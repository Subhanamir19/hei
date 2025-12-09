import { FastifyPluginCallback } from 'fastify';

const painRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post('/pain/report', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default painRoutes;
