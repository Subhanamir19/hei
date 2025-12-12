import { and, desc, eq, gte } from "drizzle-orm";
import {
  AiCoachMessageRequestBody,
  AiCoachMessageResponse,
} from "../../../shared/api-contracts";
import { db, heightPredictions, painEvents, routines } from "../../db/client";
import { callOpenAiChat } from "../../config/openai";
import { getTrackingSummary } from "../tracking/tracking.service";

const buildDeterministicReply = (
  latestPrediction:
    | (typeof heightPredictions.$inferSelect & { createdAt: Date })
    | undefined,
  latestRoutine: (typeof routines.$inferSelect & { createdAt: Date }) | undefined,
  summary: Awaited<ReturnType<typeof getTrackingSummary>>,
  painCount: number,
): string => {
  const parts: string[] = [];

  if (latestPrediction) {
    parts.push(
      `Predicted adult height: ${latestPrediction.predictedAdultHeightCm} cm (percentile ${latestPrediction.percentile}, growth ${latestPrediction.growthCompletionPercent}% complete).`,
    );
  } else {
    parts.push("No prediction on file yet.");
  }

  if (latestRoutine) {
    parts.push(`Routine status: ${latestRoutine.status}.`);
  }

  const ts = summary.trackingSummary;
  parts.push(
    `This week: ${ts.currentWeekCompletionPercent}% completion (delta ${ts.consistencyDeltaPercent} vs last week), streak ${ts.activeStreakDays} days.`,
  );

  if (painCount > 0) {
    parts.push(`Pain events in last 14 days: ${painCount}. Prioritize recovery tasks.`);
  }

  parts.push("Focus: finish today's scheduled tasks and log completion.");
  return parts.join(" ");
};

export const handleAiCoachMessage = async (
  userId: string,
  input: AiCoachMessageRequestBody,
): Promise<AiCoachMessageResponse> => {
  const [latestPrediction] = await db
    .select()
    .from(heightPredictions)
    .where(eq(heightPredictions.userId, userId))
    .orderBy(desc(heightPredictions.createdAt))
    .limit(1);

  const [latestRoutine] = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(desc(routines.createdAt))
    .limit(1);

  const summary = await getTrackingSummary(userId);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);

  const recentPainCountResult = await db
    .select()
    .from(painEvents)
    .where(
      and(
        eq(painEvents.userId, userId),
        gte(painEvents.createdAt, fourteenDaysAgo),
      ),
    );

  const painCount = recentPainCountResult.length;

  const deterministicFallback = buildDeterministicReply(
    latestPrediction,
    latestRoutine,
    summary,
    painCount,
  );

  const systemPrompt =
    "You are a concise, supportive AI coach for a height-improvement program. Use only the provided data. Keep responses under 80 words. Avoid medical claims. If data is missing, say so briefly. Be specific and action-oriented. Never invent numbers.";

  const userPrompt = [
    `User message: ${input.message ?? ""}`,
    latestPrediction
      ? `Latest prediction: ${latestPrediction.predictedAdultHeightCm}cm, percentile ${latestPrediction.percentile}, growth ${latestPrediction.growthCompletionPercent}%.`
      : "No prediction available.",
    latestRoutine ? `Routine status: ${latestRoutine.status}.` : "No routine available.",
    `Tracking: week ${summary.trackingSummary.currentWeekCompletionPercent}% (delta ${summary.trackingSummary.consistencyDeltaPercent}), streak ${summary.trackingSummary.activeStreakDays} days, pain last 14d: ${painCount}.`,
  ].join(" ");

  try {
    const aiReply = await callOpenAiChat(systemPrompt, userPrompt);
    if (!aiReply) {
      return { reply: deterministicFallback };
    }
    return { reply: aiReply.trim() };
  } catch {
    return { reply: deterministicFallback };
  }
};
