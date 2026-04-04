export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { carrier_rates, customer_tariffs, lanes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const laneIdStr = sp.get('laneId');
    if (!laneIdStr) return NextResponse.json({ error: 'laneId is required' }, { status: 400 });

    const laneId = parseInt(laneIdStr);
    if (isNaN(laneId)) return NextResponse.json({ error: 'Invalid laneId' }, { status: 400 });

    const [lane] = await db.select().from(lanes).where(eq(lanes.id, laneId)).limit(1);
    if (!lane) return NextResponse.json({ error: 'Lane not found' }, { status: 404 });

    const cRates = await db.select().from(carrier_rates).where(eq(carrier_rates.lane_id, laneId)).orderBy(carrier_rates.created_at);
    const tariffs = await db.select().from(customer_tariffs).where(eq(customer_tariffs.lane_id, laneId)).orderBy(customer_tariffs.created_at);

    // Build unified rate history
    const history = [
      ...cRates.map(r => ({
        id: r.id,
        type: 'carrier' as const,
        name: r.carrier_name,
        rate: r.rate_amount,
        basis: r.rate_basis,
        rate_type: r.rate_type,
        effective_date: r.effective_date,
        expiry_date: r.expiry_date,
        created_at: r.created_at,
      })),
      ...tariffs.map(t => ({
        id: t.id,
        type: 'tariff' as const,
        name: t.customer_name,
        rate: t.rate_amount,
        basis: t.rate_basis,
        rate_type: null,
        effective_date: t.effective_date,
        expiry_date: t.expiry_date,
        created_at: t.created_at,
      })),
    ].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));

    // Stats
    const carrierAmounts = cRates.map(r => r.rate_amount);
    const tariffAmounts = tariffs.filter(t => t.status === 'active').map(t => t.rate_amount);
    const avgCarrier = carrierAmounts.length > 0 ? carrierAmounts.reduce((a, b) => a + b, 0) / carrierAmounts.length : null;
    const avgTariff = tariffAmounts.length > 0 ? tariffAmounts.reduce((a, b) => a + b, 0) / tariffAmounts.length : null;
    const avgMargin = avgCarrier && avgTariff && avgTariff > 0
      ? ((avgTariff - avgCarrier) / avgTariff) * 100
      : null;

    return NextResponse.json({
      data: { lane, history, stats: { avgCarrier, avgTariff, avgMargin } },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch lane trends' }, { status: 500 });
  }
}
