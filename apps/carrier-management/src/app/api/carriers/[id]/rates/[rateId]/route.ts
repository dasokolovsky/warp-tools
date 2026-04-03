import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierRates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const RateUpdateSchema = z.object({
  originCity: z.string().optional().nullable(),
  originState: z.string().optional().nullable(),
  originZip: z.string().optional().nullable(),
  destCity: z.string().optional().nullable(),
  destState: z.string().optional().nullable(),
  destZip: z.string().optional().nullable(),
  equipmentType: z.string().optional().nullable(),
  rateType: z.enum(['per_mile', 'flat', 'per_cwt']).optional(),
  rateAmount: z.number().min(0).optional(),
  effectiveDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string; rateId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, rateId } = await params;
  const body = await req.json();
  const parsed = RateUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db
    .update(carrierRates)
    .set(parsed.data)
    .where(and(eq(carrierRates.id, rateId), eq(carrierRates.carrierId, id)))
    .returning();

  if (!updated.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, rateId } = await params;

  const deleted = await db
    .delete(carrierRates)
    .where(and(eq(carrierRates.id, rateId), eq(carrierRates.carrierId, id)))
    .returning();

  if (!deleted.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
