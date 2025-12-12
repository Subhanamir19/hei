import { asc, desc, eq } from 'drizzle-orm';
import {
  CreateHeightLogRequestBody,
  CreateHeightLogResponse,
  GetHeightLogsResponse,
  GetHeightReportResponse,
} from '../../../shared/api-contracts';
import { HeightLog, HeightPrediction } from '../../../shared/domain-models';
import { db, heightLogs, heightPredictions } from '../../db/client';
import { createPredictionFromLatestLog } from './prediction.service';

const mapPrediction = (prediction: typeof heightPredictions.$inferSelect): HeightPrediction => ({
  id: prediction.id,
  userId: prediction.userId,
  predictedAdultHeightCm: prediction.predictedAdultHeightCm,
  percentile: prediction.percentile,
  dreamHeightOddsPercent: prediction.dreamHeightOddsPercent,
  growthCompletionPercent: prediction.growthCompletionPercent,
  createdAt: prediction.createdAt.toISOString(),
});

const mapHeightLog = (log: typeof heightLogs.$inferSelect): HeightLog => ({
  id: log.id,
  userId: log.userId,
  heightCm: log.heightCm,
  recordedAt: log.recordedAt.toISOString(),
});

export const getHeightReport = async (userId: string): Promise<GetHeightReportResponse> => {
  const predictions = await db
    .select()
    .from(heightPredictions)
    .where(eq(heightPredictions.userId, userId))
    .orderBy(asc(heightPredictions.createdAt));

  if (predictions.length === 0) {
    const error = new Error('No predictions found');
    (error as any).statusCode = 404;
    throw error;
  }

  const latestPrediction = predictions[predictions.length - 1];

  return {
    latestPrediction: mapPrediction(latestPrediction),
    predictionHistory: predictions.map(mapPrediction),
  };
};

export const getHeightLogs = async (userId: string): Promise<GetHeightLogsResponse> => {
  const logs = await db
    .select()
    .from(heightLogs)
    .where(eq(heightLogs.userId, userId))
    .orderBy(asc(heightLogs.recordedAt));

  return {
    heightLogs: logs.map(mapHeightLog),
  };
};

export const createHeightLog = async (
  userId: string,
  input: CreateHeightLogRequestBody,
): Promise<CreateHeightLogResponse> => {
  const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();

  const [inserted] = await db
    .insert(heightLogs)
    .values({
      userId,
      heightCm: input.heightCm,
      recordedAt,
    })
    .returning();

  await createPredictionFromLatestLog(userId);

  const [latestPrediction] = await db
    .select()
    .from(heightPredictions)
    .where(eq(heightPredictions.userId, userId))
    .orderBy(desc(heightPredictions.createdAt))
    .limit(1);

  if (!latestPrediction) {
    const error = new Error('Prediction not found after height log creation');
    (error as any).statusCode = 500;
    throw error;
  }

  return {
    heightLog: mapHeightLog(inserted),
    updatedPrediction: mapPrediction(latestPrediction),
  };
};
