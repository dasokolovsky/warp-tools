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

  // By status
  const byStatus: Record<string, number> = {};
  for (const s of all) {
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
  }

  // By customer
  const byCustomer: Record<string, number> = {};
  for (const s of all) {
    byCustomer[s.customerName] = (byCustomer[s.customerName] ?? 0) + 1;
  }

  // By week (last 8 weeks)
  const byWeek: Record<string, number> = {};
  for (const s of all) {
    const d = new Date(s.createdAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    byWeek[key] = (byWeek[key] ?? 0) + 1;
  }

  // By month
  const byMonth: Record<string, number> = {};
  for (const s of all) {
    const key = s.createdAt.slice(0, 7);
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }

  // By equipment
  const byEquipment: Record<string, number> = {};
  for (const s of all) {
    byEquipment[s.equipmentType] = (byEquipment[s.equipmentType] ?? 0) + 1;
  }

  const customerTable = Object.entries(byCustomer)
    .map(([customer, count]) => ({ customer, count }))
    .sort((a, b) => b.count - a.count);

  const weekTable = Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));

  const monthTable = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return NextResponse.json({
    total: all.length,
    byStatus,
    byCustomer: customerTable,
    byWeek: weekTable,
    byMonth: monthTable,
    byEquipment,
  });
}
