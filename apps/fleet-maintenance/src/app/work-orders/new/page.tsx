'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function NewWorkOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicle = searchParams.get('vehicle_id') ?? '';
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then(setVehicles)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const body = Object.fromEntries(formData.entries());
    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      toast('Work order created');
      router.push(`/work-orders/${data.id}`);
    } catch {
      toast('Failed to create work order', 'error');
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/work-orders" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Work Order</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Create a new work order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Work Order Details</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Vehicle *</label>
            <select name="vehicle_id" required defaultValue={preselectedVehicle} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.unit_number}{v.make ? ` — ${v.make} ${v.model ?? ''}` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title *</label>
            <input name="title" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="e.g. Oil Change & Filter Replacement" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Type</label>
              <select name="type" defaultValue="repair" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
                {WORK_ORDER_TYPES.map((t) => <option key={t} value={t}>{statusLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <select name="priority" defaultValue="medium" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
                {PRIORITIES.map((p) => <option key={p} value={p}>{statusLabel(p)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select name="status" defaultValue="open" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
                {WORK_ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea name="description" rows={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none resize-none" placeholder="Describe the work to be done..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Assigned To</label>
              <input name="assigned_to" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="Mechanic or shop name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Vendor</label>
              <input name="vendor" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="Vendor or dealership" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Parts Cost ($)</label>
              <input name="parts_cost" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Labor Cost ($)</label>
              <input name="labor_cost" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Mileage at Service</label>
              <input name="mileage_at_service" type="number" min="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="450000" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea name="notes" rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none resize-none" placeholder="Any additional notes..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00C650] px-6 py-2.5 text-sm font-medium text-black hover:bg-[#00b347] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create Work Order'}
          </button>
          <Link href="/work-orders" className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500 text-sm">Loading...</div>}>
      <NewWorkOrderForm />
    </Suspense>
  );
}
