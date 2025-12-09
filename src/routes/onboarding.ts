import { FastifyPluginCallback } from 'fastify';

const onboardingRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post('/onboarding', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default onboardingRoutes;
