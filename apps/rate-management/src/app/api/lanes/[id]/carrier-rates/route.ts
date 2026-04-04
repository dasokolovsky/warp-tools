import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lanes, carrier_rates } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

const CarrierRateSchema = z.object({
  carrier_name: z.string().min(1, 'Carrier name is required'),
  carrier_id: z.string().optional().nullable(),
  rate_amount: z.number().positive('Rate must be positive'),
  rate_basis: z.enum(['per_mile', 'flat', 'per_cwt', 'per_pallet']),
  rate_type: z.enum(['spot', 'contract']),
  effective_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.enum(['email', 'phone', 'rfq', 'website']).optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const laneId = parseInt(id, 10);
    if (isNaN(laneId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const rates = await db
      .select()
      .from(carrier_rates)
      .where(eq(carrier_rates.lane_id, laneId))
      .orderBy(asc(carrier_rates.rate_amount));

    return NextResponse.json(rates);
  } catch (err) {
    console.error('GET carrier-rates error:', err);
    return NextResponse.json({ error: 'Failed to fetch carrier rates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const laneId = parseInt(id, 10);
    if (isNaN(laneId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    // Verify lane exists
    const [lane] = await db.select().from(lanes).where(eq(lanes.id, laneId)).limit(1);
    if (!lane) return NextResponse.json({ error: 'Lane not found' }, { status: 404 });

    const body = await req.json();
    const parsed = CarrierRateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [rate] = await db
      .insert(carrier_rates)
      .values({ ...parsed.data, lane_id: laneId })
      .returning();

    return NextResponse.json(rate, { status: 201 });
  } catch (err) {
    console.error('POST carrier-rates error:', err);
    return NextResponse.json({ error: 'Failed to create carrier rate' }, { status: 500 });
  }
}
