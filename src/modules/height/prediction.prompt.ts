export const buildPredictionSystemPrompt = (): string =>
  [
    'You are a deterministic height prediction engine.',
    'Use only the provided structured input.',
    'Respond with JSON only, no prose.',
    'Percentile must be relative to peers of the same age.',
  ].join(' ');

export interface PredictionPromptInput {
  gender: string;
  ethnicity: string;
  workoutCapacity: string;
  dateOfBirth: string;
  motherHeightCm: number;
  fatherHeightCm: number;
  footSizeCm: number;
  averageSleepHours: number;
  dreamHeightCm: number;
  latestHeightCm?: number;
  latestHeightRecordedAt?: string;
}

export const buildPredictionUserPrompt = (input: PredictionPromptInput): string => {
  const payload = {
    ...input,
  };

  return [
    'Input JSON:',
    JSON.stringify(payload),
    'Respond with JSON object: { "predictedAdultHeightCm": number (100-250), "percentile": number (1-99), "dreamHeightOddsPercent": number (0-100), "growthCompletionPercent": number (0-100) }',
    'percentile = how tall this user is versus people the same age.',
    'Do not include explanations.',
  ].join('\n');
};
