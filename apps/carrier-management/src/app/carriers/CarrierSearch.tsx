'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search } from 'lucide-react';

interface CarrierSearchProps {
  initialSearch?: string;
  initialStatus?: string;
}

export function CarrierSearch({ initialSearch, initialStatus }: CarrierSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/carriers?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
        <input
          type="text"
          placeholder="Search carriers, MC#, DOT#..."
          defaultValue={initialSearch}
          onChange={(e) => {
            const v = e.target.value;
            clearTimeout((window as any).__searchTimeout);
            (window as any).__searchTimeout = setTimeout(() => updateParams('search', v), 300);
          }}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#080F1E] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650]/50 transition-colors"
        />
      </div>

      {/* Status Filter */}
      <select
        defaultValue={initialStatus ?? 'all'}
        onChange={(e) => updateParams('status', e.target.value)}
        className="px-3 py-2 rounded-xl bg-[#080F1E] border border-[#1A2235] text-sm text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50 transition-colors cursor-pointer"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="blacklisted">Blacklisted</option>
      </select>
    </div>
  );
}
