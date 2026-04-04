export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Package, TrendingUp, AlertTriangle, Truck } from 'lucide-react';

async function getDashboardData() {
  const allShipments = await db.select().from(shipments);

  const statusCounts = allShipments.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const activeStatuses = ['booked', 'dispatched', 'in_transit'];
  const active = allShipments.filter((s) => activeStatuses.includes(s.status));

  const revenueShipments = allShipments.filter(
    (s) => s.customerRate != null && ['invoiced', 'paid', 'closed'].includes(s.status)
  );
  const totalRevenue = revenueShipments.reduce((sum, s) => sum + (s.customerRate ?? 0), 0);
  const totalMargin = revenueShipments.reduce((sum, s) => sum + (s.margin ?? 0), 0);

  // Alerts: missing docs, at-risk
  const missingDocAlerts = allShipments.filter((s) => {
    if (['quote', 'cancelled', 'closed'].includes(s.status)) return false;
    if (['dispatched', 'in_transit'].includes(s.status) && !s.hasRateCon) return true;
    if (['delivered', 'invoiced', 'paid'].includes(s.status) && !s.hasPod) return true;
    if (['delivered', 'invoiced', 'paid'].includes(s.status) && !s.hasInvoice) return true;
    return false;
  });

  // Today's activity
  const today = new Date().toISOString().slice(0, 10);
  const pickupsToday = allShipments.filter((s) => s.pickupDate === today);
  const deliveriesToday = allShipments.filter((s) => s.deliveryDate === today);

  const recent = allShipments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return {
    statusCounts,
    active,
    totalRevenue,
    totalMargin,
    missingDocAlerts,
    pickupsToday,
    deliveriesToday,
    recent,
    total: allShipments.length,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const avgMarginPct =
    data.totalRevenue > 0 ? (data.totalMargin / data.totalRevenue) * 100 : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#8B95A5] text-sm mt-1">
          {data.total} total shipments · {data.active.length} active
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-[#8B95A5]" />
            <span className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Active Loads</span>
          </div>
          <div className="text-2xl font-bold text-white">{data.active.length}</div>
          <div className="text-xs text-[#8B95A5] mt-1">
            {data.statusCounts['in_transit'] ?? 0} in transit
          </div>
        </div>

        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[#8B95A5]" />
            <span className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Revenue</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(data.totalRevenue)}</div>
          <div className="text-xs text-[#8B95A5] mt-1">invoiced + paid + closed</div>
        </div>

        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[#8B95A5]" />
            <span className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Avg Margin</span>
          </div>
          <div className="text-2xl font-bold text-white">{avgMarginPct.toFixed(1)}%</div>
          <div className="text-xs text-[#8B95A5] mt-1">{formatCurrency(data.totalMargin)} total</div>
        </div>

        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-[#8B95A5]" />
            <span className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Alerts</span>
          </div>
          <div className="text-2xl font-bold text-white">{data.missingDocAlerts.length}</div>
          <div className="text-xs text-[#8B95A5] mt-1">missing docs</div>
        </div>
      </div>

      {/* Today&apos;s Activity */}
      {(data.pickupsToday.length > 0 || data.deliveriesToday.length > 0) && (
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Today&apos;s Activity</h2>
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
        </div>
      )}

      {/* Status breakdown + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Pipeline */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Pipeline</h2>
          <div className="space-y-2">
            {(
              [
                ['quote', 'Quote', 'text-slate-400'],
                ['booked', 'Booked', 'text-blue-400'],
                ['dispatched', 'Dispatched', 'text-yellow-400'],
                ['in_transit', 'In Transit', 'text-cyan-400'],
                ['delivered', 'Delivered', 'text-emerald-400'],
                ['invoiced', 'Invoiced', 'text-purple-400'],
                ['paid', 'Paid', 'text-green-400'],
              ] as [string, string, string][]
            ).map(([status, label, color]) => {
              const count = data.statusCounts[status] ?? 0;
              const max = Math.max(...Object.values(data.statusCounts));
              const pct = max > 0 ? (count / max) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`text-xs font-medium w-20 shrink-0 ${color}`}>{label}</div>
                  <div className="flex-1 h-1.5 bg-[#1A2235] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color.replace('text-', 'bg-').replace('-400', '-400/60')}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-[#8B95A5] w-6 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <h2 className="text-sm font-semibold text-white mb-3">
            Alerts{' '}
            {data.missingDocAlerts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-red-400/10 text-red-400 border border-red-400/20">
                {data.missingDocAlerts.length}
              </span>
            )}
          </h2>
          {data.missingDocAlerts.length === 0 ? (
            <div className="text-sm text-[#8B95A5]">No alerts — all docs in order ✓</div>
          ) : (
            <div className="space-y-2">
              {data.missingDocAlerts.slice(0, 6).map((s) => {
                const missing = [];
                if (['dispatched', 'in_transit'].includes(s.status) && !s.hasRateCon) missing.push('Rate Con');
                if (['delivered', 'invoiced', 'paid'].includes(s.status) && !s.hasPod) missing.push('POD');
                if (['delivered', 'invoiced', 'paid'].includes(s.status) && !s.hasInvoice) missing.push('Invoice');
                return (
                  <Link
                    key={s.id}
                    href={`/shipments/${s.id}`}
                    className="flex items-start justify-between text-xs rounded px-2 py-2 bg-red-400/5 border border-red-400/10 hover:border-red-400/30 transition-colors"
                  >
                    <div>
                      <div className="text-white font-medium">{s.shipmentNumber}</div>
                      <div className="text-[#8B95A5] mt-0.5">{s.customerName}</div>
                    </div>
                    <div className="text-red-400 text-right">
                      Missing: {missing.join(', ')}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Shipments */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Recent Shipments</h2>
          <Link href="/shipments" className="text-xs text-[#00C650] hover:underline">
            View all
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#8B95A5]">Shipment</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#8B95A5]">Customer</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#8B95A5]">Route</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#8B95A5]">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[#8B95A5]">Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((s) => (
              <tr key={s.id} className="border-b border-[#1A2235]/50 hover:bg-[#0C1528] transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/shipments/${s.id}`} className="text-[#00C650] hover:underline font-medium">
                    {s.shipmentNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#8B95A5]">{s.customerName}</td>
                <td className="px-4 py-3 text-[#8B95A5]">
                  {s.originCity}, {s.originState} → {s.destCity}, {s.destState}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs capitalize">{s.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 text-right text-white">
                  {formatCurrency(s.customerRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
