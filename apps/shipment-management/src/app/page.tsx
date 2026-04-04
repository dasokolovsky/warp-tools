export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments, shipmentEvents } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { formatCurrency, getShipmentStatusLabel, getEventTypeIcon, getHealthScoreColor } from '@/lib/utils';
import { ShipmentPipeline } from '@/components/ShipmentPipeline';
import { ShipmentStatusBadge } from '@/components/ShipmentStatusBadge';
import Link from 'next/link';
import { Package, TrendingUp, Clock, CheckCircle, AlertTriangle, Truck } from 'lucide-react';

async function getDashboardData() {
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
  const active = allShipments.filter((s) => activeStatuses.includes(s.status));

  const revenueMTD = allShipments
    .filter((s) => {
      if (!['invoiced', 'paid', 'closed'].includes(s.status)) return false;
      const ts = s.invoicedAt ?? s.createdAt;
      return ts >= monthStart;
    })
    .reduce((sum, s) => sum + (s.customerRate ?? 0), 0);

  const allBilled = allShipments.filter(
    (s) => s.customerRate != null && ['invoiced', 'paid', 'closed'].includes(s.status)
  );
  const totalRevenue = allBilled.reduce((sum, s) => sum + (s.customerRate ?? 0), 0);
  const totalMargin = allBilled.reduce((sum, s) => sum + (s.margin ?? 0), 0);
  const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const withDeliveryData = allShipments.filter((s) => s.deliveryOnTime !== null);
  const onTimeDeliveries = withDeliveryData.filter((s) => s.deliveryOnTime === true).length;
  const onTimePct = withDeliveryData.length > 0 ? (onTimeDeliveries / withDeliveryData.length) * 100 : 0;

  const docCompliant = allShipments.filter(
    (s) => s.hasBol && s.hasPod && s.hasRateCon && s.hasInvoice
  ).length;
  const docCompliancePct = allShipments.length > 0 ? (docCompliant / allShipments.length) * 100 : 0;

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
  const overdueInvoices = allShipments.filter(
    (s) => s.status === 'invoiced' && s.invoicedAt && s.invoicedAt <= thirtyDaysAgoStr
  );

  const alertCount = lateDeliveries.length + missingDocs.length + overdueInvoices.length;

  // Today
  const pickupsToday = allShipments.filter((s) => s.pickupDate === today);
  const deliveriesToday = allShipments.filter((s) => s.deliveryDate === today);

  // Enrich events
  const shipmentMap = new Map(allShipments.map((s) => [s.id, s]));
  const enrichedEvents = recentEvents.map((e) => ({
    ...e,
    shipment: shipmentMap.get(e.shipmentId) ?? null,
  }));

  return {
    statusCounts,
    active,
    revenueMTD,
    avgMarginPct,
    onTimePct,
    docCompliancePct,
    alertCount,
    lateDeliveries,
    missingDocs,
    overdueInvoices,
    pickupsToday,
    deliveriesToday,
    enrichedEvents,
    total: allShipments.length,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#8B95A5] text-sm mt-1">
            {data.total} total shipments · {data.active.length} active
          </p>
        </div>
        <Link
          href="/shipments/new"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors"
        >
          + New Shipment
        </Link>
      </div>

      {/* Pipeline */}
      <ShipmentPipeline statusCounts={data.statusCounts} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-[#8B95A5]" />
            <span className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Active</span>
          </div>
          <div className="text-2xl font-bold text-white">{data.active.length}</div>
          <div className="text-xs text-[#8B95A5] mt-1">{data.statusCounts['in_transit'] ?? 0} in transit</div>
        </div>

        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[#8B95A5]" />
            <span className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Revenue MTD</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(data.revenueMTD)}</div>
          <div className="text-xs text-[#8B95A5] mt-1">invoiced this month</div>
        </div>

        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[#8B95A5]" />
            <span className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Avg Margin</span>
          </div>
          <div className={`text-2xl font-bold ${data.avgMarginPct >= 20 ? 'text-green-400' : data.avgMarginPct >= 12 ? 'text-yellow-400' : 'text-red-400'}`}>
            {data.avgMarginPct.toFixed(1)}%
          </div>
          <div className="text-xs text-[#8B95A5] mt-1">billed shipments</div>
        </div>

        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-[#8B95A5]" />
            <span className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">On-Time %</span>
          </div>
          <div className={`text-2xl font-bold ${data.onTimePct >= 90 ? 'text-green-400' : data.onTimePct >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
            {data.onTimePct.toFixed(0)}%
          </div>
          <div className="text-xs text-[#8B95A5] mt-1">delivery on-time</div>
        </div>

        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-[#8B95A5]" />
            <span className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Doc Compliance</span>
          </div>
          <div className={`text-2xl font-bold ${data.docCompliancePct >= 80 ? 'text-green-400' : data.docCompliancePct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {data.docCompliancePct.toFixed(0)}%
          </div>
          <div className="text-xs text-[#8B95A5] mt-1">all 4 docs present</div>
        </div>
      </div>

      {/* Alerts + Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Alerts */}
        <div className={`bg-[#080F1E] border rounded-warp p-4 ${data.alertCount > 0 ? 'border-red-400/20 bg-red-400/5' : 'border-[#1A2235]'}`}>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Alerts
            {data.alertCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-red-400/10 text-red-400 border border-red-400/20">
                {data.alertCount}
              </span>
            )}
          </h2>

          {data.alertCount === 0 ? (
            <div className="text-sm text-[#8B95A5]">All clear — no alerts ✓</div>
          ) : (
            <div className="space-y-2">
              {data.lateDeliveries.map((s) => (
                <Link
                  key={s.id}
                  href={`/shipments/${s.id}`}
                  className="flex items-start justify-between text-xs rounded px-2 py-2 bg-red-400/5 border border-red-400/10 hover:border-red-400/30 transition-colors"
                >
                  <div>
                    <div className="text-white font-medium">{s.shipmentNumber}</div>
                    <div className="text-[#8B95A5]">{s.customerName}</div>
                  </div>
                  <div className="text-red-400 text-right">Late delivery</div>
                </Link>
              ))}
              {data.missingDocs.slice(0, 4).map((s) => {
                const missing = [];
                if (['dispatched', 'in_transit'].includes(s.status) && !s.hasRateCon) missing.push('Rate Con');
                if (['delivered', 'invoiced', 'paid'].includes(s.status) && !s.hasPod) missing.push('POD');
                if (['delivered', 'invoiced', 'paid'].includes(s.status) && !s.hasInvoice) missing.push('Invoice');
                return (
                  <Link
                    key={s.id}
                    href={`/shipments/${s.id}`}
                    className="flex items-start justify-between text-xs rounded px-2 py-2 bg-yellow-400/5 border border-yellow-400/10 hover:border-yellow-400/30 transition-colors"
                  >
                    <div>
                      <div className="text-white font-medium">{s.shipmentNumber}</div>
                      <div className="text-[#8B95A5]">{s.customerName}</div>
                    </div>
                    <div className="text-yellow-400 text-right">Missing: {missing.join(', ')}</div>
                  </Link>
                );
              })}
              {data.overdueInvoices.map((s) => (
                <Link
                  key={s.id}
                  href={`/shipments/${s.id}`}
                  className="flex items-start justify-between text-xs rounded px-2 py-2 bg-orange-400/5 border border-orange-400/10 hover:border-orange-400/30 transition-colors"
                >
                  <div>
                    <div className="text-white font-medium">{s.shipmentNumber}</div>
                    <div className="text-[#8B95A5]">{s.customerName}</div>
                  </div>
                  <div className="text-orange-400 text-right">Overdue invoice</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today's Activity */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Today&apos;s Activity</h2>
          {data.pickupsToday.length === 0 && data.deliveriesToday.length === 0 ? (
            <div className="text-sm text-[#8B95A5]">No pickups or deliveries scheduled today</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[#8B95A5] mb-2 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  Pickups ({data.pickupsToday.length})
                </div>
                <div className="space-y-1.5">
                  {data.pickupsToday.map((s) => (
                    <Link
                      key={s.id}
                      href={`/shipments/${s.id}`}
                      className="flex items-center justify-between text-xs rounded px-2 py-1.5 bg-[#0C1528] hover:bg-[#1A2235] transition-colors"
                    >
                      <span className="text-white font-medium">{s.shipmentNumber}</span>
                      <span className="text-[#8B95A5]">{s.originCity} → {s.destCity}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5] mb-2 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  Deliveries ({data.deliveriesToday.length})
                </div>
                <div className="space-y-1.5">
                  {data.deliveriesToday.map((s) => (
                    <Link
                      key={s.id}
                      href={`/shipments/${s.id}`}
                      className="flex items-center justify-between text-xs rounded px-2 py-1.5 bg-[#0C1528] hover:bg-[#1A2235] transition-colors"
                    >
                      <span className="text-white font-medium">{s.shipmentNumber}</span>
                      <span className="text-[#8B95A5]">{s.originCity} → {s.destCity}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          <Link href="/shipments" className="text-xs text-[#00C650] hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-[#1A2235]/50">
          {data.enrichedEvents.map((e) => (
            <div key={e.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#0C1528] transition-colors">
              <span className="text-base mt-0.5">{getEventTypeIcon(e.eventType)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {e.shipment && (
                    <Link
                      href={`/shipments/${e.shipmentId}`}
                      className="text-xs font-semibold text-[#00C650] hover:underline"
                    >
                      {e.shipment.shipmentNumber}
                    </Link>
                  )}
                  <span className="text-xs text-[#8B95A5]">{e.description}</span>
                </div>
                {e.shipment && (
                  <div className="text-xs text-[#8B95A5] mt-0.5">
                    {e.shipment.customerName} · {e.shipment.originCity} → {e.shipment.destCity}
                  </div>
                )}
              </div>
              <div className="text-xs text-[#8B95A5] whitespace-nowrap shrink-0">
                {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
