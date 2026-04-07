import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workOrders, vehicles } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { generateId, generateWONumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db
      .select({
        id: workOrders.id,
        work_order_number: workOrders.work_order_number,
        vehicle_id: workOrders.vehicle_id,
        type: workOrders.type,
        status: workOrders.status,
        priority: workOrders.priority,
        title: workOrders.title,
        assigned_to: workOrders.assigned_to,
        parts_cost: workOrders.parts_cost,
        labor_cost: workOrders.labor_cost,
        total_cost: workOrders.total_cost,
        created_at: workOrders.created_at,
        completed_at: workOrders.completed_at,
        unit_number: vehicles.unit_number,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(workOrders)
      .leftJoin(vehicles, eq(workOrders.vehicle_id, vehicles.id))
      .orderBy(desc(workOrders.created_at));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[work-orders GET]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const parts = parseFloat(body.parts_cost ?? 0);
    const labor = parseFloat(body.labor_cost ?? 0);
    const wo = {
      id: generateId(),
      vehicle_id: body.vehicle_id,
      work_order_number: generateWONumber(),
      type: body.type ?? 'repair',
      status: body.status ?? 'open',
      priority: body.priority ?? 'medium',
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
      created_at: now,
      updated_at: now,
    };
    await db.insert(workOrders).values(wo);
    return NextResponse.json(wo, { status: 201 });
  } catch (err) {
    console.error('[work-orders POST]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
