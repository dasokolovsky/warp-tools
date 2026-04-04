import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lanes, customer_tariffs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const TariffSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_id: z.string().optional().nullable(),
  rate_amount: z.number().positive('Rate must be positive'),
  rate_basis: z.enum(['per_mile', 'flat', 'per_cwt', 'per_pallet']),
  contract_ref: z.string().optional().nullable(),
  effective_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  status: z.enum(['active', 'pending', 'expired']).optional().default('active'),
  notes: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const laneId = parseInt(id, 10);
    if (isNaN(laneId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const tariffs = await db
      .select()
      .from(customer_tariffs)
      .where(eq(customer_tariffs.lane_id, laneId))
      .orderBy(customer_tariffs.created_at);

    return NextResponse.json(tariffs);
  } catch (err) {
    console.error('GET tariffs error:', err);
    return NextResponse.json({ error: 'Failed to fetch tariffs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const laneId = parseInt(id, 10);
    if (isNaN(laneId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const [lane] = await db.select().from(lanes).where(eq(lanes.id, laneId)).limit(1);
    if (!lane) return NextResponse.json({ error: 'Lane not found' }, { status: 404 });

    const body = await req.json();
    const parsed = TariffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [tariff] = await db
      .insert(customer_tariffs)
      .values({ ...parsed.data, lane_id: laneId })
      .returning();

    return NextResponse.json(tariff, { status: 201 });
  } catch (err) {
    console.error('POST tariffs error:', err);
    return NextResponse.json({ error: 'Failed to create tariff' }, { status: 500 });
  }
}
