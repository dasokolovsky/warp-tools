import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments } from '@/db/schema';
import { or, like, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const rows = await db
    .select({
      id: shipments.id,
      shipmentNumber: shipments.shipmentNumber,
      status: shipments.status,
      customerName: shipments.customerName,
      originCity: shipments.originCity,
      originState: shipments.originState,
      destCity: shipments.destCity,
      destState: shipments.destState,
      carrierName: shipments.carrierName,
    })
    .from(shipments)
    .where(
      or(
        like(shipments.shipmentNumber, `%${q}%`),
        like(shipments.customerName, `%${q}%`),
        like(shipments.carrierName, `%${q}%`),
        like(shipments.originCity, `%${q}%`),
        like(shipments.destCity, `%${q}%`)
      )
    )
    .orderBy(desc(shipments.createdAt))
    .limit(10);

  return NextResponse.json({ data: rows });
}
