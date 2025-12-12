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
    'Tasks per day must be between 4 and 5.',
    'Allowed task types: stretch, strength, lifestyle.',
    'Include reps for strength tasks when applicable; include durationMinutes for stretch/lifestyle tasks when applicable.',
    'Reps must be between 1 and 50; durationMinutes between 5 and 60.',
  ].join(' ');

export const buildRoutineUserPrompt = (input: RoutinePromptInput): string => {
  const payload = {
    ...input,
  };

  return [
    'Input JSON:',
    JSON.stringify(payload),
    'Output strictly in JSON with shape: { "days": [ { "day": number (1-30), "tasks": [ { "name": string, "type": "stretch"|"strength"|"lifestyle", "reps"?: number, "durationMinutes"?: number } ] } ] }',
    'Return exactly 30 days. 4 to 5 tasks per day. No extra commentary.',
  ].join('\n');
};
