import { desc, eq } from 'drizzle-orm';
import { db, heightLogs, heightPredictions, userProfiles } from '../../db/client';

const bucketDreamHeightOdds = (dreamHeightCm: number, predicted: number): number => {
  const diff = dreamHeightCm - predicted;
  if (diff <= -5) return 80;
  if (diff <= 0) return 60;
  if (diff <= 5) return 40;
  return 20;
};

const computePredictedAdultHeight = (
  profile: typeof userProfiles.$inferSelect,
  latestHeightLog: typeof heightLogs.$inferSelect | undefined,
): number => {
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

  return Math.round(predictedBase);
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

export const createInitialPredictionForUser = async (userId: string): Promise<void> => {
  const { profile, latestHeightLog } = await getProfileAndLatestHeightLog(userId);

  const predictedAdultHeightCm = computePredictedAdultHeight(profile, latestHeightLog);
  const dreamHeightOddsPercent = bucketDreamHeightOdds(
    profile.dreamHeightCm,
    predictedAdultHeightCm,
  );

  await db.insert(heightPredictions).values({
    userId,
    predictedAdultHeightCm,
    percentile: 50,
    dreamHeightOddsPercent,
    growthCompletionPercent: 50,
  });
};

export const createPredictionFromLatestLog = async (userId: string): Promise<void> => {
  const { profile, latestHeightLog } = await getProfileAndLatestHeightLog(userId);

  if (!latestHeightLog) {
    const error = new Error('No height log found');
    (error as any).statusCode = 404;
    throw error;
  }

  const computedPrediction = computePredictedAdultHeight(profile, latestHeightLog);

  const [previousPrediction] = await db
    .select()
    .from(heightPredictions)
    .where(eq(heightPredictions.userId, userId))
    .orderBy(desc(heightPredictions.createdAt))
    .limit(1);

  const predictedAdultHeightCm = previousPrediction
    ? Math.max(computedPrediction, previousPrediction.predictedAdultHeightCm)
    : computedPrediction;

  const dreamHeightOddsPercent = bucketDreamHeightOdds(
    profile.dreamHeightCm,
    predictedAdultHeightCm,
  );

  await db.insert(heightPredictions).values({
    userId,
    predictedAdultHeightCm,
    percentile: 50,
    dreamHeightOddsPercent,
    growthCompletionPercent: 50,
  });
};
