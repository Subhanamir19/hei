import { FastifyPluginCallback } from 'fastify';
import { GetHeightReportResponse } from '../../shared/api-contracts';
import { getHeightReport } from '../modules/height/height.service';

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

  fastify.get('/height/logs', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  fastify.post('/height/logs', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default heightRoutes;
