import { NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, shipmentEvents } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [allShipments, recentEvents] = await Promise.all([
    db.select().from(shipments),
    db
      .select()
      .from(shipmentEvents)
      .orderBy(desc(shipmentEvents.createdAt))
      .limit(10),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  // Pipeline counts
  const statusCounts: Record<string, number> = {};
  for (const s of allShipments) {
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
  }

  // KPIs
  const activeStatuses = ['booked', 'dispatched', 'in_transit'];
  const activeCount = allShipments.filter((s) => activeStatuses.includes(s.status)).length;

  const revenueMTD = allShipments
    .filter((s) => {
      if (!['invoiced', 'paid', 'closed'].includes(s.status)) return false;
      const invoicedAt = s.invoicedAt ?? s.createdAt;
      return invoicedAt >= monthStart;
    })
    .reduce((sum, s) => sum + (s.customerRate ?? 0), 0);

  const allWithRevenue = allShipments.filter(
    (s) => s.customerRate != null && s.carrierRate != null && ['invoiced', 'paid', 'closed'].includes(s.status)
  );
  const totalRevenue = allWithRevenue.reduce((sum, s) => sum + (s.customerRate ?? 0), 0);
  const totalMargin = allWithRevenue.reduce((sum, s) => sum + (s.margin ?? 0), 0);
  const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const completedDeliveries = allShipments.filter((s) =>
    ['delivered', 'invoiced', 'paid', 'closed'].includes(s.status) &&
    (s.deliveryOnTime !== null)
  );
  const onTimeCount = completedDeliveries.filter((s) => s.deliveryOnTime === true).length;
  const onTimePct = completedDeliveries.length > 0 ? (onTimeCount / completedDeliveries.length) * 100 : 0;

  const docCompliantCount = allShipments.filter((s) =>
    s.hasBol && s.hasPod && s.hasRateCon && s.hasInvoice
  ).length;
  const docCompliancePct = allShipments.length > 0
    ? (docCompliantCount / allShipments.length) * 100
    : 0;

  // Alerts
  const lateDeliveries = allShipments.filter((s) => {
    if (!['in_transit', 'dispatched'].includes(s.status)) return false;
    if (!s.deliveryDate) return false;
    return s.deliveryDate < today;
  });

  const missingDocs = allShipments.filter((s) => {
    if (['quote', 'cancelled', 'closed', 'claim'].includes(s.status)) return false;
    if (['delivered', 'invoiced', 'paid'].includes(s.status) && (!s.hasPod || !s.hasInvoice)) return true;
    if (['dispatched', 'in_transit'].includes(s.status) && !s.hasRateCon) return true;
    return false;
  });

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().replace('T', ' ').slice(0, 19);

  const overdueInvoices = allShipments.filter((s) => {
    if (s.status !== 'invoiced') return false;
    if (!s.invoicedAt) return false;
    return s.invoicedAt <= thirtyDaysAgoStr;
  });

  // Today's activity
  const pickupsToday = allShipments.filter((s) => s.pickupDate === today);
  const deliveriesToday = allShipments.filter((s) => s.deliveryDate === today);

  // Enrich recent events with shipment data
  const shipmentMap = new Map(allShipments.map((s) => [s.id, s]));
  const enrichedEvents = recentEvents.map((e) => ({
    ...e,
    shipment: shipmentMap.get(e.shipmentId) ?? null,
  }));

  return NextResponse.json({
    statusCounts,
    kpis: {
      activeCount,
      revenueMTD,
      avgMarginPct,
      onTimePct,
      docCompliancePct,
    },
    alerts: {
      lateDeliveries: lateDeliveries.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        customerName: s.customerName,
        originCity: s.originCity,
        originState: s.originState,
        destCity: s.destCity,
        destState: s.destState,
        deliveryDate: s.deliveryDate,
        status: s.status,
      })),
      missingDocs: missingDocs.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        customerName: s.customerName,
        status: s.status,
        hasBol: s.hasBol,
        hasPod: s.hasPod,
        hasRateCon: s.hasRateCon,
        hasInvoice: s.hasInvoice,
      })),
      overdueInvoices: overdueInvoices.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        customerName: s.customerName,
        invoicedAt: s.invoicedAt,
        customerRate: s.customerRate,
      })),
    },
    today: {
      pickups: pickupsToday.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        customerName: s.customerName,
        originCity: s.originCity,
        originState: s.originState,
        destCity: s.destCity,
        destState: s.destState,
        status: s.status,
      })),
      deliveries: deliveriesToday.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        customerName: s.customerName,
        originCity: s.originCity,
        originState: s.originState,
        destCity: s.destCity,
        destState: s.destState,
        status: s.status,
      })),
    },
    recentEvents: enrichedEvents,
  });
}
