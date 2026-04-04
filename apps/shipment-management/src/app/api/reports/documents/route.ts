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

  const relevant = all.filter((s) => !['quote', 'cancelled'].includes(s.status));

  const bolCount = relevant.filter((s) => s.hasBol).length;
  const podCount = relevant.filter((s) => s.hasPod).length;
  const rateConCount = relevant.filter((s) => s.hasRateCon).length;
  const invoiceCount = relevant.filter((s) => s.hasInvoice).length;
  const total = relevant.length;

  // By status
  const statusMap: Record<string, { total: number; bolPct: number; podPct: number; rateConPct: number; invoicePct: number }> = {};
  const statuses = ['booked', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid', 'closed', 'claim'];
  for (const status of statuses) {
    const group = all.filter((s) => s.status === status);
    if (group.length === 0) continue;
    statusMap[status] = {
      total: group.length,
      bolPct: (group.filter((s) => s.hasBol).length / group.length) * 100,
      podPct: (group.filter((s) => s.hasPod).length / group.length) * 100,
      rateConPct: (group.filter((s) => s.hasRateCon).length / group.length) * 100,
      invoicePct: (group.filter((s) => s.hasInvoice).length / group.length) * 100,
    };
  }

  const fullCompliant = relevant.filter(
    (s) => s.hasBol && s.hasPod && s.hasRateCon && s.hasInvoice
  ).length;
  const overallCompliancePct = total > 0 ? (fullCompliant / total) * 100 : 0;

  return NextResponse.json({
    total: relevant.length,
    overallCompliancePct,
    docCounts: {
      bol: { count: bolCount, pct: total > 0 ? (bolCount / total) * 100 : 0 },
      pod: { count: podCount, pct: total > 0 ? (podCount / total) * 100 : 0 },
      rateCon: { count: rateConCount, pct: total > 0 ? (rateConCount / total) * 100 : 0 },
      invoice: { count: invoiceCount, pct: total > 0 ? (invoiceCount / total) * 100 : 0 },
    },
    byStatus: statusMap,
  });
}
