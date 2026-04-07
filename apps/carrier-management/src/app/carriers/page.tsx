export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { carriers, carrierInsurance } from '@/db/schema';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreRing } from '@/components/ScoreRing';
import { CarrierSearch } from './CarrierSearch';
import { SortHeader } from '@/components/SortHeader';
import { Pagination } from '@/components/Pagination';

const PAGE_SIZE = 25;

const equipLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  lowboy: 'Lowboy',
  sprinter_van: 'Sprinter',
  cargo_van: 'Cargo Van',
};

type SortBy = 'name' | 'mcNumber' | 'overallScore' | 'status' | 'location';
type SortDir = 'asc' | 'desc';

async function getInsuranceAlerts() {
  const all = await db.select().from(carrierInsurance);
  const now = new Date();
  const alerts: Record<string, 'expired' | 'expiring_soon'> = {};
  for (const ins of all) {
    const d = new Date(ins.expiryDate);
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (d < now) {
      alerts[ins.carrierId] = 'expired';
    } else if (diff <= 30 && alerts[ins.carrierId] !== 'expired') {
      alerts[ins.carrierId] = 'expiring_soon';
    }
  }
  return alerts;
}

function buildSortHref(
  current: URLSearchParams,
  col: SortBy,
  currentSortBy: SortBy,
  currentSortDir: SortDir
): string {
  const p = new URLSearchParams(current.toString());
  p.set('sortBy', col);
  p.set('sortDir', currentSortBy === col && currentSortDir === 'asc' ? 'desc' : 'asc');
  p.delete('page');
  return `/carriers?${p.toString()}`;
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    equipment?: string;
    score?: string;
    compliance?: string;
    vetting?: string;
    sortBy?: string;
    sortDir?: string;
    page?: string;
  }>;
}

