export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { loads, checkCalls } from '@/db/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
      <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-[#8B95A5] mt-1">{sub}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];

  // Total loads by status
  const allLoads = await db.select().from(loads).orderBy(desc(loads.created_at));

  const statusCounts = allLoads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  const activeLoads = allLoads.filter((l) =>
    ['dispatched', 'picked_up', 'in_transit'].includes(l.status)
  );

  // Revenue this month
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const deliveredThisMonth = allLoads.filter(
    (l) => l.status === 'delivered' && l.delivered_at && l.delivered_at >= monthStartStr
  );
  const revenueThisMonth = deliveredThisMonth.reduce((sum, l) => sum + (l.customer_rate ?? 0), 0);
  const marginThisMonth = deliveredThisMonth.reduce((sum, l) => sum + (l.margin ?? 0), 0);

  // Pickups today
  const pickupsToday = allLoads.filter((l) => l.pickup_date === today);
  const deliveriesToday = allLoads.filter((l) => l.delivery_date === today);

  // Overdue check calls: in-transit loads with no check call in 4+ hours
  const fourHoursAgo = new Date(new Date().getTime() - 4 * 60 * 60 * 1000).toISOString();
  const inTransitLoads = allLoads.filter((l) =>
    ['dispatched', 'picked_up', 'in_transit'].includes(l.status)
  );

  const recentCheckCalls = await db
    .select()
    .from(checkCalls)
    .where(gte(checkCalls.created_at, fourHoursAgo));

  const recentLoadIds = new Set(recentCheckCalls.map((c) => c.load_id));
  const overdueLoads = inTransitLoads.filter((l) => !recentLoadIds.has(l.id));

  // Recent loads
  const recentLoads = allLoads.slice(0, 8);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-[#8B95A5] mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alert: Overdue Check Calls */}
      {overdueLoads.length > 0 && (
        <div className="rounded-xl border border-[#FFAA00]/30 bg-[#FFAA00]/5 p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-[#FFAA00]/20 flex items-center justify-center">
            <span className="text-[#FFAA00] text-xs font-bold">!</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-[#FFAA00]">
              {overdueLoads.length} load{overdueLoads.length !== 1 ? 's' : ''} need a check call
            </div>
            <div className="text-xs text-[#8B95A5] mt-0.5">
              No contact in 4+ hours:{' '}
              {overdueLoads.map((l) => l.load_number).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Loads" value={activeLoads.length} sub="dispatched + in transit" />
        <StatCard label="Pickups Today" value={pickupsToday.length} sub={today} />
        <StatCard label="Deliveries Today" value={deliveriesToday.length} sub={today} />
        <StatCard
          label="Revenue This Month"
          value={formatCurrency(revenueThisMonth)}
          sub={`${formatCurrency(marginThisMonth)} margin`}
        />
      </div>

      {/* Status breakdown */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Load Status Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['new', 'posted', 'covered', 'dispatched', 'in_transit'] as const).map((status) => (
            <div key={status} className="text-center">
              <div className="text-xl font-bold text-white">{statusCounts[status] ?? 0}</div>
              <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block border ${getStatusColor(status)}`}>
                {getStatusLabel(status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent loads */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Recent Loads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Load #</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Customer</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Lane</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Pickup</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Rate</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLoads.map((load) => (
                <tr key={load.id} className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] transition-colors">
                  <td className="px-5 py-3 font-mono text-[#00C650] text-xs">{load.load_number}</td>
                  <td className="px-5 py-3 text-slate-300">{load.customer_name}</td>
                  <td className="px-5 py-3 text-[#8B95A5]">
                    {load.origin_city}, {load.origin_state} → {load.dest_city}, {load.dest_state}
                  </td>
                  <td className="px-5 py-3 text-[#8B95A5]">{formatDate(load.pickup_date)}</td>
                  <td className="px-5 py-3 text-slate-300">{formatCurrency(load.customer_rate)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(load.status)}`}>
                      {getStatusLabel(load.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
