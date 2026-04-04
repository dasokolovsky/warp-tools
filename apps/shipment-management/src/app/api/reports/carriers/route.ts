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

  const carrierMap: Record<string, {
    count: number;
    cost: number;
    revenue: number;
    margin: number;
    onTimeDeliveries: number;
    totalWithDeliveryData: number;
  }> = {};

  for (const s of all) {
    if (!s.carrierName) continue;
    const c = carrierMap[s.carrierName] ?? {
      count: 0,
      cost: 0,
      revenue: 0,
      margin: 0,
      onTimeDeliveries: 0,
      totalWithDeliveryData: 0,
    };
    c.count += 1;
    c.cost += s.carrierRate ?? 0;
    c.revenue += s.customerRate ?? 0;
    c.margin += s.margin ?? 0;
    if (s.deliveryOnTime !== null) {
      c.totalWithDeliveryData += 1;
      if (s.deliveryOnTime === true) c.onTimeDeliveries += 1;
    }
    carrierMap[s.carrierName] = c;
  }

  const carriers = Object.entries(carrierMap)
    .map(([carrier, v]) => ({
      carrier,
      count: v.count,
      cost: v.cost,
      margin: v.margin,
      marginPct: v.revenue > 0 ? (v.margin / v.revenue) * 100 : null,
      onTimePct: v.totalWithDeliveryData > 0 ? (v.onTimeDeliveries / v.totalWithDeliveryData) * 100 : null,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ carriers });
}
