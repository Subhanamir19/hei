import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  date as dateColumn,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id),
  gender: text('gender').notNull(),
  ethnicity: text('ethnicity').notNull(),
  workoutCapacity: text('workout_capacity').notNull(),
  dateOfBirth: dateColumn('date_of_birth').notNull(),
  motherHeightCm: integer('mother_height_cm').notNull(),
  fatherHeightCm: integer('father_height_cm').notNull(),
  footSizeCm: integer('foot_size_cm').notNull(),
  averageSleepHours: integer('average_sleep_hours').notNull(),
  dreamHeightCm: integer('dream_height_cm').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const heightLogs = pgTable('height_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  heightCm: integer('height_cm').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
});

export const heightPredictions = pgTable('height_predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  predictedAdultHeightCm: integer('predicted_adult_height_cm').notNull(),
  percentile: integer('percentile').notNull(),
  dreamHeightOddsPercent: integer('dream_height_odds_percent').notNull(),
  growthCompletionPercent: integer('growth_completion_percent').notNull(),
  inputHash: text('input_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const routines = pgTable('routines', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  status: text('status').notNull(),
  month: text('month').notNull(),
  inputHash: text('input_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const routineDays = pgTable('routine_days', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineId: uuid('routine_id')
    .notNull()
    .references(() => routines.id),
  dayIndex: integer('day_index').notNull(),
});

export const routineTasks = pgTable('routine_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineDayId: uuid('routine_day_id')
    .notNull()
    .references(() => routineDays.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  reps: integer('reps'),
  durationMinutes: integer('duration_minutes'),
});

export const painEvents = pgTable('pain_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  area: text('area').notNull(),
  severity: text('severity').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const taskLogs = pgTable('task_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  routineId: uuid('routine_id')
    .notNull()
    .references(() => routines.id),
  routineTaskId: uuid('routine_task_id')
    .notNull()
    .references(() => routineTasks.id),
  dayIndex: integer('day_index').notNull(),
  date: dateColumn('date').notNull(),
  completed: boolean('completed').notNull(),
  loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow().notNull(),
});
