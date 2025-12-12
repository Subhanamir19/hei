Project

hei: height growth planning app. Backend: Fastify + TypeScript. DB: Supabase Postgres via Drizzle. Shared types live in /shared.

Non-negotiable workflow

For every change:

Context Gather: inspect current tree + relevant files + shared contracts

Codex Execution: one directed prompt, scoped to a small change

Sanity Check: npx tsc --noEmit, npm run dev, and endpoint tests
No step proceeds until the previous step is green.

Current repo constraints (must match existing code)

Existing folders: src/config, src/db, src/jobs, src/modules/*, src/routes/*, shared/*

Fastify server entry: src/index.ts calls createServer() from src/server.ts

Global error handler returns ApiErrorResponse from shared/api-contracts

DB: src/db/client.ts exports db and table objects

Queues: src/jobs/queues.ts exports predictionQueue and routineQueue with MOCK_QUEUES support

Read services already exist:

src/modules/height/height.service.ts implements getHeightReport(userId)

src/modules/routine/routine.service.ts implements getActiveRoutine(userId)

Identity (temporary): x-user-id header for read endpoints

Coding standards

TypeScript strict: true

No any unless isolated and justified

No “magic” env reads outside env module

New logic goes into src/modules/** (services), not routes

Routes should only: parse headers/body, call service, return response

Never change shared contracts without explicit instruction

Environment

.env is local only, never committed

DATABASE_URL uses Supabase pooler URI (required)

REDIS_URL may be unused when MOCK_QUEUES=true

MOCK_QUEUES=true allows no-Redis local dev

DB + Drizzle conventions

Table definitions live in src/db/schema.ts

Any schema change requires:

npm run db:generate

npm run db:push

Do not assume tables exist until migrations applied

Prefer insert-returning for new IDs

API invariants (must stay true)

/onboarding creates a user + profile and optionally initial height log

Height logs update predictions only (not routines)

/height/report returns latest + history; 404 if none

/routine/active returns latest routine; 404 if none

Error responses use { errorCode, message } only

Phase 2.4 (next): Seed data generation (no OpenAI)

Goal: After onboarding, the user can immediately fetch:

GET /height/report returns a real prediction row

GET /routine/active returns a real monthly routine with days + tasks

Steps

Create src/modules/height/prediction.service.ts

Function: createInitialPredictionForUser(userId: string): Promise<void>

Inputs: userId

Reads: userProfiles, latest heightLogs

Writes: insert into heightPredictions

Deterministic formula (placeholder):

base = avg(mother, father)

+5 male, -5 female, else +0

nudge +1/-1 based on latest height log vs base

percentile=50, growthCompletionPercent=50

dreamHeightOddsPercent bucketed 20/40/60/80 based on diff

Create src/modules/routine/routine.generator.ts

Function: createInitialRoutineForUser(userId: string): Promise<void>

Writes: routines, routineDays, routineTasks

Month format: "YYYY-MM"

Create 30 days (dayIndex 1..30)

Each day inserts 3 tasks (stretch/strength/lifestyle) with duration minutes

Update src/modules/onboarding/onboarding.service.ts

After profile + optional height log inserts:

call both create functions

Keep queue .add() calls unchanged (future async)

Acceptance tests (must pass)

npx tsc --noEmit succeeds

npm run dev boots

POST /onboarding returns 200 with {onboardingId,userId,predictionQueued,routineQueued}

After onboarding, with returned userId:

GET /height/report returns 200 with non-empty history

GET /routine/active returns 200 with routineDays length 30 and tasks populated

Concerning notes

Ensure inserts are idempotent for repeated onboarding calls (future). For now, accept duplicates but do not crash.

Ensure routine generation does not exceed reasonable runtime (should be fast).

Phase 3: Dashboard & Prediction updates (no AI)
Steps

Add endpoint POST /height/logs to insert a log

Update prediction generation:

Add createPredictionFromLatestLog(userId) that appends a new prediction row

Do not mutate existing predictions

Add GET /height/logs for history

Acceptance tests

Posting a new height log appends a log and appends a prediction row

/height/report latestPrediction changes accordingly

Concerning notes

Prediction logic must be monotonic + explainable (no randomness)

Phase 4: Routine & Recovery (no AI)
Steps

Add GET /routine/day/:index (already in shared contracts) to return tasks for a day

Add pain reporting:

POST /pain/report persists pain_events

set routine status to recovery OR create a recovery routine (decide and document)

Add recovery routine generator (deterministic)

Acceptance tests

Pain report creates record and changes routine behavior deterministically

Concerning notes

Avoid overwriting active routine; use versioning or separate recovery routine.

Phase 5: Tracking & AI Coach (minimal AI usage)
Steps

POST /tracking/task-log persists completion

GET /tracking/summary returns aggregated metrics

POST /ai-coach/message uses latest stored data as context only

Acceptance tests

Task completion updates weekly summary deterministically

Concerning notes

AI coach must not fabricate state; all claims must trace to stored records.

Phase 6: AI-backed Prediction and Routine Generation (controlled, deterministic prompts)
Scope: Introduce OpenAI calls for height prediction (onboarding + height logs) and for routine generation (active + recovery), without altering API contracts.

Infrastructure
- Add OpenAI client module with temperature=0, bounded max tokens, and strict schema validation.
- Add recoveryRoutineQueue (if absent) alongside existing predictionQueue and routineQueue. Queue payloads include inputHash to skip unchanged work.

Prediction (OpenAI)
- Inputs: user profile + latest height log. Compute inputHash; if unchanged from last prediction, return cached prediction row, skip OpenAI.
- Prompt: deterministic template producing predictedAdultHeightCm, percentile, dreamHeightOddsPercent, growthCompletionPercent. Validate numeric bounds; on validation failure, fall back to existing deterministic formula.
- Invocation points: onboarding and POST /height/logs only. Never mutate routines on height logs.
- Persistence: append new row to height_predictions; do not mutate existing rows.

Routine generation (OpenAI)
- Active routine: inputs = user profile + latest prediction. Recovery routine: inputs = user profile + latest prediction + recent pain event metadata.
- Prompt: deterministic template that must output 30 days, each with 3–5 tasks, type ∈ {stretch,strength,lifestyle}, sane reps/durations, no images. Temperature=0.
- Validation: enforce counts/types/bounds; if invalid, fall back to deterministic template generator.
- Queuing: routineQueue for active, recoveryRoutineQueue for recovery. Use inputHash to avoid regenerating when inputs unchanged.
- Persistence: insert into routines + routine_days + routine_tasks only; do not change API contracts.

Safety and guardrails
- If OpenAI response missing required fields or fails validation, log and use deterministic fallback; never fail request.
- Never call OpenAI for tracking or other endpoints. Keep AI coach as the only other AI entry point.

Acceptance tests
- With unchanged inputs, repeated calls do not trigger new OpenAI generations (hash-based skip).
- On onboarding + height log, prediction rows append (AI output or fallback) and /height/report reflects latest.
- Routine generation yields 30 days with valid tasks; recovery flow yields a recovery routine with correct schema and status.
