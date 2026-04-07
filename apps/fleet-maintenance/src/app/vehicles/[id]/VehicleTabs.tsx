'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { useToast } from '@/components/Toast';
import { formatDate, formatMileage, formatCurrency, statusLabel } from '@/lib/utils';
import { SERVICE_TYPES, PRIORITIES } from '@/db/constants';
interface Vehicle {
  id: string;
  unit_number: string;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  type: string | null;
  license_plate: string | null;
  state: string | null;
  status: string;
  current_mileage: number;
  last_inspection_date: string | null;
  next_inspection_due: string | null;
  acquisition_date: string | null;
  notes: string | null;
}

interface MaintenanceSchedule {
  id: string;
  vehicle_id: string;
  service_type: string;
  interval_miles: number | null;
  interval_days: number | null;
  last_completed_at: string | null;
  last_completed_miles: number | null;
  next_due_at: string | null;
  next_due_miles: number | null;
  priority: string;
  is_active: number;
  notes: string | null;
}

interface WorkOrder {
  id: string;
  vehicle_id: string;
  work_order_number: string | null;
  type: string | null;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  vendor: string | null;
  parts_cost: number;
  labor_cost: number;
  total_cost: number;
  started_at: string | null;
  completed_at: string | null;
  mileage_at_service: number | null;
  notes: string | null;
}

interface DvirReport {
  id: string;
  vehicle_id: string;
  driver_name: string;
  inspection_type: string;
  date: string;
  mileage: number | null;
  defects_found: number;
  status: string;
  defects_json: string | null;
  corrective_action: string | null;
}

interface VehicleTabsProps {
  vehicle: Vehicle;
  schedules: MaintenanceSchedule[];
  workOrders: (WorkOrder & { unit_number?: string; make?: string; model?: string })[];
  dvirs: (DvirReport & { unit_number?: string })[];
}

const TABS = ['Overview', 'Maintenance', 'Work Orders', 'DVIR History', 'Costs'] as const;
type Tab = (typeof TABS)[number];

interface AddScheduleFormProps {
  vehicleId: string;
  onAdded: () => void;
}

