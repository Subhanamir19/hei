import { FastifyPluginCallback } from 'fastify';
import {
  CreateTaskLogRequestBody,
  CreateTaskLogResponse,
  GetTrackingSummaryResponse,
} from '../../shared/api-contracts';
import { createTaskLog, getTrackingSummary } from '../modules/tracking/tracking.service';

const trackingRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get<{ Reply: GetTrackingSummaryResponse }>('/tracking/summary', async (request) => {
    const userIdHeader = request.headers['x-user-id'];

    if (typeof userIdHeader !== 'string') {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 401;
      throw error;
    }

    const response = await getTrackingSummary(userIdHeader);
    return response;
  });

  fastify.post<{
    Body: CreateTaskLogRequestBody;
    Reply: CreateTaskLogResponse;
  }>('/tracking/task-log', async (request) => {
    const userIdHeader = request.headers['x-user-id'];

    if (typeof userIdHeader !== 'string') {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 401;
      throw error;
    }

    const response = await createTaskLog(userIdHeader, request.body);
    return response;
  });

  done();
};

export default trackingRoutes;
