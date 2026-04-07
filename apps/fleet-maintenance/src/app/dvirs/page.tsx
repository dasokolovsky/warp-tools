import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { formatDate, statusLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface DvirRow {
  id: string;
  vehicle_id: string;
  driver_name: string;
  inspection_type: string;
  date: string;
  mileage: number | null;
  defects_found: number;
  status: string;
  created_at: string;
  unit_number: string | null;
  make: string | null;
  model: string | null;
}

async function getDvirs(): Promise<DvirRow[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3019';
    const res = await fetch(`${base}/api/dvirs`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getVehicles(): Promise<{ id: string; unit_number: string }[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3019';
    const res = await fetch(`${base}/api/vehicles`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function DvirsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const vehicleFilter = sp.vehicle ?? '';
  const statusFilter = sp.status ?? '';

  const [allDvirs, vehicles] = await Promise.all([getDvirs(), getVehicles()]);

  const filtered = allDvirs.filter((d) => {
    if (vehicleFilter && d.vehicle_id !== vehicleFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">DVIR Reports</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{allDvirs.length} total · {filtered.length} shown</p>
        </div>
        <Link
          href="/dvirs/new"
          className="flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00b347] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log DVIR
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          {(['no_defects', 'defects_noted', 'out_of_service'] as const).map((s) => {
            const isActive = statusFilter === s;
            const params = new URLSearchParams({ ...sp, status: isActive ? '' : s });
            return (
              <Link
                key={s}
                href={`/dvirs?${params}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  isActive
                    ? 'bg-[#00C650]/20 text-[#00C650] border-[#00C650]/30'
                    : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {statusLabel(s)}
              </Link>
            );
          })}
        </div>

        {(statusFilter || vehicleFilter) && (
          <Link href="/dvirs" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
            Clear
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">No DVIR reports found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Driver</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Defects</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dvirs/${d.id}`} className="text-zinc-300 hover:text-[#00C650] transition-colors">
                      {formatDate(d.date)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/vehicles/${d.vehicle_id}`} className="text-zinc-300 hover:text-[#00C650] font-medium transition-colors">
                      {d.unit_number ?? '—'}
                    </Link>
                    {d.make && <div className="text-xs text-zinc-500">{d.make} {d.model}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{d.driver_name}</td>
                  <td className="px-4 py-3"><Badge status={d.inspection_type} /></td>
                  <td className="px-4 py-3"><Badge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${d.defects_found > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {d.defects_found}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


