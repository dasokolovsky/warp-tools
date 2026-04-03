import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierRates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const RateSchema = z.object({
  originCity: z.string().optional().nullable(),
  originState: z.string().optional().nullable(),
  originZip: z.string().optional().nullable(),
  destCity: z.string().optional().nullable(),
  destState: z.string().optional().nullable(),
  destZip: z.string().optional().nullable(),
  equipmentType: z.string().optional().nullable(),
  rateType: z.enum(['per_mile', 'flat', 'per_cwt']).default('per_mile'),
  rateAmount: z.number().min(0),
  effectiveDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rates = await db
    .select()
    .from(carrierRates)
    .where(eq(carrierRates.carrierId, id));
  return NextResponse.json(rates);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = RateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const rate = await db
    .insert(carrierRates)
    .values({ ...parsed.data, carrierId: id })
    .returning();

  return NextResponse.json(rate[0], { status: 201 });
}
