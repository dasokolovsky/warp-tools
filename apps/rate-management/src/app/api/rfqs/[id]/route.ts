export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { rfqs, rfq_responses, lanes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    if (isNaN(rfqId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId)).limit(1);
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

    const responses = await db.select().from(rfq_responses).where(eq(rfq_responses.rfq_id, rfqId));
    const lane = rfq.lane_id
      ? (await db.select().from(lanes).where(eq(lanes.id, rfq.lane_id)).limit(1))[0] ?? null
      : null;

    return NextResponse.json({ data: { rfq, responses, lane } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch RFQ' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    if (isNaN(rfqId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const allowed: Record<string, unknown> = {};
    const fields = ['status', 'notes', 'pickup_date', 'desired_rate', 'equipment_type', 'lane_id'];
    for (const f of fields) {
      if (f in body) allowed[f] = body[f];
    }

    const [updated] = await db
      .update(rfqs)
      .set({ ...allowed, updated_at: new Date().toISOString() })
      .where(eq(rfqs.id, rfqId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update RFQ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    if (isNaN(rfqId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const cancelReason = body.reason ?? null;

    const [updated] = await db
      .update(rfqs)
      .set({ status: 'cancelled', notes: cancelReason ?? undefined, updated_at: new Date().toISOString() })
      .where(eq(rfqs.id, rfqId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to cancel RFQ' }, { status: 500 });
  }
}
