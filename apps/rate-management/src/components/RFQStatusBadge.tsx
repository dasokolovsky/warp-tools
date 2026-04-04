import { cn, getRFQStatusLabel, getRFQStatusColor } from '@/lib/utils';
import type { RFQStatus } from '@/db/schema';

interface RFQStatusBadgeProps {
  status: RFQStatus;
  className?: string;
}

export function RFQStatusBadge({ status, className }: RFQStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium',
        getRFQStatusColor(status),
        className
      )}
    >
      {getRFQStatusLabel(status)}
    </span>
  );
}
