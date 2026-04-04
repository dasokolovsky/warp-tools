import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrier_rates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const PatchRateSchema = z.object({
  carrier_name: z.string().min(1).optional(),
  carrier_id: z.string().optional().nullable(),
  rate_amount: z.number().positive().optional(),
  rate_basis: z.enum(['per_mile', 'flat', 'per_cwt', 'per_pallet']).optional(),
  rate_type: z.enum(['spot', 'contract']).optional(),
  effective_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.enum(['email', 'phone', 'rfq', 'website']).optional().nullable(),
});

type Params = { params: Promise<{ id: string; rateId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id, rateId } = await params;
    const laneId = parseInt(id, 10);
    const rId = parseInt(rateId, 10);
    if (isNaN(laneId) || isNaN(rId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const parsed = PatchRateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [updated] = await db
      .update(carrier_rates)
      .set({ ...parsed.data, updated_at: new Date().toISOString() })
      .where(and(eq(carrier_rates.id, rId), eq(carrier_rates.lane_id, laneId)))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Rate not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH carrier-rates/[rateId] error:', err);
    return NextResponse.json({ error: 'Failed to update carrier rate' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, rateId } = await params;
    const laneId = parseInt(id, 10);
    const rId = parseInt(rateId, 10);
    if (isNaN(laneId) || isNaN(rId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const [deleted] = await db
      .delete(carrier_rates)
      .where(and(eq(carrier_rates.id, rId), eq(carrier_rates.lane_id, laneId)))
      .returning();

    if (!deleted) return NextResponse.json({ error: 'Rate not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE carrier-rates/[rateId] error:', err);
    return NextResponse.json({ error: 'Failed to delete carrier rate' }, { status: 500 });
  }
}
