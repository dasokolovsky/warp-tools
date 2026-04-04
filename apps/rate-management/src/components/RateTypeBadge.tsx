import type { RateType } from '@/db/schema';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<RateType, { label: string; className: string }> = {
  spot: { label: 'Spot', className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  contract: { label: 'Contract', className: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
};

interface RateTypeBadgeProps {
  type: RateType;
  className?: string;
}

export function RateTypeBadge({ type, className }: RateTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? { label: type, className: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
