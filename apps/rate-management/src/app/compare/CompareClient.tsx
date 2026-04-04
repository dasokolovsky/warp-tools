'use client';

import { useState } from 'react';
import { BarChart2, Search, Star, TrendingUp } from 'lucide-react';
import { RateBasisBadge } from '@/components/RateBasisBadge';
import { RateTypeBadge } from '@/components/RateTypeBadge';
import { TariffStatusBadge } from '@/components/TariffStatusBadge';
import { LaneDisplay } from '@/components/LaneDisplay';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Lane, CarrierRate, CustomerTariff } from '@/db/schema';

interface CompareClientProps {
  lanes: Lane[];
}

type SortKey = 'rate' | 'carrier_name' | 'margin';

interface CompareRow {
  id: number;
  name: string;
  rate: number;
  rate_basis: CarrierRate['rate_basis'];
  rate_type?: CarrierRate['rate_type'];
  effective_date: string | null;
  expiry_date: string | null;
  isTariff: boolean;
  margin?: number;
  tariffStatus?: CustomerTariff['status'];
}

function BestBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#00C650]/10 border border-[#00C650]/30 text-[#00C650] font-medium">
      <Star className="h-2.5 w-2.5 fill-current" />
      Best Value
    </span>
  );
}

function MarginCell({ margin }: { margin: number }) {
  const colorClass = margin >= 15 ? 'text-green-400' : margin >= 10 ? 'text-yellow-400' : 'text-red-400';
  return (
    <span className={cn('inline-flex items-center gap-1 font-semibold', colorClass)}>
      <TrendingUp className="h-3 w-3" />
      {margin.toFixed(1)}%
    </span>
  );
}

