import { apiFetch } from './client';
import {
  CreateTaskLogRequest,
  CreateTaskLogResponse,
  GetTrackingSummaryResponse,
} from './types';

export const getTrackingSummary = async (
  userId: string,
): Promise<GetTrackingSummaryResponse> => {
  return apiFetch<GetTrackingSummaryResponse>('/tracking/summary', {
    method: 'GET',
    userId,
  });
};

export const createTaskLog = async (
  userId: string,
  input: CreateTaskLogRequest,
): Promise<CreateTaskLogResponse> => {
  return apiFetch<CreateTaskLogResponse>('/tracking/task-log', {
    method: 'POST',
    userId,
    body: JSON.stringify(input),
  });
};
