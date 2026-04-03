import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierInsurance } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getInsuranceStatus } from '@/lib/utils';

const InsuranceSchema = z.object({
  type: z.enum(['auto_liability', 'cargo', 'general_liability', 'workers_comp']),
  provider: z.string().optional().nullable(),
  policyNumber: z.string().optional().nullable(),
  coverageAmount: z.number().optional().nullable(),
  effectiveDate: z.string().optional().nullable(),
  expiryDate: z.string(),
  documentUrl: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const records = await db
    .select()
    .from(carrierInsurance)
    .where(eq(carrierInsurance.carrierId, id));
  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = InsuranceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const status = getInsuranceStatus(parsed.data.expiryDate);

  const record = await db
    .insert(carrierInsurance)
    .values({ ...parsed.data, carrierId: id, status })
    .returning();

  return NextResponse.json(record[0], { status: 201 });
}
