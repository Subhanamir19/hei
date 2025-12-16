import { apiFetch } from './client';
import { GetHeightReportResponse } from './types';

export const getHeightReport = async (userId: string): Promise<GetHeightReportResponse> => {
  return apiFetch<GetHeightReportResponse>('/height/report', {
    method: 'GET',
    userId,
  });
};
