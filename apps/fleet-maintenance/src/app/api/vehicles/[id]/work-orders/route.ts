import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workOrders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(workOrders).where(eq(workOrders.vehicle_id, id)).orderBy(desc(workOrders.created_at));
  return NextResponse.json(rows);
}
