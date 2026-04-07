import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carriers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const RejectSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
  rejectedBy: z.string().optional().nullable(),
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
  const parsed = RejectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db
    .update(carriers)
    .set({
      vettingStatus: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectionReason: parsed.data.rejectionReason,
      approvedAt: null,
      approvedBy: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(carriers.id, id))
    .returning();

  return NextResponse.json(updated[0]);
}
