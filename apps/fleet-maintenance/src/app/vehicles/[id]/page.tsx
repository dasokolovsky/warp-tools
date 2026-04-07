import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Edit, Truck } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { formatDate, formatMileage, statusLabel } from '@/lib/utils';
import { VehicleTabs } from './VehicleTabs';

export const dynamic = 'force-dynamic';

async function getData(id: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3019';
  const [vRes, schedRes, woRes, dvirRes] = await Promise.all([
    fetch(`${base}/api/vehicles/${id}`, { cache: 'no-store' }),
    fetch(`${base}/api/vehicles/${id}/schedules`, { cache: 'no-store' }),
    fetch(`${base}/api/vehicles/${id}/work-orders`, { cache: 'no-store' }),
    fetch(`${base}/api/vehicles/${id}/dvirs`, { cache: 'no-store' }),
  ]);
  if (!vRes.ok) return null;
  const [vehicle, schedules, workOrders, dvirs] = await Promise.all([
    vRes.json(),
    schedRes.ok ? schedRes.json() : [],
    woRes.ok ? woRes.json() : [],
    dvirRes.ok ? dvirRes.json() : [],
  ]);
  return { vehicle, schedules, workOrders, dvirs };
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { vehicle, schedules, workOrders, dvirs } = data;

  const totalCost = workOrders
    .filter((wo: { status: string }) => wo.status === 'completed')
    .reduce((sum: number, wo: { total_cost: number }) => sum + (wo.total_cost ?? 0), 0);

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <Link href="/vehicles" className="mt-1 text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
                <Truck className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{vehicle.unit_number}</h1>
                <p className="text-sm text-zinc-500">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 ml-13">
              <Badge status={vehicle.status} />
              {vehicle.type && <span className="text-xs text-zinc-500">{statusLabel(vehicle.type)}</span>}
              <span className="text-xs text-zinc-500">{formatMileage(vehicle.current_mileage)}</span>
              {vehicle.license_plate && (
                <span className="text-xs font-mono text-zinc-500">{vehicle.license_plate} {vehicle.state}</span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/vehicles/${id}/edit`}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
          <div className="text-xs text-zinc-500 mb-1">Open Work Orders</div>
          <div className="text-2xl font-bold text-white">
            {workOrders.filter((wo: { status: string }) => ['open', 'in_progress', 'waiting_parts'].includes(wo.status)).length}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
          <div className="text-xs text-zinc-500 mb-1">PM Schedules</div>
          <div className="text-2xl font-bold text-white">{schedules.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
          <div className="text-xs text-zinc-500 mb-1">Total Lifetime Cost</div>
          <div className="text-2xl font-bold text-[#00C650]">
            ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <VehicleTabs vehicle={vehicle} schedules={schedules} workOrders={workOrders} dvirs={dvirs} />
    </div>
  );
}
