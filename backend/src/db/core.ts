import * as schema from './schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const pgUrl = process.env.POSTGRES_URL;
if (!pgUrl) {
  throw new Error('missing POSTGRES_URL');
}

export const db = drizzle(postgres(pgUrl), { schema });

export function runMigrations(): Promise<void> {
  return migrate(db, { migrationsFolder: 'migrations' });
}
