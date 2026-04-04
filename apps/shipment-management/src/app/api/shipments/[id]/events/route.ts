import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipmentEvents, shipments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const CreateSchema = z.object({
  description: z.string().min(1),
  createdBy: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const events = await db
    .select()
    .from(shipmentEvents)
    .where(eq(shipmentEvents.shipmentId, id))
    .orderBy(desc(shipmentEvents.createdAt));
  return NextResponse.json({ events });
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

  const now = new Date().toISOString();
  const [newEvent] = await db
    .insert(shipmentEvents)
    .values({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      shipmentId: id,
      eventType: 'note',
      description: parsed.data.description,
      createdBy: parsed.data.createdBy ?? 'system',
      createdAt: now,
    })
    .returning();

  return NextResponse.json({ event: newEvent }, { status: 201 });
}
