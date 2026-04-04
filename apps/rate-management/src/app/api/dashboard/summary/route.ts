export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs, rfqs } from '@/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { NextResponse } from 'next/server';

function calculateMargin(tariffRate: number, carrierRate: number): number {
  if (tariffRate <= 0) return 0;
  return ((tariffRate - carrierRate) / tariffRate) * 100;
}

export async function GET() {
  try {
    const today = new Date();
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    const todayStr = today.toISOString().split('T')[0];
    const in30Str = in30.toISOString().split('T')[0];

    // Overview counts
    const [totalLanes] = await db.select({ count: count() }).from(lanes).where(eq(lanes.status, 'active'));
    const [activeRates] = await db.select({ count: count() }).from(carrier_rates);
    const [activeTariffs] = await db.select({ count: count() }).from(customer_tariffs).where(eq(customer_tariffs.status, 'active'));
    const [openRFQs] = await db.select({ count: count() }).from(rfqs).where(sql`status IN ('draft','sent','responses')`);

    // Expiring rates (carrier rates expiring within 30 days)
    const expiringCarrierRates = await db
      .select()
      .from(carrier_rates)
      .where(sql`expiry_date IS NOT NULL AND expiry_date >= ${todayStr} AND expiry_date <= ${in30Str}`);

    // Expiring tariffs
    const expiringTariffs = await db
      .select()
      .from(customer_tariffs)
      .where(sql`expiry_date IS NOT NULL AND expiry_date >= ${todayStr} AND expiry_date <= ${in30Str} AND status = 'active'`);

    // Build expiring items with lane info
    const laneCache: Record<number, { origin_city: string; origin_state: string; dest_city: string; dest_state: string }> = {};
    async function getLane(laneId: number) {
      if (laneCache[laneId]) return laneCache[laneId];
      const [lane] = await db.select({
        origin_city: lanes.origin_city,
        origin_state: lanes.origin_state,
        dest_city: lanes.dest_city,
        dest_state: lanes.dest_state,
      }).from(lanes).where(eq(lanes.id, laneId)).limit(1);
      if (lane) laneCache[laneId] = lane;
      return lane ?? null;
    }

    const expiringItems = [
      ...await Promise.all(expiringCarrierRates.map(async r => ({
        type: 'carrier' as const,
        id: r.id,
        name: r.carrier_name,
        rate: r.rate_amount,
        basis: r.rate_basis,
        expiry_date: r.expiry_date,
        lane: await getLane(r.lane_id),
      }))),
      ...await Promise.all(expiringTariffs.map(async t => ({
        type: 'tariff' as const,
        id: t.id,
        name: t.customer_name,
        rate: t.rate_amount,
        basis: t.rate_basis,
        expiry_date: t.expiry_date,
        lane: t.lane_id ? await getLane(t.lane_id) : null,
      }))),
    ].sort((a, b) => (a.expiry_date ?? '').localeCompare(b.expiry_date ?? ''));

    // Margin alerts - lanes below 15% target
    const allLanes = await db.select().from(lanes).where(eq(lanes.status, 'active'));
    const marginAlerts = [];
    const topLanes = [];

    for (const lane of allLanes) {
      const rates = await db.select().from(carrier_rates).where(eq(carrier_rates.lane_id, lane.id)).orderBy(carrier_rates.rate_amount);
      const tariffs = await db.select().from(customer_tariffs).where(eq(customer_tariffs.lane_id, lane.id));
      const bestRate = rates[0];
      const activeTariff = tariffs.find(t => t.status === 'active') ?? tariffs[0];

      if (bestRate && activeTariff) {
        const margin = calculateMargin(activeTariff.rate_amount, bestRate.rate_amount);
        if (margin < 15) {
          marginAlerts.push({
            lane_id: lane.id,
            origin_city: lane.origin_city,
            origin_state: lane.origin_state,
            dest_city: lane.dest_city,
            dest_state: lane.dest_state,
            equipment_type: lane.equipment_type,
            carrier_rate: bestRate.rate_amount,
            tariff_rate: activeTariff.rate_amount,
            margin,
          });
        }
        topLanes.push({
          lane_id: lane.id,
          origin_city: lane.origin_city,
          origin_state: lane.origin_state,
          dest_city: lane.dest_city,
          dest_state: lane.dest_state,
          equipment_type: lane.equipment_type,
          carrier_rate: bestRate.rate_amount,
          tariff_rate: activeTariff.rate_amount,
          margin,
          rate_count: rates.length,
        });
      }
    }

    // Top 5 by rate count
    topLanes.sort((a, b) => b.rate_count - a.rate_count);
    const top5Lanes = topLanes.slice(0, 5);

    // Recent rate changes (last 10)
    const recentRates = await db
      .select()
      .from(carrier_rates)
      .orderBy(sql`created_at DESC`)
      .limit(10);

    const recentRateChanges = await Promise.all(
      recentRates.map(async r => ({
        ...r,
        lane: await getLane(r.lane_id),
      }))
    );

    // Open RFQs
    const openRFQList = await db
      .select()
      .from(rfqs)
      .where(sql`status IN ('draft','sent','responses')`)
      .orderBy(sql`created_at DESC`);

    return NextResponse.json({
      data: {
        overview: {
          totalLanes: totalLanes.count,
          activeRates: activeRates.count,
          activeTariffs: activeTariffs.count,
          openRFQs: openRFQs.count,
        },
        expiringItems,
        marginAlerts,
        topLanes: top5Lanes,
        recentRateChanges,
        openRFQList,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch dashboard summary' }, { status: 500 });
  }
}
