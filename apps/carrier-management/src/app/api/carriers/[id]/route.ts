import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carriers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const UpdateCarrierSchema = z.object({
  name: z.string().min(1).optional(),
  mcNumber: z.string().optional().nullable(),
  dotNumber: z.string().optional().nullable(),
  scacCode: z.string().optional().nullable(),
  addressStreet: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressState: z.string().optional().nullable(),
  addressZip: z.string().optional().nullable(),
  addressCountry: z.string().optional(),
  website: z.string().optional().nullable(),
  equipmentTypes: z.array(z.string()).optional(),
  serviceAreas: z.array(z.any()).optional(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'blacklisted']).optional(),
  authorityStatus: z.enum(['active', 'inactive', 'revoked', 'unknown']).optional(),
  safetyRating: z.enum(['satisfactory', 'conditional', 'unsatisfactory', 'not_rated', 'unknown']).optional(),
  overallScore: z.number().optional().nullable(),
  vettingStatus: z.enum(['not_started', 'in_progress', 'vetted', 'approved', 'rejected']).optional(),
  vettingScore: z.number().optional().nullable(),
  approvedAt: z.string().optional().nullable(),
  approvedBy: z.string().optional().nullable(),
  rejectedAt: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  onboardingNotes: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const carrier = await db.select().from(carriers).where(eq(carriers.id, id)).limit(1);

  if (!carrier.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(carrier[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateCarrierSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { equipmentTypes, serviceAreas, tags, ...rest } = parsed.data;

  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date().toISOString() };
  if (equipmentTypes) updates.equipmentTypes = JSON.stringify(equipmentTypes);
  if (serviceAreas) updates.serviceAreas = JSON.stringify(serviceAreas);
  if (tags) updates.tags = JSON.stringify(tags);

  const updated = await db.update(carriers).set(updates).where(eq(carriers.id, id)).returning();

  if (!updated.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(carriers).where(eq(carriers.id, id));
  return NextResponse.json({ success: true });
}
