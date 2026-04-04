export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs } from '@/db/schema';
import { eq, sql, asc, and } from 'drizzle-orm';
import { LanesClient } from './LanesClient';
import type { RateBasis } from '@/db/schema';

export default async function LanesPage() {
  const allLanes = await db.select().from(lanes).orderBy(sql`status ASC, created_at DESC`);

  const enriched = await Promise.all(
    allLanes.map(async lane => {
      const [rateCountRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(carrier_rates)
        .where(eq(carrier_rates.lane_id, lane.id));

      const [tariffCountRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(customer_tariffs)
        .where(eq(customer_tariffs.lane_id, lane.id));

      const bestRateRows = await db
        .select({ amount: carrier_rates.rate_amount, basis: carrier_rates.rate_basis })
        .from(carrier_rates)
        .where(eq(carrier_rates.lane_id, lane.id))
        .orderBy(asc(carrier_rates.rate_amount))
        .limit(1);

      const activeTariffRows = await db
        .select({ amount: customer_tariffs.rate_amount, basis: customer_tariffs.rate_basis })
        .from(customer_tariffs)
        .where(and(eq(customer_tariffs.lane_id, lane.id), eq(customer_tariffs.status, 'active')))
        .limit(1);

      const rateCount = Number(rateCountRow?.count ?? 0);
      const tariffCount = Number(tariffCountRow?.count ?? 0);
      const bestRate = bestRateRows[0] ? { amount: bestRateRows[0].amount, basis: bestRateRows[0].basis as RateBasis } : null;
      const activeTariff = activeTariffRows[0] ? { amount: activeTariffRows[0].amount, basis: activeTariffRows[0].basis as RateBasis } : null;

      let margin: number | null = null;
      if (bestRate && activeTariff && activeTariff.amount > 0) {
        margin = ((activeTariff.amount - bestRate.amount) / activeTariff.amount) * 100;
      }

      return { ...lane, rateCount, tariffCount, bestRate, activeTariff, margin };
    })
  );

  return <LanesClient initialLanes={enriched} totalCount={enriched.length} />;
}
