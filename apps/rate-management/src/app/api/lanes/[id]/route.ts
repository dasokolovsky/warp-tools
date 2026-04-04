import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs, rfqs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const PatchLaneSchema = z.object({
  origin_city: z.string().min(1).optional(),
  origin_state: z.string().min(1).max(2).optional(),
  origin_zip: z.string().optional().nullable(),
  dest_city: z.string().min(1).optional(),
  dest_state: z.string().min(1).max(2).optional(),
  dest_zip: z.string().optional().nullable(),
  equipment_type: z.enum(['dry_van', 'reefer', 'flatbed', 'step_deck', 'lowboy', 'sprinter_van', 'cargo_van', 'power_only']).optional(),
  estimated_miles: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const laneId = parseInt(id, 10);
    if (isNaN(laneId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const [lane] = await db.select().from(lanes).where(eq(lanes.id, laneId)).limit(1);
    if (!lane) return NextResponse.json({ error: 'Lane not found' }, { status: 404 });

    const rates = await db
      .select()
      .from(carrier_rates)
      .where(eq(carrier_rates.lane_id, laneId))
      .orderBy(carrier_rates.rate_amount);

    const tariffs = await db
      .select()
      .from(customer_tariffs)
      .where(eq(customer_tariffs.lane_id, laneId));

    const laneRfqs = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.lane_id, laneId))
      .orderBy(rfqs.created_at);

    return NextResponse.json({ lane, rates, tariffs, rfqs: laneRfqs });
  } catch (err) {
    console.error('GET /api/lanes/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch lane' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const laneId = parseInt(id, 10);
    if (isNaN(laneId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const parsed = PatchLaneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { tags, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = {
      ...rest,
      updated_at: new Date().toISOString(),
    };
    if (tags !== undefined) {
      updateData.tags = tags ? JSON.stringify(tags) : null;
    }

    const [updated] = await db
      .update(lanes)
      .set(updateData)
      .where(eq(lanes.id, laneId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Lane not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/lanes/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update lane' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const laneId = parseInt(id, 10);
    if (isNaN(laneId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    // Soft delete — set status to inactive
    const [updated] = await db
      .update(lanes)
      .set({ status: 'inactive', updated_at: new Date().toISOString() })
      .where(and(eq(lanes.id, laneId), eq(lanes.status, 'active')))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Lane not found or already inactive' }, { status: 404 });

    return NextResponse.json({ success: true, lane: updated });
  } catch (err) {
    console.error('DELETE /api/lanes/[id] error:', err);
    return NextResponse.json({ error: 'Failed to deactivate lane' }, { status: 500 });
  }
}
