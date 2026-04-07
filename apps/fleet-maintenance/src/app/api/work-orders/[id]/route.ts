import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workOrders, vehicles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db
      .select({
        id: workOrders.id,
        work_order_number: workOrders.work_order_number,
        vehicle_id: workOrders.vehicle_id,
        type: workOrders.type,
        status: workOrders.status,
        priority: workOrders.priority,
        title: workOrders.title,
        description: workOrders.description,
        assigned_to: workOrders.assigned_to,
        vendor: workOrders.vendor,
        parts_cost: workOrders.parts_cost,
        labor_cost: workOrders.labor_cost,
        total_cost: workOrders.total_cost,
        started_at: workOrders.started_at,
        completed_at: workOrders.completed_at,
        mileage_at_service: workOrders.mileage_at_service,
        notes: workOrders.notes,
        created_at: workOrders.created_at,
        updated_at: workOrders.updated_at,
        unit_number: vehicles.unit_number,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(workOrders)
      .leftJoin(vehicles, eq(workOrders.vehicle_id, vehicles.id))
      .where(eq(workOrders.id, id));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = new Date().toISOString();
    const parts = parseFloat(body.parts_cost ?? 0);
    const labor = parseFloat(body.labor_cost ?? 0);
    await db.update(workOrders).set({
      vehicle_id: body.vehicle_id,
      type: body.type,
      status: body.status,
      priority: body.priority,
      title: body.title,
      description: body.description ?? null,
      assigned_to: body.assigned_to ?? null,
      vendor: body.vendor ?? null,
      parts_cost: parts,
      labor_cost: labor,
      total_cost: parts + labor,
      started_at: body.started_at ?? null,
      completed_at: body.completed_at ?? null,
      mileage_at_service: body.mileage_at_service ? parseInt(body.mileage_at_service) : null,
      notes: body.notes ?? null,
      updated_at: now,
    }).where(eq(workOrders.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(workOrders).where(eq(workOrders.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
