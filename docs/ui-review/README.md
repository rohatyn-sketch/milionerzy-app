# EduFiszka: UI and information architecture review

This review follows the Lean UX "iceberg": concept, then information architecture, then interaction, then visual. The primary standard is the design-system guide (`reusable_guides/design-system-guide.md`, cited below as **G§n**). Screenshots are in [`screenshots/`](screenshots/).

Scope tier: **Medium** (a restructure of existing screens, no new product area). It ran unattended, so the human checkpoint is the PR review. Every decision below lists its alternative and a falsifier, so any of them can be reversed.

---

## 0. Brief

- **Feature:** restructure EduFiszka's navigation and screens so a student can always see where they are, start a quiz in one step, and find secondary features (progress, shop, settings) without hunting.
- **User benefit:** less time spent figuring out the menu and more time answering questions. It also gives working keyboard, screen-reader and phone use.
- **Primary task:** pick a subject and start a quiz round.
- **Users:** Polish primary-school students (the bundled set is "Fizyka – Klasa 7", so roughly 12–14 years old), mostly on phones, sometimes on school or home desktops. Confidence: *medium*. This is inferred from the content, not from analytics.
- **Constraints:** vanilla TypeScript multi-page Vite app, no framework, four HTML entry points, PL/EN i18n, existing shop themes and e2e suite. The brand must stay "EduFiszka", and the redesign must not be gratuitous.

## 1. Evidence log

| ID | Claim | Source | Tier | What it justifies |
|---|---|---|---|---|
| E1 | Hidden navigation (hamburger) reduced content discoverability by more than 20% and made tasks harder. NN/g recommends visible nav on desktop and visible links on mobile when there are 4 or fewer. | NN/g, *Hamburger Menus and Hidden Navigation Hurt UX Metrics*: https://www.nngroup.com/articles/hamburger-menus/ | 1 | Visible 3-item nav, no hamburger (DR-02) |
| E2 | A navigation bar suits 3–5 equally important top-level destinations on compact screens. | Android / Material 3 *Navigation bar*: https://developer.android.com/develop/ui/compose/components/navigation-bar | 1 | Bottom tab bar on phones (DR-02) |
| E3 | Duolingo uses a persistent bottom tab bar (learn, leaderboard, shop, profile) and refreshed it so the tabs feel like one family. | Duolingo blog, *Core tabs redesign*: https://blog.duolingo.com/core-tabs-redesign | 2 | Domain precedent for Start / Progress / Shop tabs and a consistent tab design |
| E4 | WCAG 2.2 adds 2.5.8 Target Size (Minimum, 24×24 px) and 2.4.11 Focus Not Obscured (a sticky header or footer must not hide the focused element). | W3C, *What's new in WCAG 2.2*: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ | 0 | 44 px targets, `scroll-padding` for the sticky bars (DR-06) |
| E5 | A modal dialog needs `role="dialog"`, `aria-modal`, a name, focus moved inside on open, Tab contained, Esc to close, and focus returned on close. | WAI-ARIA APG, *Dialog (Modal) Pattern*: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ | 0 | `ui/dialog.ts` (DR-05) |
| E6 | Use one primary call to action per view and show the others lower in the hierarchy. | Red Hat Design System, *Call to action guidelines*: https://ux.redhat.com/elements/call-to-action/guidelines | 2 | One filled "Play" button; practice and formulas become secondary (DR-03) |
| E7 | 1.4.3 Contrast (4.5:1 for text), 2.1.1 Keyboard, 2.4.7 Focus Visible, 1.4.1 Use of Color. | WCAG 2.2: https://www.w3.org/TR/WCAG22/ | 0 | Contrast fixes, focus ring, keyboard fix, text status on achievements |
| E8 | Hamburger menus on desktop layouts hide navigation for no benefit. | Adrian Roselli: https://adrianroselli.com/2016/01/avoid-the-hamburger-menu-for-desktop-layouts.html | 2 | Top nav on desktop (DR-02) |
| E9 | Show the streak or progress counter prominently on the home screen rather than burying it. | MWM glossary, *Daily streak*: https://mwm.ai/glossary/daily-streak | 3 | The progress summary stays on Home (DR-04). Low tier, so cheap to reverse |
| E10 | `prefers-reduced-motion` lets users opt out of non-essential animation. | MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion | 1 | Glow, pulse and shake animations are disabled under that preference |

