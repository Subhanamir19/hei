import { apiFetch } from './client';
import { GetHeightReportResponse, GetHeightDashboardResponse } from './types';

export const getHeightReport = async (userId: string): Promise<GetHeightReportResponse> => {
  return apiFetch<GetHeightReportResponse>('/height/report', {
    method: 'GET',
    userId,
  });
};

export const getHeightDashboard = async (userId: string): Promise<GetHeightDashboardResponse> => {
  return apiFetch<GetHeightDashboardResponse>('/height/dashboard', {
    method: 'GET',
    userId,
  });
};
