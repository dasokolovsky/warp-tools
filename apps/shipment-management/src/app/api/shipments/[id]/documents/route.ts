import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipmentDocuments, shipmentEvents, shipments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { calculateDocScore, calculateHealthScore } from '@/lib/utils';

const CreateSchema = z.object({
  docType: z.enum(['bol', 'pod', 'rate_confirmation', 'invoice', 'insurance_cert', 'other']),
  filename: z.string().min(1),
  docRef: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docs = await db
    .select()
    .from(shipmentDocuments)
    .where(eq(shipmentDocuments.shipmentId, id))
    .orderBy(desc(shipmentDocuments.uploadedAt));
  return NextResponse.json({ docs });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
  if (!shipment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { createdBy, ...rest } = parsed.data;
  const now = new Date().toISOString();
  const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const [newDoc] = await db
    .insert(shipmentDocuments)
    .values({
      id: docId,
      shipmentId: id,
      uploadedAt: now,
      ...rest,
    })
    .returning();

  // Update has_* fields
  const docUpdate: Record<string, unknown> = { updatedAt: now };
  if (rest.docType === 'bol') docUpdate.hasBol = true;
  if (rest.docType === 'pod') docUpdate.hasPod = true;
  if (rest.docType === 'rate_confirmation') docUpdate.hasRateCon = true;
  if (rest.docType === 'invoice') docUpdate.hasInvoice = true;

  // Recalculate doc score
  const updatedHasBol = rest.docType === 'bol' ? true : (shipment.hasBol ?? false);
  const updatedHasPod = rest.docType === 'pod' ? true : (shipment.hasPod ?? false);
  const updatedHasRateCon = rest.docType === 'rate_confirmation' ? true : (shipment.hasRateCon ?? false);
  const updatedHasInvoice = rest.docType === 'invoice' ? true : (shipment.hasInvoice ?? false);

  docUpdate.docScore = calculateDocScore({
    hasBol: updatedHasBol,
    hasPod: updatedHasPod,
    hasRateCon: updatedHasRateCon,
    hasInvoice: updatedHasInvoice,
  });

  // Recalculate health score
  docUpdate.healthScore = calculateHealthScore({
    status: shipment.status,
    hasRateCon: updatedHasRateCon,
    hasBol: updatedHasBol,
    hasPod: updatedHasPod,
    hasInvoice: updatedHasInvoice,
    pickupOnTime: shipment.pickupOnTime ?? null,
    deliveryOnTime: shipment.deliveryOnTime ?? null,
    marginPct: shipment.marginPct ?? null,
  });

  await db.update(shipments).set(docUpdate).where(eq(shipments.id, id));

  // Auto-log event
  const docLabels: Record<string, string> = {
    bol: 'BOL',
    pod: 'POD',
    rate_confirmation: 'Rate Confirmation',
    invoice: 'Invoice',
    insurance_cert: 'Insurance Certificate',
    other: 'Document',
  };

  await db.insert(shipmentEvents).values({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shipmentId: id,
    eventType: 'document',
    description: `${docLabels[rest.docType] ?? rest.docType} uploaded: ${rest.filename}`,
    newValue: rest.docType,
    createdBy: createdBy ?? 'system',
    createdAt: now,
  });

  return NextResponse.json({ doc: newDoc }, { status: 201 });
}
