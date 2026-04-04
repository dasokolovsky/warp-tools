export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { rfq_responses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; respId: string }> }
) {
  try {
    const { respId } = await params;
    const id = parseInt(respId);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid response ID' }, { status: 400 });

    const body = await req.json();
    const allowed: Record<string, unknown> = {};
    const fields = ['carrier_name', 'rate_amount', 'rate_basis', 'valid_until', 'contact_name', 'contact_email', 'notes'];
    for (const f of fields) {
      if (f in body) allowed[f] = body[f];
    }

    const [updated] = await db
      .update(rfq_responses)
      .set(allowed)
      .where(eq(rfq_responses.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update response' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; respId: string }> }
) {
  try {
    const { respId } = await params;
    const id = parseInt(respId);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid response ID' }, { status: 400 });

    const [deleted] = await db
      .delete(rfq_responses)
      .where(eq(rfq_responses.id, id))
      .returning();

    if (!deleted) return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    return NextResponse.json({ data: deleted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 });
  }
}
