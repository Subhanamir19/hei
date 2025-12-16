# Routine Generation Upgrade Plan

Goal: introduce a resilient AI-assisted routine generator that reliably produces 15 days × 5 tasks/day (1 diet + 2 protocols + 2 exercises) using weighted items and progressive overload, with deterministic fallback and strict validation, without breaking existing flows.

## Scope & Principles
- Keep API contracts unchanged (routine endpoints stay the same).
- Do not alter DB schema.
- Idempotent generation via input hashing; skip regen when inputs unchanged.
- Always persist valid routines; never overwrite; append new rows only.
- Deterministic fallback whenever AI output is missing/invalid/timed out.
- Keep queue behavior unchanged (still supports MOCK_QUEUES).

## Backend Changes
- Prompt tightening (age/weight/overload aware):
  - Update `src/modules/routine/routine.prompt.ts` to include the weighted item list (exercises/protocols/diet) with progressive overload rules and the required 15×5 structure.
  - Explicit JSON-only instruction and failure path (`{"error":"..."}`) if constraints can’t be met.
- Generator logic:
  - `src/modules/routine/routine.generator.ts`
    - Inject the new prompt content.
    - Enforce target shape: exactly 15 days, each with 5 tasks (1 diet, 2 protocol, 2 exercise).
    - Validate fields: name non-empty, type ∈ {stretch,strength,lifestyle} OR map to {diet,protocol,exercise} categories; duration/reps within sane bounds; notes optional.
    - Apply inputHash skip: if latest routine for user has same hash and matching status, return hash.
    - Deterministic fallback builder using the provided weighted items and overload rules; guarantee 15×5 output.
    - Timeout guard around `callOpenAiChat`; on timeout/error/validation failure -> fallback.
- Types/contracts:
  - No schema changes.
  - Ensure `routine.prompt` types match the new task categories; if adding a diet/protocol mapping, normalize to existing `RoutineTaskType` or extend mapping inside generator before insert.
- Persistence:
  - Keep insert flow: `routines` -> `routine_days` -> `routine_tasks` with validated data only.
  - Reject invalid AI payloads before insertion; never partially insert.
- Hashing:
  - Continue using sha256 of prompt input (profile + prediction) for `inputHash`; reuse in job payloads.
- Logging/metrics:
  - Log validation failures with truncated AI response for debugging (no PII).

## Frontend Changes
- No contract changes expected; Routine screen already reads `/routine/active`.
- Optional: surface AI vs fallback (if desired) via a non-breaking field; otherwise no UI change needed.

## Testing Plan
- Unit tests (if harness exists) for validator: valid payload, invalid types, wrong counts, missing fields.
- Integration manual:
  - Force AI path: MOCK_QUEUES=false, ensure OpenAI key set; verify routine days=15, tasks=5/day.
  - Force fallback: simulate bad AI JSON (e.g., mock `callOpenAiChat` to return junk); verify deterministic plan inserted.
  - Hash reuse: run onboarding twice with same inputs -> no new routine when hash matches.
- Non-regression: `npm run build` (backend tsc), `npx tsc --noEmit` (frontend).

## Rollout Steps
1) Implement prompt + generator validation/fallback in `routine.generator.ts` and `routine.prompt.ts`.
2) Keep existing routes/queues untouched.
3) Deploy backend; restart server/queues.
4) Smoke test onboarding + `/routine/active` to confirm 15×5 deterministic output in fallback and AI success cases.
