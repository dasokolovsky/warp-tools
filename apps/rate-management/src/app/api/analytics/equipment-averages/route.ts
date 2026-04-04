export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { carrier_rates, lanes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allRates = await db.select({
      id: carrier_rates.id,
      lane_id: carrier_rates.lane_id,
      rate_amount: carrier_rates.rate_amount,
      rate_basis: carrier_rates.rate_basis,
    }).from(carrier_rates);

    const laneCache: Record<number, string> = {};
    for (const rate of allRates) {
      if (!laneCache[rate.lane_id]) {
        const [lane] = await db.select({ equipment_type: lanes.equipment_type }).from(lanes).where(eq(lanes.id, rate.lane_id)).limit(1);
        if (lane) laneCache[rate.lane_id] = lane.equipment_type;
      }
    }

    const grouped: Record<string, number[]> = {};
    for (const rate of allRates) {
      const eq_type = laneCache[rate.lane_id];
      if (!eq_type) continue;
      if (!grouped[eq_type]) grouped[eq_type] = [];
      grouped[eq_type].push(rate.rate_amount);
    }

    const result = Object.entries(grouped).map(([equipment_type, rates]) => ({
      equipment_type,
      avg_rate: rates.reduce((a, b) => a + b, 0) / rates.length,
      count: rates.length,
      min_rate: Math.min(...rates),
      max_rate: Math.max(...rates),
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch equipment averages' }, { status: 500 });
  }
}
