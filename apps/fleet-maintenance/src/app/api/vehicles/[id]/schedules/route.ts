import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { maintenanceSchedules } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(maintenanceSchedules)
    .where(eq(maintenanceSchedules.vehicle_id, id))
    .orderBy(asc(maintenanceSchedules.next_due_at));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = new Date().toISOString();
    const schedule = {
      id: generateId(),
      vehicle_id: id,
      service_type: body.service_type,
      interval_miles: body.interval_miles ? parseInt(body.interval_miles) : null,
      interval_days: body.interval_days ? parseInt(body.interval_days) : null,
      last_completed_at: body.last_completed_at ?? null,
      last_completed_miles: body.last_completed_miles ? parseInt(body.last_completed_miles) : null,
      next_due_at: body.next_due_at ?? null,
      next_due_miles: body.next_due_miles ? parseInt(body.next_due_miles) : null,
      priority: body.priority ?? 'medium',
      is_active: 1,
      notes: body.notes ?? null,
      created_at: now,
      updated_at: now,
    };
    await db.insert(maintenanceSchedules).values(schedule);
    return NextResponse.json(schedule, { status: 201 });
  } catch (err) {
    console.error('[schedules POST]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
