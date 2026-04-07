import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'fleet-maintenance.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

async function main() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });
  console.log('Migrations complete.');

  client.close();
}

main().catch(console.error);
