import { FastifyPluginCallback } from 'fastify';

const heightRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get('/height/report', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  fastify.get('/height/logs', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  fastify.post('/height/logs', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });

  done();
};

export default heightRoutes;
