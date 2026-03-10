# Milionerzy - Architecture & Capabilities

Polish "Who Wants to Be a Millionaire" educational quiz game with AI-powered question generation.

**Live URL:** https://milionerzy.web.app
**Backend API:** https://milionerzy-api-4qrian2puq-lm.a.run.app
**Repository:** https://github.com/rohatyn-sketch/milionerzy-app

---

## Project Structure

pnpm monorepo with 3 packages:

```
milionerzy/
├── packages/
│   ├── shared/          # Types, constants, utilities (shared between FE & BE)
│   ├── frontend/        # Vite + vanilla TypeScript SPA
│   └── backend/         # Express API server (Cloud Run)
├── terraform/           # Infrastructure as Code (7 modules)
├── .github/workflows/   # CI/CD pipelines
├── firebase.json        # Hosting & Firestore config
└── firestore.rules      # Security rules
```

---

## Frontend

**Stack:** Vite, TypeScript, vanilla DOM, CSS
**Hosting:** Firebase Hosting (milionerzy.web.app)

### Pages

| Page | File | Purpose |
|------|------|---------|
| Menu | `index.html` | Class selector, daily challenge, leaderboard, stats, shop link |
| Game | `game.html` | Quiz gameplay with timer, answers, lifelines |
| Shop | `shop.html` | Purchase themes, backgrounds, lifelines |
| Achievements | `achievements.html` | Achievement gallery with progress |

### Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| Game Engine | `src/game/game.ts` | Question rendering, answer handling, timer, scoring, lifelines |
| Auth | `src/auth/auth.ts` | Google OAuth via Firebase, progress sync, auto-save |
| Storage | `src/state/storage.ts` | LocalStorage wrapper — money, stats, classes, incorrect questions |
| Class Selector | `src/ui/class-selector.ts` | Multi-class cards, login gating, add/delete classes |
| Setup Panel | `src/ui/setup-panel.ts` | New class creation form with image upload |
| Questions | `src/features/questions.ts` | Question loading (cached, fallback, per-class) |
| Daily Challenge | `src/features/daily.ts` | Seeded daily questions, countdown timer |
| Achievements | `src/features/achievements.ts` | 13 achievement unlock conditions & notifications |
| Streak | `src/features/streak.ts` | Consecutive correct answer multipliers |
| Difficulty | `src/features/difficulty.ts` | Timer & reward scaling by question number |
| Sound | `src/features/sound.ts` | SFX (correct/incorrect/timer) & background music |
| Keyboard | `src/features/keyboard.ts` | A/B/C/D, 1-4, Space, Escape bindings |
| Leaderboard | `src/features/leaderboard.ts` | Top 10 display & score submission |
| Shop | `src/features/shop.ts` | Theme, background, lifeline purchases |
| Theme | `src/ui/theme.ts` | CSS variable application for selected theme |
| API Client | `src/api/client.ts` | HTTP client with auth token injection |

### Authentication Flow

1. User clicks Google sign-in button
2. Firebase popup OAuth completes
3. Frontend calls `POST /api/auth/login` with ID token
4. Backend verifies token, creates/updates user in Firestore
5. Frontend loads progress from `GET /api/user/progress`
6. Auto-save every 60 seconds while logged in

### Auth Gating

- **Logged out:** Only default Fizyka class visible, practice mode disabled
- **"Dodaj klase" when logged out:** Shows login prompt modal with Google sign-in
- **Logout:** Reverts active class to default, hides user-generated classes
- **Game exit:** Back button and Escape show confirmation dialog

---

## Backend

**Stack:** Express, TypeScript, Firebase Admin SDK
**Hosting:** Google Cloud Run (europe-central2)
**Container:** Node 20 slim, port 8080

