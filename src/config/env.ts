import { config } from 'dotenv';
import { z } from 'zod';

// Load .env and allow it to override any existing env vars (to avoid stale values)
config({ override: true });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  OPENAI_API_KEY: z
    .string()
    .min(1)
    .transform((value) => value.trim()),
  MOCK_QUEUES: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
