import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (err) {
    console.error('[vehicle GET]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = new Date().toISOString();
    await db.update(vehicles).set({
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
      updated_at: now,
    }).where(eq(vehicles.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[vehicle PUT]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[vehicle DELETE]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
