'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { INSPECTION_TYPES } from '@/db/constants';
import { statusLabel } from '@/lib/utils';

interface VehicleOption {
  id: string;
  unit_number: string;
  make: string | null;
  model: string | null;
}

interface Defect {
  area: string;
  description: string;
  severity: 'minor' | 'major' | 'out_of_service';
  corrected: boolean;
}

const DEFECT_AREAS = ['tires', 'brakes', 'lights', 'engine', 'body', 'coupling', 'other'];
const DEFECT_SEVERITIES = [
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
  { value: 'out_of_service', label: 'Out of Service' },
] as const;

function computeStatus(defects: Defect[]): string {
  if (defects.length === 0) return 'no_defects';
  const hasOOS = defects.some((d) => d.severity === 'out_of_service' && !d.corrected);
  if (hasOOS) return 'out_of_service';
  return 'defects_noted';
}

function NewDvirForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicle = searchParams.get('vehicle_id') ?? '';
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then(setVehicles)
      .catch(() => {});
  }, []);

  function addDefect() {
    setDefects((prev) => [
      ...prev,
      { area: 'tires', description: '', severity: 'minor', corrected: false },
    ]);
  }

  function removeDefect(idx: number) {
    setDefects((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateDefect(idx: number, field: keyof Defect, value: string | boolean) {
    setDefects((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const body = {
      vehicle_id: formData.get('vehicle_id'),
      driver_name: formData.get('driver_name'),
      inspection_type: formData.get('inspection_type'),
      date: formData.get('date'),
      mileage: formData.get('mileage'),
      corrective_action: formData.get('corrective_action'),
      defects,
    };
    try {
      const res = await fetch('/api/dvirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      toast('DVIR submitted');
      router.push(`/dvirs/${data.id}`);
    } catch {
      toast('Failed to submit DVIR', 'error');
      setSaving(false);
    }
  }

  const computedStatus = computeStatus(defects);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dvirs" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Log DVIR</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Driver Vehicle Inspection Report</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 space-y-4">
          <h2 className="font-semibold text-zinc-200">Inspection Details</h2>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Vehicle *</label>
            <select name="vehicle_id" required defaultValue={preselectedVehicle} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.unit_number}{v.make ? ` — ${v.make} ${v.model ?? ''}` : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Driver Name *</label>
              <input name="driver_name" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Inspection Type</label>
              <select name="inspection_type" defaultValue="pre_trip" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
                {INSPECTION_TYPES.map((t) => <option key={t} value={t}>{statusLabel(t)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Date *</label>
              <input name="date" type="date" required defaultValue={today} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Mileage</label>
              <input name="mileage" type="number" min="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="Current odometer" />
            </div>
          </div>
        </div>

        {/* Defects */}
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-200">Defects</h2>
            <div className="flex items-center gap-3">
              {defects.length > 0 && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  computedStatus === 'no_defects' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                  computedStatus === 'defects_noted' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                  'bg-red-500/15 text-red-400 border-red-500/20'
                }`}>
                  {statusLabel(computedStatus)}
                </span>
              )}
              <button
                type="button"
                onClick={addDefect}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 hover:border-[#00C650] hover:text-[#00C650] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Defect
              </button>
            </div>
          </div>

          {defects.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-4">No defects logged — vehicle is in satisfactory condition.</p>
          ) : (
            <div className="space-y-3">
              {defects.map((defect, idx) => (
                <DefectRow
                  key={idx}
                  defect={defect}
                  index={idx}
                  onChange={updateDefect}
                  onRemove={removeDefect}
                />
              ))}
            </div>
          )}
        </div>

        {defects.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Corrective Action Taken</label>
            <textarea name="corrective_action" rows={2} className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none resize-none" placeholder="Describe any corrective actions taken..." />
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00C650] px-6 py-2.5 text-sm font-medium text-black hover:bg-[#00b347] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Submitting...' : 'Submit DVIR'}
          </button>
          <Link href="/dvirs" className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

interface DefectRowProps {
  defect: Defect;
  index: number;
  onChange: (idx: number, field: keyof Defect, value: string | boolean) => void;
  onRemove: (idx: number) => void;
}

export default function NewDvirPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500 text-sm">Loading...</div>}>
      <NewDvirForm />
    </Suspense>
  );
}

function DefectRow({ defect, index, onChange, onRemove }: DefectRowProps) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 space-y-2">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Area</label>
          <select
            value={defect.area}
            onChange={(e) => onChange(index, 'area', e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-[#00C650] focus:outline-none"
          >
            {DEFECT_AREAS.map((a) => <option key={a} value={a}>{statusLabel(a)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Severity</label>
          <select
            value={defect.severity}
            onChange={(e) => onChange(index, 'severity', e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 focus:border-[#00C650] focus:outline-none"
          >
            {DEFECT_SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex items-end justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={defect.corrected}
              onChange={(e) => onChange(index, 'corrected', e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-[#00C650]"
            />
            <span className="text-xs text-zinc-400">Corrected</span>
          </label>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div>
        <input
          type="text"
          value={defect.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          placeholder="Describe the defect..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none"
        />
      </div>
    </div>
  );
}
