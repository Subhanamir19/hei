import { asc, eq } from 'drizzle-orm';
import { GetHeightReportResponse } from '../../../shared/api-contracts';
import { HeightPrediction } from '../../../shared/domain-models';
import { db, heightPredictions } from '../../db/client';

const mapPrediction = (prediction: typeof heightPredictions.$inferSelect): HeightPrediction => ({
  id: prediction.id,
  userId: prediction.userId,
  predictedAdultHeightCm: prediction.predictedAdultHeightCm,
  percentile: prediction.percentile,
  dreamHeightOddsPercent: prediction.dreamHeightOddsPercent,
  growthCompletionPercent: prediction.growthCompletionPercent,
  createdAt: prediction.createdAt.toISOString(),
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
