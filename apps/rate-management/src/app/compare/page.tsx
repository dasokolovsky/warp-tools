export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { lanes } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { CompareClient } from './CompareClient';

export default async function ComparePage() {
  const allLanes = await db.select().from(lanes).orderBy(asc(lanes.origin_city));

  return <CompareClient lanes={allLanes} />;
}