**Research gap.** No analytics or user sessions were available. These remain unknown:

- the real device split;
- whether students understand "Postępy" (Progress) as the place where achievements live;
- whether teachers use "Dodaj klasę" (Add class) more than students do;
- whether the hidden bonus code is a feature or a developer cheat.

A five-student hallway test of the findability tasks in section 4 would answer most of these.

## 2. Persona (primary)

**Ola, 13, Grade 7 student.** *"I have 10 minutes before the bus. Just let me do the physics questions."*

- **Context:** a phone in portrait orientation, often one-handed [ASSUMPTION, based on age group and E3 precedent]. Sometimes a school PC with a keyboard [ASSUMPTION].
- **Goal:** practise for a test quickly and see that she is improving [ASSUMPTION]. Coins and achievements motivate her [inferred from the existing product design].
- **Fluency:** high with apps like Duolingo or Kahoot, low patience for menus [ASSUMPTION].
- **Frustrations the audit observed:** controls overlap on her phone, and "Ćwicz" (Practice) is greyed out with no reason given. The gear icon looks like settings but actually adds a class.

**Secondary (teacher or parent):** creates a custom class from a syllabus photo. This persona matters only for the "Add class" flow.

## 3. Conceptual model

| Candidate | Metaphor | Makes easy | Makes awkward |
|---|---|---|---|
| A. TV quiz show (status quo) | "Milionerzy" stage | Excitement, money | The name no longer fits EduFiszka, and hexagon buttons clip the focus ring |
| **B. Study hub with tabs (chosen)** | Duolingo-style home: *what to study* → *play* → *my progress* → *shop* | Starting a round, seeing progress | Less "TV show" theatre |
| C. Single scrolling dashboard | Everything on one page | Nothing is hidden | Already the problem: one long column of 9 equal-weight blocks |

**DR-01 (Concept):**
- **Chose:** B, and kept the game screen's quiz-show look (hexagon answers, gold money).
- **Over:** A, rejected because of the brand change and accessibility problems. C, rejected because it is the current pain.
- **Falsifier:** if students say the app now feels "like homework", bring more show styling back to Home.
- **Reversal cost:** cheap (CSS).

## 4. Sitemap: current vs proposed

### Current (main)

```
index.html  (one long centred column, no navigation)
├─ [fixed top-right] language PL/EN        ← overlaps sign-in on phones
├─ [fixed top-right] Google sign-in + hint ← overlaps title on phones
├─ Title "EduFiszka" + subtitle
├─ Class cards (+ "Dodaj klasę" card → login dialog if signed out)
├─ Question-count slider
├─ Buttons: GRAJ | ĆWICZ (n) | SKLEP | WZORY   ← four equal-weight, differently coloured CTAs
├─ Daily challenge
├─ Best scores (top 3)
├─ Money
├─ Stats line (inline styles)
├─ Sound toggles
├─ Code input (inline styles, unlabelled)
├─ [fixed bottom-right] ⚙ gear → "Dodaj nową klasę" panel (duplicate entry point, misleading icon)
├─ Modal: Formulas · Panel: Add class · Overlay: Login prompt · Overlay: Generating…
game.html  ← "← Powrót do menu" fixed link (overlaps header on phones)
├─ header (timer, difficulty, streak, money) · question · answers · lifelines · key hints
├─ Explanation overlay (+ podcast button) · End screen · Learn-more toast · Audio player
shop.html  ← back link only
achievements.html  ← ORPHAN: not linked from anywhere in the app
(full leaderboard renderer exists in code but is never shown)
```

### Proposed (this PR)

