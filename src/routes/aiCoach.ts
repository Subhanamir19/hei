import { FastifyPluginCallback } from 'fastify';

const aiCoachRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post('/ai-coach/message', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default aiCoachRoutes;
