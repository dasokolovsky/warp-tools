import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dvirReports, vehicles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db
      .select({
        id: dvirReports.id,
        vehicle_id: dvirReports.vehicle_id,
        driver_name: dvirReports.driver_name,
        inspection_type: dvirReports.inspection_type,
        date: dvirReports.date,
        mileage: dvirReports.mileage,
        defects_found: dvirReports.defects_found,
        status: dvirReports.status,
        defects_json: dvirReports.defects_json,
        corrective_action: dvirReports.corrective_action,
        reviewed_by: dvirReports.reviewed_by,
        reviewed_at: dvirReports.reviewed_at,
        created_at: dvirReports.created_at,
        unit_number: vehicles.unit_number,
        make: vehicles.make,
        model: vehicles.model,
      })
      .from(dvirReports)
      .leftJoin(vehicles, eq(dvirReports.vehicle_id, vehicles.id))
      .where(eq(dvirReports.id, id));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
