import { FastifyPluginCallback } from 'fastify';

const trackingRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/tracking/summary', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  fastify.post('/tracking/task-log', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default trackingRoutes;
