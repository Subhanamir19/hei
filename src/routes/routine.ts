import { FastifyPluginCallback } from 'fastify';
import { GetActiveRoutineResponse, GetRoutineDayResponse } from '../../shared/api-contracts';
import { getActiveRoutine, getRoutineDay } from '../modules/routine/routine.service';

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

  fastify.get<{ Reply: GetRoutineDayResponse; Params: { index: string } }>(
    '/routine/day/:index',
    async (request) => {
      const userIdHeader = request.headers['x-user-id'];
      const dayIndex = Number(request.params.index);

      if (typeof userIdHeader !== 'string') {
        const error = new Error('Unauthorized');
        (error as any).statusCode = 401;
        throw error;
      }

      if (!Number.isInteger(dayIndex) || dayIndex < 1) {
        const error = new Error('Invalid day index');
        (error as any).statusCode = 400;
        throw error;
      }

      const response = await getRoutineDay(userIdHeader, dayIndex);
      return response;
    },
  );

  done();
};

export default routineRoutes;
