import { FastifyPluginCallback } from 'fastify';
import { GetActiveRoutineResponse } from '../../shared/api-contracts';
import { getActiveRoutine } from '../modules/routine/routine.service';

const routineRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get<{ Reply: GetActiveRoutineResponse }>(
    '/routine/active',
    async (request) => {
      const userIdHeader = request.headers['x-user-id'];

      if (typeof userIdHeader !== 'string') {
        const error = new Error('Unauthorized');
        (error as any).statusCode = 401;
        throw error;
      }

      const response = await getActiveRoutine(userIdHeader);
      return response;
    },
  );

  fastify.get('/routine/day/:index', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default routineRoutes;
