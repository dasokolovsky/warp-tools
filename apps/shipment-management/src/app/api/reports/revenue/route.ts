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

  const billed = all.filter((s) =>
    ['invoiced', 'paid', 'closed'].includes(s.status) && s.customerRate != null
  );

  // Totals
  const totalRevenue = billed.reduce((sum, s) => sum + (s.customerRate ?? 0), 0);
  const totalCost = billed.reduce((sum, s) => sum + (s.carrierRate ?? 0), 0);
  const totalMargin = billed.reduce((sum, s) => sum + (s.margin ?? 0), 0);
  const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  // By customer
  const customerMap: Record<string, { revenue: number; cost: number; margin: number; count: number }> = {};
  for (const s of billed) {
    const c = customerMap[s.customerName] ?? { revenue: 0, cost: 0, margin: 0, count: 0 };
    c.revenue += s.customerRate ?? 0;
    c.cost += s.carrierRate ?? 0;
    c.margin += s.margin ?? 0;
    c.count += 1;
    customerMap[s.customerName] = c;
  }
  const byCustomer = Object.entries(customerMap)
    .map(([customer, v]) => ({
      customer,
      ...v,
      marginPct: v.revenue > 0 ? (v.margin / v.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // By carrier
  const carrierMap: Record<string, { revenue: number; cost: number; margin: number; count: number }> = {};
  for (const s of billed) {
    if (!s.carrierName) continue;
    const c = carrierMap[s.carrierName] ?? { revenue: 0, cost: 0, margin: 0, count: 0 };
    c.revenue += s.customerRate ?? 0;
    c.cost += s.carrierRate ?? 0;
    c.margin += s.margin ?? 0;
    c.count += 1;
    carrierMap[s.carrierName] = c;
  }
  const byCarrier = Object.entries(carrierMap)
    .map(([carrier, v]) => ({
      carrier,
      ...v,
      marginPct: v.revenue > 0 ? (v.margin / v.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // By month
  const monthMap: Record<string, { revenue: number; cost: number; margin: number; count: number }> = {};
  for (const s of billed) {
    const key = s.createdAt.slice(0, 7);
    const c = monthMap[key] ?? { revenue: 0, cost: 0, margin: 0, count: 0 };
    c.revenue += s.customerRate ?? 0;
    c.cost += s.carrierRate ?? 0;
    c.margin += s.margin ?? 0;
    c.count += 1;
    monthMap[key] = c;
  }
  const byMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      ...v,
      marginPct: v.revenue > 0 ? (v.margin / v.revenue) * 100 : 0,
    }));

  return NextResponse.json({
    totals: { totalRevenue, totalCost, totalMargin, avgMarginPct, count: billed.length },
    byCustomer,
    byCarrier,
    byMonth,
  });
}
