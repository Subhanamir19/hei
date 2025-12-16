import {
  Gender,
  Ethnicity,
  WorkoutCapacityLevel,
  HeightPrediction,
  HeightLog,
  Routine,
  RoutineDay,
  RoutineStatus,
  RoutineTask,
  TaskLog,
  PainSeverity,
  PainEvent,
  TrackingSummary,
  Subscription,
  UUID,
  ISODateString,
} from './domain-models';

export type ApiErrorCode =
  | 'unauthorized'
  | 'validation_failed'
  | 'not_found'
  | 'rate_limited'
  | 'internal_error';

export interface ApiErrorResponse {
  readonly errorCode: ApiErrorCode;
  readonly message: string;
}

// /onboarding
export interface OnboardingRequestBody {
  readonly userId?: UUID;
  readonly email?: string;
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
  readonly initialHeightCm?: number;
  readonly initialHeightRecordedAt?: ISODateString;
}

export interface OnboardingResponse {
  readonly onboardingId: UUID;
  readonly userId: UUID;
  readonly predictionQueued: boolean;
  readonly routineQueued: boolean;
}

// /height/report
export interface GetHeightReportResponse {
  readonly latestPrediction: HeightPrediction;
  readonly predictionHistory: readonly HeightPrediction[];
}

export interface GetHeightDashboardResponse {
  readonly latestHeightLog: HeightLog | null;
  readonly latestPrediction: HeightPrediction;
  readonly predictionHistory: readonly HeightPrediction[];
  readonly dreamHeightCm: number;
  readonly dateOfBirth: ISODateString;
}

// /height/logs
export interface CreateHeightLogRequestBody {
  readonly heightCm: number;
  readonly recordedAt?: ISODateString;
}

export interface CreateHeightLogResponse {
  readonly heightLog: HeightLog;
  readonly updatedPrediction: HeightPrediction;
}

export interface GetHeightLogsResponse {
  readonly heightLogs: readonly HeightLog[];
}

// /routine/active
export interface GetActiveRoutineResponse {
  readonly routine: Routine;
}

// /routine/day/:index
export interface GetRoutineDayParams {
  readonly index: number;
}

export interface GetRoutineDayResponse {
  readonly routineId: UUID;
  readonly status: RoutineStatus;
  readonly routineDay: RoutineDay;
  readonly routineTasks: readonly RoutineTask[];
}

// /tracking/summary
export interface GetTrackingSummaryResponse {
  readonly trackingSummary: TrackingSummary;
}

// /tracking/task-log
export interface CreateTaskLogRequestBody {
  readonly routineId: UUID;
  readonly dayIndex: number;
  readonly taskId: UUID;
  readonly date: ISODateString;
  readonly completed: boolean;
}

export interface CreateTaskLogResponse {
  readonly taskLog: TaskLog;
  readonly trackingSummary?: TrackingSummary;
}

// /pain/report
export interface ReportPainRequestBody {
  readonly area: string;
  readonly severity: PainSeverity;
  readonly notes?: string;
}

export interface ReportPainResponse {
  readonly painEvent: PainEvent;
  readonly recoveryRoutineQueued: boolean;
}

// /ai-coach/message
export interface AiCoachMessageRequestBody {
  readonly message: string;
  readonly context?: {
    readonly latestHeightPredictionId?: UUID;
    readonly hasRecentPain?: boolean;
    readonly lastPainEventId?: UUID;
  };
}

export interface AiCoachMessageResponse {
  readonly reply: string;
}

// /subscription/me
export interface GetSubscriptionResponse {
  readonly subscription: Subscription;
}
