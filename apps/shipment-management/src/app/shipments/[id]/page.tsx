export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments, shipmentEvents, shipmentDocuments, checkCalls } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ShipmentDetailClient } from './ShipmentDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShipmentDetailPage({ params }: Props) {
  const { id } = await params;

  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
  if (!shipment) notFound();

  const events = await db
    .select()
    .from(shipmentEvents)
    .where(eq(shipmentEvents.shipmentId, id));

  const docs = await db
    .select()
    .from(shipmentDocuments)
    .where(eq(shipmentDocuments.shipmentId, id));

  const calls = await db
    .select()
    .from(checkCalls)
    .where(eq(checkCalls.shipmentId, id));

  return (
    <ShipmentDetailClient
      shipment={shipment}
      events={events}
      docs={docs}
      calls={calls}
    />
  );
}
