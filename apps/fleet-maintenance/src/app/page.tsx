import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, DollarSign, Plus, Truck, Wrench, FileCheck, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDate, daysUntil, statusLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface DashboardData {
  vehicleStats: { total: number; active: number; in_shop: number; out_of_service: number };
  upcomingMaintenance: Array<{ id: string; service_type: string; next_due_at: string | null; priority: string; unit_number: string | null; make: string | null; model: string | null }>;
  overdueMaintenance: Array<{ id: string; service_type: string; next_due_at: string | null; priority: string; unit_number: string | null; make: string | null; model: string | null }>;
  openWorkOrders: Array<{ id: string; work_order_number: string | null; title: string; status: string; priority: string; unit_number: string | null; created_at: string }>;
  woStatusBreakdown: { open: number; in_progress: number; waiting_parts: number };
  recentDvirs: Array<{ id: string; date: string; driver_name: string; status: string; defects_found: number; unit_number: string | null }>;
  monthlySummary: { parts: number; labor: number; total: number };
}

async function getDashboard(): Promise<DashboardData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3019';
    const res = await fetch(`${baseUrl}/api/dashboard`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#111113] p-5">
      <div className={`text-3xl font-bold ${color ?? 'text-white'}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-zinc-300">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboard();

  if (!data) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-800/50 bg-red-950/20 p-6 text-red-400">
          Failed to load dashboard. Make sure the database is seeded: <code className="ml-2 rounded bg-red-950/40 px-2 py-0.5 text-xs">npm run db:seed</code>
        </div>
      </div>
    );
  }

  const { vehicleStats, upcomingMaintenance, overdueMaintenance, openWorkOrders, woStatusBreakdown, recentDvirs, monthlySummary } = data;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fleet Command Center</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Overview of your fleet health and maintenance status</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/work-orders/new"
            className="flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00b347] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Work Order
          </Link>
          <Link
            href="/dvirs/new"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <FileCheck className="h-4 w-4" />
            Log DVIR
          </Link>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueMaintenance.length > 0 && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <h2 className="font-semibold text-red-400">Overdue Maintenance ({overdueMaintenance.length})</h2>
          </div>
          <div className="space-y-2">
            {overdueMaintenance.slice(0, 5).map((item) => {
              const days = daysUntil(item.next_due_at);
              return (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-red-950/30 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-red-400/70" />
                    <div>
                      <span className="text-sm font-medium text-zinc-200">{item.unit_number}</span>
                      <span className="mx-2 text-zinc-600">·</span>
                      <span className="text-sm text-zinc-400">{statusLabel(item.service_type)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={item.priority} />
                    <span className="text-xs text-red-400 font-medium">
                      {days !== null ? `${Math.abs(days)}d overdue` : 'Overdue'}
                    </span>
                  </div>
                </div>
              );
            })}
            {overdueMaintenance.length > 5 && (
              <p className="text-xs text-red-400/70 pl-3">+{overdueMaintenance.length - 5} more overdue items</p>
            )}
          </div>
        </div>
      )}

      {/* Fleet Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Vehicles" value={vehicleStats.total} sub="in fleet" />
        <StatCard label="Active" value={vehicleStats.active} color="text-emerald-400" sub="on the road" />
        <StatCard label="In Shop" value={vehicleStats.in_shop} color="text-amber-400" sub="being serviced" />
        <StatCard label="Out of Service" value={vehicleStats.out_of_service} color="text-red-400" sub="unavailable" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Maintenance */}
        <div className="rounded-xl border border-zinc-800 bg-[#111113]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#00C650]" />
              <h2 className="font-semibold text-white">Upcoming (7 Days)</h2>
            </div>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{upcomingMaintenance.length}</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {upcomingMaintenance.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/40 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No maintenance due in the next 7 days</p>
              </div>
            ) : (
              upcomingMaintenance.map((item) => {
                const days = daysUntil(item.next_due_at);
                return (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-zinc-200">
                        {item.unit_number} — {statusLabel(item.service_type)}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {item.make} {item.model} · Due {formatDate(item.next_due_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge status={item.priority} />
                      <span className={`text-xs font-medium ${days !== null && days <= 2 ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Open Work Orders */}
        <div className="rounded-xl border border-zinc-800 bg-[#111113]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[#00C650]" />
              <h2 className="font-semibold text-white">Open Work Orders</h2>
            </div>
            <div className="flex gap-2">
              {woStatusBreakdown.open > 0 && (
                <span className="rounded-full bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                  {woStatusBreakdown.open} open
                </span>
              )}
              {woStatusBreakdown.in_progress > 0 && (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                  {woStatusBreakdown.in_progress} in progress
                </span>
              )}
              {woStatusBreakdown.waiting_parts > 0 && (
                <span className="rounded-full bg-orange-500/15 border border-orange-500/20 px-2 py-0.5 text-xs text-orange-400">
                  {woStatusBreakdown.waiting_parts} waiting parts
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {openWorkOrders.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/40 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No open work orders</p>
              </div>
            ) : (
              openWorkOrders.map((wo) => (
                <Link
                  key={wo.id}
                  href={`/work-orders/${wo.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors block"
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{wo.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {wo.work_order_number} · {wo.unit_number}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge status={wo.priority} />
                    <Badge status={wo.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
          {openWorkOrders.length > 0 && (
            <div className="px-5 py-3 border-t border-zinc-800">
              <Link href="/work-orders" className="text-xs text-[#00C650] hover:underline">
                View all work orders →
              </Link>
            </div>
          )}
        </div>

        {/* Recent DVIRs with defects */}
        <div className="rounded-xl border border-zinc-800 bg-[#111113]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#00C650]" />
              <h2 className="font-semibold text-white">Recent DVIRs w/ Defects</h2>
            </div>
            <Link href="/dvirs" className="text-xs text-zinc-500 hover:text-[#00C650]">View all</Link>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentDvirs.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/40 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No defect reports recently</p>
              </div>
            ) : (
              recentDvirs.map((dvir) => (
                <Link
                  key={dvir.id}
                  href={`/dvirs/${dvir.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors block"
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-200">
                      {dvir.unit_number} — {dvir.driver_name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {formatDate(dvir.date)} · {dvir.defects_found} defect{dvir.defects_found !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Badge status={dvir.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Monthly Cost Summary */}
        <div className="rounded-xl border border-zinc-800 bg-[#111113]">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
            <DollarSign className="h-4 w-4 text-[#00C650]" />
            <h2 className="font-semibold text-white">Monthly Cost Summary</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Parts Cost</span>
              <span className="text-sm font-semibold text-zinc-200">{formatCurrency(monthlySummary.parts)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Labor Cost</span>
              <span className="text-sm font-semibold text-zinc-200">{formatCurrency(monthlySummary.labor)}</span>
            </div>
            <div className="h-px bg-zinc-800" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-300">Total This Month</span>
              <span className="text-lg font-bold text-[#00C650]">{formatCurrency(monthlySummary.total)}</span>
            </div>
            <div className="pt-2">
              <Link href="/work-orders" className="text-xs text-[#00C650] hover:underline">
                View all work orders →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
