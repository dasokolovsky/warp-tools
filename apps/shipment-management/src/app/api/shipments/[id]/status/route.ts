import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, shipmentEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { calculateHealthScore, calculateDocScore } from '@/lib/utils';
import type { ShipmentStatus } from '@/db/schema';

const VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  quote: ['booked', 'cancelled'],
  booked: ['dispatched', 'cancelled'],
  dispatched: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['invoiced', 'cancelled'],
  invoiced: ['paid', 'cancelled'],
  paid: ['closed'],
  closed: [],
  cancelled: [],
  claim: [],
};

// Timestamp field to set per status
const STATUS_TIMESTAMPS: Partial<Record<ShipmentStatus, string>> = {
  booked: 'bookedAt',
  dispatched: 'dispatchedAt',
  in_transit: 'pickedUpAt',
  delivered: 'deliveredAt',
  invoiced: 'invoicedAt',
  paid: 'paidAt',
  closed: 'closedAt',
  cancelled: 'cancelledAt',
};

// Human-readable label for events
const STATUS_LABELS: Record<ShipmentStatus, string> = {
  quote: 'Quote',
  booked: 'Booked',
  dispatched: 'Dispatched',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  paid: 'Paid',
  closed: 'Closed',
  cancelled: 'Cancelled',
  claim: 'Claim',
};

const StatusSchema = z.object({
  status: z.enum(['quote', 'booked', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid', 'closed', 'cancelled', 'claim']),
  cancellationReason: z.string().optional(),
  createdBy: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
  if (!shipment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = StatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { status: newStatus, cancellationReason, createdBy } = parsed.data;
  const oldStatus = shipment.status as ShipmentStatus;

  // Validate transition
  const allowed = VALID_TRANSITIONS[oldStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${oldStatus} to ${newStatus}` },
      { status: 422 }
    );
  }

  // Cancel requires reason
  if (newStatus === 'cancelled' && !cancellationReason) {
    return NextResponse.json({ error: 'Cancellation reason required' }, { status: 422 });
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now,
  };

  // Set timestamp
  const tsField = STATUS_TIMESTAMPS[newStatus];
  if (tsField) {
    updateData[tsField] = now;
  }

  if (newStatus === 'cancelled' && cancellationReason) {
    updateData.cancellationReason = cancellationReason;
  }

  // Recalculate health score
  const health = calculateHealthScore({
    status: newStatus,
    hasRateCon: shipment.hasRateCon ?? false,
    hasBol: shipment.hasBol ?? false,
    hasPod: shipment.hasPod ?? false,
    hasInvoice: shipment.hasInvoice ?? false,
    pickupOnTime: shipment.pickupOnTime ?? null,
    deliveryOnTime: shipment.deliveryOnTime ?? null,
    marginPct: shipment.marginPct ?? null,
  });
  updateData.healthScore = health;

  await db.update(shipments).set(updateData).where(eq(shipments.id, id));

  // Auto-log event
  const eventDesc = newStatus === 'cancelled'
    ? `Shipment cancelled: ${cancellationReason}`
    : `Status changed to ${STATUS_LABELS[newStatus]}`;

  await db.insert(shipmentEvents).values({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shipmentId: id,
    eventType: 'status_change',
    description: eventDesc,
    oldValue: oldStatus,
    newValue: newStatus,
    createdBy: createdBy ?? 'system',
    createdAt: now,
  });

  const [updated] = await db.select().from(shipments).where(eq(shipments.id, id));
  return NextResponse.json({ shipment: updated });
}

// Suppress unused import warning
void calculateDocScore;
