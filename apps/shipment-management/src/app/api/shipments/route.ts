import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, shipmentEvents } from '@/db/schema';
import { eq, like, or, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import type { AnyColumn } from 'drizzle-orm';
import type { ShipmentStatus, EquipmentType } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const q = searchParams.get('q') ?? '';
  const statusParam = searchParams.getAll('status');
  const customer = searchParams.get('customer') ?? '';
  const carrier = searchParams.get('carrier') ?? '';
  const equipment = searchParams.get('equipment') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const marginFilter = searchParams.get('marginFilter') ?? '';
  const docStatus = searchParams.get('docStatus') ?? '';
  const sortBy = searchParams.get('sort') ?? 'createdAt';
  const sortDir = searchParams.get('sortDir') ?? 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '25', 10));

  const conditions = [];

  if (q) {
    conditions.push(
      or(
        like(shipments.shipmentNumber, `%${q}%`),
        like(shipments.customerName, `%${q}%`),
        like(shipments.carrierName, `%${q}%`),
        like(shipments.originCity, `%${q}%`),
        like(shipments.destCity, `%${q}%`)
      )
    );
  }

  if (statusParam.length > 0) {
    conditions.push(inArray(shipments.status, statusParam as ShipmentStatus[]));
  }

  if (customer) {
    conditions.push(like(shipments.customerName, `%${customer}%`));
  }

  if (carrier) {
    conditions.push(like(shipments.carrierName, `%${carrier}%`));
  }

  if (equipment) {
    conditions.push(eq(shipments.equipmentType, equipment as EquipmentType));
  }

  if (dateFrom) {
    conditions.push(gte(shipments.pickupDate, dateFrom));
  }

  if (dateTo) {
    conditions.push(lte(shipments.pickupDate, dateTo));
  }

  if (marginFilter === 'above') {
    conditions.push(gte(shipments.marginPct, 20));
  } else if (marginFilter === 'below') {
    conditions.push(lte(shipments.marginPct, 19.99));
  }

  if (docStatus === 'complete') {
    conditions.push(
      and(
        eq(shipments.hasBol, true),
        eq(shipments.hasPod, true),
        eq(shipments.hasRateCon, true),
        eq(shipments.hasInvoice, true)
      )
    );
  } else if (docStatus === 'incomplete') {
    conditions.push(
      or(
        eq(shipments.hasBol, false),
        eq(shipments.hasPod, false),
        eq(shipments.hasRateCon, false),
        eq(shipments.hasInvoice, false)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort column
  const sortableColumns: Record<string, AnyColumn> = {
    createdAt: shipments.createdAt,
    shipmentNumber: shipments.shipmentNumber,
    customerName: shipments.customerName,
    carrierName: shipments.carrierName,
    pickupDate: shipments.pickupDate,
    deliveryDate: shipments.deliveryDate,
    customerRate: shipments.customerRate,
    marginPct: shipments.marginPct,
    healthScore: shipments.healthScore,
  };

  const sortCol = sortableColumns[sortBy] ?? shipments.createdAt;
  const orderFn = sortDir === 'asc' ? asc : desc;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(shipments)
      .where(whereClause)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)` })
      .from(shipments)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;

  return NextResponse.json({
    data: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Auto-generate shipment number
  const yearStr = new Date().getFullYear().toString();
  const prefix = (body.prefix as string) ?? 'SHP';
  const lastShipment = await db
    .select({ shipmentNumber: shipments.shipmentNumber })
    .from(shipments)
    .orderBy(desc(shipments.createdAt))
    .limit(100);

  let nextNum = 1;
  const pattern = new RegExp(`^${prefix}-\\d{4}-(\\d+)$`);
  for (const s of lastShipment) {
    const match = s.shipmentNumber.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= nextNum) nextNum = n + 1;
    }
  }

  const shipmentNumber = `${prefix}-${yearStr}-${String(nextNum).padStart(4, '0')}`;
  const id = `shp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Calculate margin
  const customerRate = body.customerRate ? parseFloat(body.customerRate) : null;
  const carrierRate = body.carrierRate ? parseFloat(body.carrierRate) : null;
  const margin = customerRate != null && carrierRate != null ? customerRate - carrierRate : null;
  const marginPct = margin != null && customerRate != null && customerRate > 0
    ? (margin / customerRate) * 100
    : null;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  await db.insert(shipments).values({
    id,
    shipmentNumber,
    status: (body.status as ShipmentStatus) ?? 'quote',
    customerName: body.customerName,
    originCity: body.originCity,
    originState: body.originState,
    originZip: body.originZip ?? null,
    destCity: body.destCity,
    destState: body.destState,
    destZip: body.destZip ?? null,
    equipmentType: body.equipmentType ?? 'dry_van',
    pickupDate: body.pickupDate ?? null,
    deliveryDate: body.deliveryDate ?? null,
    carrierName: body.carrierName ?? null,
    carrierContact: body.carrierContact ?? null,
    carrierPhone: body.carrierPhone ?? null,
    customerRate,
    carrierRate,
    margin,
    marginPct,
    rateType: body.rateType ?? 'flat',
    miles: body.miles ? parseInt(body.miles) : null,
    commodity: body.commodity ?? null,
    weight: body.weight ? parseInt(body.weight) : null,
    specialInstructions: body.specialInstructions ?? null,
    notes: body.notes ?? null,
    hasBol: false,
    hasPod: false,
    hasRateCon: body.status === 'booked' && body.carrierRate ? true : false,
    hasInvoice: false,
    docScore: 0,
    healthScore: 50,
    quotedAt: now,
    bookedAt: body.status === 'booked' ? now : null,
    createdBy: body.createdBy ?? 'user',
  });

  // Create initial event
  const evtId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const statusLabel = body.status === 'booked' ? 'Booked' : 'Quote';
  await db.insert(shipmentEvents).values({
    id: evtId,
    shipmentId: id,
    eventType: 'status_change',
    description: `Shipment created as ${statusLabel}`,
    newValue: body.status ?? 'quote',
    createdBy: body.createdBy ?? 'user',
    createdAt: now,
  });

  return NextResponse.json({ id, shipmentNumber }, { status: 201 });
}
