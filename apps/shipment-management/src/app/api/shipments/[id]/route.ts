import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, shipmentEvents, shipmentDocuments, checkCalls } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const PatchSchema = z.object({
  customerName: z.string().optional(),
  originCity: z.string().optional(),
  originState: z.string().optional(),
  originZip: z.string().optional(),
  destCity: z.string().optional(),
  destState: z.string().optional(),
  destZip: z.string().optional(),
  equipmentType: z.string().optional(),
  pickupDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  customerRate: z.number().optional(),
  carrierRate: z.number().optional(),
  rateType: z.enum(['flat', 'per_mile']).optional(),
  miles: z.number().optional(),
  loadRef: z.string().optional(),
  carrierName: z.string().optional(),
  carrierContact: z.string().optional(),
  carrierPhone: z.string().optional(),
  commodity: z.string().optional(),
  weight: z.number().optional(),
  specialInstructions: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
  if (!shipment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const events = await db
    .select()
    .from(shipmentEvents)
    .where(eq(shipmentEvents.shipmentId, id))
    .orderBy(desc(shipmentEvents.createdAt));

  const docs = await db
    .select()
    .from(shipmentDocuments)
    .where(eq(shipmentDocuments.shipmentId, id))
    .orderBy(desc(shipmentDocuments.uploadedAt));

  const calls = await db
    .select()
    .from(checkCalls)
    .where(eq(checkCalls.shipmentId, id))
    .orderBy(desc(checkCalls.createdAt));

  return NextResponse.json({ shipment, events, docs, calls });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [existing] = await db.select().from(shipments).where(eq(shipments.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };

  // Recalculate margin if rates change
  const customerRate = data.customerRate ?? existing.customerRate;
  const carrierRate = data.carrierRate ?? existing.carrierRate;
  if (customerRate != null && carrierRate != null) {
    updateData.margin = customerRate - carrierRate;
    updateData.marginPct = ((customerRate - carrierRate) / customerRate) * 100;
  }

  await db.update(shipments).set(updateData).where(eq(shipments.id, id));

  const [updated] = await db.select().from(shipments).where(eq(shipments.id, id));
  return NextResponse.json({ shipment: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [existing] = await db.select().from(shipments).where(eq(shipments.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(shipments).where(eq(shipments.id, id));
  return NextResponse.json({ success: true });
}
