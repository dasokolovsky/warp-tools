import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { checkCalls } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const PatchSchema = z.object({
  status: z.enum(['scheduled', 'at_pickup', 'loading', 'in_transit', 'at_delivery', 'delivered', 'delayed', 'issue']).optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  eta: z.string().optional(),
  notes: z.string().optional(),
  contactMethod: z.enum(['phone', 'text', 'email', 'tracking']).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; callId: string }> }
) {
  const { id, callId } = await params;

  const [existing] = await db
    .select()
    .from(checkCalls)
    .where(and(eq(checkCalls.id, callId), eq(checkCalls.shipmentId, id)));

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.update(checkCalls).set(parsed.data).where(eq(checkCalls.id, callId));

  const [updated] = await db.select().from(checkCalls).where(eq(checkCalls.id, callId));
  return NextResponse.json({ call: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; callId: string }> }
) {
  const { id, callId } = await params;

  const [existing] = await db
    .select()
    .from(checkCalls)
    .where(and(eq(checkCalls.id, callId), eq(checkCalls.shipmentId, id)));

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(checkCalls).where(eq(checkCalls.id, callId));
  return NextResponse.json({ success: true });
}
