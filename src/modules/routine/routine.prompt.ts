export type RoutinePromptMode = 'active' | 'recovery';

export interface RoutinePromptInput {
  gender: string;
  ethnicity: string;
  workoutCapacity: string;
  dateOfBirth: string;
  motherHeightCm: number;
  fatherHeightCm: number;
  footSizeCm: number;
  averageSleepHours: number;
  dreamHeightCm: number;
  latestPredictionCm: number;
  latestPredictionPercentile: number;
  mode: RoutinePromptMode;
}

export const buildRoutineSystemPrompt = (): string =>
  [
    'You are a deterministic routine generator for a height-improvement program.',
    'Use only the provided structured data.',
    'Respond with JSON only, no prose.',
    'Exactly 15 days; each day has exactly 5 tasks: 1 diet, 2 protocols, 2 exercises.',
    'Allowed task types: stretch, strength, lifestyle.',
    'Include reps for strength-type tasks when applicable; include durationMinutes for stretch/lifestyle tasks when applicable.',
    'Reps must be between 1 and 50; durationMinutes between 5 and 60.',
    'If constraints cannot be satisfied, respond with {"error":"reason"} only.',
  ].join(' ');

const allowedItems = {
  exercises: [
    { name: 'Cobra stretch', type: 'stretch', weight: 3, overload: '+5s hold each appearance' },
    { name: 'Bar hanging', type: 'strength', weight: 3, overload: '+5s hang each appearance' },
    { name: 'Jumping Squats', type: 'strength', weight: 2, overload: '+2 reps each appearance' },
    { name: 'Calf Stretch', type: 'stretch', weight: 2, overload: '+5s hold each appearance' },
    { name: 'Squats pose', type: 'strength', weight: 1, overload: '+2 reps each appearance' },
    { name: 'Forward Bend', type: 'stretch', weight: 1, overload: '+5s hold each appearance' },
    { name: 'Lying Butterfly Stretch', type: 'stretch', weight: 1, overload: '+5s hold each appearance' },
  ],
  protocols: [
    { name: 'Cycling with raised seat', type: 'lifestyle', weight: 3, overload: '+2 min each appearance' },
    { name: 'Massai Jump', type: 'strength', weight: 2, overload: '+5 jumps each appearance' },
    { name: 'Sprinting', type: 'strength', weight: 2, overload: '+5s each appearance' },
    { name: 'Touch the sky jump', type: 'strength', weight: 1, overload: '+3 reps each appearance' },
    { name: 'High-knee sprinting', type: 'strength', weight: 1, overload: '+5s each appearance' },
  ],
  diet: [
    { name: 'Bone broth', type: 'lifestyle', weight: 2, overload: 'keep serving 8-12 oz stable' },
    { name: 'Raw dairy milk', type: 'lifestyle', weight: 2, overload: 'keep serving 8-12 oz stable' },
    { name: 'Royal jelly', type: 'lifestyle', weight: 1, overload: 'keep 1-2 tsp stable' },
    { name: 'Unsalted cheese', type: 'lifestyle', weight: 1, overload: 'keep 1-2 slices stable' },
    { name: 'Raw honey', type: 'lifestyle', weight: 1, overload: 'keep 1-2 tsp stable' },
    { name: 'Red meat', type: 'lifestyle', weight: 1, overload: 'keep 100-150g stable' },
    { name: 'Egg yolks', type: 'lifestyle', weight: 1, overload: 'keep 2-3 yolks stable' },
  ],
};

export const buildRoutineUserPrompt = (input: RoutinePromptInput): string => {
  const payload = {
    ...input,
  };

  const guidance = {
    selectionRules:
      'Each day: pick 1 diet, 2 distinct protocols, 2 distinct exercises. Favor higher weights but rotate; avoid repeating the exact same set two days in a row.',
    overload: 'Apply progressive overload per item based on its overload note; track prior appearances.',
  };

  return [
    'Input JSON:',
    JSON.stringify(payload),
    'Allowed items:',
    JSON.stringify(allowedItems),
    'Selection rules:',
    JSON.stringify(guidance),
    'Output strictly in JSON with shape: { "days": [ { "day": number (1-15), "tasks": [ { "name": string, "type": "stretch"|"strength"|"lifestyle", "reps"?: number, "durationMinutes"?: number } ] } ] }',
    'Return exactly 15 days; exactly 5 tasks per day (1 diet, 2 protocols, 2 exercises). No extra commentary.',
  ].join('\n');
};