export function CompareClient({ lanes }: CompareClientProps) {
  const [selectedLaneId, setSelectedLaneId] = useState<number | null>(null);
  const [laneSearch, setLaneSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ lane: Lane; rates: CarrierRate[]; tariffs: CustomerTariff[] } | null>(null);

  const filteredLanes = lanes.filter(l => {
    const q = laneSearch.toLowerCase();
    return (
      l.origin_city.toLowerCase().includes(q) ||
      l.origin_state.toLowerCase().includes(q) ||
      l.dest_city.toLowerCase().includes(q) ||
      l.dest_state.toLowerCase().includes(q)
    );
  });

  async function handleSelectLane(laneId: number) {
    setSelectedLaneId(laneId);
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?laneId=${laneId}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }

  // Build comparison rows
  let rows: CompareRow[] = [];
  let activeTariff: CustomerTariff | null = null;
  let bestCarrierRate: CarrierRate | null = null;

  if (data) {
    activeTariff = data.tariffs.find(t => t.status === 'active') ?? data.tariffs[0] ?? null;
    bestCarrierRate = data.rates.length > 0
      ? data.rates.reduce((a, b) => a.rate_amount < b.rate_amount ? a : b)
      : null;

    rows = data.rates.map(r => {
      const margin = activeTariff && activeTariff.rate_amount > 0
        ? ((activeTariff.rate_amount - r.rate_amount) / activeTariff.rate_amount) * 100
        : undefined;
      return {
        id: r.id,
        name: r.carrier_name,
        rate: r.rate_amount,
        rate_basis: r.rate_basis,
        rate_type: r.rate_type,
        effective_date: r.effective_date,
        expiry_date: r.expiry_date,
        isTariff: false,
        margin,
      };
    });

    // Sort
    rows.sort((a, b) => {
      let diff = 0;
      if (sortKey === 'rate') diff = a.rate - b.rate;
      else if (sortKey === 'carrier_name') diff = a.name.localeCompare(b.name);
      else if (sortKey === 'margin') diff = (a.margin ?? -Infinity) - (b.margin ?? -Infinity);
      return sortOrder === 'asc' ? diff : -diff;
    });
  }

  const selectedLane = lanes.find(l => l.id === selectedLaneId);

  function SortTh({ label, field }: { label: string; field: SortKey }) {
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide cursor-pointer hover:text-white select-none"
        onClick={() => handleSort(field)}
      >
        {label} {sortKey === field ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-[#00C650]" />
          Rate Comparison
        </h1>
        <p className="text-[#8B95A5] mt-1 text-sm">Select a lane to compare carrier rates vs your customer tariff.</p>
      </div>

      {/* Lane Selector */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
        <label className="block text-xs text-[#8B95A5] mb-2">Select Lane</label>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
          <input
            className="w-full bg-[#0D1526] border border-[#1A2235] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50"
            placeholder="Search lanes..."
            value={laneSearch}
            onChange={e => setLaneSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {filteredLanes.map(lane => (
            <button
              key={lane.id}
              onClick={() => handleSelectLane(lane.id)}
              className={cn(
                'text-left px-3 py-2 rounded-lg border text-sm transition-colors',
                selectedLaneId === lane.id
                  ? 'border-[#00C650]/50 bg-[#00C650]/10 text-white'
                  : 'border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245]'
              )}
            >
              <LaneDisplay
                originCity={lane.origin_city}
                originState={lane.origin_state}
                destCity={lane.dest_city}
                destState={lane.dest_state}
                size="sm"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!selectedLaneId && (
        <div className="py-20 text-center text-[#8B95A5]">
          <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Select a lane to compare rates</p>
          <p className="text-sm mt-1">Choose a lane above to see carrier rates and margin analysis</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center text-[#8B95A5]">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#00C650] border-t-transparent mb-2" />
          <p>Loading comparison...</p>
        </div>
      )}

      {/* Comparison table */}
      {!loading && data && selectedLane && (
        <div className="space-y-4">
          {/* Lane info */}
          <div className="flex items-center gap-4">
            <LaneDisplay
              originCity={selectedLane.origin_city}
              originState={selectedLane.origin_state}
              destCity={selectedLane.dest_city}
              destState={selectedLane.dest_state}
              size="lg"
            />
            {selectedLane.estimated_miles && (
              <span className="text-sm text-[#8B95A5]">{selectedLane.estimated_miles.toLocaleString()} mi</span>
            )}
          </div>

          {/* Customer tariff reference row */}
          {activeTariff && (
            <div className="bg-[#00C650]/5 border border-[#00C650]/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#00C650] font-medium uppercase tracking-wide mb-1">Customer Tariff (Reference)</div>
                  <div className="text-sm font-semibold text-white">{activeTariff.customer_name}</div>
                  {activeTariff.contract_ref && (
                    <div className="text-xs text-[#8B95A5] mt-0.5">{activeTariff.contract_ref}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{formatCurrency(activeTariff.rate_amount)}</div>
                  <div className="flex items-center gap-2 justify-end mt-1">
                    <RateBasisBadge basis={activeTariff.rate_basis} />
                    <TariffStatusBadge status={activeTariff.status} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No rates */}
          {rows.length === 0 && (
            <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl py-12 text-center text-[#8B95A5]">
              <p>No carrier rates for this lane yet</p>
              <p className="text-xs mt-1">Add rates from the lane detail page</p>
            </div>
          )}

          {/* Rates table */}
          {rows.length > 0 && (
            <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-[#1A2235]">
                  <tr>
                    <SortTh label="Carrier" field="carrier_name" />
                    <SortTh label="Rate" field="rate" />
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Basis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Effective</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Expires</th>
                    {activeTariff && <SortTh label="Margin" field="margin" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2235]">
                  {rows.map(row => {
                    const isBest = bestCarrierRate?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          'transition-colors hover:bg-[#0D1526]',
                          isBest && 'bg-[#00C650]/5'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium">{row.name}</span>
                            {isBest && <BestBadge />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-white">
                          {formatCurrency(row.rate)}
                        </td>
                        <td className="px-4 py-3">
                          <RateBasisBadge basis={row.rate_basis} />
                        </td>
                        <td className="px-4 py-3">
                          {row.rate_type && <RateTypeBadge type={row.rate_type} />}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#8B95A5]">{formatDate(row.effective_date)}</td>
                        <td className="px-4 py-3 text-xs text-[#8B95A5]">{formatDate(row.expiry_date)}</td>
                        {activeTariff && (
                          <td className="px-4 py-3">
                            {row.margin !== undefined ? (
                              <div>
                                <MarginCell margin={row.margin} />
                                <div className="text-xs text-[#8B95A5] mt-0.5">
                                  {formatCurrency(activeTariff.rate_amount - row.rate)}
                                </div>
                              </div>
                            ) : <span className="text-[#8B95A5]">—</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* No tariff notice */}
          {!activeTariff && rows.length > 0 && (
            <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-3 text-sm text-yellow-400">
              No active customer tariff on this lane — add one to see margin analysis
            </div>
          )}
        </div>
      )}
    </div>
  );
}
