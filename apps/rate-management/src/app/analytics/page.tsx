'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, getEquipmentLabel, getMarginColor, getMarginLabel, cn } from '@/lib/utils';

interface Lane {
  id: number;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  equipment_type: string;
}

interface TrendEntry {
  id: number;
  type: 'carrier' | 'tariff';
  name: string;
  rate: number;
  basis: string;
  rate_type: string | null;
  effective_date?: string | null;
  expiry_date?: string | null;
  created_at: string;
}

interface LaneStats {
  avgCarrier: number | null;
  avgTariff: number | null;
  avgMargin: number | null;
}

interface MarginRow {
  lane_id: number;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  equipment_type: string;
  status: string;
  carrier_rate: number | null;
  tariff_rate: number | null;
  margin: number | null;
  rate_count: number;
}

interface EquipAvg {
  equipment_type: string;
  avg_rate: number;
  count: number;
  min_rate: number;
  max_rate: number;
}

export default function AnalyticsPage() {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [selectedLaneId, setSelectedLaneId] = useState('');
  const [laneHistory, setLaneHistory] = useState<TrendEntry[]>([]);
  const [laneStats, setLaneStats] = useState<LaneStats | null>(null);
  const [selectedLane, setSelectedLane] = useState<Lane | null>(null);
  const [marginRows, setMarginRows] = useState<MarginRow[]>([]);
  const [equipAvgs, setEquipAvgs] = useState<EquipAvg[]>([]);
  const [targetMargin, setTargetMargin] = useState(15);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const settings = JSON.parse(localStorage.getItem('rateSettings') ?? '{}');
      if (settings.targetMargin) setTargetMargin(Number(settings.targetMargin));
    }
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const [lanesRes, marginRes, equipRes] = await Promise.all([
      fetch('/api/lanes').catch(() => null),
      fetch('/api/analytics/margin-summary'),
      fetch('/api/analytics/equipment-averages'),
    ]);

    if (lanesRes?.ok) {
      const json = await lanesRes.json();
      setLanes(json.data ?? []);
    }
    if (marginRes.ok) {
      const json = await marginRes.json();
      setMarginRows(json.data ?? []);
    }
    if (equipRes.ok) {
      const json = await equipRes.json();
      setEquipAvgs(json.data ?? []);
    }
  }

  async function handleLaneSelect(laneIdStr: string) {
    setSelectedLaneId(laneIdStr);
    const lane = lanes.find(l => l.id === parseInt(laneIdStr));
    setSelectedLane(lane ?? null);
    if (!laneIdStr) {
      setLaneHistory([]);
      setLaneStats(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/lane-trends?laneId=${laneIdStr}`);
      if (res.ok) {
        const json = await res.json();
        setLaneHistory(json.data?.history ?? []);
        setLaneStats(json.data?.stats ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  const thinMarginLanes = marginRows.filter(r => r.margin !== null && r.margin < targetMargin);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[#00C650]" />
          Analytics
        </h1>
        <p className="text-[#8B95A5] mt-1 text-sm">Rate trends, margin analysis, and equipment benchmarks.</p>
      </div>

      {/* Lane Selector */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5">
        <label className="block text-xs text-[#8B95A5] mb-2">Select Lane for Trend Analysis</label>
        <select
          value={selectedLaneId}
          onChange={e => handleLaneSelect(e.target.value)}
          className="w-full md:w-auto bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
        >
          <option value="">— Choose a lane —</option>
          {lanes.map(l => (
            <option key={l.id} value={l.id}>
              {l.origin_city}, {l.origin_state} → {l.dest_city}, {l.dest_state} ({l.equipment_type.replace(/_/g, ' ')})
            </option>
          ))}
        </select>

        {/* Lane Stats */}
        {laneStats && selectedLane && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-white">
                {selectedLane.origin_city}, {selectedLane.origin_state}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[#8B95A5]" />
              <span className="text-sm font-semibold text-white">
                {selectedLane.dest_city}, {selectedLane.dest_state}
              </span>
              <span className="text-xs text-[#8B95A5]">({getEquipmentLabel(selectedLane.equipment_type as never)})</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0C1528] rounded-lg p-3">
                <div className="text-xs text-[#8B95A5]">Avg Carrier Rate</div>
                <div className="text-lg font-bold text-white mt-1">{laneStats.avgCarrier ? formatCurrency(laneStats.avgCarrier) : '—'}</div>
              </div>
              <div className="bg-[#0C1528] rounded-lg p-3">
                <div className="text-xs text-[#8B95A5]">Avg Tariff Rate</div>
                <div className="text-lg font-bold text-white mt-1">{laneStats.avgTariff ? formatCurrency(laneStats.avgTariff) : '—'}</div>
              </div>
              <div className="bg-[#0C1528] rounded-lg p-3">
                <div className="text-xs text-[#8B95A5]">Avg Margin</div>
                <div className={cn('text-lg font-bold mt-1', laneStats.avgMargin !== null ? getMarginColor(laneStats.avgMargin) : 'text-[#8B95A5]')}>
                  {laneStats.avgMargin !== null ? `${laneStats.avgMargin.toFixed(1)}%` : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rate Trend Table */}
      {selectedLaneId && (
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1A2235]">
            <h2 className="text-sm font-semibold text-white">Rate History</h2>
          </div>
          {loading ? (
            <div className="text-center py-10 text-[#8B95A5]">Loading...</div>
          ) : laneHistory.length === 0 ? (
            <div className="text-center py-10 text-[#8B95A5]">No rate history for this lane.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A2235]">
                    <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Added</th>
                    <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Carrier / Customer</th>
                    <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Rate</th>
                    <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Basis</th>
                    <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Effective</th>
                    <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2235]">
                  {laneHistory.map(entry => (
                    <tr key={`${entry.type}-${entry.id}`} className="hover:bg-[#0C1528] transition-colors">
                      <td className="px-5 py-3 text-[#8B95A5] text-xs">{formatDate(entry.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded border', entry.type === 'carrier' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-purple-400 bg-purple-400/10 border-purple-400/20')}>
                          {entry.type === 'carrier' ? 'Carrier' : 'Tariff'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{entry.name}</td>
                      <td className="px-4 py-3 text-right text-white font-semibold">{formatCurrency(entry.rate)}</td>
                      <td className="px-4 py-3 text-[#8B95A5] text-xs">{entry.basis.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-[#8B95A5] text-xs">{formatDate(entry.effective_date)}</td>
                      <td className="px-5 py-3 text-[#8B95A5] text-xs">{formatDate(entry.expiry_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Equipment Averages */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Equipment Type Averages</h2>
          <p className="text-xs text-[#8B95A5] mt-0.5">Average carrier rate by equipment type across all lanes</p>
        </div>
        {equipAvgs.length === 0 ? (
          <div className="text-center py-10 text-[#8B95A5]">No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Equipment</th>
                  <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Avg Rate</th>
                  <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Min</th>
                  <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Max</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide"># Rates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2235]">
                {equipAvgs.map(row => (
                  <tr key={row.equipment_type} className="hover:bg-[#0C1528] transition-colors">
                    <td className="px-5 py-3 text-white">{getEquipmentLabel(row.equipment_type as never)}</td>
                    <td className="px-4 py-3 text-right text-[#00C650] font-semibold">{formatCurrency(row.avg_rate)}</td>
                    <td className="px-4 py-3 text-right text-[#8B95A5]">{formatCurrency(row.min_rate)}</td>
                    <td className="px-4 py-3 text-right text-[#8B95A5]">{formatCurrency(row.max_rate)}</td>
                    <td className="px-5 py-3 text-right text-[#8B95A5]">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Margin Breakdown */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Lane Margin Breakdown</h2>
            <p className="text-xs text-[#8B95A5] mt-0.5">Sorted by worst margin first · Target: {targetMargin}%</p>
          </div>
          {thinMarginLanes.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {thinMarginLanes.length} below target
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Lane</th>
                <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Equipment</th>
                <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Carrier Rate</th>
                <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Tariff Rate</th>
                <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2235]">
              {marginRows.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-[#8B95A5]">No data</td></tr>
              )}
              {marginRows.map(row => {
                const isThin = row.margin !== null && row.margin < targetMargin;
                return (
                  <tr key={row.lane_id} className={cn('transition-colors', isThin ? 'bg-red-400/5' : 'hover:bg-[#0C1528]')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-white font-medium">
                        <span>{row.origin_city}, {row.origin_state}</span>
                        <ArrowRight className="h-3 w-3 text-[#8B95A5]" />
                        <span>{row.dest_city}, {row.dest_state}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8B95A5] text-xs">{getEquipmentLabel(row.equipment_type as never)}</td>
                    <td className="px-4 py-3 text-right text-white">{row.carrier_rate ? formatCurrency(row.carrier_rate) : <span className="text-[#8B95A5]">—</span>}</td>
                    <td className="px-4 py-3 text-right text-white">{row.tariff_rate ? formatCurrency(row.tariff_rate) : <span className="text-[#8B95A5]">—</span>}</td>
                    <td className="px-5 py-3 text-right">
                      {row.margin !== null ? (
                        <span className={cn('font-semibold', getMarginColor(row.margin))}>
                          {row.margin.toFixed(1)}% <span className="text-xs font-normal">({getMarginLabel(row.margin)})</span>
                        </span>
                      ) : (
                        <span className="text-[#8B95A5]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
