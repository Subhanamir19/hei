HEIGHT APP — UPDATED BACKEND
ARCHITECTURE
STACK: Node.js (TS), Fastify/Express, Supabase Postgres, Redis, BullMQ, RevenueCat, OpenAI.
Modular monolith.
CORE RULES: • New height logs → prediction update only. • No routine regeneration on height logs. •
Pain → recovery routine. • Deterministic tracking feedback. • No exercise images in v1.
OPENAI CALLS: Only after onboarding and when height logs change (prediction only). Pain triggers
recovery routine job. Backend returns cached results if inputs unchanged.
DATA MODEL: users, user_profile, height_logs, height_predictions, routines, routine_days,
routine_tasks (name, reps, duration), task_logs, pain_events, subscriptions.
QUEUES: predictionQueue (generate prediction), routineQueue (initial monthly routine),
recoveryRoutineQueue (pain-triggered updates).
ENDPOINTS: /auth/google, /onboarding, /height/report, /height/logs, /routine/active, /routine/day/:index,
/routine/recovery (internal), /tracking/summary, /tracking/task-log, /pain/report, /ai-coach/message,
/subscription/me.
ROUTINE DAY RESPONSE SHAPE: {taskId, name, type, durationMinutes, reps}.
RECOVERY MODE: routine.status returned as 'recovery'. Frontend must show banner.
TRACKING SUMMARY: Backend computes deterministic stats (e.g., % improvement). No AI
involvement.
ONBOARDING PIPELINE: POST /onboarding → enqueue prediction+routine generation → frontend
polls.
SUBSCRIPTIONS: All premium features subscription-gated. Enforcement ready; UI gating comes later.