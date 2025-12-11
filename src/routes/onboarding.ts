import { FastifyPluginCallback } from 'fastify';
import { OnboardingRequestBody, OnboardingResponse } from '../../shared/api-contracts';
import { handleOnboarding } from '../modules/onboarding/onboarding.service';

const onboardingRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post<{
    Body: OnboardingRequestBody;
    Reply: OnboardingResponse;
  }>('/onboarding', async (request) => {
    const response = await handleOnboarding(request.body);
    return response;
  });

  done();
};

export default onboardingRoutes;
