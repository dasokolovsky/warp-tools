import Link from 'next/link';
import { Plus, Truck } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { formatDate, formatMileage, statusLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface VehicleRow {
  id: string;
  unit_number: string;
  type: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  status: string;
  current_mileage: number;
  open_wo_count: number;
  next_pm_due: string | null;
}

async function getVehicles(): Promise<VehicleRow[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3019';
    const res = await fetch(`${baseUrl}/api/vehicles`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function VehiclesPage() {
  const vehicles = await getVehicles();

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicles</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in fleet</p>
        </div>
        <Link
          href="/vehicles/new"
          className="flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00b347] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-[#111113] py-16 text-center">
          <Truck className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No vehicles yet</p>
          <p className="text-sm text-zinc-600 mt-1">Add your first vehicle to get started</p>
          <Link
            href="/vehicles/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00b347] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Unit #</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Make / Model</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Mileage</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Next PM</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Open WOs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/vehicles/${v.id}`} className="font-semibold text-[#00C650] hover:underline">
                        {v.unit_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">{v.type ? statusLabel(v.type) : '—'}</td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      {v.year} {v.make} {v.model}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={v.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-300 font-mono text-xs">
                      {formatMileage(v.current_mileage)}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                      {v.next_pm_due ? formatDate(v.next_pm_due) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {v.open_wo_count > 0 ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/20 w-6 h-6 text-xs font-semibold text-amber-400">
                          {v.open_wo_count}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
