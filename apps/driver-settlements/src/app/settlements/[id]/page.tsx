export const dynamic = 'force-dynamic';

import { db } from '@/db';
import {
  settlements,
  drivers,
  trips,
  settlementDeductions,
  settlementReimbursements,
  advances,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { SettlementDetailClient } from './SettlementDetailClient';

type PageProps = { params: Promise<{ id: string }> };

export default async function SettlementDetailPage({ params }: PageProps) {
  const { id } = await params;
  const settlementId = parseInt(id, 10);
  if (isNaN(settlementId)) notFound();

  const [settlement] = await db.select().from(settlements).where(eq(settlements.id, settlementId));
  if (!settlement) notFound();

  const [driver] = await db.select().from(drivers).where(eq(drivers.id, settlement.driver_id));
  const settlementTrips = await db
    .select()
    .from(trips)
    .where(eq(trips.settlement_id, settlementId))
    .orderBy(trips.trip_date);
  const deductions = await db.select().from(settlementDeductions).where(eq(settlementDeductions.settlement_id, settlementId));
  const reimbursements = await db.select().from(settlementReimbursements).where(eq(settlementReimbursements.settlement_id, settlementId));
  const settlementAdvances = await db.select().from(advances).where(eq(advances.settlement_id, settlementId));

  return (
    <SettlementDetailClient
      settlement={settlement}
      driver={driver ?? null}
      initialTrips={settlementTrips}
      initialDeductions={deductions}
      initialReimbursements={reimbursements}
      advances={settlementAdvances}
    />
  );
}
