import { randomUUID } from 'crypto';
import { OnboardingRequestBody, OnboardingResponse } from '../../../shared/api-contracts';
import { db, heightLogs, userProfiles, users } from '../../db/client';
import { predictionQueue, routineQueue } from '../../jobs/queues';
import { createInitialPredictionForUser } from '../height/prediction.service';
import { createInitialRoutineForUser } from '../routine/routine.generator';

export const handleOnboarding = async (
  input: OnboardingRequestBody,
): Promise<OnboardingResponse> => {
  const onboardingId = randomUUID();

  // TODO: Normalize and validate email when persistence rules are finalized.
  const [createdUser] = await db
    .insert(users)
    .values({
      email: input.email ?? null,
    })
    .returning({
      id: users.id,
    });

  const userId = createdUser.id;

  // TODO: Expand profile persistence once additional fields are introduced.
  await db.insert(userProfiles).values({
    userId,
    gender: input.gender,
    ethnicity: input.ethnicity,
    workoutCapacity: input.workoutCapacity,
    dateOfBirth: input.dateOfBirth,
    motherHeightCm: input.parentHeightsCm.mother,
    fatherHeightCm: input.parentHeightsCm.father,
    footSizeCm: input.footSizeCm,
    averageSleepHours: input.averageSleepHours,
    dreamHeightCm: input.dreamHeightCm,
  });

  if (input.initialHeightCm !== undefined) {
    await db.insert(heightLogs).values({
      userId,
      heightCm: input.initialHeightCm,
      recordedAt: input.initialHeightRecordedAt
        ? new Date(input.initialHeightRecordedAt)
        : new Date(),
    });
  }

  await createInitialPredictionForUser(userId);
  await createInitialRoutineForUser(userId);

  await predictionQueue.add('prediction', { userId });
  await routineQueue.add('routine', { userId });

  return {
    onboardingId,
    userId,
    predictionQueued: true,
    routineQueued: true,
  };
};
