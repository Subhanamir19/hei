import { db, routineDays, routineTasks, routines } from '../../db/client';

const formatMonth = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const createInitialRoutineForUser = async (userId: string): Promise<void> => {
  const month = formatMonth(new Date());

  const [routine] = await db
    .insert(routines)
    .values({ userId, status: 'active', month })
    .returning({ id: routines.id });

  const routineDaysToInsert = Array.from({ length: 30 }, (_value, idx) => ({
    routineId: routine.id,
    dayIndex: idx + 1,
  }));

  const insertedDays = await db
    .insert(routineDays)
    .values(routineDaysToInsert)
    .returning({ id: routineDays.id });

  const tasksToInsert = insertedDays.flatMap((day) => [
    {
      routineDayId: day.id,
      name: 'Daily Stretch',
      type: 'stretch',
      durationMinutes: 10,
    },
    {
      routineDayId: day.id,
      name: 'Core Strength',
      type: 'strength',
      reps: 12,
    },
    {
      routineDayId: day.id,
      name: 'Posture Walk',
      type: 'lifestyle',
      durationMinutes: 15,
    },
  ]);

  await db.insert(routineTasks).values(tasksToInsert);
};
