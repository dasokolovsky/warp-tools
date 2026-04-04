'use client';

import Link from 'next/link';
import type { Shipment } from '@/db/schema';
import { ShipmentStatusBadge } from '@/components/ShipmentStatusBadge';
import { formatCurrency, formatDate, getMarginColor, getHealthScoreColor } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface ShipmentTableProps {
  shipments: Shipment[];
  total: number;
  page: number;
  totalPages: number;
  sort: string;
  sortDir: string;
  onSort: (col: string) => void;
  onPage: (p: number) => void;
}

const COLUMNS = [
  { key: 'shipmentNumber', label: 'Shipment #', sortable: true },
  { key: 'customerName', label: 'Customer', sortable: true },
  { key: 'route', label: 'Origin → Dest', sortable: false },
  { key: 'carrierName', label: 'Carrier', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'pickupDate', label: 'Pickup', sortable: true },
  { key: 'deliveryDate', label: 'Delivery', sortable: true },
  { key: 'customerRate', label: 'Revenue', sortable: true },
  { key: 'carrierRate', label: 'Cost', sortable: true },
  { key: 'marginPct', label: 'Margin', sortable: true },
  { key: 'docScore', label: 'Docs', sortable: false },
  { key: 'healthScore', label: 'Health', sortable: true },
];

function SortIcon({ col, sort, sortDir }: { col: string; sort: string; sortDir: string }) {
  if (col !== sort) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  return sortDir === 'asc' ? (
    <ChevronUp className="h-3 w-3 text-[#00C650]" />
  ) : (
    <ChevronDown className="h-3 w-3 text-[#00C650]" />
  );
}

export function ShipmentTable({
  shipments,
  total,
  page,
  totalPages,
  sort,
  sortDir,
  onSort,
  onPage,
}: ShipmentTableProps) {
  return (
    <div className="space-y-2">
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`text-left px-3 py-3 text-xs font-medium text-[#8B95A5] whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-white select-none' : ''}`}
                    onClick={col.sortable ? () => onSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && <SortIcon col={col.key} sort={sort} sortDir={sortDir} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-[#8B95A5]">
                    No shipments found
                  </td>
                </tr>
              )}
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-[#1A2235]/50 hover:bg-[#0C1528] transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Link href={`/shipments/${s.id}`} className="text-[#00C650] hover:underline font-medium text-xs">
                      {s.shipmentNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-[#8B95A5] text-xs max-w-32 truncate">{s.customerName}</td>
                  <td className="px-3 py-3 text-[#8B95A5] text-xs whitespace-nowrap">
                    {s.originCity}, {s.originState} → {s.destCity}, {s.destState}
                  </td>
                  <td className="px-3 py-3 text-[#8B95A5] text-xs max-w-32 truncate">{s.carrierName ?? '—'}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <ShipmentStatusBadge status={s.status} size="sm" />
                  </td>
                  <td className="px-3 py-3 text-[#8B95A5] text-xs whitespace-nowrap">{formatDate(s.pickupDate)}</td>
                  <td className="px-3 py-3 text-[#8B95A5] text-xs whitespace-nowrap">{formatDate(s.deliveryDate)}</td>
                  <td className="px-3 py-3 text-white text-xs text-right whitespace-nowrap">{formatCurrency(s.customerRate)}</td>
                  <td className="px-3 py-3 text-[#8B95A5] text-xs text-right whitespace-nowrap">{formatCurrency(s.carrierRate)}</td>
                  <td className="px-3 py-3 text-xs text-right whitespace-nowrap">
                    {s.marginPct != null ? (
                      <span className={`font-semibold ${getMarginColor(s.marginPct)}`}>
                        {s.marginPct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-[#8B95A5]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-center whitespace-nowrap">
                    <span className="text-[#8B95A5]">{s.docScore ?? 0}%</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-center whitespace-nowrap">
                    {s.healthScore != null ? (
                      <span className={`font-bold ${getHealthScoreColor(s.healthScore)}`}>
                        {s.healthScore}
                      </span>
                    ) : (
                      <span className="text-[#8B95A5]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-[#8B95A5]">
        <span>{total} shipments</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="px-2 py-1 rounded bg-[#0C1528] border border-[#1A2235] hover:border-[#2A3245] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded bg-[#0C1528] border border-[#1A2235] hover:border-[#2A3245] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
