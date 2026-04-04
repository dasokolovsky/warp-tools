export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { rfqs, rfq_responses, carrier_rates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    if (isNaN(rfqId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const { responseId } = body;
    if (!responseId) return NextResponse.json({ error: 'responseId is required' }, { status: 400 });

    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId)).limit(1);
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

    const [response] = await db.select().from(rfq_responses).where(eq(rfq_responses.id, responseId)).limit(1);
    if (!response) return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    if (response.rfq_id !== rfqId) return NextResponse.json({ error: 'Response does not belong to this RFQ' }, { status: 400 });

    const awardedAt = new Date().toISOString();

    // Clear all winners on this RFQ then mark winner
    await db.update(rfq_responses).set({ is_winner: false }).where(eq(rfq_responses.rfq_id, rfqId));
    await db.update(rfq_responses).set({ is_winner: true }).where(eq(rfq_responses.id, responseId));

    // Update RFQ status to awarded
    const [updatedRfq] = await db
      .update(rfqs)
      .set({
        status: 'awarded',
        awarded_carrier: response.carrier_name,
        awarded_rate: response.rate_amount,
        awarded_at: awardedAt,
        updated_at: awardedAt,
      })
      .where(eq(rfqs.id, rfqId))
      .returning();

    // Create carrier_rate record on the lane
    let newRate = null;
    if (rfq.lane_id) {
      const [created] = await db
        .insert(carrier_rates)
        .values({
          lane_id: rfq.lane_id,
          carrier_name: response.carrier_name,
          carrier_id: response.carrier_id ?? null,
          rate_amount: response.rate_amount,
          rate_basis: response.rate_basis,
          rate_type: 'spot',
          effective_date: new Date().toISOString().split('T')[0],
          expiry_date: response.valid_until ?? null,
          contact_name: response.contact_name ?? null,
          contact_email: response.contact_email ?? null,
          notes: `Awarded from ${rfq.rfq_number}`,
          source: 'rfq',
        })
        .returning();
      newRate = created;
    }

    return NextResponse.json({ data: { rfq: updatedRfq, response, newRate } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to award RFQ' }, { status: 500 });
  }
}
