// Shared domain models for Height App

export type UUID = string;
export type ISODateString = string;

export type Gender = 'male' | 'female' | 'non_binary' | 'unspecified';

export type Ethnicity =
  | 'asian'
  | 'black'
  | 'hispanic_latino'
  | 'white'
  | 'middle_eastern'
  | 'indigenous'
  | 'mixed'
  | 'other'
  | 'prefer_not_to_say';

export type WorkoutCapacityLevel = 'low' | 'moderate' | 'high';

export type RoutineStatus = 'active' | 'recovery';

export type RoutineTaskType = 'stretch' | 'strength' | 'lifestyle';

export type PainSeverity = 'mild' | 'moderate' | 'severe';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type SubscriptionPlatform = 'ios' | 'android' | 'web';

export interface UserProfile {
  readonly userId: UUID;
  readonly gender: Gender;
  readonly dateOfBirth: ISODateString;
  readonly ethnicity: Ethnicity;
  readonly parentHeightsCm: {
    readonly mother: number;
    readonly father: number;
  };
  readonly footSizeCm: number;
  readonly workoutCapacity: WorkoutCapacityLevel;
  readonly averageSleepHours: number;
  readonly dreamHeightCm: number;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface Subscription {
  readonly userId: UUID;
  readonly status: SubscriptionStatus;
  readonly platform: SubscriptionPlatform;
  readonly productId: string;
  readonly entitlementActive: boolean;
  readonly renewsAt?: ISODateString;
  readonly expiresAt?: ISODateString;
  readonly trialEndsAt?: ISODateString;
  readonly updatedAt?: ISODateString;
}

export interface User {
  readonly id: UUID;
  readonly email: string;
  readonly profile: UserProfile;
  readonly subscription: Subscription;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface HeightLog {
  readonly id: UUID;
  readonly userId: UUID;
  readonly heightCm: number;
  readonly recordedAt: ISODateString;
}

export interface HeightPrediction {
  readonly id: UUID;
  readonly userId: UUID;
  readonly predictedAdultHeightCm: number;
  readonly percentile: number;
  readonly dreamHeightOddsPercent: number;
  readonly growthCompletionPercent: number;
  readonly createdAt: ISODateString;
}

export interface RoutineTask {
  readonly id: UUID;
  readonly name: string;
  readonly type: RoutineTaskType;
  readonly reps?: number;
  readonly durationMinutes?: number;
}

export interface RoutineDay {
  readonly index: number;
  readonly scheduledDate?: ISODateString;
  readonly routineTasks: readonly RoutineTask[];
}

export interface Routine {
  readonly id: UUID;
  readonly userId: UUID;
  readonly status: RoutineStatus;
  readonly month: string; // YYYY-MM
  readonly routineDays: readonly RoutineDay[];
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface TaskLog {
  readonly id: UUID;
  readonly userId: UUID;
  readonly routineId: UUID;
  readonly routineTaskId: UUID;
  readonly dayIndex: number;
  readonly date: ISODateString;
  readonly completed: boolean;
  readonly loggedAt: ISODateString;
}

export interface PainEvent {
  readonly id: UUID;
  readonly userId: UUID;
  readonly area: string;
  readonly severity: PainSeverity;
  readonly notes?: string;
  readonly createdAt: ISODateString;
}

export interface TrackingSummary {
  readonly currentWeekCompletionPercent: number;
  readonly lastWeekCompletionPercent: number;
  readonly consistencyDeltaPercent: number;
  readonly totalTasksCompleted: number;
  readonly totalPainEvents: number;
  readonly activeStreakDays: number;
  readonly recoveryDaysThisWeek: number;
}
