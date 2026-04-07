import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles, workOrders, maintenanceSchedules } from '@/db/schema';
import { eq, sql, or, asc, desc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.select().from(vehicles).orderBy(asc(vehicles.unit_number));

    const withCounts = await Promise.all(
      rows.map(async (v) => {
        const [woCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(workOrders)
          .where(
            sql`${workOrders.vehicle_id} = ${v.id} AND ${workOrders.status} IN ('open','in_progress','waiting_parts')`
          );
        const [nextPM] = await db
          .select({ next_due_at: maintenanceSchedules.next_due_at })
          .from(maintenanceSchedules)
          .where(eq(maintenanceSchedules.vehicle_id, v.id))
          .orderBy(asc(maintenanceSchedules.next_due_at))
          .limit(1);
        return {
          ...v,
          open_wo_count: woCount?.count ?? 0,
          next_pm_due: nextPM?.next_due_at ?? null,
        };
      })
    );

    return NextResponse.json(withCounts);
  } catch (err) {
    console.error('[vehicles GET]', err);
    return NextResponse.json({ error: 'Failed to load vehicles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const id = generateId();
    const vehicle = {
      id,
      unit_number: body.unit_number,
      vin: body.vin ?? null,
      year: body.year ? parseInt(body.year) : null,
      make: body.make ?? null,
      model: body.model ?? null,
      type: body.type ?? null,
      license_plate: body.license_plate ?? null,
      state: body.state ?? null,
      status: body.status ?? 'active',
      current_mileage: body.current_mileage ? parseInt(body.current_mileage) : 0,
      last_inspection_date: body.last_inspection_date ?? null,
      next_inspection_due: body.next_inspection_due ?? null,
      acquisition_date: body.acquisition_date ?? null,
      notes: body.notes ?? null,
      created_at: now,
      updated_at: now,
    };
    await db.insert(vehicles).values(vehicle);
    return NextResponse.json(vehicle, { status: 201 });
  } catch (err) {
    console.error('[vehicles POST]', err);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}
