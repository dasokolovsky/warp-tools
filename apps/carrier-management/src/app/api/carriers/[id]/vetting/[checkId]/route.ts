import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierVetting, carriers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const UpdateVettingSchema = z.object({
  status: z.enum(['pending', 'passed', 'failed', 'waived', 'expired']).optional(),
  checkedAt: z.string().optional().nullable(),
  checkedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string; checkId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id, checkId } = await params;

  const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
  if (!carrier) {
    return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateVettingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db
    .update(carrierVetting)
    .set(parsed.data)
    .where(and(eq(carrierVetting.id, checkId), eq(carrierVetting.carrierId, id)))
    .returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: 'Vetting check not found' }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id, checkId } = await params;

  await db
    .delete(carrierVetting)
    .where(and(eq(carrierVetting.id, checkId), eq(carrierVetting.carrierId, id)));

  return NextResponse.json({ success: true });
}
