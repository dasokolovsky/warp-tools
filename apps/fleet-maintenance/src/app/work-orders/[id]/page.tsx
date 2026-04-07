import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDate, formatMileage, statusLabel } from '@/lib/utils';
import { WorkOrderActions } from './WorkOrderActions';

export const dynamic = 'force-dynamic';

async function getWorkOrder(id: string) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3019';
    const res = await fetch(`${base}/api/work-orders/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wo = await getWorkOrder(id);
  if (!wo) notFound();

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <Link href="/work-orders" className="mt-1 text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{wo.title}</h1>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-xs text-zinc-500">{wo.work_order_number ?? '—'}</span>
              <Badge status={wo.status} />
              <Badge status={wo.priority} />
              {wo.type && <span className="text-xs text-zinc-500">{statusLabel(wo.type)}</span>}
            </div>
          </div>
        </div>
        <Link
          href={`/work-orders/${id}/edit`}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Link>
      </div>

      {/* Status workflow */}
      <WorkOrderActions workOrder={wo} />

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Details</h2>
          <InfoRow label="Vehicle" value={wo.unit_number} href={`/vehicles/${wo.vehicle_id}`} />
          <InfoRow label="Make / Model" value={wo.make ? `${wo.make} ${wo.model ?? ''}`.trim() : undefined} />
          <InfoRow label="Assigned To" value={wo.assigned_to} />
          <InfoRow label="Vendor" value={wo.vendor} />
          <InfoRow label="Mileage at Service" value={wo.mileage_at_service ? formatMileage(wo.mileage_at_service) : undefined} />
          <InfoRow label="Started" value={formatDate(wo.started_at)} />
          <InfoRow label="Completed" value={formatDate(wo.completed_at)} />
          <InfoRow label="Created" value={formatDate(wo.created_at)} />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Costs</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-sm text-zinc-500">Parts</span>
              <span className="text-sm text-zinc-200">{formatCurrency(wo.parts_cost ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-sm text-zinc-500">Labor</span>
              <span className="text-sm text-zinc-200">{formatCurrency(wo.labor_cost ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-semibold text-zinc-300">Total</span>
              <span className="text-lg font-bold text-[#00C650]">{formatCurrency(wo.total_cost ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {wo.description && (
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-5 mt-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-2">Description</h2>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{wo.description}</p>
        </div>
      )}

      {wo.notes && (
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-5 mt-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-2">Notes</h2>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{wo.notes}</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-zinc-500">{label}</span>
      {href && value ? (
        <Link href={href} className="text-sm text-[#00C650] hover:text-[#00b347] transition-colors">{value}</Link>
      ) : (
        <span className="text-sm text-zinc-300">{value ?? '—'}</span>
      )}
    </div>
  );
}
