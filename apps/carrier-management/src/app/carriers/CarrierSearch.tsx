'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search, X } from 'lucide-react';

const equipmentOptions = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'lowboy', label: 'Lowboy' },
  { value: 'sprinter_van', label: 'Sprinter' },
  { value: 'cargo_van', label: 'Cargo Van' },
];

interface CarrierSearchProps {
  initialSearch?: string;
  initialStatus?: string;
  initialEquipment?: string;
  initialScore?: string;
  initialCompliance?: string;
  initialVetting?: string;
}

export function CarrierSearch({
  initialSearch,
  initialStatus,
  initialEquipment,
  initialScore,
  initialCompliance,
  initialVetting,
}: CarrierSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      // reset to page 1 whenever filters change
      params.delete('page');
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      startTransition(() => router.push(`/carriers?${params.toString()}`));
    },
    [router, searchParams]
  );

  // Equipment multi-select toggle
  const selectedEquip: string[] = initialEquipment ? initialEquipment.split(',').filter(Boolean) : [];

  const toggleEquip = (val: string) => {
    const next = selectedEquip.includes(val)
      ? selectedEquip.filter((e) => e !== val)
      : [...selectedEquip, val];
    updateParams({ equipment: next.join(',') || null });
  };

  const hasFilters = !!(initialSearch || (initialStatus && initialStatus !== 'all') || selectedEquip.length || (initialScore && initialScore !== 'all') || (initialCompliance && initialCompliance !== 'all') || (initialVetting && initialVetting !== 'all'));

  const clearAll = () => {
    startTransition(() => router.push('/carriers'));
  };

  return (
    <div className="space-y-3">
      {/* Row 1: search + status + score + compliance */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
          <input
            type="text"
            placeholder="Search carriers, MC#, DOT#..."
            defaultValue={initialSearch}
            onChange={(e) => {
              const v = e.target.value;
              clearTimeout((window as any).__searchTimeout);
              (window as any).__searchTimeout = setTimeout(() => updateParams({ search: v }), 300);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#080F1E] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50 transition-colors"
          />
        </div>

        {/* Status */}
        <select
          defaultValue={initialStatus ?? 'all'}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="px-3 py-2 rounded-xl bg-[#080F1E] border border-[#1A2235] text-sm text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50 transition-colors cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>

        {/* Score range */}
        <select
          defaultValue={initialScore ?? 'all'}
          onChange={(e) => updateParams({ score: e.target.value })}
          className="px-3 py-2 rounded-xl bg-[#080F1E] border border-[#1A2235] text-sm text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50 transition-colors cursor-pointer"
        >
          <option value="all">All Scores</option>
          <option value="90">Score 90+</option>
          <option value="75">Score 75+</option>
          <option value="below75">Below 75</option>
        </select>

        {/* Compliance status */}
        <select
          defaultValue={initialCompliance ?? 'all'}
          onChange={(e) => updateParams({ compliance: e.target.value })}
          className="px-3 py-2 rounded-xl bg-[#080F1E] border border-[#1A2235] text-sm text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50 transition-colors cursor-pointer"
        >
          <option value="all">All Compliance</option>
          <option value="ok">OK</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>

        {/* Vetting status */}
        <select
          defaultValue={initialVetting ?? 'all'}
          onChange={(e) => updateParams({ vetting: e.target.value })}
          className="px-3 py-2 rounded-xl bg-[#080F1E] border border-[#1A2235] text-sm text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50 transition-colors cursor-pointer"
        >
          <option value="all">All Vetting</option>
          <option value="pending">Pending Vetting</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="vetted">Vetted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-[#8B95A5] hover:text-white hover:bg-[#0C1528] border border-[#1A2235] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Row 2: Equipment type chips */}
      <div className="flex flex-wrap gap-1.5">
        {equipmentOptions.map((opt) => {
          const active = selectedEquip.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleEquip(opt.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                active
                  ? 'bg-[#00C650]/15 border-[#00C650]/40 text-[#00C650]'
                  : 'bg-[#080F1E] border-[#1A2235] text-[#8B95A5] hover:border-[#2A3245] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        {selectedEquip.length > 0 && (
          <span className="self-center text-xs text-[#8B95A5] ml-1">
            {selectedEquip.length} selected
          </span>
        )}
      </div>
    </div>
  );
}
