HEIGHT APP — UPDATED PRODUCT PRD
(SYNCHRONIZED)
✓ No outdated logic. ✓ No regeneration button. ✓ Deterministic tracking feedback. ✓ Recovery mode
banner. ✓ No exercise images in v1.
ONBOARDING FLOW: gender, dob, ethnicity, parent heights, foot size, workout capacity, sleep, dream
height. On submit → backend queues prediction+routine jobs. Frontend shows “Preparing your plan…”
screen and polls /height/report and /routine/active until ready.
DASHBOARD: Displays latest prediction (predicted height, dream odds, growth completion), percentile,
height delta graph (frontend-generated using historic predictions and logs).
HEIGHT LOGGING: User can add height. Backend updates prediction ONLY (no routine changes).
ROUTINE TAB: Monthly routine generated after onboarding. View-only. No user regeneration. Routine
contains days → tasks (name, reps, duration). No images in v1.
RECOVERY MODE: When pain reported, backend generates recovery-adjusted routine. Frontend
shows top-banner: “You’re in recovery mode”. Routine content structurally same.
EXERCISE SCREEN: Text-only list: name, reps, duration. No images yet.
TRACKING: Logs task completion + optional pain. Tracking summary received from backend as
deterministic feedback (“Consistency improved 12% vs last week”).
AI COACH: Provides text guidance. Feature is subscription-gated but paywall appears later.
SUBSCRIPTIONS: All premium features require entitlement: dashboard prediction, routine view, AI
coach. Enforcement added later in UI.