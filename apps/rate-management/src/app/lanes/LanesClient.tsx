'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus, ChevronUp, ChevronDown, ChevronsUpDown, Map } from 'lucide-react';
import { LaneDisplay } from '@/components/LaneDisplay';
import { RateBasisBadge } from '@/components/RateBasisBadge';
import { MarginIndicator } from '@/components/MarginIndicator';
import { cn, getEquipmentLabel, getEquipmentColor, getLaneStatusColor, getLaneStatusLabel, formatCurrency } from '@/lib/utils';
import type { RateBasis } from '@/db/schema';

interface LaneStat {
  id: number;
  origin_city: string;
  origin_state: string;
  origin_zip: string | null;
  dest_city: string;
  dest_state: string;
  dest_zip: string | null;
  equipment_type: string;
  estimated_miles: number | null;
  tags: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  rateCount: number;
  tariffCount: number;
  bestRate: { amount: number; basis: RateBasis } | null;
  activeTariff: { amount: number; basis: RateBasis } | null;
  margin: number | null;
}

interface LanesClientProps {
  initialLanes: LaneStat[];
  totalCount: number;
}

type SortField = 'origin_city' | 'dest_city' | 'estimated_miles' | 'margin' | 'created_at';

const EQUIPMENT_OPTIONS = [
  { value: '', label: 'All Equipment' },
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'lowboy', label: 'Lowboy' },
  { value: 'sprinter_van', label: 'Sprinter Van' },
  { value: 'cargo_van', label: 'Cargo Van' },
  { value: 'power_only', label: 'Power Only' },
];

