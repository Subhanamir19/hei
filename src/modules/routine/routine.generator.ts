import { createHash } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { db, routineDays, routineTasks, routines, userProfiles, heightPredictions } from '../../db/client';
import { RoutineStatus, RoutineTaskType } from '../../../shared/domain-models';
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

type Category = 'diet' | 'protocol' | 'exercise';

type RoutineTaskTemplate = {
  name: string;
  type: 'stretch' | 'strength' | 'lifestyle';
  category: Category;
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

type WeightedItem = {
  name: string;
  type: RoutineTaskTemplate['type'];
  category: Category;
  weight: number;
  baseReps?: number;
  baseDuration?: number;
  incrementReps?: number;
  incrementDuration?: number;
};

const dietItems: WeightedItem[] = [
  { name: 'Bone broth', type: 'lifestyle', category: 'diet', weight: 2, baseReps: 1 },
  { name: 'Raw dairy milk', type: 'lifestyle', category: 'diet', weight: 2, baseReps: 1 },
  { name: 'Royal jelly', type: 'lifestyle', category: 'diet', weight: 1, baseReps: 1 },
  { name: 'Unsalted cheese', type: 'lifestyle', category: 'diet', weight: 1, baseReps: 1 },
  { name: 'Raw honey', type: 'lifestyle', category: 'diet', weight: 1, baseReps: 1 },
  { name: 'Red meat', type: 'lifestyle', category: 'diet', weight: 1, baseReps: 1 },
  { name: 'Egg yolks', type: 'lifestyle', category: 'diet', weight: 1, baseReps: 1 },
];

const protocolItems: WeightedItem[] = [
  { name: 'Cycling with raised seat', type: 'lifestyle', category: 'protocol', weight: 3, baseDuration: 12, incrementDuration: 2 },
  { name: 'Massai Jump', type: 'strength', category: 'protocol', weight: 2, baseReps: 20, incrementReps: 5 },
  { name: 'Sprinting', type: 'strength', category: 'protocol', weight: 2, baseDuration: 10, incrementDuration: 1 },
  { name: 'Touch the sky jump', type: 'strength', category: 'protocol', weight: 1, baseReps: 15, incrementReps: 3 },
  { name: 'High-knee sprinting', type: 'strength', category: 'protocol', weight: 1, baseDuration: 8, incrementDuration: 1 },
];

const exerciseItems: WeightedItem[] = [
  { name: 'Cobra stretch', type: 'stretch', category: 'exercise', weight: 3, baseDuration: 5, incrementDuration: 1 },
  { name: 'Bar hanging', type: 'strength', category: 'exercise', weight: 3, baseDuration: 5, incrementDuration: 1 },
  { name: 'Jumping Squats', type: 'strength', category: 'exercise', weight: 2, baseReps: 12, incrementReps: 2 },
  { name: 'Calf Stretch', type: 'stretch', category: 'exercise', weight: 2, baseDuration: 5, incrementDuration: 1 },
  { name: 'Squats pose', type: 'strength', category: 'exercise', weight: 1, baseReps: 12, incrementReps: 2 },
  { name: 'Forward Bend', type: 'stretch', category: 'exercise', weight: 1, baseDuration: 5, incrementDuration: 1 },
  { name: 'Lying Butterfly Stretch', type: 'stretch', category: 'exercise', weight: 1, baseDuration: 5, incrementDuration: 1 },
];

const classifyTask = (name: string): Category | null => {
  const lower = name.trim().toLowerCase();
  if (dietItems.some((i) => i.name.toLowerCase() === lower)) return 'diet';
  if (protocolItems.some((i) => i.name.toLowerCase() === lower)) return 'protocol';
  if (exerciseItems.some((i) => i.name.toLowerCase() === lower)) return 'exercise';
  return null;
};

const validateTask = (task: any): RoutineTaskTemplate | null => {
  if (!task || typeof task.name !== 'string' || task.name.trim().length === 0) {
    return null;
  }
  if (!allowedTypes.has(task.type)) {
    return null;
  }

  const category = classifyTask(task.name);
  if (!category) {
    return null;
  }

  const result: RoutineTaskTemplate = {
    name: task.name.trim(),
    type: task.type,
    category,
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

  if (result.reps === undefined && result.durationMinutes === undefined) {
    return null;
  }

  return result;
};

const validatePlan = (raw: any): RoutinePlan[] | null => {
  if (!raw || !Array.isArray(raw.days) || raw.days.length !== 15) {
    return null;
  }

  const plans: RoutinePlan[] = [];

  for (const dayEntry of raw.days) {
    if (typeof dayEntry.day !== 'number' || dayEntry.day < 1 || dayEntry.day > 15) {
      return null;
    }

    if (!Array.isArray(dayEntry.tasks) || dayEntry.tasks.length !== 5) {
      return null;
    }

    const tasks: RoutineTaskTemplate[] = [];
    const names = new Set<string>();
    for (const task of dayEntry.tasks) {
      const validated = validateTask(task);
      if (!validated) {
        return null;
      }
      if (names.has(validated.name)) {
        return null;
      }
      names.add(validated.name);
      tasks.push(validated);
    }

    const dietCount = tasks.filter((t) => t.category === 'diet').length;
    const protocolCount = tasks.filter((t) => t.category === 'protocol').length;
    const exerciseCount = tasks.filter((t) => t.category === 'exercise').length;

    if (dietCount !== 1 || protocolCount !== 2 || exerciseCount !== 2) {
      return null;
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

const weightedPool = (items: WeightedItem[]): WeightedItem[] =>
  items.flatMap((item) => Array.from({ length: item.weight }).map(() => item));

const pickFromPool = (
  pool: WeightedItem[],
  startIndex: number,
  disallowName?: string,
): { item: WeightedItem; nextIndex: number } => {
  const len = pool.length;
  let idx = startIndex;
  for (let i = 0; i < len; i += 1) {
    const candidate = pool[idx % len];
    if (!disallowName || candidate.name !== disallowName) {
      return { item: candidate, nextIndex: idx + 1 };
    }
    idx += 1;
  }
  // fallback to startIndex item if all are same name (should not happen with current pool)
  return { item: pool[startIndex % len], nextIndex: startIndex + 1 };
};

const buildFallbackPlan = (status: RoutineStatus): RoutinePlan[] => {
  const days = 15;
  const dietPool = weightedPool(dietItems);
  const protocolPool = weightedPool(protocolItems);
  const exercisePool = weightedPool(exerciseItems);

  const seenCounts = new Map<string, number>();
  let dietIdx = 0;
  let protocolIdx = 0;
  let exerciseIdx = 0;

  const nextValue = (item: WeightedItem): { reps?: number; durationMinutes?: number } => {
    const used = seenCounts.get(item.name) ?? 0;
    seenCounts.set(item.name, used + 1);

    const reps =
      item.baseReps !== undefined
        ? item.baseReps + (item.incrementReps ?? 0) * used
        : undefined;
    const duration =
      item.baseDuration !== undefined
        ? item.baseDuration + (item.incrementDuration ?? 0) * used
        : undefined;
    return {
      reps,
      durationMinutes: duration,
    };
  };

  const plans: RoutinePlan[] = [];
  for (let i = 0; i < days; i += 1) {
    const dietPick = pickFromPool(dietPool, dietIdx);
    dietIdx = dietPick.nextIndex;

    const protocolPick1 = pickFromPool(protocolPool, protocolIdx);
    protocolIdx = protocolPick1.nextIndex;
    const protocolPick2 = pickFromPool(protocolPool, protocolIdx, protocolPick1.item.name);
    protocolIdx = protocolPick2.nextIndex;

    const exercisePick1 = pickFromPool(exercisePool, exerciseIdx);
    exerciseIdx = exercisePick1.nextIndex;
    const exercisePick2 = pickFromPool(exercisePool, exerciseIdx, exercisePick1.item.name);
    exerciseIdx = exercisePick2.nextIndex;

    const dayTasks: RoutineTaskTemplate[] = [
      {
        name: dietPick.item.name,
        type: dietPick.item.type,
        category: 'diet',
        ...nextValue(dietPick.item),
      } as RoutineTaskTemplate,
      {
        name: protocolPick1.item.name,
        type: protocolPick1.item.type,
        category: 'protocol',
        ...nextValue(protocolPick1.item),
      } as RoutineTaskTemplate,
      {
        name: protocolPick2.item.name,
        type: protocolPick2.item.type,
        category: 'protocol',
        ...nextValue(protocolPick2.item),
      } as RoutineTaskTemplate,
      {
        name: exercisePick1.item.name,
        type: exercisePick1.item.type,
        category: 'exercise',
        ...nextValue(exercisePick1.item),
      } as RoutineTaskTemplate,
      {
        name: exercisePick2.item.name,
        type: exercisePick2.item.type,
        category: 'exercise',
        ...nextValue(exercisePick2.item),
      } as RoutineTaskTemplate,
    ];

    plans.push({ day: i + 1, tasks: dayTasks });
  }

  return plans;
};

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
      type: task.type as RoutineTaskType,
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

  let plan: RoutinePlan[] | null = null;

  try {
    const aiRaw = await callOpenAiChat(systemPrompt, userPrompt);
    plan = aiRaw ? parseAiRoutine(aiRaw) : null;
  } catch {
    plan = null;
  }

  if (!plan) {
    plan = buildFallbackPlan(status);
  }

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

export const createInitialRoutineForUser = async (userId: string): Promise<string> => {
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
    return inputHash;
  }

  await insertRoutinePlan(userId, 'active', inputHash, plan);
  return inputHash;
};

export const createRecoveryRoutineForUser = async (userId: string): Promise<string> => {
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
    return inputHash;
  }

  await insertRoutinePlan(userId, 'recovery', inputHash, plan);
  return inputHash;
};
