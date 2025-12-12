import { createHash } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { db, routineDays, routineTasks, routines, userProfiles, heightPredictions } from '../../db/client';
import { RoutineStatus } from '../../../shared/domain-models';
import { callOpenAiChat } from '../../config/openai';
import {
  RoutinePromptInput,
  RoutinePromptMode,
  buildRoutineSystemPrompt,
  buildRoutineUserPrompt,
} from './routine.prompt';

const formatMonth = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const allowedTypes = new Set(['stretch', 'strength', 'lifestyle']);

type RoutineTaskTemplate = {
  name: string;
  type: 'stretch' | 'strength' | 'lifestyle';
  reps?: number;
  durationMinutes?: number;
};

type RoutinePlan = {
  day: number;
  tasks: RoutineTaskTemplate[];
};

const hashRoutineInput = (input: RoutinePromptInput): string => {
  const json = JSON.stringify(input);
  return createHash('sha256').update(json).digest('hex');
};

const validateTask = (task: any): RoutineTaskTemplate | null => {
  if (!task || typeof task.name !== 'string' || task.name.trim().length === 0) {
    return null;
  }
  if (!allowedTypes.has(task.type)) {
    return null;
  }

  const result: RoutineTaskTemplate = {
    name: task.name.trim(),
    type: task.type,
  } as RoutineTaskTemplate;

  if (task.reps !== undefined) {
    if (typeof task.reps !== 'number' || task.reps < 1 || task.reps > 50) {
      return null;
    }
    result.reps = Math.round(task.reps);
  }

  if (task.durationMinutes !== undefined) {
    if (typeof task.durationMinutes !== 'number' || task.durationMinutes < 5 || task.durationMinutes > 60) {
      return null;
    }
    result.durationMinutes = Math.round(task.durationMinutes);
  }

  // At least one of reps or durationMinutes should exist
  if (result.reps === undefined && result.durationMinutes === undefined) {
    return null;
  }

  return result;
};

const validatePlan = (raw: any): RoutinePlan[] | null => {
  if (!raw || !Array.isArray(raw.days) || raw.days.length !== 30) {
    return null;
  }

  const plans: RoutinePlan[] = [];

  for (const dayEntry of raw.days) {
    if (typeof dayEntry.day !== 'number' || dayEntry.day < 1 || dayEntry.day > 30) {
      return null;
    }

    if (!Array.isArray(dayEntry.tasks) || dayEntry.tasks.length < 4 || dayEntry.tasks.length > 5) {
      return null;
    }

    const tasks: RoutineTaskTemplate[] = [];
    for (const task of dayEntry.tasks) {
      const validated = validateTask(task);
      if (!validated) {
        return null;
      }
      tasks.push(validated);
    }

    plans.push({ day: dayEntry.day, tasks });
  }

  return plans;
};

const parseAiRoutine = (raw: string): RoutinePlan[] | null => {
  try {
    const parsed = JSON.parse(raw);
    return validatePlan(parsed);
  } catch {
    return null;
  }
};

const fallbackTasks = (status: RoutineStatus): RoutineTaskTemplate[] => {
  if (status === 'recovery') {
    return [
      { name: 'Gentle Mobility', type: 'stretch', durationMinutes: 12 },
      { name: 'Low-Impact Core', type: 'strength', reps: 10 },
      { name: 'Recovery Walk', type: 'lifestyle', durationMinutes: 12 },
      { name: 'Breathing Reset', type: 'lifestyle', durationMinutes: 8 },
    ];
  }

  return [
    { name: 'Daily Stretch', type: 'stretch', durationMinutes: 10 },
    { name: 'Core Strength', type: 'strength', reps: 12 },
    { name: 'Posture Walk', type: 'lifestyle', durationMinutes: 15 },
    { name: 'Breathing Reset', type: 'lifestyle', durationMinutes: 8 },
  ];
};

const buildFallbackPlan = (status: RoutineStatus): RoutinePlan[] =>
  Array.from({ length: 30 }, (_v, idx) => ({
    day: idx + 1,
    tasks: fallbackTasks(status),
  }));

