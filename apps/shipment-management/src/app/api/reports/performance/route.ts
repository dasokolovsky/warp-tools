import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments } from '@/db/schema';
import { gte, lte, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';

  const conditions = [];
  if (dateFrom) conditions.push(gte(shipments.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(shipments.createdAt, dateTo + ' 23:59:59'));

  const all = await db
    .select()
    .from(shipments)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Overall on-time stats
  const withPickupData = all.filter((s) => s.pickupOnTime !== null);
  const withDeliveryData = all.filter((s) => s.deliveryOnTime !== null);

  const onTimePickups = withPickupData.filter((s) => s.pickupOnTime === true).length;
  const onTimeDeliveries = withDeliveryData.filter((s) => s.deliveryOnTime === true).length;
  const pickupOnTimePct = withPickupData.length > 0 ? (onTimePickups / withPickupData.length) * 100 : 0;
  const deliveryOnTimePct = withDeliveryData.length > 0 ? (onTimeDeliveries / withDeliveryData.length) * 100 : 0;

  // By carrier
  const carrierMap: Record<string, {
    totalPickups: number;
    onTimePickups: number;
    totalDeliveries: number;
    onTimeDeliveries: number;
    count: number;
  }> = {};

  for (const s of all) {
    if (!s.carrierName) continue;
    const c = carrierMap[s.carrierName] ?? {
      totalPickups: 0,
      onTimePickups: 0,
      totalDeliveries: 0,
      onTimeDeliveries: 0,
      count: 0,
    };
    c.count += 1;
    if (s.pickupOnTime !== null) {
      c.totalPickups += 1;
      if (s.pickupOnTime === true) c.onTimePickups += 1;
    }
    if (s.deliveryOnTime !== null) {
      c.totalDeliveries += 1;
      if (s.deliveryOnTime === true) c.onTimeDeliveries += 1;
    }
    carrierMap[s.carrierName] = c;
  }

  const byCarrier = Object.entries(carrierMap)
    .map(([carrier, v]) => ({
      carrier,
      count: v.count,
      pickupOnTimePct: v.totalPickups > 0 ? (v.onTimePickups / v.totalPickups) * 100 : null,
      deliveryOnTimePct: v.totalDeliveries > 0 ? (v.onTimeDeliveries / v.totalDeliveries) * 100 : null,
      totalPickups: v.totalPickups,
      totalDeliveries: v.totalDeliveries,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    overall: { pickupOnTimePct, deliveryOnTimePct, total: all.length },
    byCarrier,
  });
}
