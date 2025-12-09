import { FastifyPluginCallback } from 'fastify';

const routineRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/routine/active', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  fastify.get('/routine/day/:index', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default routineRoutes;
