import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carriers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const ApproveSchema = z.object({
  approvedBy: z.string().optional().nullable(),
  onboardingNotes: z.string().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
  if (!carrier) {
    return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = ApproveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db
    .update(carriers)
    .set({
      vettingStatus: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: parsed.data.approvedBy ?? null,
      onboardingNotes: parsed.data.onboardingNotes ?? null,
      rejectedAt: null,
      rejectionReason: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(carriers.id, id))
    .returning();

  return NextResponse.json(updated[0]);
}
