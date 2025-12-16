import { FastifyPluginCallback } from 'fastify';
import {
  CreateHeightLogRequestBody,
  CreateHeightLogResponse,
  GetHeightLogsResponse,
  GetHeightReportResponse,
  GetHeightDashboardResponse,
} from '../../shared/api-contracts';
import {
  createHeightLog,
  getHeightDashboard,
  getHeightLogs,
  getHeightReport,
} from '../modules/height/height.service';

const heightRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get<{ Reply: GetHeightReportResponse }>(
    '/height/report',
    async (request) => {
      const userIdHeader = request.headers['x-user-id'];

      if (typeof userIdHeader !== 'string') {
        const error = new Error('Unauthorized');
        (error as any).statusCode = 401;
        throw error;
      }

      const response = await getHeightReport(userIdHeader);
      return response;
    },
  );

  fastify.get<{ Reply: GetHeightLogsResponse }>(
    '/height/logs',
    async (request) => {
      const userIdHeader = request.headers['x-user-id'];

      if (typeof userIdHeader !== 'string') {
        const error = new Error('Unauthorized');
        (error as any).statusCode = 401;
        throw error;
      }

      const response = await getHeightLogs(userIdHeader);
      return response;
    },
  );

  fastify.post<{
    Body: CreateHeightLogRequestBody;
    Reply: CreateHeightLogResponse;
  }>('/height/logs', async (request) => {
    const userIdHeader = request.headers['x-user-id'];

    if (typeof userIdHeader !== 'string') {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 401;
      throw error;
    }

    const response = await createHeightLog(userIdHeader, request.body);
    return response;
  });

  fastify.get<{ Reply: GetHeightDashboardResponse }>(
    '/height/dashboard',
    async (request) => {
      const userIdHeader = request.headers['x-user-id'];

      if (typeof userIdHeader !== 'string') {
        const error = new Error('Unauthorized');
        (error as any).statusCode = 401;
        throw error;
      }

      const response = await getHeightDashboard(userIdHeader);
      return response;
    },
  );

  done();
};

export default heightRoutes;
