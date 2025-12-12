import { ReportPainRequestBody, ReportPainResponse } from '../../../shared/api-contracts';
import { PainEvent } from '../../../shared/domain-models';
import { db, painEvents } from '../../db/client';
import { recoveryRoutineQueue } from '../../jobs/queues';
import { createRecoveryRoutineForUser } from '../routine/routine.generator';

const mapPainEvent = (event: typeof painEvents.$inferSelect): PainEvent => ({
  id: event.id,
  userId: event.userId,
  area: event.area,
  severity: event.severity as PainEvent['severity'],
  notes: event.notes ?? undefined,
  createdAt: event.createdAt.toISOString(),
});

export const reportPainEvent = async (
  userId: string,
  input: ReportPainRequestBody,
): Promise<ReportPainResponse> => {
  const [inserted] = await db
    .insert(painEvents)
    .values({
      userId,
      area: input.area,
      severity: input.severity,
      notes: input.notes ?? null,
    })
    .returning();

  const recoveryInputHash = await createRecoveryRoutineForUser(userId);

  await recoveryRoutineQueue.add('recoveryRoutine', { userId, inputHash: recoveryInputHash });

  return {
    painEvent: mapPainEvent(inserted),
    recoveryRoutineQueued: true,
  };
};
