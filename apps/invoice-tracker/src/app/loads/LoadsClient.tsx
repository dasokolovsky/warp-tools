'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, X, Filter } from 'lucide-react';
import { QuickCreateLoadModal } from './QuickCreateLoadModal';
import { LoadStatusBadge } from '@/components/LoadStatusBadge';
import { MarginIndicator, getMarginColor, getMarginBg } from '@/components/MarginIndicator';
import { SortHeader } from '@/components/SortHeader';
import { Pagination } from '@/components/Pagination';

interface Customer {
  id: string;
  name: string;
}

interface Load {
  id: string;
  loadRef: string;
  customerId: string;
  customerName: string;
  carrierName: string | null;
  origin: string | null;
  destination: string | null;
  revenue: number;
  cost: number;
  status: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  invoiceId: string | null;
  carrierPaymentId: string | null;
}

interface Totals {
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  avgMarginPct: number;
}

interface LoadsClientProps {
  loads: Load[];
  total: number;
  page: number;
  pageSize: number;
  totals: Totals;
  customers: Customer[];
  sortBy: string;
  sortDir: string;
  searchParams: Record<string, string | undefined>;
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type SortCol = 'loadRef' | 'customerName' | 'carrierName' | 'origin' | 'destination' | 'revenue' | 'cost' | 'margin' | 'marginPct' | 'status' | 'pickupDate';

export function LoadsClient({
  loads,
  total,
  page,
  pageSize,
  totals,
  customers,
  sortBy,
  sortDir,
  searchParams: sp,
}: LoadsClientProps) {
  const router = useRouter();
  const rawSearchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);

