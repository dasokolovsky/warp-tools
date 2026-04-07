import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDate, statusLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface WorkOrderRow {
  id: string;
  work_order_number: string | null;
  vehicle_id: string;
  type: string | null;
  status: string;
  priority: string;
  title: string;
  assigned_to: string | null;
  parts_cost: number;
  labor_cost: number;
  total_cost: number;
  created_at: string;
  completed_at: string | null;
  unit_number: string | null;
  make: string | null;
  model: string | null;
}

async function getWorkOrders(): Promise<WorkOrderRow[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3019';
    const res = await fetch(`${base}/api/work-orders`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').toLowerCase();
  const statusFilter = sp.status ?? '';
  const priorityFilter = sp.priority ?? '';
  const typeFilter = sp.type ?? '';

  const allWOs = await getWorkOrders();

  const filtered = allWOs.filter((wo) => {
    if (statusFilter && wo.status !== statusFilter) return false;
    if (priorityFilter && wo.priority !== priorityFilter) return false;
    if (typeFilter && wo.type !== typeFilter) return false;
    if (q) {
      const haystack = [wo.title, wo.work_order_number, wo.unit_number, wo.assigned_to].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Orders</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{allWOs.length} total · {filtered.length} shown</p>
        </div>
        <Link
          href="/work-orders/new"
          className="flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00b347] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Work Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Search work orders..."
            className="bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none w-48"
          />
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="priority" value={priorityFilter} />
          <input type="hidden" name="type" value={typeFilter} />
        </form>
        <FilterSelect label="Status" name="status" value={statusFilter} options={['open', 'in_progress', 'waiting_parts', 'completed', 'cancelled']} sp={sp} />
        <FilterSelect label="Priority" name="priority" value={priorityFilter} options={['low', 'medium', 'high', 'critical']} sp={sp} />
        <FilterSelect label="Type" name="type" value={typeFilter} options={['preventive', 'repair', 'inspection', 'emergency', 'recall']} sp={sp} />
        {(statusFilter || priorityFilter || typeFilter || q) && (
          <Link href="/work-orders" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            Clear
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">No work orders match the filters.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">WO#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Assigned To</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Cost</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((wo) => (
                <tr key={wo.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/work-orders/${wo.id}`} className="font-mono text-xs text-zinc-500 hover:text-[#00C650] transition-colors">
                      {wo.work_order_number ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/vehicles/${wo.vehicle_id}`} className="text-zinc-300 hover:text-[#00C650] transition-colors font-medium">
                      {wo.unit_number ?? '—'}
                    </Link>
                    {wo.make && <div className="text-xs text-zinc-500">{wo.make} {wo.model}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/work-orders/${wo.id}`} className="text-zinc-200 hover:text-white transition-colors">
                      {wo.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{wo.type ? statusLabel(wo.type) : '—'}</td>
                  <td className="px-4 py-3"><Badge status={wo.priority} /></td>
                  <td className="px-4 py-3"><Badge status={wo.status} /></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{wo.assigned_to ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-300 text-right">{formatCurrency(wo.total_cost)}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{formatDate(wo.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
  sp,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  sp: Record<string, string>;
}) {
  const base = '/work-orders';
  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => {
        const isActive = value === opt;
        const params = new URLSearchParams({ ...sp, [name]: isActive ? '' : opt });
        return (
          <Link
            key={opt}
            href={`${base}?${params}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
              isActive
                ? 'bg-[#00C650]/20 text-[#00C650] border-[#00C650]/30'
                : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
            }`}
          >
            {statusLabel(opt)}
          </Link>
        );
      })}
    </div>
  );
}
