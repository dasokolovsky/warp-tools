export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { drivers, deductionTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CreateSettlementClient } from './CreateSettlementClient';

export default async function NewSettlementPage() {
  const activeDrivers = await db.select().from(drivers).where(eq(drivers.status, 'active'));
  const templates = await db.select().from(deductionTemplates).where(eq(deductionTemplates.active, true));

  return <CreateSettlementClient drivers={activeDrivers} templates={templates} />;
}
