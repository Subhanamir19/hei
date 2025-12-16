import { apiFetch } from './client';

export interface OnboardingPayload {
  gender: string;
  dateOfBirth: string;
  ethnicity: string;
  parentHeightsCm: { mother: number; father: number };
  footSizeCm: number;
  workoutCapacity: string;
  averageSleepHours: number;
  dreamHeightCm: number;
  initialHeightCm?: number;
  initialHeightRecordedAt?: string;
  email?: string;
}

export interface OnboardingResponse {
  onboardingId: string;
  userId: string;
  predictionQueued: boolean;
  routineQueued: boolean;
}

export const submitOnboarding = async (payload: OnboardingPayload): Promise<OnboardingResponse> => {
  return apiFetch<OnboardingResponse>('/onboarding', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
