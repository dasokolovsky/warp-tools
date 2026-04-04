export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { loadTemplates } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { TemplatesClient } from './TemplatesClient';

export default async function TemplatesPage() {
  const templates = await db.select().from(loadTemplates).orderBy(desc(loadTemplates.use_count));

  return <TemplatesClient initialTemplates={templates} />;
}
