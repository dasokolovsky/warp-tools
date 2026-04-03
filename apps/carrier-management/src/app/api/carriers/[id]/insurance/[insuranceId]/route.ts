import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierInsurance } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getInsuranceStatus } from '@/lib/utils';

const InsuranceUpdateSchema = z.object({
  type: z.enum(['auto_liability', 'cargo', 'general_liability', 'workers_comp']).optional(),
  provider: z.string().optional().nullable(),
  policyNumber: z.string().optional().nullable(),
  coverageAmount: z.number().optional().nullable(),
  effectiveDate: z.string().optional().nullable(),
  expiryDate: z.string().optional(),
  documentUrl: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string; insuranceId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, insuranceId } = await params;
  const body = await req.json();
  const parsed = InsuranceUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.expiryDate) {
    updateData.status = getInsuranceStatus(parsed.data.expiryDate);
  }

  const updated = await db
    .update(carrierInsurance)
    .set(updateData)
    .where(and(eq(carrierInsurance.id, insuranceId), eq(carrierInsurance.carrierId, id)))
    .returning();

  if (!updated.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, insuranceId } = await params;

  const deleted = await db
    .delete(carrierInsurance)
    .where(and(eq(carrierInsurance.id, insuranceId), eq(carrierInsurance.carrierId, id)))
    .returning();

  if (!deleted.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
