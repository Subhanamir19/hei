export type ISODateString = string;

export type RoutineStatus = 'active' | 'recovery';
export type RoutineTaskType = 'stretch' | 'strength' | 'lifestyle';

export interface HeightPrediction {
  readonly id: string;
  readonly userId: string;
  readonly predictedAdultHeightCm: number;
  readonly percentile: number;
  readonly dreamHeightOddsPercent: number;
  readonly growthCompletionPercent: number;
  readonly createdAt: ISODateString;
}

export interface GetHeightReportResponse {
  readonly latestPrediction: HeightPrediction;
  readonly predictionHistory: readonly HeightPrediction[];
}

export interface RoutineTask {
  readonly id: string;
  readonly name: string;
  readonly type: RoutineTaskType;
  readonly reps?: number;
  readonly durationMinutes?: number;
}

export interface RoutineDay {
  readonly index: number;
  readonly routineTasks: readonly RoutineTask[];
}

export interface Routine {
  readonly id: string;
  readonly userId: string;
  readonly status: RoutineStatus;
  readonly month: string;
  readonly routineDays: readonly RoutineDay[];
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface GetActiveRoutineResponse {
  readonly routine: Routine;
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

export interface TaskLog {
  readonly id: string;
  readonly userId: string;
  readonly routineId: string;
  readonly routineTaskId: string;
  readonly dayIndex: number;
  readonly date: ISODateString;
  readonly completed: boolean;
  readonly loggedAt: ISODateString;
}

export interface GetTrackingSummaryResponse {
  readonly trackingSummary: TrackingSummary;
}

export interface CreateTaskLogRequest {
  readonly routineId: string;
  readonly dayIndex: number;
  readonly taskId: string;
  readonly date: ISODateString;
  readonly completed: boolean;
}

export interface CreateTaskLogResponse {
  readonly taskLog: TaskLog;
  readonly trackingSummary?: TrackingSummary;
}

export type PainSeverity = 'mild' | 'moderate' | 'severe';

export interface PainEvent {
  readonly id: string;
  readonly userId: string;
  readonly area: string;
  readonly severity: PainSeverity;
  readonly notes?: string;
  readonly createdAt: ISODateString;
}

export interface ReportPainRequest {
  readonly area: string;
  readonly severity: PainSeverity;
  readonly notes?: string;
}

export interface ReportPainResponse {
  readonly painEvent: PainEvent;
  readonly recoveryRoutineQueued: boolean;
}

export interface AiCoachMessageResponse {
  readonly reply: string;
}
