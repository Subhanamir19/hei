import { FastifyPluginCallback } from 'fastify';
import { AiCoachMessageRequestBody, AiCoachMessageResponse } from '../../shared/api-contracts';
import { handleAiCoachMessage } from '../modules/aiCoach/aiCoach.service';

const aiCoachRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post<{
    Body: AiCoachMessageRequestBody;
    Reply: AiCoachMessageResponse;
  }>('/ai-coach/message', async (request) => {
    const userIdHeader = request.headers['x-user-id'];

    if (typeof userIdHeader !== 'string') {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 401;
      throw error;
    }

    const response = await handleAiCoachMessage(userIdHeader, request.body);
    return response;
  });

  done();
};

export default aiCoachRoutes;
