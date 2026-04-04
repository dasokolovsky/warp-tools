import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const laneIdParam = searchParams.get('laneId');

    if (laneIdParam) {
      // Single lane comparison
      const laneId = parseInt(laneIdParam, 10);
      if (isNaN(laneId)) return NextResponse.json({ error: 'Invalid laneId' }, { status: 400 });

      const [lane] = await db.select().from(lanes).where(eq(lanes.id, laneId)).limit(1);
      if (!lane) return NextResponse.json({ error: 'Lane not found' }, { status: 404 });

      const rates = await db
        .select()
        .from(carrier_rates)
        .where(eq(carrier_rates.lane_id, laneId))
        .orderBy(asc(carrier_rates.rate_amount));

      const tariffs = await db
        .select()
        .from(customer_tariffs)
        .where(eq(customer_tariffs.lane_id, laneId));

      return NextResponse.json({ lane, rates, tariffs });
    }

    // All lanes summary
    const allLanes = await db.select().from(lanes).orderBy(asc(lanes.origin_city));
    return NextResponse.json({ lanes: allLanes });
  } catch (err) {
    console.error('GET /api/compare error:', err);
    return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 });
  }
}
