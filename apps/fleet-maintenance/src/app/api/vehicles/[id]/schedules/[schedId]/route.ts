import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { maintenanceSchedules } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; schedId: string }> }) {
  try {
    const { schedId } = await params;
    const body = await req.json();
    const now = new Date().toISOString();
    await db.update(maintenanceSchedules).set({
      service_type: body.service_type,
      interval_miles: body.interval_miles ? parseInt(body.interval_miles) : null,
      interval_days: body.interval_days ? parseInt(body.interval_days) : null,
      last_completed_at: body.last_completed_at ?? null,
      last_completed_miles: body.last_completed_miles ? parseInt(body.last_completed_miles) : null,
      next_due_at: body.next_due_at ?? null,
      next_due_miles: body.next_due_miles ? parseInt(body.next_due_miles) : null,
      priority: body.priority ?? 'medium',
      notes: body.notes ?? null,
      updated_at: now,
    }).where(eq(maintenanceSchedules.id, schedId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[sched PUT]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; schedId: string }> }) {
  try {
    const { schedId } = await params;
    const body = await req.json();
    const now = new Date().toISOString();
    // Mark complete: update last_completed and compute next_due
    const [sched] = await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.id, schedId));
    if (!sched) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const completedAt = body.completed_at ?? now.slice(0, 10);
    let nextDueAt: string | null = null;
    if (sched.interval_days) {
      const d = new Date(completedAt);
      d.setDate(d.getDate() + sched.interval_days);
      nextDueAt = d.toISOString().slice(0, 10);
    }

    await db.update(maintenanceSchedules).set({
      last_completed_at: completedAt,
      last_completed_miles: body.mileage ? parseInt(body.mileage) : sched.last_completed_miles,
      next_due_at: nextDueAt,
      updated_at: now,
    }).where(eq(maintenanceSchedules.id, schedId));

    return NextResponse.json({ success: true, next_due_at: nextDueAt });
  } catch (err) {
    console.error('[sched complete]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; schedId: string }> }) {
  try {
    const { schedId } = await params;
    await db.delete(maintenanceSchedules).where(eq(maintenanceSchedules.id, schedId));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
