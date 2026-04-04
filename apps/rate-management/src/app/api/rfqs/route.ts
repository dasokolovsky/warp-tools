export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { rfqs, rfq_responses, lanes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const search = (sp.get('search') ?? '').toLowerCase();
    const status = sp.get('status') ?? 'all';
    const page = Math.max(1, parseInt(sp.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20')));
    const sortBy = sp.get('sortBy') ?? 'created_at';
    const sortOrder = sp.get('sortOrder') ?? 'desc';
    const dateFrom = sp.get('dateFrom') ?? '';
    const dateTo = sp.get('dateTo') ?? '';

    const allRFQs = await db.select().from(rfqs).orderBy(sql`created_at DESC`);

    const rfqData = await Promise.all(
      allRFQs.map(async rfq => {
        const responses = await db
          .select()
          .from(rfq_responses)
          .where(eq(rfq_responses.rfq_id, rfq.id));
        const lane = rfq.lane_id
          ? (await db.select().from(lanes).where(eq(lanes.id, rfq.lane_id)).limit(1))[0] ?? null
          : null;
        return { rfq, responses, lane, responseCount: responses.length };
      })
    );

    // Filter
    let filtered = rfqData;
    if (status !== 'all') {
      filtered = filtered.filter(d => d.rfq.status === status);
    }
    if (search) {
      filtered = filtered.filter(d => {
        const rfqMatch = d.rfq.rfq_number.toLowerCase().includes(search);
        const carrierMatch = d.rfq.awarded_carrier?.toLowerCase().includes(search) ?? false;
        const laneMatch = d.lane
          ? `${d.lane.origin_city} ${d.lane.dest_city}`.toLowerCase().includes(search)
          : false;
        const responseCarrierMatch = d.responses.some(r =>
          r.carrier_name.toLowerCase().includes(search)
        );
        return rfqMatch || carrierMatch || laneMatch || responseCarrierMatch;
      });
    }
    if (dateFrom) {
      filtered = filtered.filter(d => (d.rfq.pickup_date ?? '') >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(d => (d.rfq.pickup_date ?? '') <= dateTo);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (sortBy === 'rfq_number') { aVal = a.rfq.rfq_number; bVal = b.rfq.rfq_number; }
      else if (sortBy === 'status') { aVal = a.rfq.status; bVal = b.rfq.status; }
      else if (sortBy === 'pickup_date') { aVal = a.rfq.pickup_date ?? ''; bVal = b.rfq.pickup_date ?? ''; }
      else if (sortBy === 'responses') { aVal = a.responseCount; bVal = b.responseCount; }
      else { aVal = a.rfq.created_at; bVal = b.rfq.created_at; }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      data: paginated,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch RFQs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lane_id, equipment_type, pickup_date, desired_rate, notes, status: reqStatus, prefix } = body;

    // Auto-generate rfq_number: PREFIX-YEAR-NNN
    const year = new Date().getFullYear();
    const pfx = (prefix ?? 'RFQ').toUpperCase();
    const allNumbers = await db.select({ rfq_number: rfqs.rfq_number }).from(rfqs);
    const yearPrefix = `${pfx}-${year}-`;
    const existingNums = allNumbers
      .map(r => r.rfq_number)
      .filter(n => n.startsWith(yearPrefix))
      .map(n => parseInt(n.replace(yearPrefix, ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const rfq_number = `${yearPrefix}${String(nextNum).padStart(3, '0')}`;

    const status = reqStatus ?? 'draft';

    const [created] = await db
      .insert(rfqs)
      .values({
        rfq_number,
        lane_id: lane_id ?? null,
        equipment_type: equipment_type ?? null,
        pickup_date: pickup_date ?? null,
        desired_rate: desired_rate ?? null,
        notes: notes ?? null,
        status,
        created_by: body.created_by ?? null,
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create RFQ' }, { status: 500 });
  }
}
