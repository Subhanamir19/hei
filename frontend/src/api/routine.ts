import { apiFetch } from './client';
import { GetActiveRoutineResponse } from './types';

export const getActiveRoutine = async (userId: string): Promise<GetActiveRoutineResponse> => {
  return apiFetch<GetActiveRoutineResponse>('/routine/active', {
    method: 'GET',
    userId,
  });
};