export default async function CarriersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search;
  const status = params.status;
  const equipmentFilter = params.equipment;
  const scoreFilter = params.score;
  const complianceFilter = params.compliance;
  const vettingFilter = params.vetting;
  const sortBy = (params.sortBy as SortBy) || 'name';
  const sortDir = (params.sortDir as SortDir) || 'asc';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const [allCarriers, insuranceAlerts] = await Promise.all([
    db.select().from(carriers),
    getInsuranceAlerts(),
  ]);

  // ── Filter ──────────────────────────────────────────────────────────────
  let filtered = allCarriers;

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mcNumber?.toLowerCase().includes(q) ||
        c.dotNumber?.toLowerCase().includes(q) ||
        c.scacCode?.toLowerCase().includes(q) ||
        c.addressState?.toLowerCase().includes(q) ||
        c.addressCity?.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((c) => c.status === status);
  }

  if (equipmentFilter) {
    const selected = equipmentFilter.split(',').filter(Boolean);
    if (selected.length > 0) {
      filtered = filtered.filter((c) => {
        const equip: string[] = JSON.parse(c.equipmentTypes ?? '[]');
        return selected.some((e) => equip.includes(e));
      });
    }
  }

  if (scoreFilter && scoreFilter !== 'all') {
    filtered = filtered.filter((c) => {
      const s = c.overallScore ?? 0;
      if (scoreFilter === '90') return s >= 90;
      if (scoreFilter === '75') return s >= 75;
      if (scoreFilter === 'below75') return s < 75;
      return true;
    });
  }

  if (complianceFilter && complianceFilter !== 'all') {
    filtered = filtered.filter((c) => {
      const alert = insuranceAlerts[c.id];
      if (complianceFilter === 'expired') return alert === 'expired';
      if (complianceFilter === 'expiring_soon') return alert === 'expiring_soon';
      if (complianceFilter === 'ok') return !alert;
      return true;
    });
  }

  if (vettingFilter && vettingFilter !== 'all') {
    filtered = filtered.filter((c) => {
      if (vettingFilter === 'pending') {
        return c.vettingStatus === 'not_started' || c.vettingStatus === 'in_progress';
      }
      return c.vettingStatus === vettingFilter;
    });
  }

  // ── Sort ─────────────────────────────────────────────────────────────────
  const mult = sortDir === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return mult * a.name.localeCompare(b.name);
      case 'mcNumber':
        return mult * (a.mcNumber ?? '').localeCompare(b.mcNumber ?? '');
      case 'overallScore':
        return mult * ((a.overallScore ?? 0) - (b.overallScore ?? 0));
      case 'status':
        return mult * a.status.localeCompare(b.status);
      case 'location': {
        const locA = [a.addressCity, a.addressState].filter(Boolean).join(', ');
        const locB = [b.addressCity, b.addressState].filter(Boolean).join(', ');
        return mult * locA.localeCompare(locB);
      }
      default:
        return 0;
    }
  });

  // ── Paginate ─────────────────────────────────────────────────────────────
  const total = filtered.length;
  const pageCarriers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Build URLSearchParams for sort links
  const qp = new URLSearchParams();
  if (search) qp.set('search', search);
  if (status) qp.set('status', status);
  if (equipmentFilter) qp.set('equipment', equipmentFilter);
  if (scoreFilter) qp.set('score', scoreFilter);
  if (complianceFilter) qp.set('compliance', complianceFilter);
  if (vettingFilter) qp.set('vetting', vettingFilter);

  const sortCols: { col: SortBy; label: string }[] = [
    { col: 'name', label: 'Carrier' },
    { col: 'mcNumber', label: 'MC #' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Carriers</h1>
          <p className="text-[#8B95A5] text-sm mt-0.5">
            {total} carrier{total !== 1 ? 's' : ''}{total !== allCarriers.length ? ` of ${allCarriers.length} total` : ' total'}
          </p>
        </div>
        <Link
          href="/carriers/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Carrier
        </Link>
      </div>

      {/* Search + Filters */}
      <CarrierSearch
        initialSearch={search}
        initialStatus={status}
        initialEquipment={equipmentFilter}
        initialScore={scoreFilter}
        initialCompliance={complianceFilter}
        initialVetting={vettingFilter}
      />

      {/* Table */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden mt-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <SortHeader
                href={buildSortHref(qp, 'name', sortBy, sortDir)}
                label="Carrier"
                isActive={sortBy === 'name'}
                dir={sortDir}
              />
              <SortHeader
                href={buildSortHref(qp, 'mcNumber', sortBy, sortDir)}
                label="MC #"
                isActive={sortBy === 'mcNumber'}
                dir={sortDir}
              />
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
                Equipment
              </th>
              <SortHeader
                href={buildSortHref(qp, 'location', sortBy, sortDir)}
                label="Location"
                isActive={sortBy === 'location'}
                dir={sortDir}
              />
              <SortHeader
                href={buildSortHref(qp, 'overallScore', sortBy, sortDir)}
                label="Score"
                isActive={sortBy === 'overallScore'}
                dir={sortDir}
              />
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
                Insurance
              </th>
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
                Vetting
              </th>
              <SortHeader
                href={buildSortHref(qp, 'status', sortBy, sortDir)}
                label="Status"
                isActive={sortBy === 'status'}
                dir={sortDir}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {pageCarriers.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-[#8B95A5] py-12 text-sm">
                  No carriers match your filters.{' '}
                  <Link href="/carriers" className="text-[#00C650] underline">
                    Clear filters →
                  </Link>
                </td>
              </tr>
            )}
            {pageCarriers.map((carrier) => {
              const equip: string[] = JSON.parse(carrier.equipmentTypes ?? '[]');
              const insAlert = insuranceAlerts[carrier.id];

              return (
                <tr
                  key={carrier.id}
                  className="hover:bg-[#0C1528] transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <div className="text-sm font-medium text-white group-hover:text-[#00C650] transition-colors">
                        {carrier.name}
                      </div>
                      {carrier.dotNumber && (
                        <div className="text-xs text-[#8B95A5] mt-0.5">DOT {carrier.dotNumber}</div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <span className="text-sm text-[#8B95A5] font-mono">{carrier.mcNumber ?? '—'}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <div className="flex flex-wrap gap-1">
                        {equip.slice(0, 2).map((e) => (
                          <span
                            key={e}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-[#0C1528] border border-[#1A2235] text-[#8B95A5]"
                          >
                            {equipLabels[e] ?? e}
                          </span>
                        ))}
                        {equip.length > 2 && (
                          <span className="text-[10px] text-[#8B95A5]">+{equip.length - 2}</span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <span className="text-sm text-[#8B95A5]">
                        {carrier.addressCity && carrier.addressState
                          ? `${carrier.addressCity}, ${carrier.addressState}`
                          : '—'}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <ScoreRing score={carrier.overallScore} size={36} />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      {insAlert ? (
                        <StatusBadge status={insAlert} />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#00C650]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00C650]" />
                          OK
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}?tab=vetting`} className="block">
                      <VettingBadgeSmall status={carrier.vettingStatus} />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/carriers/${carrier.id}`} className="block">
                      <StatusBadge status={carrier.status} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
    </div>
  );
}

function VettingBadgeSmall({ status }: { status: string | null }) {
  const map: Record<string, { color: string; label: string }> = {
    not_started: { color: '#8B95A5', label: 'Not Started' },
    in_progress: { color: '#FFAA00', label: 'In Progress' },
    vetted: { color: '#3B82F6', label: 'Vetted' },
    approved: { color: '#00C650', label: 'Approved' },
    rejected: { color: '#FF4444', label: 'Rejected' },
  };
  const s = status ?? 'not_started';
  const { color, label } = map[s] ?? map.not_started;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ color, backgroundColor: `${color}18` }}
    >
      {label}
    </span>
  );
}
