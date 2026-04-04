export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allLanes = await db.select().from(lanes);

    const result = await Promise.all(
      allLanes.map(async lane => {
        const rates = await db.select().from(carrier_rates).where(eq(carrier_rates.lane_id, lane.id)).orderBy(carrier_rates.rate_amount);
        const tariffs = await db.select().from(customer_tariffs).where(eq(customer_tariffs.lane_id, lane.id));

        const bestRate = rates[0];
        const activeTariff = tariffs.find(t => t.status === 'active') ?? tariffs[0];
        let margin: number | null = null;

        if (bestRate && activeTariff && activeTariff.rate_amount > 0) {
          margin = ((activeTariff.rate_amount - bestRate.rate_amount) / activeTariff.rate_amount) * 100;
        }

        return {
          lane_id: lane.id,
          origin_city: lane.origin_city,
          origin_state: lane.origin_state,
          dest_city: lane.dest_city,
          dest_state: lane.dest_state,
          equipment_type: lane.equipment_type,
          status: lane.status,
          carrier_rate: bestRate?.rate_amount ?? null,
          tariff_rate: activeTariff?.rate_amount ?? null,
          margin,
          rate_count: rates.length,
        };
      })
    );

    result.sort((a, b) => {
      if (a.margin === null && b.margin === null) return 0;
      if (a.margin === null) return 1;
      if (b.margin === null) return -1;
      return a.margin - b.margin;
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch margin summary' }, { status: 500 });
  }
}
