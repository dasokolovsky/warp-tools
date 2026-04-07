import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { partsInventory } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(partsInventory).where(eq(partsInventory.id, id));
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = new Date().toISOString();
    await db.update(partsInventory).set({
      part_number: body.part_number ?? null,
      name: body.name,
      category: body.category ?? null,
      quantity_on_hand: parseInt(body.quantity_on_hand ?? 0),
      minimum_stock: parseInt(body.minimum_stock ?? 0),
      unit_cost: parseFloat(body.unit_cost ?? 0),
      supplier: body.supplier ?? null,
      location: body.location ?? null,
      notes: body.notes ?? null,
      updated_at: now,
    }).where(eq(partsInventory.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(partsInventory).where(eq(partsInventory.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