function SortIcon({ field, current, order }: { field: SortField; current: SortField; order: 'asc' | 'desc' }) {
  if (field !== current) return <ChevronsUpDown className="h-3.5 w-3.5 text-[#4A5568]" />;
  return order === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-[#00C650]" />
    : <ChevronDown className="h-3.5 w-3.5 text-[#00C650]" />;
}

function getMarginRowColor(margin: number | null) {
  if (margin === null) return '';
  if (margin >= 15) return 'text-green-400';
  if (margin >= 10) return 'text-yellow-400';
  return 'text-red-400';
}

export function LanesClient({ initialLanes, totalCount }: LanesClientProps) {
  const router = useRouter();

  const [lanes, setLanes] = useState<LaneStat[]>(initialLanes);
  const [total] = useState(totalCount);
  const [search, setSearch] = useState('');
  const [equipment, setEquipment] = useState('');
  const [status, setStatus] = useState('');
  const [hasTariff, setHasTariff] = useState('');
  const [hasRates, setHasRates] = useState('');
  const [sort, setSort] = useState<SortField>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  async function fetchLanes(params: {
    search?: string; equipment?: string; status?: string;
    hasTariff?: string; hasRates?: string; sort?: string; order?: string; page?: number;
  }) {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (params.search) qs.set('search', params.search);
      if (params.equipment) qs.set('equipment', params.equipment);
      if (params.status) qs.set('status', params.status);
      if (params.hasTariff) qs.set('hasTariff', params.hasTariff);
      if (params.hasRates) qs.set('hasRates', params.hasRates);
      if (params.sort) qs.set('sort', params.sort);
      if (params.order) qs.set('order', params.order);
      if (params.page) qs.set('page', String(params.page));
      qs.set('limit', '20');

      const res = await fetch(`/api/lanes?${qs}`);
      const data = await res.json();
      setLanes(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
    fetchLanes({ search: val, equipment, status, hasTariff, hasRates, sort, order, page: 1 });
  }

  function handleSort(field: SortField) {
    const newOrder = field === sort && order === 'desc' ? 'asc' : 'desc';
    setSort(field);
    setOrder(newOrder);
    fetchLanes({ search, equipment, status, hasTariff, hasRates, sort: field, order: newOrder, page });
  }

  function handleFilter(updates: Record<string, string>) {
    const newEquipment = 'equipment' in updates ? updates.equipment : equipment;
    const newStatus = 'status' in updates ? updates.status : status;
    const newHasTariff = 'hasTariff' in updates ? updates.hasTariff : hasTariff;
    const newHasRates = 'hasRates' in updates ? updates.hasRates : hasRates;
    if ('equipment' in updates) setEquipment(newEquipment);
    if ('status' in updates) setStatus(newStatus);
    if ('hasTariff' in updates) setHasTariff(newHasTariff);
    if ('hasRates' in updates) setHasRates(newHasRates);
    setPage(1);
    fetchLanes({ search, equipment: newEquipment, status: newStatus, hasTariff: newHasTariff, hasRates: newHasRates, sort, order, page: 1 });
  }

  function thClass(field: SortField) {
    return cn(
      'px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide cursor-pointer select-none hover:text-white transition-colors',
      sort === field && 'text-white'
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Map className="h-6 w-6 text-[#00C650]" />
            Lanes
          </h1>
          <p className="text-[#8B95A5] mt-1 text-sm">{total} lanes in your network</p>
        </div>
        <button
          onClick={() => router.push('/lanes/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#00C650] text-black font-semibold rounded-lg text-sm hover:bg-[#00B348] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Lane
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
          <input
            className="w-full bg-[#080F1E] border border-[#1A2235] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50"
            placeholder="Search by city or state..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
            showFilters
              ? 'border-[#00C650]/50 text-[#00C650] bg-[#00C650]/10'
              : 'border-[#1A2235] text-[#8B95A5] hover:text-white'
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-[#080F1E] border border-[#1A2235] rounded-xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8B95A5]">Equipment</label>
            <select
              className="bg-[#0D1526] border border-[#1A2235] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              value={equipment}
              onChange={e => handleFilter({ equipment: e.target.value })}
            >
              {EQUIPMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8B95A5]">Status</label>
            <select
              className="bg-[#0D1526] border border-[#1A2235] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              value={status}
              onChange={e => handleFilter({ status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8B95A5]">Has Rates</label>
            <select
              className="bg-[#0D1526] border border-[#1A2235] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              value={hasRates}
              onChange={e => handleFilter({ hasRates: e.target.value })}
            >
              <option value="">Any</option>
              <option value="true">Has Rates</option>
              <option value="false">No Rates</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#8B95A5]">Has Tariff</label>
            <select
              className="bg-[#0D1526] border border-[#1A2235] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              value={hasTariff}
              onChange={e => handleFilter({ hasTariff: e.target.value })}
            >
              <option value="">Any</option>
              <option value="true">Has Tariff</option>
              <option value="false">No Tariff</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
        <div className={cn('transition-opacity', loading && 'opacity-50')}>
          <table className="w-full">
            <thead className="border-b border-[#1A2235]">
              <tr>
                <th className={thClass('origin_city')} onClick={() => handleSort('origin_city')}>
                  <div className="flex items-center gap-1">Lane <SortIcon field="origin_city" current={sort} order={order} /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Equipment</th>
                <th className={thClass('estimated_miles')} onClick={() => handleSort('estimated_miles')}>
                  <div className="flex items-center gap-1">Miles <SortIcon field="estimated_miles" current={sort} order={order} /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Rates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Best Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Tariff</th>
                <th className={thClass('margin')} onClick={() => handleSort('margin')}>
                  <div className="flex items-center gap-1">Margin <SortIcon field="margin" current={sort} order={order} /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2235]">
              {lanes.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-[#8B95A5]">
                    No lanes found
                  </td>
                </tr>
              )}
              {lanes.map(lane => (
                <tr
                  key={lane.id}
                  className="hover:bg-[#0D1526] cursor-pointer transition-colors"
                  onClick={() => router.push(`/lanes/${lane.id}`)}
                >
                  <td className="px-4 py-3">
                    <LaneDisplay
                      originCity={lane.origin_city}
                      originState={lane.origin_state}
                      destCity={lane.dest_city}
                      destState={lane.dest_state}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', getEquipmentColor(lane.equipment_type as Parameters<typeof getEquipmentColor>[0]))}>
                      {getEquipmentLabel(lane.equipment_type as Parameters<typeof getEquipmentLabel>[0])}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8B95A5]">
                    {lane.estimated_miles ? lane.estimated_miles.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {lane.rateCount > 0 ? lane.rateCount : <span className="text-[#8B95A5]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {lane.bestRate ? (
                      <span className="text-[#00C650] font-semibold">
                        {formatCurrency(lane.bestRate.amount)}
                        <span className="text-xs text-[#8B95A5] font-normal ml-1">
                          <RateBasisBadge basis={lane.bestRate.basis} />
                        </span>
                      </span>
                    ) : <span className="text-[#8B95A5]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {lane.activeTariff ? (
                      <span className="text-white font-semibold">{formatCurrency(lane.activeTariff.amount)}</span>
                    ) : <span className="text-[#8B95A5]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    {lane.margin !== null ? (
                      <span className={getMarginRowColor(lane.margin)}>
                        {lane.margin.toFixed(1)}%
                      </span>
                    ) : <span className="text-[#8B95A5]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getLaneStatusColor(lane.status as Parameters<typeof getLaneStatusColor>[0]))}>
                      {getLaneStatusLabel(lane.status as Parameters<typeof getLaneStatusLabel>[0])}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="border-t border-[#1A2235] px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-[#8B95A5]">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  fetchLanes({ search, equipment, status, hasTariff, hasRates, sort, order, page: p });
                }}
                className="px-3 py-1 rounded-lg border border-[#1A2235] text-xs text-[#8B95A5] disabled:opacity-40 hover:text-white transition-colors"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  fetchLanes({ search, equipment, status, hasTariff, hasRates, sort, order, page: p });
                }}
                className="px-3 py-1 rounded-lg border border-[#1A2235] text-xs text-[#8B95A5] disabled:opacity-40 hover:text-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
