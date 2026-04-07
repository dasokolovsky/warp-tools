import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { partsInventory } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.select().from(partsInventory).orderBy(asc(partsInventory.name));
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const part = {
      id: generateId(),
      part_number: body.part_number ?? null,
      name: body.name,
      category: body.category ?? null,
      quantity_on_hand: parseInt(body.quantity_on_hand ?? 0),
      minimum_stock: parseInt(body.minimum_stock ?? 0),
      unit_cost: parseFloat(body.unit_cost ?? 0),
      supplier: body.supplier ?? null,
      location: body.location ?? null,
      notes: body.notes ?? null,
      created_at: now,
      updated_at: now,
    };
    await db.insert(partsInventory).values(part);
    return NextResponse.json(part, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
