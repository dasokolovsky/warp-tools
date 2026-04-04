'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowRight, Plus, Search, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { RFQStatusBadge } from '@/components/RFQStatusBadge';
import { formatCurrency, formatDate, getEquipmentLabel, getEquipmentColor, cn } from '@/lib/utils';
import type { RFQStatus } from '@/db/schema';

interface Lane {
  id: number;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  equipment_type: string;
}

interface RFQRow {
  rfq: {
    id: number;
    rfq_number: string;
    status: RFQStatus;
    equipment_type: string | null;
    pickup_date: string | null;
    desired_rate: number | null;
    awarded_carrier: string | null;
    awarded_rate: number | null;
    created_at: string;
  };
  lane: Lane | null;
  responseCount: number;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'responses', label: 'Responses In' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function RFQsPage() {
  const [rows, setRows] = useState<RFQRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({
        search,
        status,
        page: String(page),
        limit: '20',
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
      });
      const res = await fetch(`/api/rfqs?${sp}`);
      const json = await res.json();
      setRows(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
      setPages(json.meta?.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [search, status, page, sortBy, sortOrder, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  }

  function SortHeader({ col, label }: { col: string; label: string }) {
    const active = sortBy === col;
    return (
      <button
        onClick={() => toggleSort(col)}
        className={cn('flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors', active ? 'text-white' : 'text-[#8B95A5] hover:text-white')}
      >
        {label}
        {active && <span className="text-[#00C650]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
      </button>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileQuestion className="h-6 w-6 text-[#00C650]" />
            RFQs
          </h1>
          <p className="text-[#8B95A5] mt-1 text-sm">{total} request{total !== 1 ? 's' : ''} for quote</p>
        </div>
        <Link
          href="/rfqs/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00C650]/90 text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create RFQ
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
          <input
            type="text"
            placeholder="Search RFQ #, carrier, lane..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#080F1E] border border-[#1A2235] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          title="To date"
        />
      </div>

      {/* Table */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-5 py-3"><SortHeader col="rfq_number" label="RFQ #" /></th>
                <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Lane</th>
                <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Equipment</th>
                <th className="text-left px-4 py-3"><SortHeader col="status" label="Status" /></th>
                <th className="text-right px-4 py-3"><SortHeader col="responses" label="Responses" /></th>
                <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">Awarded</th>
                <th className="text-right px-4 py-3"><SortHeader col="pickup_date" label="Pickup" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2235]">
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#8B95A5]">Loading...</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FileQuestion className="h-8 w-8 mx-auto mb-2 text-[#8B95A5] opacity-30" />
                    <p className="text-[#8B95A5]">No RFQs found</p>
                  </td>
                </tr>
              )}
              {!loading && rows.map(({ rfq, lane, responseCount }) => (
                <tr key={rfq.id} className="hover:bg-[#0C1528] transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/rfqs/${rfq.id}`} className="font-semibold text-white hover:text-[#00C650] transition-colors">
                      {rfq.rfq_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {lane ? (
                      <div className="flex items-center gap-1 text-[#8B95A5] text-xs">
                        <span>{lane.origin_city}, {lane.origin_state}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{lane.dest_city}, {lane.dest_state}</span>
                      </div>
                    ) : (
                      <span className="text-[#8B95A5]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rfq.equipment_type ? (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border', getEquipmentColor(rfq.equipment_type as never))}>
                        {getEquipmentLabel(rfq.equipment_type as never)}
                      </span>
                    ) : (
                      <span className="text-[#8B95A5]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RFQStatusBadge status={rfq.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('font-semibold', responseCount > 0 ? 'text-white' : 'text-[#8B95A5]')}>
                      {responseCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {rfq.awarded_carrier ? (
                      <div className="flex items-center gap-1 text-green-400 text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{rfq.awarded_carrier}</span>
                        {rfq.awarded_rate && <span className="text-[#8B95A5] ml-1">({formatCurrency(rfq.awarded_rate)})</span>}
                      </div>
                    ) : (
                      <span className="text-[#8B95A5]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[#8B95A5] text-xs">
                    {formatDate(rfq.pickup_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#1A2235]">
            <span className="text-xs text-[#8B95A5]">Page {page} of {pages} · {total} total</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#0C1528] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#0C1528] disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
