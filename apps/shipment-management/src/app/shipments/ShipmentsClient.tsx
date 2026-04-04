'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Shipment, ShipmentStatus } from '@/db/schema';
import { ShipmentKanban } from './ShipmentKanban';
import { ShipmentTable } from './ShipmentTable';
import { ShipmentFilters } from './ShipmentFilters';
import { ExportCSV } from '@/components/ExportCSV';
import { LayoutGrid, List } from 'lucide-react';

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

interface ShipmentsData {
  data: Shipment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ShipmentsClientProps {
  initialView: string;
  initialStatus: string;
  customers: string[];
  carriers: string[];
}

export function ShipmentsClient({
  initialView,
  initialStatus,
  customers,
  carriers,
}: ShipmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<'table' | 'kanban'>(() =>
    initialView === 'kanban' ? 'kanban' : 'table'
  );
  const [filters, setFilters] = useState<FilterState>(() => ({
    q: '',
    statuses: initialStatus ? [initialStatus as ShipmentStatus] : [],
    customer: '',
    carrier: '',
    equipment: '',
    dateFrom: '',
    dateTo: '',
    marginFilter: '',
    docStatus: '',
  }));
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [data, setData] = useState<ShipmentsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      filters.statuses.forEach((s) => params.append('status', s));
      if (filters.customer) params.set('customer', filters.customer);
      if (filters.carrier) params.set('carrier', filters.carrier);
      if (filters.equipment) params.set('equipment', filters.equipment);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.marginFilter) params.set('marginFilter', filters.marginFilter);
      if (filters.docStatus) params.set('docStatus', filters.docStatus);
      params.set('sort', sort);
      params.set('sortDir', sortDir);
      params.set('page', String(page));
      params.set('pageSize', view === 'kanban' ? '200' : '25');

      const res = await fetch(`/api/shipments?${params.toString()}`);
      const json: ShipmentsData = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, sortDir, page, view]);

  useEffect(() => {
    void fetchShipments();
  }, [fetchShipments]);

  function handleSort(col: string) {
    if (col === sort) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(col);
      setSortDir('desc');
    }
    setPage(1);
  }

  function handleFiltersChange(newFilters: FilterState) {
    setFilters(newFilters);
    setPage(1);
  }

  function handleViewChange(newView: 'table' | 'kanban') {
    setView(newView);
    const url = new URL(window.location.href);
    if (newView === 'kanban') {
      url.searchParams.set('view', 'kanban');
    } else {
      url.searchParams.delete('view');
    }
    router.replace(url.pathname + url.search, { scroll: false });
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Shipments</h1>
          <p className="text-[#8B95A5] text-sm mt-1">
            {data ? `${data.total} shipments` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[#0C1528] border border-[#1A2235] rounded-lg p-1 gap-1">
            <button
              onClick={() => handleViewChange('table')}
              className={`p-1.5 rounded transition-colors ${view === 'table' ? 'bg-[#1A2235] text-white' : 'text-[#8B95A5] hover:text-white'}`}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewChange('kanban')}
              className={`p-1.5 rounded transition-colors ${view === 'kanban' ? 'bg-[#1A2235] text-white' : 'text-[#8B95A5] hover:text-white'}`}
              title="Kanban view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {data && (
            <ExportCSV shipments={data.data} filename="shipments-export.csv" />
          )}

          <Link
            href="/shipments/new"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors"
          >
            + New Shipment
          </Link>
        </div>
      </div>

      {/* Filters */}
      <ShipmentFilters
        filters={filters}
        customers={customers}
        carriers={carriers}
        onChange={handleFiltersChange}
      />

      {/* Content */}
      {loading ? (
        <div className="text-[#8B95A5] text-sm py-8 text-center">Loading shipments…</div>
      ) : data ? (
        view === 'kanban' ? (
          <ShipmentKanban shipments={data.data} />
        ) : (
          <ShipmentTable
            shipments={data.data}
            total={data.total}
            page={data.page}
            totalPages={data.totalPages}
            sort={sort}
            sortDir={sortDir}
            onSort={handleSort}
            onPage={setPage}
          />
        )
      ) : null}
    </div>
  );
}
