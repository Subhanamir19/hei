import { FastifyPluginCallback } from 'fastify';

const subscriptionRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/subscription/me', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default subscriptionRoutes;