```
App bar (every page except game): [brand] [Start · Postępy · Sklep] [💰 wallet → shop] [PL/EN] [account]
   phones: nav becomes a bottom tab bar (3 visible tabs)

Start (index.html)
├─ h1 EduFiszka
├─ h2 Wybierz przedmiot     class cards (buttons, aria-pressed) + "Dodaj klasę" (single entry point)
├─ h2 Zagraj                question count → [GRAJ] (only primary CTA)
│                           secondary: [Ćwicz błędy (n)] [Wzory]  + visible reason when unavailable
├─ h2 Wyzwanie dnia
├─ h2 Twoje postępy         sign-in nudge · money · 3 stat tiles · top 3 · "Wszystkie postępy →"
└─ h2 Ustawienia            sound toggles · labelled bonus code
Postępy (achievements.html)  ← now in nav
├─ h2 Statystyki · h2 Osiągnięcia (with text locked/unlocked) · h2 Najlepsze wyniki (full list, finally shown)
Sklep (shop.html)
└─ h2 Motywy · h2 Tła · h2 Koła ratunkowe
Gra (game.html)  focused mode: "← Zakończ grę" + PL/EN only, no tab bar
Dialogs: Wzory, Dodaj klasę (with inline sign-in), Explanation, End screen  (APG dialog pattern)
```

**Labels.** "Start", "Postępy" and "Sklep" are short and match the words students already see in the UI.

| Label | Rejected alternatives | Why rejected |
|---|---|---|
| Start | "Graj" | It would duplicate the Play button |
| Start | "Menu" | Engineering-ish |
| Postępy | "Osiągnięcia" | Too narrow, since the page now also holds stats and scores |
| Postępy | "Profil" | There is no profile data yet |

**Findability test plan** (give a student the task and watch where they tap first):

1. Start a 10-question physics game.
2. Find how many achievements you have unlocked.
3. Buy the Gold theme.
4. Turn off the music.
5. See your best score ever.
6. Add your own biology question set.
7. Practise the questions you got wrong.
8. Switch the app to English.

A card sort would settle whether "Ustawienia" (Settings) belongs on Home or in the account menu (task 4 is the weakest guess).

## 5. Problems found, and the fix for each

