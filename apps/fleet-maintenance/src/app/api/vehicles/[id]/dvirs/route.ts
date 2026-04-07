import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dvirReports } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(dvirReports).where(eq(dvirReports.vehicle_id, id)).orderBy(desc(dvirReports.date));
  return NextResponse.json(rows);
}
