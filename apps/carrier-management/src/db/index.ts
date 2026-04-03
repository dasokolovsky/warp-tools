import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'carrier-management.db');

const client = createClient({
  url: `file:${DB_PATH}`,
});

export const db = drizzle(client, { schema });

export type DB = typeof db;
