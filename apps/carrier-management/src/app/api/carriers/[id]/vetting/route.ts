import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierVetting, carriers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const CreateVettingSchema = z.object({
  checkType: z.enum([
    'authority',
    'insurance_verified',
    'safety_rating',
    'w9_received',
    'contract_signed',
    'reference_checked',
    'drug_testing',
    'cargo_coverage',
    'general_liability',
    'workers_comp',
  ]),
  status: z.enum(['pending', 'passed', 'failed', 'waived', 'expired']).default('pending'),
  checkedAt: z.string().optional().nullable(),
  checkedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
  if (!carrier) {
    return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });
  }

  const checks = await db
    .select()
    .from(carrierVetting)
    .where(eq(carrierVetting.carrierId, id));

  return NextResponse.json(checks);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
  if (!carrier) {
    return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = CreateVettingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const check = await db
    .insert(carrierVetting)
    .values({ carrierId: id, ...parsed.data })
    .returning();

  return NextResponse.json(check[0], { status: 201 });
}
