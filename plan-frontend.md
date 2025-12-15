Phase F0 – Foundations, Theme, and App Skeleton
State / Store / Storage

Zustand stores (explicit separation):

useAuthStore

userId: string | null

onboardingCompleted: boolean

useUIStore

transient UI flags only (modals, banners, loading states)

useLocalMetricsStore

water intake

local streak previews (derived, not authoritative)

Persistent storage

AsyncStorage

Persist only:

userId

onboarding completion flag

last selected routine day

Never persist derived server data directly (React Query handles that)

Concerns

No server data in Zustand.

Zustand is UI + identity only, never business truth.

Phase F1 – Networking, React Query, Offline Strategy
Server State (React Query)

Query client rules

staleTime: 5–15 minutes (screen dependent)

cacheTime: 24h

Persist cache via AsyncStorage

Standard query keys

['heightReport', userId]

['activeRoutine', userId]

['trackingSummary', userId]

Offline Behavior

If offline:

Render last cached server state immediately

Show “Last updated X ago” badge

If online:

Background refetch

Mutations queue locally when offline (see task logs below)

Concerns

Never block UI waiting for network.

Never silently overwrite cached data.

Phase F2 – Onboarding Flow + Readiness Gate
State Flow

User submits onboarding form.

Backend returns userId.

Store userId in useAuthStore.

Navigate to “Preparing your plan…”.

Readiness Logic (explicit)

Poll both:

/height/report

/routine/active

Readiness condition:

both return HTTP 200

Polling:

initial delay: 1s

backoff: exponential (max 10s)

max retries: 30

On success:

set onboardingCompleted = true

navigate to main app

Concerns

No guessing. Readiness is binary and deterministic.

Phase F3 – Dashboard (Sigma Max Polish)
Widgets

Current height + trend

Predicted adult height card

Dream height odds meter

Growth progress chart (Victory)

Water intake (local store)

Deterministic motivational message

State Rules

Height + prediction from React Query only.

Water intake from local store only.

No cross-pollination.

Concerns

Charts must render from cached data when offline.

Animations subtle, not TikTok.

Phase F4 – Routine Screen + Recovery Banner Wiring
Routine State

Routine data: React Query (activeRoutine)

Selected day index: Zustand (persisted)

Recovery Banner Logic

Banner visible if:

routine.status === 'recovery'

OR last pain event within N days (future)

Banner is read-only UI for now.

No logic duplication: backend decides recovery, frontend reflects it.

Concerns

Do not hide recovery state just because user swipes days.

Banner must be globally visible, not buried.

Phase F5 – Task Logging + Sync Strategy
Local Task Log Model

Each task completion creates a local event:

{ taskId, dayIndex, completed, timestamp }

Stored in AsyncStorage event queue.

Sync Strategy

When online:

Flush events FIFO to /tracking/task-log

On success: remove from local queue

If offline:

Accumulate events

UI reflects local completion immediately

Conflict Rule

Backend is source of truth.

If backend rejects a task log:

show non-blocking warning

do not roll back UI unless critical

Concerns

Never lose user actions.

Never double-submit events.

Phase F6 – AI Coach UI (Scoped, Non-Hallucinatory)
UI

Chat-style screen

No free typing at first:

guided prompts (“Why is my growth slow?”, “What should I focus on today?”)

Data Rules

AI coach requests include:

latest prediction id

routine status

recent pain flag

AI responses must be shown as advice, not facts.

Concerns

AI must never contradict dashboard numbers.

If backend is unavailable, AI tab shows “Unavailable offline”.

Phase F7 – Subscription Acknowledgment (No Enforcement Yet)
UI Only

Show subscription status from /subscription/me

States:

active

trialing

expired

No gating yet.

Just visual acknowledgment.

Concerns

UI must be ready before enforcement.

No hard-coded paywalls.