### API Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/health` | No | Health check for Cloud Run |
| POST | `/api/auth/login` | No | Verify Firebase token, register user |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/user/progress` | Yes | Load user progress, preferences, lifelines |
| POST | `/api/user/progress` | Yes | Save user progress |
| POST | `/api/generate` | Yes | Generate questions via Gemini AI |
| GET | `/api/criteria` | No | List cached question sets |
| GET | `/api/leaderboard` | No | Top 10 scores |
| POST | `/api/leaderboard` | Yes | Submit score |

### Services

| Service | Purpose |
|---------|---------|
| `gemini.service.ts` | Gemini 3 Flash Preview API — builds prompt, parses JSON response, supports image input |
| `question.service.ts` | Generates & caches questions by class name + context |
| `user.service.ts` | User CRUD in Firestore |
| `progress.service.ts` | Progress load/save with defaults |
| `leaderboard.service.ts` | Leaderboard queries and score submission |
| `class.service.ts` | User class CRUD operations |

### AI Question Generation

- **Model:** `gemini-3-flash-preview` via REST API
- **Output:** 65 questions per class (55 multiple choice + 10 true/false)
- **Input:** Class name, optional context text, optional image (criteria screenshot)
- **Image support:** When image is provided, prompt instructs model to analyze it and generate questions based on the image content
- **Caching:** Questions cached in Firestore `questionCache` collection

---

## Shared Package

Exports types, constants, and utilities used by both frontend and backend.

### Game Configuration

| Setting | Value |
|---------|-------|
| Questions per game | 10 |
| Money per correct | +100,000 PLN |
| Money per incorrect | -50,000 PLN |
| Daily questions | 5 |
| Daily bonus multiplier | 1.5x |

### Difficulty Levels

| Level | Questions | Timer | Multiplier | 50:50 Removes |
|-------|-----------|-------|------------|---------------|
| Easy | 1-4 | 60s | 1.0x | 2 answers |
| Medium | 5-7 | 45s | 1.5x | 2 answers |
| Hard | 8-10 | 30s | 2.0x | 1 answer |

### Streak Multipliers

| Streak | Multiplier |
|--------|------------|
| 0-2 | 1.0x |
| 3-4 | 2.0x |
| 5-6 | 3.0x |
| 7-9 | 4.0x |
| 10+ | 5.0x |

### Achievements (13)

First Win, Millionaire (1M PLN), Perfect Game, Streak 3/5/10, Speed Demon (<3s answer), No Lifelines Win, 10/50 Games Played, Daily Champion, Collector (5+ achievements), Physics categories (Density/Pressure/Archimedes 10 correct each)

### Lifelines

- **50:50** — Removes 2 wrong answers (1 on hard difficulty)
- **Skip** — Omits current question
- **+Time** — Adds 30 seconds to timer

### Shop Items

- **Themes:** Gold (500K), Cosmic (750K), Neon (1M PLN)
- **Backgrounds:** 6 options (200K-500K PLN)
- **Lifelines:** 50:50 (75K), Skip (100K), +Time (150K PLN)

---

## Database (Firestore)

### Collections

```
users/{userId}
  ├── profile: googleId, email, name, picture, createdAt, lastLogin
  ├── progress: money, totalEarned, gamesPlayed, gamesWon, bestStreak, ...
  ├── preferences: activeTheme, activeBackground, soundSfx, soundMusic, owned*
  ├── lifelines: fifty, skip, time
  ├── achievements: string[]
  ├── activeClassId, incorrectQuestions
  └── classes/{classId}  (subcollection)
        ├── name, isDefault, questionCount, context, generatedAt
        └── questions[]

leaderboard/{entryId}
  └── userId, name, score, date
      Index: score DESC, date DESC

questionCache/{cacheKey}
  └── className, context, questions[], questionCount, createdAt, createdBy
