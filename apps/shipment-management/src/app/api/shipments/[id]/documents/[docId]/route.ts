import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipmentDocuments, shipments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateDocScore, calculateHealthScore } from '@/lib/utils';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;

  const [doc] = await db
    .select()
    .from(shipmentDocuments)
    .where(and(eq(shipmentDocuments.id, docId), eq(shipmentDocuments.shipmentId, id)));

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(shipmentDocuments).where(eq(shipmentDocuments.id, docId));

  // Recalculate doc flags + scores
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
  if (shipment) {
    const remainingDocs = await db
      .select()
      .from(shipmentDocuments)
      .where(eq(shipmentDocuments.shipmentId, id));

    const hasBol = remainingDocs.some((d) => d.docType === 'bol');
    const hasPod = remainingDocs.some((d) => d.docType === 'pod');
    const hasRateCon = remainingDocs.some((d) => d.docType === 'rate_confirmation');
    const hasInvoice = remainingDocs.some((d) => d.docType === 'invoice');

    const docScore = calculateDocScore({ hasBol, hasPod, hasRateCon, hasInvoice });
    const healthScore = calculateHealthScore({
      status: shipment.status,
      hasRateCon,
      hasBol,
      hasPod,
      hasInvoice,
      pickupOnTime: shipment.pickupOnTime ?? null,
      deliveryOnTime: shipment.deliveryOnTime ?? null,
      marginPct: shipment.marginPct ?? null,
    });

    await db.update(shipments).set({
      hasBol,
      hasPod,
      hasRateCon,
      hasInvoice,
      docScore,
      healthScore,
      updatedAt: new Date().toISOString(),
    }).where(eq(shipments.id, id));
  }

  return NextResponse.json({ success: true });
}
