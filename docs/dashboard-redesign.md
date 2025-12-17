## User-visible behavior changes and invariants
- Replace current Dashboard layout with the “Last Report” screen matching the provided mock: header, two height tiles (current/predicted), “Optimize up to X inches” pill, dark chart card with callouts, percentile pill, and two metric cards (dream height odds, growth complete).
- Current height displays the user’s latest recorded/onboarding height in feet/inches (with cm in parentheses if desired for accessibility); invariant: always derived from latest height log or onboarding input.
- Predicted height displays the model prediction in feet/inches; invariant: uses latest prediction from backend without arbitrary offsets.
- Optimize up to X inches shows `predicted – current` in inches, floored at 0 (never negative); invariant: shows 0.0 if predicted ≤ current.
- Taller than X% of your age uses backend percentile; invariant: render even if zero, and clamp 0–100.
- Dream height odds shows backend `dreamHeightOddsPercent` plus dream height in parentheses; invariant: no invented numbers—only backend values.
- Growth complete shows backend `growthCompletionPercent`; invariant: clamp to 0–100 and show one decimal or whole percent consistently.
- Loading/error states remain: shimmer/spinner while fetching, error text when requests fail; empty states when no prediction/height data.

## Data flow (old vs new)
- Inputs: `GET /height/dashboard` -> `{ latestHeightLog, latestPrediction, predictionHistory, dreamHeightCm, dateOfBirth }`; `GET /tracking/summary` -> `{ trackingSummary }`.
- Transforms (old): height strings formatted feet/inches with cm; percentile shown directly; prediction history rendered as list; CTA showed dream gap; chart drawn from prediction history deltas.
- Transforms (new):
  - `currentHeightInches = latestHeightLog.heightCm / 2.54`
  - `predictedHeightInches = latestPrediction.predictedAdultHeightCm / 2.54`
  - `optimizeDeltaInches = max(0, predictedHeightInches - currentHeightInches)`
  - Percentile text uses `latestPrediction.percentile`
  - Dream height odds uses `latestPrediction.dreamHeightOddsPercent` and `dreamHeightCm`
  - Growth complete uses `latestPrediction.growthCompletionPercent`
  - Chart still uses `predictionHistory` points; callouts label latest height and delta from previous point if available.
- Outputs: formatted strings for tiles/pills/cards; chart path + callouts; tracking pill text. No new backend calls planned.

## Backward-compatibility & silent-break risks
- If backend omits `latestPrediction` or `latestHeightLog`, UI must gracefully show placeholders instead of crashing.
- Height formatting must handle cm-only locales; feet/inches math rounding must not regress existing displays.
- Clamping percentages prevents UI overflow if backend sends out-of-range values.
- Any added optional fields in types must remain backward-compatible with current API payloads.
- Avoid changing navigation names/route keys to not break saved navigation state.

## Files to modify (and why)
- `frontend/src/screens/DashboardScreen.tsx`: Rebuild layout to match mock, compute deltas/percentiles, wire data to new UI sections.
- `frontend/src/api/types.ts`: Ensure types cover any additional optional fields (if needed for chart callouts or dream height display).
- `frontend/src/theme/tokens.ts` (optional): Add light palette values and shadows to mirror the mock’s cream/gold surfaces.
- `frontend/src/components/Screen.tsx` (optional): Allow light background override for this screen if needed.
- `frontend/src/components/*` (optional new small components): Reusable pill/metric card styling if we abstract them.

## New files to add (and why they can’t be reused)
- None strictly required. If we extract reusable UI elements (e.g., `MetricCard`, `HeightTile`, `PillButton`), they would be new components under `frontend/src/components/` because existing components do not cover the light, rounded, pill-style UI in the mock.

## Files that must remain untouched (guardrails)
- Backend route handlers and DB schemas: no server-side contract changes planned.
- Navigation setup (`frontend/src/navigation/AppNavigator.tsx`) to avoid route key/name changes.
- Global providers/state outside dashboard (auth store, other screens) unless a bug is discovered.

## API routes audit (new/changed/deprecated)
- New: none.
- Changed: none planned; continue using `GET /height/dashboard` and `GET /tracking/summary`.
- Deprecated: none. Backend contract should remain stable; frontend adapts presentation only. 
