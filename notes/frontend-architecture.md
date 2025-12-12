ARCH OVERVIEW: React Native (Expo). Screens: onboarding, dashboard, routine, routine-day,
tracking, exercises, AI coach.
STATE MANAGEMENT: Zustand or Jotai for local state, React Query for server state & polling.
Persistent storage via SecureStore for tokens.
ONBOARDING: After POST /onboarding success → navigate to ‘Preparing your plan…’ screen. Poll
/height/report and /routine/active until both return populated.
DASHBOARD: Reads prediction + history. Graph generated locally. Deterministic feedback from
backend displayed.
ROUTINE PLAN SCREEN: View-only. No regenerate button. Displays days list. If routine.status ==
'recovery', show recovery banner.
ROUTINE DAY SCREEN: Text-only tasks: name, reps, duration. No images in v1. Errors handled
gracefully.
TRACKING: Logs completion & pain. Fetches tracking summary from backend (deterministic).
PAIN REPORTING: Sends pain event → backend may regenerate routine → frontend refreshes routine
& shows banner.
AI COACH: Simple message → response endpoint (non-streaming).
SUBSCRIPTION: Architecture acknowledges future paywall gating, not implemented y