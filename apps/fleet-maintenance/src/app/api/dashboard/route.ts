import { NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles, maintenanceSchedules, workOrders, dvirReports } from '@/db/schema';
import { eq, sql, and, lte, gte, lt, or, isNull, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date().toISOString().slice(0, 10);
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    // Vehicle stats
    const allVehicles = await db.select().from(vehicles);
    const vehicleStats = {
      total: allVehicles.length,
      active: allVehicles.filter((v) => v.status === 'active').length,
      in_shop: allVehicles.filter((v) => v.status === 'in_shop').length,
      out_of_service: allVehicles.filter((v) => v.status === 'out_of_service').length,
    };

    // Upcoming maintenance (next 7 days)
    const upcomingMaintenance = await db
      .select({
        id: maintenanceSchedules.id,
        vehicle_id: maintenanceSchedules.vehicle_id,
        service_type: maintenanceSchedules.service_type,
        next_due_at: maintenanceSchedules.next_due_at,
        next_due_miles: maintenanceSchedules.next_due_miles,
        priority: maintenanceSchedules.priority,
        unit_number: vehicles.unit_number,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(maintenanceSchedules)
      .leftJoin(vehicles, eq(maintenanceSchedules.vehicle_id, vehicles.id))
      .where(
        and(
          eq(maintenanceSchedules.is_active, 1),
          gte(maintenanceSchedules.next_due_at, now),
          lte(maintenanceSchedules.next_due_at, in7Days)
        )
      )
      .orderBy(maintenanceSchedules.next_due_at);

    // Overdue maintenance
    const overdueMaintenance = await db
      .select({
        id: maintenanceSchedules.id,
        vehicle_id: maintenanceSchedules.vehicle_id,
        service_type: maintenanceSchedules.service_type,
        next_due_at: maintenanceSchedules.next_due_at,
        priority: maintenanceSchedules.priority,
        unit_number: vehicles.unit_number,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(maintenanceSchedules)
      .leftJoin(vehicles, eq(maintenanceSchedules.vehicle_id, vehicles.id))
      .where(
        and(
          eq(maintenanceSchedules.is_active, 1),
          lt(maintenanceSchedules.next_due_at, now)
        )
      )
      .orderBy(maintenanceSchedules.next_due_at);

    // Open work orders
    const openWorkOrders = await db
      .select({
        id: workOrders.id,
        work_order_number: workOrders.work_order_number,
        title: workOrders.title,
        status: workOrders.status,
        priority: workOrders.priority,
        unit_number: vehicles.unit_number,
        created_at: workOrders.created_at,
      })
      .from(workOrders)
      .leftJoin(vehicles, eq(workOrders.vehicle_id, vehicles.id))
      .where(
        or(
          eq(workOrders.status, 'open'),
          eq(workOrders.status, 'in_progress'),
          eq(workOrders.status, 'waiting_parts')
        )
      )
      .orderBy(desc(workOrders.created_at));

    const woStatusBreakdown = {
      open: openWorkOrders.filter((w) => w.status === 'open').length,
      in_progress: openWorkOrders.filter((w) => w.status === 'in_progress').length,
      waiting_parts: openWorkOrders.filter((w) => w.status === 'waiting_parts').length,
    };

    // Recent DVIRs with defects
    const recentDvirs = await db
      .select({
        id: dvirReports.id,
        date: dvirReports.date,
        driver_name: dvirReports.driver_name,
        status: dvirReports.status,
        defects_found: dvirReports.defects_found,
        unit_number: vehicles.unit_number,
      })
      .from(dvirReports)
      .leftJoin(vehicles, eq(dvirReports.vehicle_id, vehicles.id))
      .where(
        or(
          eq(dvirReports.status, 'defects_noted'),
          eq(dvirReports.status, 'out_of_service')
        )
      )
      .orderBy(desc(dvirReports.date))
      .limit(5);

    // Monthly cost summary
    const monthlyCosts = await db
      .select({
        parts_cost: workOrders.parts_cost,
        labor_cost: workOrders.labor_cost,
        total_cost: workOrders.total_cost,
      })
      .from(workOrders)
      .where(
        and(
          gte(workOrders.created_at, monthStart),
          or(eq(workOrders.status, 'completed'), eq(workOrders.status, 'in_progress'), eq(workOrders.status, 'waiting_parts'))
        )
      );

    const monthlySummary = monthlyCosts.reduce(
      (acc, row) => ({
        parts: acc.parts + (row.parts_cost ?? 0),
        labor: acc.labor + (row.labor_cost ?? 0),
        total: acc.total + (row.total_cost ?? 0),
      }),
      { parts: 0, labor: 0, total: 0 }
    );

    return NextResponse.json({
      vehicleStats,
      upcomingMaintenance,
      overdueMaintenance,
      openWorkOrders: openWorkOrders.slice(0, 5),
      woStatusBreakdown,
      recentDvirs,
      monthlySummary,
    });
  } catch (err) {
    console.error('[dashboard]', err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