function AddScheduleForm({ vehicleId, onAdded }: AddScheduleFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Schedule added');
      setShow(false);
      onAdded();
    } catch {
      toast('Failed to add schedule', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-500 hover:border-[#00C650] hover:text-[#00C650] transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Schedule
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4 space-y-3">
      <h3 className="text-sm font-medium text-zinc-300">Add Maintenance Schedule</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Service Type *</label>
          <select name="service_type" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
            {SERVICE_TYPES.map((t) => <option key={t} value={t}>{statusLabel(t)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Priority</label>
          <select name="priority" defaultValue="medium" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none">
            {PRIORITIES.map((p) => <option key={p} value={p}>{statusLabel(p)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Interval (miles)</label>
          <input name="interval_miles" type="number" min="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="15000" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Interval (days)</label>
          <input name="interval_days" type="number" min="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="90" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Next Due Date</label>
          <input name="next_due_at" type="date" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:border-[#00C650] focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Next Due Miles</label>
          <input name="next_due_miles" type="number" min="0" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="250000" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Notes</label>
        <input name="notes" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-[#00C650] focus:outline-none" placeholder="Optional notes..." />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-[#00C650] px-4 py-1.5 text-sm font-medium text-black hover:bg-[#00b347] disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Add'}
        </button>
        <button type="button" onClick={() => setShow(false)} className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function VehicleTabs({ vehicle, schedules: initialSchedules, workOrders, dvirs }: VehicleTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [schedules, setSchedules] = useState(initialSchedules);
  const { toast } = useToast();

  async function markComplete(schedId: string) {
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/schedules/${schedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_at: new Date().toISOString().slice(0, 10) }),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Marked as complete');
      // Refresh schedules
      const r2 = await fetch(`/api/vehicles/${vehicle.id}/schedules`);
      if (r2.ok) setSchedules(await r2.json());
    } catch {
      toast('Failed to mark complete', 'error');
    }
  }

  function handleScheduleAdded() {
    fetch(`/api/vehicles/${vehicle.id}/schedules`)
      .then((r) => r.json())
      .then(setSchedules)
      .catch(() => {});
  }

  const completedWOs = workOrders.filter((wo) => wo.status === 'completed');
  const totalParts = completedWOs.reduce((s, wo) => s + (wo.parts_cost ?? 0), 0);
  const totalLabor = completedWOs.reduce((s, wo) => s + (wo.labor_cost ?? 0), 0);
  const totalCost = totalParts + totalLabor;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-800 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[#00C650] text-[#00C650]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6">
          <h2 className="font-semibold text-zinc-200 mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoRow label="Unit Number" value={vehicle.unit_number} />
            <InfoRow label="VIN" value={vehicle.vin} mono />
            <InfoRow label="Type" value={vehicle.type ? statusLabel(vehicle.type) : undefined} />
            <InfoRow label="Year / Make / Model" value={[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || undefined} />
            <InfoRow label="License Plate" value={vehicle.license_plate ? `${vehicle.license_plate} ${vehicle.state ?? ''}`.trim() : undefined} />
            <InfoRow label="Current Mileage" value={formatMileage(vehicle.current_mileage)} />
            <InfoRow label="Acquisition Date" value={formatDate(vehicle.acquisition_date)} />
            <InfoRow label="Last Inspection" value={formatDate(vehicle.last_inspection_date)} />
            <InfoRow label="Next Inspection Due" value={formatDate(vehicle.next_inspection_due)} />
          </div>
          {vehicle.notes && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1">Notes</div>
              <p className="text-sm text-zinc-300">{vehicle.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Maintenance */}
      {activeTab === 'Maintenance' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden">
            {schedules.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No maintenance schedules yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Service</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Interval</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Last Done</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Next Due</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 text-zinc-200 font-medium">{statusLabel(s.service_type)}</td>
                      <td className="px-4 py-3"><Badge status={s.priority} /></td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {s.interval_miles ? `${s.interval_miles.toLocaleString()} mi` : ''}
                        {s.interval_miles && s.interval_days ? ' / ' : ''}
                        {s.interval_days ? `${s.interval_days}d` : ''}
                        {!s.interval_miles && !s.interval_days ? '—' : ''}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{formatDate(s.last_completed_at)}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {s.next_due_at ? formatDate(s.next_due_at) : ''}
                        {s.next_due_miles ? ` / ${s.next_due_miles.toLocaleString()} mi` : ''}
                        {!s.next_due_at && !s.next_due_miles ? '—' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => markComplete(s.id)}
                          className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-[#00C650] hover:text-[#00C650] transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <AddScheduleForm vehicleId={vehicle.id} onAdded={handleScheduleAdded} />
        </div>
      )}

      {/* Work Orders */}
      {activeTab === 'Work Orders' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link
              href={`/work-orders/new?vehicle_id=${vehicle.id}`}
              className="flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00b347] transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Work Order
            </Link>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden">
            {workOrders.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No work orders for this vehicle.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">WO#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Cost</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((wo) => (
                    <tr key={wo.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{wo.work_order_number ?? '—'}</td>
                      <td className="px-4 py-3 text-zinc-200">{wo.title}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{wo.type ? statusLabel(wo.type) : '—'}</td>
                      <td className="px-4 py-3"><Badge status={wo.priority} /></td>
                      <td className="px-4 py-3"><Badge status={wo.status} /></td>
                      <td className="px-4 py-3 text-zinc-400">{formatCurrency(wo.total_cost ?? 0)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/work-orders/${wo.id}`} className="text-zinc-500 hover:text-[#00C650] transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* DVIR History */}
      {activeTab === 'DVIR History' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link
              href={`/dvirs/new?vehicle_id=${vehicle.id}`}
              className="flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00b347] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Log DVIR
            </Link>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden">
            {dvirs.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No DVIR reports for this vehicle.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Driver</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Defects</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {dvirs.map((d) => (
                    <tr key={d.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 text-zinc-300">{formatDate(d.date)}</td>
                      <td className="px-4 py-3 text-zinc-400">{d.driver_name}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{statusLabel(d.inspection_type)}</td>
                      <td className="px-4 py-3"><Badge status={d.status} /></td>
                      <td className="px-4 py-3 text-zinc-400">{d.defects_found}</td>
                      <td className="px-4 py-3">
                        <Link href={`/dvirs/${d.id}`} className="text-zinc-500 hover:text-[#00C650] transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Costs */}
      {activeTab === 'Costs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
              <div className="text-xs text-zinc-500 mb-1">Total Parts</div>
              <div className="text-xl font-bold text-white">{formatCurrency(totalParts)}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
              <div className="text-xs text-zinc-500 mb-1">Total Labor</div>
              <div className="text-xl font-bold text-white">{formatCurrency(totalLabor)}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#111113] p-4">
              <div className="text-xs text-zinc-500 mb-1">Overall Total</div>
              <div className="text-xl font-bold text-[#00C650]">{formatCurrency(totalCost)}</div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#111113] overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300">Completed Work Orders</h3>
            </div>
            {completedWOs.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No completed work orders yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">WO#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Completed</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Parts</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Labor</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedWOs.map((wo) => (
                    <tr key={wo.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{wo.work_order_number ?? '—'}</td>
                      <td className="px-4 py-3 text-zinc-200">{wo.title}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{formatDate(wo.completed_at)}</td>
                      <td className="px-4 py-3 text-zinc-400 text-right">{formatCurrency(wo.parts_cost ?? 0)}</td>
                      <td className="px-4 py-3 text-zinc-400 text-right">{formatCurrency(wo.labor_cost ?? 0)}</td>
                      <td className="px-4 py-3 text-white font-medium text-right">{formatCurrency(wo.total_cost ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 mb-0.5">{label}</div>
      <div className={`text-sm text-zinc-200 ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</div>
    </div>
  );
}
