import { asc, desc, eq, inArray } from 'drizzle-orm';
import { GetActiveRoutineResponse } from '../../../shared/api-contracts';
import { RoutineStatus, RoutineTaskType } from '../../../shared/domain-models';
import { db, routineDays, routineTasks, routines } from '../../db/client';

const mapRoutineTask = (
  task: typeof routineTasks.$inferSelect,
): {
  id: string;
  name: string;
  type: RoutineTaskType;
  reps?: number;
  durationMinutes?: number;
} => ({
  id: task.id,
  name: task.name,
  type: task.type as RoutineTaskType,
  reps: task.reps ?? undefined,
  durationMinutes: task.durationMinutes ?? undefined,
});

export const getActiveRoutine = async (userId: string): Promise<GetActiveRoutineResponse> => {
  const [routine] = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(desc(routines.createdAt))
    .limit(1);

  if (!routine) {
    const error = new Error('Routine not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const routineDayRecords = await db
    .select()
    .from(routineDays)
    .where(eq(routineDays.routineId, routine.id))
    .orderBy(asc(routineDays.dayIndex));

  const routineDayIds = routineDayRecords.map((day) => day.id);

  const routineTaskRecords =
    routineDayIds.length > 0
      ? await db
          .select()
          .from(routineTasks)
          .where(inArray(routineTasks.routineDayId, routineDayIds))
      : [];

  const tasksByDayId = new Map<string, typeof routineTasks.$inferSelect[]>();

  for (const task of routineTaskRecords) {
    const tasksForDay = tasksByDayId.get(task.routineDayId) ?? [];
    tasksForDay.push(task);
    tasksByDayId.set(task.routineDayId, tasksForDay);
  }

  const mappedRoutineDays = routineDayRecords.map((day) => ({
    index: day.dayIndex,
    routineTasks: (tasksByDayId.get(day.id) ?? []).map(mapRoutineTask),
  }));

  return {
    routine: {
      id: routine.id,
      userId: routine.userId,
      status: routine.status as RoutineStatus,
      month: routine.month,
      routineDays: mappedRoutineDays,
      createdAt: routine.createdAt.toISOString(),
      updatedAt: routine.updatedAt.toISOString(),
    },
  };
};
