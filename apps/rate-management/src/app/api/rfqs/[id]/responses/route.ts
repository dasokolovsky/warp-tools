export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { rfqs, rfq_responses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    if (isNaN(rfqId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId)).limit(1);
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

    const body = await req.json();
    const { carrier_name, rate_amount, rate_basis, valid_until, contact_name, contact_email, notes } = body;

    if (!carrier_name || rate_amount == null || !rate_basis) {
      return NextResponse.json({ error: 'carrier_name, rate_amount, rate_basis are required' }, { status: 400 });
    }

    const [created] = await db
      .insert(rfq_responses)
      .values({
        rfq_id: rfqId,
        carrier_name,
        rate_amount: Number(rate_amount),
        rate_basis,
        valid_until: valid_until ?? null,
        contact_name: contact_name ?? null,
        contact_email: contact_email ?? null,
        notes: notes ?? null,
        is_winner: false,
        responded_at: new Date().toISOString(),
      })
      .returning();

    // Auto-advance RFQ to "responses" if it was "sent"
    if (rfq.status === 'sent') {
      await db.update(rfqs).set({ status: 'responses', updated_at: new Date().toISOString() }).where(eq(rfqs.id, rfqId));
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to add response' }, { status: 500 });
  }
}
