import fastify, { FastifyError, FastifyInstance } from 'fastify';
import { ApiErrorCode, ApiErrorResponse } from '../shared/api-contracts';
import authRoutes from './routes/auth';
import onboardingRoutes from './routes/onboarding';
import heightRoutes from './routes/height';
import routineRoutes from './routes/routine';
import trackingRoutes from './routes/tracking';
import painRoutes from './routes/pain';
import aiCoachRoutes from './routes/aiCoach';
import subscriptionRoutes from './routes/subscription';

const mapStatusToErrorCode = (statusCode: number): ApiErrorCode => {
  switch (statusCode) {
    case 400:
      return 'validation_failed';
    case 401:
      return 'unauthorized';
    case 404:
      return 'not_found';
    case 429:
      return 'rate_limited';
    default:
      return 'internal_error';
  }
};

export const createServer = (): FastifyInstance => {
  const app = fastify({ logger: true });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);
    const statusCode = error.statusCode ?? 500;
    const errorResponse: ApiErrorResponse = {
      errorCode: mapStatusToErrorCode(statusCode),
      message: statusCode === 500 ? 'Internal server error' : error.message,
    };
    void reply.status(statusCode).send(errorResponse);
  });

  app.register(authRoutes);
  app.register(onboardingRoutes);
  app.register(heightRoutes);
  app.register(routineRoutes);
  app.register(trackingRoutes);
  app.register(painRoutes);
  app.register(aiCoachRoutes);
  app.register(subscriptionRoutes);

  return app;
};
