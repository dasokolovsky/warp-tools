export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs, rfqs } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { LaneDetailClient } from './LaneDetailClient';

type Props = { params: Promise<{ id: string }> };

export default async function LaneDetailPage({ params }: Props) {
  const { id } = await params;
  const laneId = parseInt(id, 10);
  if (isNaN(laneId)) notFound();

  const [lane] = await db.select().from(lanes).where(eq(lanes.id, laneId)).limit(1);
  if (!lane) notFound();

  const rates = await db
    .select()
    .from(carrier_rates)
    .where(eq(carrier_rates.lane_id, laneId))
    .orderBy(asc(carrier_rates.rate_amount));

  const tariffs = await db
    .select()
    .from(customer_tariffs)
    .where(eq(customer_tariffs.lane_id, laneId));

  const laneRfqs = await db
    .select()
    .from(rfqs)
    .where(eq(rfqs.lane_id, laneId))
    .orderBy(asc(rfqs.created_at));

  return (
    <LaneDetailClient
      lane={lane}
      rates={rates}
      tariffs={tariffs}
      rfqs={laneRfqs}
    />
  );
}
