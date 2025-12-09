import { env } from './config/env';
import { createServer } from './server';

const start = async (): Promise<void> => {
  const app = createServer();
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
