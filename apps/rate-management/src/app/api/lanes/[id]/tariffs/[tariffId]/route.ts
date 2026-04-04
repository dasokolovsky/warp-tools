import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customer_tariffs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const PatchTariffSchema = z.object({
  customer_name: z.string().min(1).optional(),
  customer_id: z.string().optional().nullable(),
  rate_amount: z.number().positive().optional(),
  rate_basis: z.enum(['per_mile', 'flat', 'per_cwt', 'per_pallet']).optional(),
  contract_ref: z.string().optional().nullable(),
  effective_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  status: z.enum(['active', 'pending', 'expired']).optional(),
  notes: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string; tariffId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id, tariffId } = await params;
    const laneId = parseInt(id, 10);
    const tId = parseInt(tariffId, 10);
    if (isNaN(laneId) || isNaN(tId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const parsed = PatchTariffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [updated] = await db
      .update(customer_tariffs)
      .set({ ...parsed.data, updated_at: new Date().toISOString() })
      .where(and(eq(customer_tariffs.id, tId), eq(customer_tariffs.lane_id, laneId)))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Tariff not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH tariffs/[tariffId] error:', err);
    return NextResponse.json({ error: 'Failed to update tariff' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, tariffId } = await params;
    const laneId = parseInt(id, 10);
    const tId = parseInt(tariffId, 10);
    if (isNaN(laneId) || isNaN(tId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const [deleted] = await db
      .delete(customer_tariffs)
      .where(and(eq(customer_tariffs.id, tId), eq(customer_tariffs.lane_id, laneId)))
      .returning();

    if (!deleted) return NextResponse.json({ error: 'Tariff not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE tariffs/[tariffId] error:', err);
    return NextResponse.json({ error: 'Failed to delete tariff' }, { status: 500 });
  }
}
