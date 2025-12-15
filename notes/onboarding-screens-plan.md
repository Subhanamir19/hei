# Onboarding Screens Implementation Plan

Goal: ship production-grade onboarding that gathers required profile inputs, submits to `/onboarding`, and transitions to main app only after prediction and routine are ready. The flow must match existing backend contracts, shared types, and frontend patterns.

## Data requirements (map to API)
- `gender` (`'male' | 'female' | 'non_binary' | 'unspecified'`) → `OnboardingRequestBody.gender`
- `dateOfBirth` (ISO date string) → `OnboardingRequestBody.dateOfBirth`
- `ethnicity` (enum from `shared/domain-models.ts`) → `OnboardingRequestBody.ethnicity`
- `parentHeightsCm.mother`, `parentHeightsCm.father` (numbers, cm) → `OnboardingRequestBody.parentHeightsCm`
- `footSizeCm` (number, cm) → `OnboardingRequestBody.footSizeCm` (UI lets user pick EU/US and converts to cm)
- `workoutCapacity` (`'low' | 'moderate' | 'high'`) → `OnboardingRequestBody.workoutCapacity`
- `averageSleepHours` (number) → `OnboardingRequestBody.averageSleepHours`
- `dreamHeightCm` (number, cm) → `OnboardingRequestBody.dreamHeightCm`
- Optional initial height log: `initialHeightCm` (cm) and `initialHeightRecordedAt` (ISO) → `OnboardingRequestBody.initialHeightCm`, `OnboardingRequestBody.initialHeightRecordedAt`
- Optional `email` capture (string) → `OnboardingRequestBody.email` (only if we decide to surface it)

## UX flow (screens)
1) **Welcome / intro**: brief value prop, start button.
2) **Gender & DOB**: segmented control for gender; date picker for DOB.
3) **Ethnicity**: chip grid for enum options.
4) **Parent heights**: dual inputs with unit toggle (cm / ft+in). Convert to cm before submit.
5) **Current height (optional)**: height input with unit toggle; recorded-at defaults to now; allow skip.
6) **Foot size**: numeric input with unit toggle (EU / US (M/F) / cm); convert to cm.
7) **Workout & sleep**: workout capacity level selector; numeric input for average sleep hours.
8) **Dream height**: height input with unit toggle; convert to cm.
9) **Review & consent**: summary of selections; submit button; legal copy placeholder if needed.
10) **Preparing screen**: after successful POST, show progress UI and poll `/height/report` + `/routine/active` until both 200; on success mark onboarding complete and navigate to main tabs.

## Visual/design spec (match app + mockup vibes)
- Base theme: use `colors.background` / `colors.surface` / `colors.surfaceMuted`; text from `colors.textPrimary`/`textSecondary`; neon accents (`neonLime`, `neonMint`, `neonCyan`).
- Layout: padded `Screen` container; cards with `radii.lg` and `shadows.card`; pill toggles inspired by mockups (rounded segmented controls, soft shadows).
- Typography: headings `typography.heading/subheading`, body `typography.body`.
- Inputs: rounded containers, focused border `colors.neonCyan`; helper/error text in `colors.textSecondary`/`colors.danger`.
- Progress indicator: step dots or bar across top; align with neon accent.
- Buttons: use `NeonButton` for primaries; ghost/secondary with `colors.surfaceMuted` background and `colors.textPrimary`.
- Imagery: keep lightweight; optional gradient header using `expo-linear-gradient` to echo mockup glow without adding assets.

## Navigation and state
- `AppNavigator` logic: keep `shouldShowMain = userId && onboardingCompleted`. During onboarding, stack hosts the multi-step flow and the preparing screen.
- Local form state: per-step local state (React hooks) with validation before advancing; no new global stores for server data.
- Persistence: only `userId` and `onboardingCompleted` via `useAuthStore`; hydrate before deciding navigator.
- Server state: use React Query for the readiness polling screen; staleTime/gcTime already set in `QueryProvider`. Ensure app root wraps in `QueryProvider` (add if missing).

## Networking/data flow
- Submit: `apiFetch<OnboardingResponse>('/onboarding', { method: 'POST', body: JSON.stringify(payload) })`.
- Headers: no auth token; include `Content-Type: application/json`; `x-user-id` not needed for onboarding.
- On success: persist `userId`; navigate to Preparing screen.
- Polling: start two queries (or one combined loop) hitting `/height/report` and `/routine/active` with `userId` header. Success condition = both 200. Poll interval: start 1s, backoff to max 10s, max attempts 30 (per `plan-frontend.md`).
- Completion: when ready, set `onboardingCompleted=true`, navigate to main tabs.
- Error handling: show inline error on submit failure; on polling failure surface retry/exit-to-form; offline → hold submission and show “offline” state.

## Validation and units
- Required: gender, DOB, ethnicity, parent heights, foot size, workout capacity, sleep hours, dream height. Optional: current height (+ timestamp), email.
- Ranges: heights 100–250 cm; foot size 18–35 cm; sleep 0–16 hours; DOB must be at least age 10 (configurable guard).
- Unit conversion:
  - Height ft+in → cm: `cm = (ft * 30.48) + (in * 2.54)`.
  - Foot size: EU → cm (approx `cm = EU / 1.5`); US (men) `cm = (US + 23.5) / 1.5`; US (women) `cm = (US + 22) / 1.5`. Display conversions in UI and store cm only.
- Time: store ISO strings via `new Date().toISOString()` for DOB and recordedAt.

## Component breakdown
- `OnboardingStack` screens under `AppNavigator` (replace single `OnboardingScreen` placeholder).
- Reusable atoms: `StepHeader` (title + step indicator), `Chip`/`PillToggle`, `NumberInput` with unit suffix, `UnitToggle` (height, shoe size), `ProgressBar`.
- Forms: inline validation per step; Next disabled until valid; Skip button where optional.
- Preparing screen: polling status, show which endpoints are ready, retry/exit controls.

## Backend alignment checks
- Payload shape exactly matches `shared/api-contracts.ts` `OnboardingRequestBody`.
- Enum values come from `shared/domain-models.ts`; no custom strings.
- Units converted to cm before POST.
- Post-submit readiness matches backend contract: `/height/report` returns 404 until ready; `/routine/active` same; only mark complete when both succeed.
- No duplicate prediction/routine calls on frontend; rely on backend queues.

## Execution phases
**Phase 1: UI and flow scaffolding**
- Build `OnboardingStack` and replace placeholder screen; add step header/progress.
- Implement shared atoms (chips, pill toggles, unit toggles, numeric inputs) using theme tokens and `Screen`.
- Create per-step screens with inline validation and unit conversions to cm; wire navigation between steps and review screen.
- Ensure `QueryProvider` wraps app root (if not already) and `useAuthStore.hydrate` runs before navigator decision.

**Phase 2: Backend wiring and readiness**
- Hook submit to `/onboarding`, persist `userId`, and transition to Preparing screen.
- Implement polling for `/height/report` + `/routine/active` with backoff and readiness gate; set `onboardingCompleted` and navigate to main tabs on success.
- Add error/offline handling, retry controls, and graceful resume of the flow.
- Validate payload shape against `shared/api-contracts.ts` and add manual QA checklist / TS type checks.

## Open questions to confirm before build
- Do we collect email now or keep it hidden?
- Minimum age rule? (Assumed 10y+; adjust if needed.)
- Exact shoe-size conversion tables acceptable, or should we use a provided table?
