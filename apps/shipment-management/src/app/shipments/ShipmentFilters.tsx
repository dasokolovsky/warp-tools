'use client';

import type { ShipmentStatus, EquipmentType } from '@/db/schema';
import { getShipmentStatusLabel } from '@/lib/utils';

const ALL_STATUSES: ShipmentStatus[] = [
  'quote', 'booked', 'dispatched', 'in_transit', 'delivered',
  'invoiced', 'paid', 'closed', 'cancelled', 'claim',
];

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  quote: 'text-slate-400 border-slate-400/30 bg-slate-400/10',
  booked: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  dispatched: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  in_transit: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  delivered: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  invoiced: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  paid: 'text-green-400 border-green-400/30 bg-green-400/10',
  closed: 'text-slate-500 border-slate-500/30 bg-slate-500/10',
  cancelled: 'text-red-400 border-red-400/30 bg-red-400/10',
  claim: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
};

const ALL_EQUIPMENT: EquipmentType[] = [
  'dry_van', 'reefer', 'flatbed', 'step_deck', 'lowboy',
  'sprinter_van', 'cargo_van', 'power_only',
];

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  dry_van: 'Dry Van', reefer: 'Reefer', flatbed: 'Flatbed',
  step_deck: 'Step Deck', lowboy: 'Lowboy', sprinter_van: 'Sprinter Van',
  cargo_van: 'Cargo Van', power_only: 'Power Only',
};

interface FilterState {
  q: string;
  statuses: ShipmentStatus[];
  customer: string;
  carrier: string;
  equipment: string;
  dateFrom: string;
  dateTo: string;
  marginFilter: string;
  docStatus: string;
}

interface ShipmentFiltersProps {
  filters: FilterState;
  customers: string[];
  carriers: string[];
  onChange: (filters: FilterState) => void;
}

export function ShipmentFilters({ filters, customers, carriers, onChange }: ShipmentFiltersProps) {
  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  function toggleStatus(status: ShipmentStatus) {
    const exists = filters.statuses.includes(status);
    if (exists) {
      update({ statuses: filters.statuses.filter((s) => s !== status) });
    } else {
      update({ statuses: [...filters.statuses, status] });
    }
  }

  return (
    <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4 space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search shipment #, customer, carrier, city…"
        value={filters.q}
        onChange={(e) => update({ q: e.target.value })}
        className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
      />

      {/* Status chips */}
      <div>
        <div className="text-xs text-[#8B95A5] mb-2 font-medium">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((status) => {
            const active = filters.statuses.includes(status);
            const colorClass = STATUS_COLORS[status];
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-2 py-0.5 text-xs rounded-full border transition-opacity ${
                  active ? colorClass : 'text-[#8B95A5] border-[#1A2235] bg-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {getShipmentStatusLabel(status)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Customer, Carrier, Equipment */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1">Customer</label>
          <select
            value={filters.customer}
            onChange={(e) => update({ customer: e.target.value })}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1">Carrier</label>
          <select
            value={filters.carrier}
            onChange={(e) => update({ carrier: e.target.value })}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          >
            <option value="">All carriers</option>
            {carriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1">Equipment</label>
          <select
            value={filters.equipment}
            onChange={(e) => update({ equipment: e.target.value })}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          >
            <option value="">All equipment</option>
            {ALL_EQUIPMENT.map((e) => (
              <option key={e} value={e}>{EQUIPMENT_LABELS[e]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Dates, Margin, Docs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1">Pickup From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1">Pickup To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1">Margin</label>
          <select
            value={filters.marginFilter}
            onChange={(e) => update({ marginFilter: e.target.value })}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          >
            <option value="">All margins</option>
            <option value="above">Above 20%</option>
            <option value="below">Below 20%</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#8B95A5] mb-1">Doc Status</label>
          <select
            value={filters.docStatus}
            onChange={(e) => update({ docStatus: e.target.value })}
            className="w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          >
            <option value="">All docs</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>
      </div>

      {/* Clear filters */}
      {(filters.q || filters.statuses.length > 0 || filters.customer || filters.carrier ||
        filters.equipment || filters.dateFrom || filters.dateTo || filters.marginFilter || filters.docStatus) && (
        <button
          onClick={() => onChange({ q: '', statuses: [], customer: '', carrier: '', equipment: '', dateFrom: '', dateTo: '', marginFilter: '', docStatus: '' })}
          className="text-xs text-[#8B95A5] hover:text-white transition-colors underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
