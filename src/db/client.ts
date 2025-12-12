import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import {
  heightLogs,
  heightPredictions,
  routineDays,
  routineTasks,
  routines,
  userProfiles,
  users,
} from './schema';

console.log('RUNTIME_DATABASE_URL', env.DATABASE_URL);

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool);

export {
  users,
  userProfiles,
  heightLogs,
  heightPredictions,
  routines,
  routineDays,
  routineTasks,
};
