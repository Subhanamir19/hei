import { createHash } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { db, heightLogs, heightPredictions, userProfiles } from '../../db/client';
import { callOpenAiChat } from '../../config/openai';
import {
  buildPredictionSystemPrompt,
  buildPredictionUserPrompt,
  PredictionPromptInput,
} from './prediction.prompt';

interface AiPredictionResult {
  predictedAdultHeightCm: number;
  percentile: number;
  dreamHeightOddsPercent: number;
  growthCompletionPercent: number;
}

const bucketDreamHeightOdds = (dreamHeightCm: number, predicted: number): number => {
  const diff = dreamHeightCm - predicted;
  if (diff <= -5) return 80;
  if (diff <= 0) return 60;
  if (diff <= 5) return 40;
  return 20;
};

const computeDeterministicPrediction = (
  profile: typeof userProfiles.$inferSelect,
  latestHeightLog: typeof heightLogs.$inferSelect | undefined,
): AiPredictionResult => {
  let predictedBase = (profile.motherHeightCm + profile.fatherHeightCm) / 2;

  if (profile.gender === 'male') {
    predictedBase += 5;
  } else if (profile.gender === 'female') {
    predictedBase -= 5;
  }

  if (latestHeightLog) {
    if (latestHeightLog.heightCm > predictedBase) {
      predictedBase += 1;
    } else if (latestHeightLog.heightCm < predictedBase) {
      predictedBase -= 1;
    }
  }

  const predictedAdultHeightCm = Math.round(predictedBase);
  const dreamHeightOddsPercent = bucketDreamHeightOdds(
    profile.dreamHeightCm,
    predictedAdultHeightCm,
  );

  return {
    predictedAdultHeightCm,
    percentile: 50,
    dreamHeightOddsPercent,
    growthCompletionPercent: 50,
  };
};