  const buildHref = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const p = new URLSearchParams(rawSearchParams.toString());
      for (const [k, v] of Object.entries(overrides)) {
        if (v === undefined || v === '') {
          p.delete(k);
        } else {
          p.set(k, v);
        }
      }
      // Reset page when filters change
      if (!('page' in overrides)) p.delete('page');
      return `?${p.toString()}`;
    },
    [rawSearchParams]
  );

  const buildSortHref = (col: SortCol) => {
    const newDir = sortBy === col && sortDir === 'asc' ? 'desc' : 'asc';
    return buildHref({ sortBy: col, sortDir: newDir, page: undefined });
  };

  const navigate = (href: string) => startTransition(() => router.push(href));

  const handleSearchChange = (value: string) => {
    navigate(buildHref({ search: value || undefined }));
  };

  const handleFilterChange = (key: string, value: string) => {
    navigate(buildHref({ [key]: value === 'all' || value === '' ? undefined : value }));
  };

  const search = sp.search ?? '';
  const statusFilter = sp.status ?? 'all';
  const customerFilter = sp.customer ?? 'all';

  const hasFilters = search || statusFilter !== 'all' || customerFilter !== 'all' || sp.dateFrom || sp.dateTo;

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Loads Ledger</h1>
          <p className="text-[#8B95A5] text-sm mt-0.5">
            {total} load{total !== 1 ? 's' : ''} — profitability at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#8B95A5] hover:text-white border border-[#1A2235] hover:border-[#2A3245] rounded-xl transition-colors"
          >
            <Plus className="h-4 w-4" />
            Quick Create Load
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Load
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
          <input
            type="text"
            placeholder="Search loads, customers, carriers…"
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-[#080F1E] border border-[#1A2235] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/40 transition-colors"
          />
        </div>

        {/* Customer filter */}
        <select
          value={customerFilter}
          onChange={(e) => handleFilterChange('customer', e.target.value)}
          className="bg-[#080F1E] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/40 transition-colors"
        >
          <option value="all">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="bg-[#080F1E] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/40 transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="booked">Booked</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#8B95A5]" />
          <input
            type="date"
            defaultValue={sp.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="bg-[#080F1E] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/40 transition-colors"
          />
          <span className="text-[#8B95A5] text-xs">to</span>
          <input
            type="date"
            defaultValue={sp.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="bg-[#080F1E] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/40 transition-colors"
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => navigate('/loads')}
            className="flex items-center gap-1.5 text-xs text-[#8B95A5] hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <SortHeader href={buildSortHref('loadRef')} label="Load Ref" isActive={sortBy === 'loadRef'} dir={sortDir as 'asc' | 'desc'} />
              <SortHeader href={buildSortHref('customerName')} label="Customer" isActive={sortBy === 'customerName'} dir={sortDir as 'asc' | 'desc'} />
              <SortHeader href={buildSortHref('carrierName')} label="Carrier" isActive={sortBy === 'carrierName'} dir={sortDir as 'asc' | 'desc'} />
              <SortHeader href={buildSortHref('origin')} label="Origin" isActive={sortBy === 'origin'} dir={sortDir as 'asc' | 'desc'} />
              <SortHeader href={buildSortHref('destination')} label="Destination" isActive={sortBy === 'destination'} dir={sortDir as 'asc' | 'desc'} />
              <SortHeader href={buildSortHref('revenue')} label="Revenue" isActive={sortBy === 'revenue'} dir={sortDir as 'asc' | 'desc'} align="right" />
              <SortHeader href={buildSortHref('cost')} label="Cost" isActive={sortBy === 'cost'} dir={sortDir as 'asc' | 'desc'} align="right" />
              <SortHeader href={buildSortHref('margin')} label="Margin $" isActive={sortBy === 'margin'} dir={sortDir as 'asc' | 'desc'} align="right" />
              <SortHeader href={buildSortHref('marginPct')} label="Margin %" isActive={sortBy === 'marginPct'} dir={sortDir as 'asc' | 'desc'} align="right" />
              <SortHeader href={buildSortHref('status')} label="Status" isActive={sortBy === 'status'} dir={sortDir as 'asc' | 'desc'} />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {loads.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-[#8B95A5] py-12 text-sm">
                  No loads match your filters.{' '}
                  <button onClick={() => navigate('/loads')} className="text-[#00C650] underline">
                    Clear filters →
                  </button>
                </td>
              </tr>
            )}
            {loads.map((load) => {
              const margin = load.revenue - load.cost;
              const marginPct = load.revenue > 0 ? (margin / load.revenue) * 100 : 0;
              const color = getMarginColor(marginPct);
              const bg = getMarginBg(marginPct);

              return (
                <tr
                  key={load.id}
                  className="hover:bg-[#0C1528] transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3.5">
                    <Link href={`/loads/${load.id}`} className="block">
                      <span className="text-sm font-medium text-white group-hover:text-[#00C650] transition-colors font-mono">
                        {load.loadRef}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/loads/${load.id}`} className="block">
                      <span className="text-sm text-[#CBD5E1]">{load.customerName}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/loads/${load.id}`} className="block">
                      <span className="text-sm text-[#8B95A5]">{load.carrierName ?? '—'}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/loads/${load.id}`} className="block">
                      <span className="text-sm text-[#8B95A5]">{load.origin ?? '—'}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/loads/${load.id}`} className="block">
                      <span className="text-sm text-[#8B95A5]">{load.destination ?? '—'}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/loads/${load.id}`} className="block">
                      <span className="text-sm text-white font-medium">{fmt(load.revenue)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/loads/${load.id}`} className="block">
                      <span className="text-sm text-[#8B95A5]">{fmt(load.cost)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/loads/${load.id}`} className="block">
                      <span
                        className="text-sm font-medium"
                        style={{ color }}
                      >
                        {fmt(margin)}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/loads/${load.id}`} className="block">
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-xs font-medium"
                        style={{ color, backgroundColor: bg }}
                      >
                        {marginPct.toFixed(1)}%
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/loads/${load.id}`} className="block">
                      <LoadStatusBadge status={load.status} size="sm" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Totals row */}
          {loads.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-[#1A2235] bg-[#040810]">
                <td colSpan={5} className="px-4 py-3.5">
                  <span className="text-xs font-semibold text-[#8B95A5] uppercase tracking-wide">
                    Totals ({total} load{total !== 1 ? 's' : ''})
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm font-semibold text-white">{fmt(totals.totalRevenue)}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm font-semibold text-[#8B95A5]">{fmt(totals.totalCost)}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: getMarginColor(totals.avgMarginPct) }}
                  >
                    {fmt(totals.totalMargin)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span
                    className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
                    style={{
                      color: getMarginColor(totals.avgMarginPct),
                      backgroundColor: getMarginBg(totals.avgMarginPct),
                    }}
                  >
                    {totals.avgMarginPct.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3.5" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      <Pagination total={total} page={page} pageSize={pageSize} />

      {/* Quick Create Modal */}
      <QuickCreateLoadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => router.refresh()}
        customers={customers}
      />
    </div>
  );
}
