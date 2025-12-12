import { FastifyPluginCallback } from 'fastify';
import { ReportPainRequestBody, ReportPainResponse } from '../../shared/api-contracts';
import { reportPainEvent } from '../modules/pain/pain.service';

const painRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post<{
    Body: ReportPainRequestBody;
    Reply: ReportPainResponse;
  }>('/pain/report', async (request) => {
    const userIdHeader = request.headers['x-user-id'];

    if (typeof userIdHeader !== 'string') {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 401;
      throw error;
    }

    const response = await reportPainEvent(userIdHeader, request.body);
    return response;
  });

  done();
};

export default painRoutes;
