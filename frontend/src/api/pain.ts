import { apiFetch } from './client';
import { ReportPainRequest, ReportPainResponse } from './types';

export const reportPain = async (
  userId: string,
  input: ReportPainRequest,
): Promise<ReportPainResponse> => {
  return apiFetch<ReportPainResponse>('/pain/report', {
    method: 'POST',
    userId,
    body: JSON.stringify(input),
  });
};
