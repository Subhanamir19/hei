import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { UUID } from '../../shared/domain-models';

export interface AppQueue<T> {
  add(jobName: string, data: T): Promise<void>;
}

export interface PredictionJobData {
  readonly userId: UUID;
  readonly inputHash?: string;
}

export interface RoutineJobData {
  readonly userId: UUID;
  readonly inputHash?: string;
}

export interface RecoveryRoutineJobData {
  readonly userId: UUID;
  readonly inputHash?: string;
}

const connection = env.MOCK_QUEUES ? null : new IORedis(env.REDIS_URL);

const createQueue = <T>(name: string): AppQueue<T> => {
  if (env.MOCK_QUEUES) {
    return {
      add: async (jobName: string, data: T) => {
        // Mock queue: log instead of enqueueing to Redis
        // eslint-disable-next-line no-console
        console.log(`[MOCK QUEUE] ${name} job=${jobName}`, data);
      },
    };
  }

  const queue = new Queue(name, {
    connection: connection as IORedis,
  });

  return {
    add: async (jobName: string, data: T) => {
      await queue.add(jobName, data as any);
    },
  };
};

export const predictionQueue: AppQueue<PredictionJobData> = createQueue<PredictionJobData>('prediction');

export const routineQueue: AppQueue<RoutineJobData> = createQueue<RoutineJobData>('routine');

export const recoveryRoutineQueue: AppQueue<RecoveryRoutineJobData> =
  createQueue<RecoveryRoutineJobData>('recoveryRoutine');
