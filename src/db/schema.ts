import {
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