| # | Problem (layer) | Evidence / guide | Fix in this PR |
|---|---|---|---|
| P1 | Achievements page is unreachable. The full leaderboard is never rendered. (IA) | G§1 "Clear IA" | It is in the main nav as **Postępy**, with stats and the full leaderboard |
| P2 | No persistent navigation. Each page invents its own back link. (IA) | E1, E2, E3, E8 | Shared app shell: top nav on desktop, bottom tab bar on phones (`ui/app-shell.ts`) |
| P3 | On phones, sign-in overlaps the title and the language button overlaps sign-in. In the game, the back link overlaps the header. (Interaction/visual) | before-mobile-home.png, before-mobile-game.png | The controls now live in a real header row, and the game gets its own static bar |
| P4 | Four equal-weight, differently coloured CTAs (Play, Practice, Shop, Formulas). (Visual hierarchy) | E6, G§8 Button variants | One filled primary button (Play). Practice and Formulas are outlined secondary buttons. Shop moved to the nav |
| P5 | The gear FAB opens "Add class" and duplicates the "+" card. (Labeling) | G§4 "pair icons with text" | One labelled "Dodaj klasę / Własne pytania z AI" card. Signed-out users see an inline sign-in instead of a second dialog |
| P6 | Practice is disabled with only a hover tooltip as the reason, and "(0)" is shown. (Interaction) | WCAG 3.3.2 / G§6 | The reason is printed under the button, the link is properly disabled (`aria-disabled`, no href), and the badge appears only when the count is above 0 |
| P7 | Class cards are clickable `div`s, so they cannot be reached by keyboard. The delete control appears only on hover. (A11y) | E7 2.1.1 | Real `<button aria-pressed>`. The delete button shows on focus and on touch, and has a 32 px target with a named label |
| P8 | On the game page, Enter and Space are hijacked globally, so a keyboard user cannot press "Next" or "Play again". (A11y) | E7 2.1.1 | `keyboard.ts` leaves Enter and Space to a focused button or link. The explanation and end dialogs move focus to their action |
| P9 | Modals have no role or name and no focus management. Esc closes only some of them. (A11y) | E5 | `ui/dialog.ts` implements the APG pattern for Formulas and Add class. Explanation and end screen get dialog semantics and focus |
| P10 | There is no visible focus indicator anywhere, and clip-path hexagons cut off outlines. (A11y) | E7 2.4.7, G§6 | Global `:focus-visible` ring, plus an inset ring on hexagon answers, plus a skip link |
| P11 | White text on `#1e90ff` buttons is 3.24:1, white on the orange daily button is 2.33:1, white on the Gold theme is 1.40:1, and the upload hint is 2.51:1. (Visual) | E7 1.4.3, G§2/§6 | Token `--accent`/`--on-accent` per theme. The results are in the contrast table below |
| P12 | Ad-hoc colours, radii and spacing, inline `style=""` in the HTML, and no type scale. (Visual consistency) | G§2, §3, §8 | CSS custom properties for palette, spacing, radius and type scale. The inline styles are removed |
| P13 | Heading order is broken (h1 → h3, no h2s). The question is a `<p>`. (A11y/IA) | G§6 "heading hierarchy" | Each page has one h1, every section has an h2, and on the game page the question is the h1 |
| P14 | Tap targets smaller than 44 px (sound toggles, lifeline counts, logout, close ×). (Interaction) | E4 2.5.8, G§4 | `--tap-min: 44px` applied to buttons, toggles, nav and close buttons |
| P15 | Logout is styled red as if it were destructive. (Visual semantics) | G§8 Danger = destructive only | Ghost button |
| P16 | Locked and unlocked achievements are shown only by opacity and icon. (A11y) | E7 1.4.1 | A text status "Odblokowane / Zablokowane" and a `progressbar` role |
| P17 | Constant glow, pulse and shake animations. (A11y) | E10 | Disabled under `prefers-reduced-motion` |
| P18 | The page background stops at the first viewport on long pages. (Visual) | before-desktop-home.png | `background-attachment: fixed` |

## 6. Decision records

**DR-02: Visible nav (top bar on desktop, bottom tabs on phones), not a hamburger.**
- **Layer:** IA.
- **Over:** a hamburger drawer (rejected because of E1: worse discoverability with only 3 items) and keeping the back links (rejected because of P1 and P2).
- **Evidence:** E1, E2, E3, E8.
- **Assumption:** most play happens on phones. UNVALIDATED.
- **Falsifier:** analytics showing the tab bar is rarely used while Home buttons are.
- **Reversal cost:** cheap (one module plus CSS).

**DR-03: Exactly one primary CTA on Home ("Graj").**
- **Layer:** visual hierarchy.
- **Over:** keeping four coloured CTAs (rejected because nothing stands out in a squint test).
- **Evidence:** E6, G§8.
- **Falsifier:** practice-mode usage drops noticeably after release.
- **Reversal cost:** cheap.

**DR-04: Keep a compact progress summary on Home and put the full detail on Postępy.**
- **Layer:** IA.
- **Over:** moving all stats off Home (rejected because motivation needs to be visible, E9, a low-tier source).
- **Falsifier:** students never scroll to the summary.
- **Reversal cost:** cheap.

**DR-05: Implement the dialog pattern as a helper that keeps the existing `.active` class contract.**
- **Layer:** interaction.
- **Over:** native `<dialog>` (rejected for now because it would restyle and restructure every overlay and break the e2e selectors in one go).
- **Evidence:** E5.
- **Reversal cost:** medium.

**DR-06: Tokens follow the guide's palette, but the theme stays dark.**
- **Layer:** visual.
- **Over:** the guide's light, slate-on-white application colours (rejected because the dark "game" atmosphere is the product's character, G§1 "Essence over Uniformity"). Primary-600 is used for filled buttons (4.60:1 with white text), and primary-400 for accents on dark backgrounds (7.49:1).
- **Falsifier:** teachers ask for a light or print-friendly mode.
- **Reversal cost:** cheap (token values).

