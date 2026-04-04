import type { RateBasis } from '@/db/schema';
import { cn } from '@/lib/utils';

const BASIS_CONFIG: Record<RateBasis, { label: string; className: string }> = {
  per_mile: { label: 'Per Mile', className: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  flat: { label: 'Flat', className: 'text-green-400 bg-green-400/10 border-green-400/20' },
  per_cwt: { label: 'Per CWT', className: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  per_pallet: { label: 'Per Pallet', className: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
};

interface RateBasisBadgeProps {
  basis: RateBasis;
  className?: string;
}

export function RateBasisBadge({ basis, className }: RateBasisBadgeProps) {
  const config = BASIS_CONFIG[basis] ?? { label: basis, className: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
