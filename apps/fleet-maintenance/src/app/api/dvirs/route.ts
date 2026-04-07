import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dvirReports, vehicles, type DvirStatus, type InspectionType } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db
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
      .orderBy(desc(dvirReports.date));
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[dvirs GET]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const defects = body.defects ?? [];
    const defectsFound = defects.length;
    let status: DvirStatus = 'no_defects';
    if (defectsFound > 0) {
      const hasOOS = defects.some((d: { severity?: string; corrected?: boolean }) => d.severity === 'out_of_service' && !d.corrected);
      status = hasOOS ? 'out_of_service' : 'defects_noted';
    }
    const dvir = {
      id: generateId(),
      vehicle_id: body.vehicle_id,
      driver_name: body.driver_name,
      inspection_type: (body.inspection_type ?? 'pre_trip') as InspectionType,
      date: body.date ?? now.slice(0, 10),
      mileage: body.mileage ? parseInt(body.mileage) : null,
      defects_found: defectsFound,
      status,
      defects_json: defectsFound > 0 ? JSON.stringify(defects) : null,
      corrective_action: body.corrective_action ?? null,
      reviewed_by: body.reviewed_by ?? null,
      reviewed_at: body.reviewed_at ?? null,
      created_at: now,
    };
    await db.insert(dvirReports).values(dvir);
    return NextResponse.json(dvir, { status: 201 });
  } catch (err) {
    console.error('[dvirs POST]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
