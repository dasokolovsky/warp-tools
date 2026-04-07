import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    await db.update(workOrders).set({
      status: 'completed',
      completed_at: body.completed_at ?? now.slice(0, 10),
      updated_at: now,
    }).where(eq(workOrders.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
