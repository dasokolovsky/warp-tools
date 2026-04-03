import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierPerformance, carriers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const PerformanceSchema = z.object({
  shipmentRef: z.string().optional().nullable(),
  pickupOnTime: z.boolean().optional().nullable(),
  deliveryOnTime: z.boolean().optional().nullable(),
  damageReported: z.boolean().default(false),
  claimFiled: z.boolean().default(false),
  transitDays: z.number().int().optional().nullable(),
  communicationScore: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
});

function computeScore(records: typeof carrierPerformance.$inferSelect[]): number {
  if (!records.length) return 0;
  const onTimePickup = records.filter((r) => r.pickupOnTime).length / records.length;
  const onTimeDelivery = records.filter((r) => r.deliveryOnTime).length / records.length;
  const noDamage = records.filter((r) => !r.damageReported).length / records.length;
  const noClaim = records.filter((r) => !r.claimFiled).length / records.length;
  const avgComm =
    records.filter((r) => r.communicationScore != null).reduce((s, r) => s + (r.communicationScore ?? 0), 0) /
    (records.filter((r) => r.communicationScore != null).length || 1);
  const commNorm = avgComm / 5;

  return Math.round(onTimePickup * 30 + onTimeDelivery * 35 + noDamage * 15 + noClaim * 10 + commNorm * 10);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const records = await db
    .select()
    .from(carrierPerformance)
    .where(eq(carrierPerformance.carrierId, id))
    .orderBy(desc(carrierPerformance.recordedAt));
  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = PerformanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await db
    .insert(carrierPerformance)
    .values({ ...parsed.data, carrierId: id })
    .returning();

  // Recalculate and update overall score
  const allRecords = await db
    .select()
    .from(carrierPerformance)
    .where(eq(carrierPerformance.carrierId, id));

  const score = computeScore(allRecords);
  await db.update(carriers).set({ overallScore: score }).where(eq(carriers.id, id));

  return NextResponse.json(record[0], { status: 201 });
}
