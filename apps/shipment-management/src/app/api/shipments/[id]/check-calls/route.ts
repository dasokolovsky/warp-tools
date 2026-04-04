import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { checkCalls, shipmentEvents, shipments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const CreateSchema = z.object({
  status: z.enum(['scheduled', 'at_pickup', 'loading', 'in_transit', 'at_delivery', 'delivered', 'delayed', 'issue']),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  eta: z.string().optional(),
  notes: z.string().optional(),
  contactMethod: z.enum(['phone', 'text', 'email', 'tracking']).optional(),
  createdBy: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const calls = await db
    .select()
    .from(checkCalls)
    .where(eq(checkCalls.shipmentId, id))
    .orderBy(desc(checkCalls.createdAt));

  return NextResponse.json({ calls });
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
  const callId = `cc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const [newCall] = await db
    .insert(checkCalls)
    .values({
      id: callId,
      shipmentId: id,
      createdAt: now,
      ...rest,
    })
    .returning();

  // Auto-log event
  const location = rest.locationCity
    ? ` — ${rest.locationCity}${rest.locationState ? `, ${rest.locationState}` : ''}`
    : '';
  const desc = `Check call: ${rest.status.replace('_', ' ')}${location}`;

  await db.insert(shipmentEvents).values({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shipmentId: id,
    eventType: 'check_call',
    description: desc,
    createdBy: createdBy ?? 'system',
    createdAt: now,
  });

  return NextResponse.json({ call: newCall }, { status: 201 });
}
