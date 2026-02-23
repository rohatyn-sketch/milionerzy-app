# Milionerzy: 3-Layer Monorepo Architecture

## Overview

The Milionerzy quiz game uses a 3-layer architecture: **TypeScript frontend** (Vite), **TypeScript backend** (Cloud Functions for Firebase), and **Firestore database** — organized as a **pnpm monorepo** with shared types. Infrastructure is managed via **Terraform** and deployed through **GitHub Actions CI/CD**.

---

## Monorepo Structure

```
milionerzy-app/
  package.json                    # Root pnpm workspace
  pnpm-workspace.yaml
  tsconfig.base.json              # Shared TS config
  firebase.json                   # Hosting + Functions config
  firestore.rules
  firestore.indexes.json

  terraform/                      # Infrastructure as Code
    main.tf                       # Providers + module calls
    variables.tf
    outputs.tf
    backend.tf                    # GCS remote state
    modules/
      firebase/                   # Firebase project + web app
      firestore/                  # Firestore DB + rules + indexes
      auth/                       # Identity Platform + Google provider
      functions/                  # Cloud Functions 2nd gen + IAM
      hosting/                    # Firebase Hosting site
      secrets/                    # Secret Manager
      storage/                    # Cloud Storage buckets

  .github/workflows/
    ci.yml                        # PR checks: typecheck, build
    deploy.yml                    # Push to main: build + deploy
    terraform.yml                 # Terraform plan/apply

  packages/
    shared/                       # @milionerzy/shared — types, constants, utils
    backend/                      # @milionerzy/backend — Express on Cloud Functions
    frontend/                     # @milionerzy/frontend — Vite multi-page app

  scripts/
    migrate-data.ts               # One-time migration to Firestore
```

---

## Packages

### @milionerzy/shared

Shared TypeScript types, constants, and utility functions used by both frontend and backend.

- **Types:** UserProfile, Question, QuizClass, GameConfig, Achievement, LeaderboardEntry, API request/response types
- **Constants:** 65 fallback physics questions, 13 achievements, shop items, difficulty levels, streak multipliers
- **Utils:** formatMoney, getDailySeed, seededRandom, shuffleAnswers, getRandomQuestions

### @milionerzy/backend

Express API wrapped in Cloud Functions `onRequest` (2nd gen, Node.js 20).

**Routes:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Verify Firebase ID token, create/update user |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/user/progress` | Yes | Load progress + classes |
| POST | `/api/user/progress` | Yes | Save structured progress |
| POST | `/api/generate` | Yes | Generate questions via Gemini AI |
| GET | `/api/criteria` | No | List cached question criteria |
| GET | `/api/leaderboard` | No | Global top scores |
| POST | `/api/leaderboard` | Yes | Submit score |

**Auth:** Firebase Admin SDK `verifyIdToken` middleware.

### @milionerzy/frontend

Vite multi-page app with 4 HTML entry points:
- `index.html` — Menu (class selector, daily challenge, leaderboard, settings)
- `game.html` — Game (timer, questions, lifelines, explanation overlay)
- `shop.html` — Shop (themes, backgrounds, lifelines)
- `achievements.html` — Achievements grid with progress bars

**Auth:** Firebase Auth SDK (`signInWithPopup`, `onAuthStateChanged`).

**State:** localStorage as cache, Firestore as source of truth. Sync with 3s debounce on events, 60s periodic auto-save.

---

## Firestore Schema

```
users/{uid}
  googleId, email, name, picture
  createdAt, lastLogin: Timestamp
  preferences: { activeTheme, activeBackground, soundSfx, soundMusic, ownedThemes[], ownedBackgrounds[] }
  progress: { money, totalEarned, gamesPlayed, gamesWon, bestStreak, perfectGames, ... }
  lifelines: { fifty, skip, time }
  achievements: string[]
  activeClassId: string
  incorrectQuestions: map<classId, number[]>

users/{uid}/classes/{classId}       # Subcollection
  name, isDefault, questionCount, context?, generatedAt?
  questions: Question[]             # Array (~32KB, under 1MB limit)

leaderboard/{entryId}               # Global collection
  userId, name, score, date
  Index: score DESC

questionCache/{cacheKey}            # Server-side Gemini result cache
  className, context, questions[], questionCount, createdAt, createdBy
```

---

## Terraform Infrastructure

| Module | Resources | Purpose |
|--------|-----------|---------|
| firebase/ | `google_firebase_project`, `google_firebase_web_app` | Firebase project + web app config |
| firestore/ | `google_firestore_database`, rules, indexes | Firestore in NATIVE mode |
| auth/ | `google_identity_platform_config`, Google IdP | Authentication |
| functions/ | `google_cloudfunctions2_function`, service account, IAM | Cloud Functions 2nd gen |
| hosting/ | `google_firebase_hosting_site` | Static hosting |
| secrets/ | `google_secret_manager_secret` | GEMINI_API_KEY |
| storage/ | `google_storage_bucket` x2 | Function source + uploads |

**Hybrid deployment:** Terraform manages infrastructure, GitHub Actions deploys code via Firebase CLI.

---

## CI/CD

- **ci.yml:** On PRs — typecheck shared, backend, frontend; build frontend
- **deploy.yml:** On push to main — build all → `firebase deploy --only functions,hosting`
- **terraform.yml:** On terraform/ changes — plan on PR (comment), apply on merge

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `GCP_PROJECT_ID` | Target GCP project |
| `GCP_SA_KEY` | Service account JSON key |
| `FIREBASE_TOKEN` | Firebase CLI token |
| `TF_VAR_gemini_api_key` | Gemini API key for Terraform |

---

## Game Features

- 10-question quiz with multiple choice + true/false
- 3 difficulty tiers: Easy (60s), Medium (45s), Hard (30s)
- Streak system with multipliers (1.0x → 2.0x)
- 3 lifelines: 50:50, Skip, +Time (purchasable in shop)
- Daily challenge: seeded questions, 1.5x money multiplier
- Practice mode: replay incorrect questions
- AI question generation via Gemini (custom classes)
- Shop: themes (gold/cosmic/neon), backgrounds, lifelines
- 13 achievements with progress tracking
- Global leaderboard
- Keyboard shortcuts: A/B/C/D, 1/2/3/4, Space, Enter, Esc
- Secret code: "Markot" = 1,000,000 PLN
- Formulas modal (physics class only)
- Google sign-in with cross-device progress sync
