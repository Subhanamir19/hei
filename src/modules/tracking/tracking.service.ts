import { and, asc, desc, eq, gte, lt, count } from 'drizzle-orm';
import {
  CreateTaskLogRequestBody,
  CreateTaskLogResponse,
  GetTrackingSummaryResponse,
} from '../../../shared/api-contracts';
import { TaskLog, TrackingSummary } from '../../../shared/domain-models';
import { db, painEvents, routines, taskLogs, routineTasks, routineDays } from '../../db/client';

const dateOnlyString = (date: Date): string =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);

const mapTaskLog = (log: typeof taskLogs.$inferSelect): TaskLog => ({
  id: log.id,
  userId: log.userId,
  routineId: log.routineId,
  routineTaskId: log.routineTaskId,
  dayIndex: log.dayIndex,
  date: `${log.date}T00:00:00.000Z`,
  completed: log.completed,
  loggedAt: log.loggedAt.toISOString(),
});

const startOfWeekUtc = (date: Date): Date => {
  const day = date.getUTCDay(); // 0 Sunday, 1 Monday, ...
  const diffToMonday = (day + 6) % 7; // 0 if Monday, 6 if Sunday
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - diffToMonday);
  return start;
};

const addDaysUtc = (date: Date, days: number): Date => {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

const computeCompletionPercent = (logs: typeof taskLogs.$inferSelect[]): number => {
  if (logs.length === 0) return 0;
  const completed = logs.filter((log) => log.completed).length;
  return Math.round((completed / logs.length) * 100);
};

const computeActiveStreak = (completedDateStrings: string[]): number => {
  if (completedDateStrings.length === 0) return 0;
  const seen = new Set<string>(completedDateStrings);
  let streak = 0;
  const today = new Date();
  let cursorDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  while (true) {
    const key = dateOnlyString(cursorDate);
    if (seen.has(key)) {
      streak += 1;
      cursorDate = addDaysUtc(cursorDate, -1);
    } else {
      break;
    }
  }

  return streak;
};

export const createTaskLog = async (
  userId: string,
  input: CreateTaskLogRequestBody,
): Promise<CreateTaskLogResponse> => {
  if (!Number.isInteger(input.dayIndex) || input.dayIndex < 1) {
    const error = new Error('Invalid day index');
    (error as any).statusCode = 400;
    throw error;
  }

  const logDate = input.date ? new Date(input.date) : new Date();
  if (Number.isNaN(logDate.getTime())) {
    const error = new Error('Invalid date');
    (error as any).statusCode = 400;
    throw error;
  }

  const [taskRecord] = await db
    .select({
      taskId: routineTasks.id,
      routineId: routines.id,
      routineUserId: routines.userId,
      routineDayIndex: routineDays.dayIndex,
    })
    .from(routineTasks)
    .innerJoin(routineDays, eq(routineDays.id, routineTasks.routineDayId))
    .innerJoin(routines, eq(routines.id, routineDays.routineId))
    .where(eq(routineTasks.id, input.taskId))
    .limit(1);

  if (!taskRecord) {
    const error = new Error('Routine task not found');
    (error as any).statusCode = 404;
    throw error;
  }

  if (taskRecord.routineUserId !== userId) {
    const error = new Error('Unauthorized');
    (error as any).statusCode = 401;
    throw error;
  }

  if (taskRecord.routineId !== input.routineId) {
    const error = new Error('Task does not belong to routine');
    (error as any).statusCode = 400;
    throw error;
  }

  if (taskRecord.routineDayIndex !== input.dayIndex) {
    const error = new Error('Day index mismatch');
    (error as any).statusCode = 400;
    throw error;
  }

  const [inserted] = await db
    .insert(taskLogs)
    .values({
      userId,
      routineId: input.routineId,
      routineTaskId: input.taskId,
      dayIndex: input.dayIndex,
      date: dateOnlyString(logDate),
      completed: input.completed,
    })
    .returning();

  const summary = await getTrackingSummary(userId);

  return {
    taskLog: mapTaskLog(inserted),
    trackingSummary: summary.trackingSummary,
  };
};

export const getTrackingSummary = async (userId: string): Promise<GetTrackingSummaryResponse> => {
  const now = new Date();
  const currentWeekStart = startOfWeekUtc(now);
  const nextWeekStart = addDaysUtc(currentWeekStart, 7);
  const lastWeekStart = addDaysUtc(currentWeekStart, -7);
  const currentWeekStartStr = dateOnlyString(currentWeekStart);
  const nextWeekStartStr = dateOnlyString(nextWeekStart);
  const lastWeekStartStr = dateOnlyString(lastWeekStart);

  const currentWeekLogs = await db
    .select()
    .from(taskLogs)
    .where(
      and(
        eq(taskLogs.userId, userId),
        gte(taskLogs.date, currentWeekStartStr),
        lt(taskLogs.date, nextWeekStartStr),
      ),
    )
    .orderBy(asc(taskLogs.date));

  const lastWeekLogs = await db
    .select()
    .from(taskLogs)
    .where(
      and(
        eq(taskLogs.userId, userId),
        gte(taskLogs.date, lastWeekStartStr),
        lt(taskLogs.date, currentWeekStartStr),
      ),
    );

  const currentWeekCompletion = computeCompletionPercent(currentWeekLogs);
  const lastWeekCompletion = computeCompletionPercent(lastWeekLogs);
  const consistencyDeltaPercent = currentWeekCompletion - lastWeekCompletion;

  const [{ count: totalCompleted }] = await db
    .select({ count: count() })
    .from(taskLogs)
    .where(and(eq(taskLogs.userId, userId), eq(taskLogs.completed, true)));

  const [{ count: totalPainEvents }] = await db
    .select({ count: count() })
    .from(painEvents)
    .where(eq(painEvents.userId, userId));

  const completedLogDates = await db
    .select({ date: taskLogs.date })
    .from(taskLogs)
    .where(and(eq(taskLogs.userId, userId), eq(taskLogs.completed, true)))
    .orderBy(desc(taskLogs.date));

  const activeStreakDays = computeActiveStreak(completedLogDates.map((row) => row.date));

  const [latestRoutine] = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(desc(routines.createdAt))
    .limit(1);

  const daysSinceWeekStart =
    Math.floor(
      (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
        currentWeekStart.getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;

  const recoveryDaysThisWeek =
    latestRoutine && latestRoutine.status === 'recovery' ? Math.max(daysSinceWeekStart, 0) : 0;

  const trackingSummary: TrackingSummary = {
    currentWeekCompletionPercent: currentWeekCompletion,
    lastWeekCompletionPercent: lastWeekCompletion,
    consistencyDeltaPercent,
    totalTasksCompleted: Number(totalCompleted ?? 0),
    totalPainEvents: Number(totalPainEvents ?? 0),
    activeStreakDays,
    recoveryDaysThisWeek,
  };

  return { trackingSummary };
};
