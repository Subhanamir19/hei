import { FastifyPluginCallback } from 'fastify';

const authRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/auth/me', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default authRoutes;