const getProfileAndLatestHeightLog = async (userId: string) => {
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    const error = new Error('User profile not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const [latestHeightLog] = await db
    .select()
    .from(heightLogs)
    .where(eq(heightLogs.userId, userId))
    .orderBy(desc(heightLogs.recordedAt))
    .limit(1);

  return { profile, latestHeightLog };
};

const buildPromptInput = (
  profile: typeof userProfiles.$inferSelect,
  latestHeightLog: typeof heightLogs.$inferSelect | undefined,
): PredictionPromptInput => {
  const dateOfBirthIso =
    typeof profile.dateOfBirth === 'string'
      ? new Date(profile.dateOfBirth).toISOString()
      : (profile.dateOfBirth as Date).toISOString();

  const latestHeightRecordedAtIso =
    latestHeightLog && typeof latestHeightLog.recordedAt === 'string'
      ? new Date(latestHeightLog.recordedAt).toISOString()
      : latestHeightLog?.recordedAt instanceof Date
        ? latestHeightLog.recordedAt.toISOString()
        : undefined;

  return {
    gender: profile.gender,
    ethnicity: profile.ethnicity,
    workoutCapacity: profile.workoutCapacity,
    dateOfBirth: dateOfBirthIso,
    motherHeightCm: profile.motherHeightCm,
    fatherHeightCm: profile.fatherHeightCm,
    footSizeCm: profile.footSizeCm,
    averageSleepHours: profile.averageSleepHours,
    dreamHeightCm: profile.dreamHeightCm,
    latestHeightCm: latestHeightLog?.heightCm,
    latestHeightRecordedAt: latestHeightRecordedAtIso,
  };
};

const hashInput = (input: PredictionPromptInput): string => {
  const json = JSON.stringify(input);
  return createHash('sha256').update(json).digest('hex');
};

const parseAiPrediction = (raw: string): AiPredictionResult | null => {
  try {
    const parsed = JSON.parse(raw);
    const { predictedAdultHeightCm, percentile, dreamHeightOddsPercent, growthCompletionPercent } =
      parsed ?? {};

    if (
      typeof predictedAdultHeightCm !== 'number' ||
      predictedAdultHeightCm < 100 ||
      predictedAdultHeightCm > 250
    ) {
      return null;
    }
    if (typeof percentile !== 'number' || percentile < 1 || percentile > 99) {
      return null;
    }
    if (
      typeof dreamHeightOddsPercent !== 'number' ||
      dreamHeightOddsPercent < 0 ||
      dreamHeightOddsPercent > 100
    ) {
      return null;
    }
    if (
      typeof growthCompletionPercent !== 'number' ||
      growthCompletionPercent < 0 ||
      growthCompletionPercent > 100
    ) {
      return null;
    }

    return {
      predictedAdultHeightCm,
      percentile,
      dreamHeightOddsPercent,
      growthCompletionPercent,
    };
  } catch {
    return null;
  }
};

const generatePrediction = async (
  input: PredictionPromptInput,
  profile: typeof userProfiles.$inferSelect,
  latestHeightLog: typeof heightLogs.$inferSelect | undefined,
  previousPrediction: typeof heightPredictions.$inferSelect | undefined,
): Promise<AiPredictionResult> => {
  const systemPrompt = buildPredictionSystemPrompt();
  const userPrompt = buildPredictionUserPrompt(input);
  const aiRaw = await callOpenAiChat(systemPrompt, userPrompt);
  const parsed = aiRaw ? parseAiPrediction(aiRaw) : null;

  if (parsed) {
    let monotonicHeight = parsed.predictedAdultHeightCm;

    if (previousPrediction) {
      monotonicHeight = Math.max(monotonicHeight, previousPrediction.predictedAdultHeightCm);
    }

    if (latestHeightLog) {
      monotonicHeight = Math.max(monotonicHeight, latestHeightLog.heightCm);
    }

    return {
      ...parsed,
      predictedAdultHeightCm: Math.round(monotonicHeight),
    };
  }

  return computeDeterministicPrediction(profile, latestHeightLog);
};

export const createInitialPredictionForUser = async (userId: string): Promise<string> => {
  const { profile, latestHeightLog } = await getProfileAndLatestHeightLog(userId);
  const promptInput = buildPromptInput(profile, latestHeightLog);
  const inputHash = hashInput(promptInput);

  const [previousPrediction] = await db
    .select()
    .from(heightPredictions)
    .where(eq(heightPredictions.userId, userId))
    .orderBy(desc(heightPredictions.createdAt))
    .limit(1);

  if (previousPrediction && previousPrediction.inputHash === inputHash) {
    return inputHash;
  }

  const prediction = await generatePrediction(
    promptInput,
    profile,
    latestHeightLog,
    previousPrediction,
  );

  await db.insert(heightPredictions).values({
    userId,
    predictedAdultHeightCm: prediction.predictedAdultHeightCm,
    percentile: prediction.percentile,
    dreamHeightOddsPercent: prediction.dreamHeightOddsPercent,
    growthCompletionPercent: prediction.growthCompletionPercent,
    inputHash,
  });

  return inputHash;
};

export const createPredictionFromLatestLog = async (userId: string): Promise<string> => {
  const { profile, latestHeightLog } = await getProfileAndLatestHeightLog(userId);

  if (!latestHeightLog) {
    const error = new Error('No height log found');
    (error as any).statusCode = 404;
    throw error;
  }

  const promptInput = buildPromptInput(profile, latestHeightLog);
  const inputHash = hashInput(promptInput);

  const [previousPrediction] = await db
    .select()
    .from(heightPredictions)
    .where(eq(heightPredictions.userId, userId))
    .orderBy(desc(heightPredictions.createdAt))
    .limit(1);

  if (previousPrediction && previousPrediction.inputHash === inputHash) {
    return inputHash;
  }

  const prediction = await generatePrediction(
    promptInput,
    profile,
    latestHeightLog,
    previousPrediction,
  );

  await db.insert(heightPredictions).values({
    userId,
    predictedAdultHeightCm: prediction.predictedAdultHeightCm,
    percentile: prediction.percentile,
    dreamHeightOddsPercent: prediction.dreamHeightOddsPercent,
    growthCompletionPercent: prediction.growthCompletionPercent,
    inputHash,
  });

  return inputHash;
};
