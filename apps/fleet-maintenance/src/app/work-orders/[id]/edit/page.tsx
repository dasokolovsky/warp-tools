'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { WORK_ORDER_TYPES, WORK_ORDER_STATUSES, PRIORITIES } from '@/db/constants';
import { statusLabel } from '@/lib/utils';

interface VehicleOption {
  id: string;
  unit_number: string;
  make: string | null;
  model: string | null;
}

interface WorkOrderData {
  id: string;
  vehicle_id: string;
  type: string | null;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  vendor: string | null;
  parts_cost: number;
  labor_cost: number;
  mileage_at_service: number | null;
  notes: string | null;
}

export default function EditWorkOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [wo, setWo] = useState<WorkOrderData | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/work-orders/${id}`).then((r) => r.json()),
      fetch('/api/vehicles').then((r) => r.json()),
    ])
      .then(([woData, vehicleData]) => {
        setWo(woData);
        setVehicles(vehicleData);
        setLoading(false);
      })
      .catch(() => {
        toast('Failed to load data', 'error');
        setLoading(false);
      });
  }, [id, toast]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const body = Object.fromEntries(formData.entries());
    try {
      const res = await fetch(`/api/work-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Work order updated');
      router.push(`/work-orders/${id}`);
    } catch {
      toast('Failed to update work order', 'error');
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-zinc-500 text-sm">Loading...</div>;
  if (!wo) return <div className="p-6 text-red-400 text-sm">Work order not found.</div>;

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/work-orders/${id}`} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Work Order</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{wo.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Work Order Details</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Vehicle *</label>
            <select name="vehicle_id" required defaultValue={wo.vehicle_id} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.unit_number}{v.make ? ` — ${v.make} ${v.model ?? ''}` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title *</label>
            <input name="title" required defaultValue={wo.title} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Type</label>
              <select name="type" defaultValue={wo.type ?? 'repair'} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
                {WORK_ORDER_TYPES.map((t) => <option key={t} value={t}>{statusLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <select name="priority" defaultValue={wo.priority} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
                {PRIORITIES.map((p) => <option key={p} value={p}>{statusLabel(p)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select name="status" defaultValue={wo.status} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
                {WORK_ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea name="description" rows={3} defaultValue={wo.description ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Assigned To</label>
              <input name="assigned_to" defaultValue={wo.assigned_to ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Vendor</label>
              <input name="vendor" defaultValue={wo.vendor ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Parts Cost ($)</label>
              <input name="parts_cost" type="number" step="0.01" min="0" defaultValue={wo.parts_cost} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Labor Cost ($)</label>
              <input name="labor_cost" type="number" step="0.01" min="0" defaultValue={wo.labor_cost} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Mileage at Service</label>
              <input name="mileage_at_service" type="number" min="0" defaultValue={wo.mileage_at_service ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea name="notes" rows={2} defaultValue={wo.notes ?? ''} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00C650] px-6 py-2.5 text-sm font-medium text-black hover:bg-[#00b347] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/work-orders/${id}`} className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
