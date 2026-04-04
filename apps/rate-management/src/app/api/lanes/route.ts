import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs } from '@/db/schema';
import type { EquipmentType, LaneStatus } from '@/db/schema';
import { eq, like, or, sql, asc, desc, and } from 'drizzle-orm';
import { z } from 'zod';

const CreateLaneSchema = z.object({
  origin_city: z.string().min(1, 'Origin city is required'),
  origin_state: z.string().min(1).max(2, 'Use 2-letter state code'),
  origin_zip: z.string().optional(),
  dest_city: z.string().min(1, 'Destination city is required'),
  dest_state: z.string().min(1).max(2, 'Use 2-letter state code'),
  dest_zip: z.string().optional(),
  equipment_type: z.enum(['dry_van', 'reefer', 'flatbed', 'step_deck', 'lowboy', 'sprinter_van', 'cargo_van', 'power_only']),
  estimated_miles: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') ?? '';
    const equipment = searchParams.get('equipment');
    const status = searchParams.get('status');
    const hasTariff = searchParams.get('hasTariff');
    const hasRates = searchParams.get('hasRates');
    const sort = searchParams.get('sort') ?? 'created_at';
    const order = searchParams.get('order') ?? 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (search) {
      conditions.push(
        or(
          like(lanes.origin_city, `%${search}%`),
          like(lanes.origin_state, `%${search}%`),
          like(lanes.dest_city, `%${search}%`),
          like(lanes.dest_state, `%${search}%`),
        ) as ReturnType<typeof eq>
      );
    }

    if (equipment) {
      conditions.push(eq(lanes.equipment_type, equipment as EquipmentType) as ReturnType<typeof eq>);
    }

    if (status) {
      conditions.push(eq(lanes.status, status as LaneStatus) as ReturnType<typeof eq>);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get all lanes matching filter
    let allLanes = await db.select().from(lanes).where(whereClause);

    // Enrich with stats
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
        const bestRate = bestRateRows[0] ?? null;
        const activeTariff = activeTariffRows[0] ?? null;

        let margin: number | null = null;
        if (bestRate && activeTariff && activeTariff.amount > 0) {
          margin = ((activeTariff.amount - bestRate.amount) / activeTariff.amount) * 100;
        }

        return { ...lane, rateCount, tariffCount, bestRate, activeTariff, margin };
      })
    );

    // Post-filter for hasRates / hasTariff
    let filtered = enriched;
    if (hasRates === 'true') filtered = filtered.filter(l => l.rateCount > 0);
    if (hasRates === 'false') filtered = filtered.filter(l => l.rateCount === 0);
    if (hasTariff === 'true') filtered = filtered.filter(l => l.tariffCount > 0);
    if (hasTariff === 'false') filtered = filtered.filter(l => l.tariffCount === 0);

    // Sort
    const sortFns: Record<string, (a: typeof filtered[0], b: typeof filtered[0]) => number> = {
      created_at: (a, b) => order === 'asc'
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at),
      origin_city: (a, b) => order === 'asc'
        ? a.origin_city.localeCompare(b.origin_city)
        : b.origin_city.localeCompare(a.origin_city),
      dest_city: (a, b) => order === 'asc'
        ? a.dest_city.localeCompare(b.dest_city)
        : b.dest_city.localeCompare(a.dest_city),
      estimated_miles: (a, b) => {
        const am = a.estimated_miles ?? 0;
        const bm = b.estimated_miles ?? 0;
        return order === 'asc' ? am - bm : bm - am;
      },
      margin: (a, b) => {
        const am = a.margin ?? -Infinity;
        const bm = b.margin ?? -Infinity;
        return order === 'asc' ? am - bm : bm - am;
      },
    };

    if (sortFns[sort]) filtered.sort(sortFns[sort]);

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /api/lanes error:', err);
    return NextResponse.json({ error: 'Failed to fetch lanes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateLaneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { tags, ...rest } = parsed.data;
    const [lane] = await db.insert(lanes).values({
      ...rest,
      tags: tags ? JSON.stringify(tags) : null,
      status: 'active',
    }).returning();

    return NextResponse.json(lane, { status: 201 });
  } catch (err) {
    console.error('POST /api/lanes error:', err);
    return NextResponse.json({ error: 'Failed to create lane' }, { status: 500 });
  }
}
