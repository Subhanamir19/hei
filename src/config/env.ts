import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  MOCK_QUEUES: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