const insertRoutinePlan = async (
  userId: string,
  status: RoutineStatus,
  inputHash: string,
  plan: RoutinePlan[],
): Promise<void> => {
  const month = formatMonth(new Date());

  const [routine] = await db
    .insert(routines)
    .values({ userId, status, month, inputHash })
    .returning({ id: routines.id });

  const routineDaysToInsert = plan.map((day) => ({
    routineId: routine.id,
    dayIndex: day.day,
  }));

  const insertedDays = await db
    .insert(routineDays)
    .values(routineDaysToInsert)
    .returning({ id: routineDays.id, dayIndex: routineDays.dayIndex });

  const tasksToInsert = insertedDays.flatMap((dayRow) => {
    const dayPlan = plan.find((p) => p.day === dayRow.dayIndex);
    const tasks = dayPlan?.tasks ?? [];
    return tasks.map((task) => ({
      routineDayId: dayRow.id,
      name: task.name,
      type: task.type,
      reps: task.reps,
      durationMinutes: task.durationMinutes,
    }));
  });

  await db.insert(routineTasks).values(tasksToInsert);
};

const buildRoutinePromptInput = (
  profile: typeof userProfiles.$inferSelect,
  prediction: typeof heightPredictions.$inferSelect,
  mode: RoutinePromptMode,
): RoutinePromptInput => {
  const dateOfBirthIso =
    typeof profile.dateOfBirth === 'string'
      ? new Date(profile.dateOfBirth).toISOString()
      : (profile.dateOfBirth as Date).toISOString();

  return {
    gender: profile.gender,
    ethnicity: profile.ethnicity,
    workoutCapacity: profile.workoutCapacity,
    dateOfBirth: dateOfBirthIso,
    motherHeightCm: profile.motherHeightCm,
    fatherHeightCm: profile.fatherHeightCm,
    footSizeCm: profile.footSizeCm,
    averageSleepHours: profile.averageSleepHours,
    dreamHeightCm: profile.dreamHeightCm,
    latestPredictionCm: prediction.predictedAdultHeightCm,
    latestPredictionPercentile: prediction.percentile,
    mode,
  };
};

const generateRoutinePlan = async (
  input: RoutinePromptInput,
  status: RoutineStatus,
): Promise<{ plan: RoutinePlan[]; inputHash: string }> => {
  const systemPrompt = buildRoutineSystemPrompt();
  const userPrompt = buildRoutineUserPrompt(input);
  const inputHash = hashRoutineInput(input);

  const aiRaw = await callOpenAiChat(systemPrompt, userPrompt);
  const aiPlan = aiRaw ? parseAiRoutine(aiRaw) : null;
  const plan = aiPlan ?? buildFallbackPlan(status);

  return { plan, inputHash };
};

const getProfileAndPrediction = async (userId: string) => {
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

  const [prediction] = await db
    .select()
    .from(heightPredictions)
    .where(eq(heightPredictions.userId, userId))
    .orderBy(desc(heightPredictions.createdAt))
    .limit(1);

  if (!prediction) {
    const error = new Error('Prediction not found');
    (error as any).statusCode = 404;
    throw error;
  }

  return { profile, prediction };
};

export const createInitialRoutineForUser = async (userId: string): Promise<void> => {
  const { profile, prediction } = await getProfileAndPrediction(userId);
  const promptInput = buildRoutinePromptInput(profile, prediction, 'active');
  const { plan, inputHash } = await generateRoutinePlan(promptInput, 'active');

  const [latestRoutine] = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(desc(routines.createdAt))
    .limit(1);

  if (latestRoutine && latestRoutine.inputHash === inputHash && latestRoutine.status === 'active') {
    return;
  }

  await insertRoutinePlan(userId, 'active', inputHash, plan);
};

export const createRecoveryRoutineForUser = async (userId: string): Promise<void> => {
  const { profile, prediction } = await getProfileAndPrediction(userId);
  const promptInput = buildRoutinePromptInput(profile, prediction, 'recovery');
  const { plan, inputHash } = await generateRoutinePlan(promptInput, 'recovery');

  const [latestRoutine] = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(desc(routines.createdAt))
    .limit(1);

  if (latestRoutine && latestRoutine.inputHash === inputHash && latestRoutine.status === 'recovery') {
    return;
  }

  await insertRoutinePlan(userId, 'recovery', inputHash, plan);
};