**DR-07: Use the system font stack with Inter first, rather than loading Inter from Google Fonts.**
- **Over:** a webfont, rejected because it is a third-party request from a children's app [ASSUMPTION: privacy and GDPR caution].
- **Reversal cost:** cheap.

**DR-08: Signed-out "Add class" opens the form with an inline sign-in.**
- **Over:** a separate login dialog, which is removed.
- **Because:** there is one path instead of two, and the user sees what they would get before signing in.
- **Falsifier:** a confusing spike of signed-out users filling in the form.
- **Reversal cost:** cheap.

## 7. Contrast checks (computed, WCAG relative luminance)

| Pair | Before | After |
|---|---|---|
| Primary button text | white on #1e90ff **3.24:1 ✗** | white on #0076d6 **4.60:1 ✓** |
| Daily challenge button | white on #ff8c00 **2.33:1 ✗** | #1f0d00 on #fb923c **8.32:1 ✓** |
| Gold theme button | white on #ffd700 **1.40:1 ✗** | #1a1300 on #ffd700 **13.17:1 ✓** |
| Cosmic theme button | white on #9b59b6 4.67:1 | white on #7d3c98 **7.07:1 ✓** |
| Neon theme button | white on #00ff88 **1.34:1 ✗** | #002b17 on #00ff88 **11.53:1 ✓** |
| Upload hint | rgba(255,255,255,.3) **≈2.51:1 ✗** | #b8bfd0 **10.4:1 ✓** |
| Secondary text on bg | #b0b0b0 8.84:1 | #b8bfd0 10.4:1 |
| Accent text/borders on bg | #1e90ff 5.92:1 | #36a9fa 7.49:1 |
| Disabled shop button | #666 on #333 2.20:1 (exempt) | #cbd5e1 on #374151 6.94:1 |

**Squint test (Home, phone).** With the page blurred, the blue "GRAJ" bar and the gold title are the two shapes that survive. Before this change, four coloured hexagons competed for attention.

## 8. Verification

- `pnpm -r typecheck` passed. `pnpm -r test` passed (backend vitest, 16 tests). `pnpm build:frontend` passed.
- Playwright e2e: 31 of 31 passed. That is the 23 existing specs (three updated to the new nav) plus 8 new ones in `e2e/navigation/`: nav reachability, shared nav, wallet sync, tab bar pinned to the bottom with no overlap and no horizontal scroll at 375 px, game focus mode, keyboard class selection, dialog focus trap and Esc, and Enter on "Next".
- Scripted click-through at 1280 px and 375 px:
  - bonus code: the wallet updates;
  - a full 5-question game played by keyboard, ending with focus on "Play again";
  - the daily challenge starts;
  - buying a theme updates the wallet and applies the theme;
  - the progress page shows the unlocked achievement and the leaderboard row;
  - Formulas opens and closes with Esc;
  - Add class works signed out, and Generate stays disabled;
  - the 50:50 lifeline works;
  - no page errors.
- **Not tested:**
  - Google sign-in and everything that needs it: practice mode with real mistakes, AI class generation, podcasts and the audio player, deleting a custom class. These need Firebase auth and the backend, which are not available on localhost.
  - Real iOS Safari or Android devices: only Chromium emulation at 375 px was used.
  - Screen readers: the semantics were checked by reading the markup and through Playwright role queries, not with VoiceOver or NVDA.

## 9. Deferred, with the reason for each

- **Polish diacritics.** All UI copy is ASCII ("Postepy", "Cwicz"). Fixing it touches every string, so it is a separate copy pass for the PO to decide.
- **Native `<dialog>`.** Migrate when the overlays are next touched (DR-05). The learn-more toast and the audio player were not refactored.
- **The "generated N questions" message.** It is written into the panel that closes at the same moment, so nobody sees it. It needs a toast component.
- **Shop "Kup" buttons.** Screen readers announce every one as just "Kup", with no item name. It needs `aria-describedby` on each item.
- **Menu customization.** The brief mentions it, but it does not exist on `main`, so it was out of scope.
