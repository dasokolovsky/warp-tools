import type { TariffStatus } from '@/db/schema';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<TariffStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'text-green-400 bg-green-400/10 border-green-400/20' },
  pending: { label: 'Pending', className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  expired: { label: 'Expired', className: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

interface TariffStatusBadgeProps {
  status: TariffStatus;
  className?: string;
}

export function TariffStatusBadge({ status, className }: TariffStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
