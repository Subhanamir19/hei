import { db, routineDays, routineTasks, routines } from '../../db/client';

type RoutineTaskTemplate = {
  readonly name: string;
  readonly type: 'stretch' | 'strength' | 'lifestyle';
  readonly reps?: number;
  readonly durationMinutes?: number;
};

const formatMonth = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const createRoutineWithTemplate = async (
  userId: string,
  status: 'active' | 'recovery',
  taskTemplate: RoutineTaskTemplate[],
): Promise<void> => {
  const month = formatMonth(new Date());

  const [routine] = await db
    .insert(routines)
    .values({ userId, status, month })
    .returning({ id: routines.id });

  const routineDaysToInsert = Array.from({ length: 30 }, (_value, idx) => ({
    routineId: routine.id,
    dayIndex: idx + 1,
  }));

  const insertedDays = await db
    .insert(routineDays)
    .values(routineDaysToInsert)
    .returning({ id: routineDays.id });

  const tasksToInsert = insertedDays.flatMap((day) =>
    taskTemplate.map((task) => ({
      routineDayId: day.id,
      name: task.name,
      type: task.type,
      reps: task.reps,
      durationMinutes: task.durationMinutes,
    })),
  );

  await db.insert(routineTasks).values(tasksToInsert);
};

export const createInitialRoutineForUser = async (userId: string): Promise<void> => {
  const baseTemplate: RoutineTaskTemplate[] = [
    {
      name: 'Daily Stretch',
      type: 'stretch',
      durationMinutes: 10,
    },
    {
      name: 'Core Strength',
      type: 'strength',
      reps: 12,
    },
    {
      name: 'Posture Walk',
      type: 'lifestyle',
      durationMinutes: 15,
    },
  ];

  await createRoutineWithTemplate(userId, 'active', baseTemplate);
};

export const createRecoveryRoutineForUser = async (userId: string): Promise<void> => {
  const recoveryTemplate: RoutineTaskTemplate[] = [
    {
      name: 'Gentle Mobility',
      type: 'stretch',
      durationMinutes: 12,
    },
    {
      name: 'Low-Impact Core',
      type: 'strength',
      reps: 8,
    },
    {
      name: 'Recovery Walk',
      type: 'lifestyle',
      durationMinutes: 10,
    },
  ];

  await createRoutineWithTemplate(userId, 'recovery', recoveryTemplate);
};
