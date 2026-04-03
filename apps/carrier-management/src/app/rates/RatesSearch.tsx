'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search } from 'lucide-react';

const equipmentOptions = [
  { value: 'all', label: 'All Equipment' },
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'lowboy', label: 'Lowboy' },
  { value: 'sprinter_van', label: 'Sprinter' },
  { value: 'cargo_van', label: 'Cargo Van' },
];

interface RatesSearchProps {
  initialOrigin?: string;
  initialDest?: string;
  initialEquipment?: string;
}

export function RatesSearch({ initialOrigin, initialDest, initialEquipment }: RatesSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const updateSearch = useCallback(
    (origin: string, dest: string, equipment: string) => {
      const params = new URLSearchParams();
      if (origin) params.set('origin', origin);
      if (dest) params.set('dest', dest);
      if (equipment && equipment !== 'all') params.set('equipment', equipment);
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
        <input
          type="text"
          placeholder="Origin city or state..."
          defaultValue={initialOrigin ?? ''}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#080F1E] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
          onChange={(e) => {
            const val = e.target.value;
            const dest = (document.querySelector('input[name="dest"]') as HTMLInputElement)?.value ?? '';
            const equip = (document.querySelector('select[name="equipment"]') as HTMLSelectElement)?.value ?? '';
            updateSearch(val, dest, equip);
          }}
        />
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
        <input
          name="dest"
          type="text"
          placeholder="Destination city or state..."
          defaultValue={initialDest ?? ''}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#080F1E] border border-[#1A2235] text-white text-sm placeholder-[#8B95A5] focus:outline-none focus:border-[#00C650] transition-colors"
          onChange={(e) => {
            const val = e.target.value;
            const origin = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value ?? '';
            const equip = (document.querySelector('select[name="equipment"]') as HTMLSelectElement)?.value ?? '';
            updateSearch(origin, val, equip);
          }}
        />
      </div>

      <select
        name="equipment"
        defaultValue={initialEquipment ?? 'all'}
        className="px-3 py-2.5 rounded-xl bg-[#080F1E] border border-[#1A2235] text-white text-sm focus:outline-none focus:border-[#00C650] transition-colors min-w-[160px]"
        onChange={(e) => {
          const origin = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value ?? '';
          const dest = (document.querySelector('input[name="dest"]') as HTMLInputElement)?.value ?? '';
          updateSearch(origin, dest, e.target.value);
        }}
      >
        {equipmentOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {isPending && (
        <div className="flex items-center text-xs text-[#8B95A5]">
          <span className="animate-pulse">Searching...</span>
        </div>
      )}
    </div>
  );
}
