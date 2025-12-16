import { apiFetch } from './client';
import { AiCoachMessageResponse } from './types';

export const sendAiCoachMessage = async (
  userId: string,
  message: string,
): Promise<AiCoachMessageResponse> => {
  return apiFetch<AiCoachMessageResponse>('/ai-coach/message', {
    method: 'POST',
    userId,
    body: JSON.stringify({ message }),
  });
};