```

### Security Rules

- Users can only read/write their own document and subcollections
- Leaderboard is publicly readable; authenticated users can create entries
- Question cache is backend-only (admin SDK)

---

## Infrastructure (Terraform)

**State Backend:** GCS bucket `milionerzy-terraform-state`
**Region:** europe-central2

### Modules

| Module | Resources |
|--------|-----------|
| `firebase` | Firebase Project, Web App |
| `firestore` | Database, rules, leaderboard index |
| `auth` | Identity Platform config, Google OAuth provider, authorized domains |
| `secrets` | Secret Manager for GEMINI_API_KEY |
| `storage` | GCS buckets (functions-source, uploads with CORS) |
| `functions` | Cloud Run SA, GitHub Actions SA, Artifact Registry, Workload Identity Federation |
| `hosting` | Firebase Hosting site (milionerzy) |

### Service Accounts

| Account | Purpose | Roles |
|---------|---------|-------|
| `milionerzy-cloud-run` | Cloud Run runtime | datastore.user, secretmanager.secretAccessor |
| `github-deployer` | GitHub Actions CI/CD | artifactregistry.writer, run.developer, iam.serviceAccountUser, firebase.admin |

### Workload Identity Federation

- Pool: `github-pool`
- Provider: GitHub OIDC (`token.actions.githubusercontent.com`)
- Condition: Repository owner must match `github_org` variable
- Attribute mapping: subject, actor, repository

---

## CI/CD (GitHub Actions)

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR to main | Typecheck + build all packages |
| `deploy.yml` | Push to main, manual dispatch | Full build → Docker → Cloud Run → Firebase Hosting |
| `terraform.yml` | Changes to `terraform/**` | Plan (on PR) / Apply (on push to main) |

### Deploy Pipeline Steps

1. Checkout code
2. Authenticate with GCP (SA key)
3. Setup pnpm 9 + Node 20
4. Install dependencies
5. Build shared → backend → frontend
6. Query existing Cloud Run URL for `VITE_API_BASE_URL`
7. Build & push Docker image to Artifact Registry
8. Deploy to Cloud Run (512Mi, max 10 instances, GEMINI_API_KEY secret)
9. Deploy frontend to Firebase Hosting

### Environment Variables & Secrets

| Secret | Used By |
|--------|---------|
| `GCP_SA_KEY` | GCP authentication (deploy + terraform) |
| `GCP_PROJECT_ID` | Project targeting |
| `VITE_FIREBASE_API_KEY` | Frontend Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend auth (milionerzy.web.app) |
| `VITE_FIREBASE_PROJECT_ID` | Frontend Firebase project |
| `VITE_FIREBASE_STORAGE_BUCKET` | Frontend storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend messaging |
| `VITE_FIREBASE_APP_ID` | Frontend app ID |
| `TF_VAR_gemini_api_key` | Terraform Gemini secret |
| `TF_VAR_google_client_id` | Terraform OAuth config |
| `TF_VAR_google_client_secret` | Terraform OAuth config |

---

## Multi-Class System

### Default Class

- **ID:** `default_fizyka7`
- **Name:** Fizyka - Klasa 7
- **Questions:** 65 built-in physics questions (hardcoded fallback)
- **Topics:** Density, pressure, hydrostatic pressure, Archimedes' principle

### Custom Classes (Authenticated Users Only)

1. User clicks "Dodaj klase" → setup panel opens
2. Enters class name (e.g., "Biologia - Klasa 8")
3. Optionally adds context text and/or image of criteria
4. Clicks "Generuj pytania" → Gemini AI generates 65 questions
5. Questions cached locally (localStorage) and in Firestore
6. Class appears in selector carousel
7. Per-class incorrect question tracking for practice mode

### Practice Mode (Cwicz)

- Available only to logged-in users
- Loads questions the user previously answered incorrectly
- Specific to the active class
- Correctly answered practice questions are removed from the incorrect list
- Shows remaining count on menu button

---

## Local Development

```bash
# Install dependencies
pnpm install

# Run frontend dev server (port 5173)
pnpm dev:frontend

# Run backend in watch mode
pnpm dev:backend

# Build all packages
pnpm build

# Type check all packages
pnpm typecheck
```

### Environment Variables

Create `.env` in `packages/frontend/`:

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=milionerzy-487910
VITE_FIREBASE_STORAGE_BUCKET=milionerzy-487910.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Backend requires:
- `GEMINI_API_KEY` environment variable
- `GOOGLE_CLOUD_PROJECT` set to project ID
- Firebase Admin SDK credentials (auto in Cloud Run, manual locally)
