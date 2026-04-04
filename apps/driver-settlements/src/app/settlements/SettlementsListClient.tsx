'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, ChevronUp, ChevronDown, CheckSquare } from 'lucide-react';
import { SettlementStatusBadge } from '@/components/SettlementStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Driver, SettlementStatus } from '@/db/schema';

interface SettlementRow {
  id: number;
  settlement_number: string;
  driver_id: number;
  driver_name: string;
  period_start: string;
  period_end: string;
  status: SettlementStatus;
  gross_earnings: number;
  total_deductions: number;
  total_reimbursements: number;
  total_advances: number;
  net_pay: number;
  paid_date: string | null;
  payment_method: string | null;
}

interface Props {
  settlements: SettlementRow[];
  drivers: Driver[];
}

const STATUSES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'disputed', label: 'Disputed' },
];

type SortField = 'settlement_number' | 'driver_name' | 'period_start' | 'gross_earnings' | 'net_pay';

export function SettlementsListClient({ settlements: initialSettlements, drivers }: Props) {
  const router = useRouter();
  const [settlements, setSettlements] = useState(initialSettlements);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('period_start');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [page, setPage] = useState(1);
  const [approving, setApproving] = useState(false);
  const pageSize = 25;

  const filtered = useMemo(() => {
    let rows = settlements;
    if (search) {
      const lower = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.settlement_number.toLowerCase().includes(lower) ||
          s.driver_name.toLowerCase().includes(lower)
      );
    }
    if (statusFilter) rows = rows.filter((s) => s.status === statusFilter);
    if (driverFilter) rows = rows.filter((s) => String(s.driver_id) === driverFilter);
    if (dateFrom) rows = rows.filter((s) => s.period_start >= dateFrom);
    if (dateTo) rows = rows.filter((s) => s.period_end <= dateTo);
    return rows;
  }, [settlements, search, statusFilter, driverFilter, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  const pageCount = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const submittedIds = paged.filter((s) => s.status === 'submitted').map((s) => s.id);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (submittedIds.every((id) => selected.has(id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        submittedIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        submittedIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  async function bulkApprove() {
    const toApprove = Array.from(selected).filter((id) =>
      settlements.find((s) => s.id === id && s.status === 'submitted')
    );
    if (toApprove.length === 0) return;
    setApproving(true);
    try {
      await Promise.all(
        toApprove.map((id) =>
          fetch(`/api/settlements/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve', approved_by: 'Admin' }),
          })
        )
      );
      // Refresh page data
      router.refresh();
      setSelected(new Set());
    } finally {
      setApproving(false);
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-[#00C650]" />
    ) : (
      <ChevronDown className="h-3 w-3 text-[#00C650]" />
    );
  }

  const selectedSubmitted = Array.from(selected).filter((id) =>
    settlements.find((s) => s.id === id && s.status === 'submitted')
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settlements</h1>
          <p className="text-sm text-[#8B95A5] mt-1">{filtered.length} settlements</p>
        </div>
        <div className="flex gap-2">
          {selectedSubmitted.length > 0 && (
            <button
              onClick={bulkApprove}
              disabled={approving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500/20 border border-blue-500/40 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              <CheckSquare className="h-4 w-4" />
              Approve Selected ({selectedSubmitted.length})
            </button>
          )}
          <a
            href="/settlements/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00C650]/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Settlement
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
          <input
            className="w-full rounded-lg bg-[#080F1E] border border-[#1A2235] pl-9 pr-3 py-2 text-sm text-white placeholder:text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50"
            placeholder="Search settlements..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="rounded-lg bg-[#080F1E] border border-[#1A2235] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          className="rounded-lg bg-[#080F1E] border border-[#1A2235] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          value={driverFilter}
          onChange={(e) => { setDriverFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Drivers</option>
          {drivers.map((d) => (
            <option key={d.id} value={String(d.id)}>{d.first_name} {d.last_name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="date"
            className="flex-1 rounded-lg bg-[#080F1E] border border-[#1A2235] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          />
          <input
            type="date"
            className="flex-1 rounded-lg bg-[#080F1E] border border-[#1A2235] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="h-10 w-10 text-[#1A2235]" />
            <p className="text-sm text-[#8B95A5]">No settlements found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={submittedIds.length > 0 && submittedIds.every((id) => selected.has(id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort('settlement_number')} className="flex items-center gap-1 text-xs font-medium text-[#8B95A5] uppercase tracking-wide hover:text-white">
                      Settlement # <SortIcon field="settlement_number" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort('driver_name')} className="flex items-center gap-1 text-xs font-medium text-[#8B95A5] uppercase tracking-wide hover:text-white">
                      Driver <SortIcon field="driver_name" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => toggleSort('period_start')} className="flex items-center gap-1 text-xs font-medium text-[#8B95A5] uppercase tracking-wide hover:text-white">
                      Period <SortIcon field="period_start" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => toggleSort('gross_earnings')} className="flex items-center justify-end gap-1 text-xs font-medium text-[#8B95A5] uppercase tracking-wide hover:text-white">
                      Gross <SortIcon field="gross_earnings" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Deductions</th>
                  <th className="px-4 py-3 text-right">
                    <button onClick={() => toggleSort('net_pay')} className="flex items-center justify-end gap-1 text-xs font-medium text-[#8B95A5] uppercase tracking-wide hover:text-white">
                      Net Pay <SortIcon field="net_pay" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2235]">
                {paged.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-[#0C1528] transition-colors cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                      router.push(`/settlements/${s.id}`);
                    }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {s.status === 'submitted' && (
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selected.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[#00C650]">{s.settlement_number}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{s.driver_name}</td>
                    <td className="px-4 py-3 text-xs text-[#8B95A5]">
                      {formatDate(s.period_start)} – {formatDate(s.period_end)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right tabular-nums">
                      {formatCurrency(s.gross_earnings)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-400 text-right tabular-nums">
                      −{formatCurrency(s.total_deductions + s.total_advances)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white text-right tabular-nums">
                      {formatCurrency(s.net_pay)}
                    </td>
                    <td className="px-4 py-3">
                      <SettlementStatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8B95A5]">
            Page {page} of {pageCount} ({sorted.length} results)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#080F1E] border border-[#1A2235] text-[#8B95A5] hover:text-white disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#080F1E] border border-[#1A2235] text-[#8B95A5] hover:text-white disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
