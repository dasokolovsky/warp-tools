import { cn } from '@/lib/utils';

type Variant = 'active' | 'inactive' | 'blacklisted' | 'expiring_soon' | 'expired' | 'satisfactory' | 'conditional' | 'unsatisfactory' | 'not_rated' | 'unknown' | 'revoked';

const variants: Record<Variant, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-[#00C650]/10 text-[#00C650] border-[#00C650]/20' },
  inactive: { label: 'Inactive', className: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20' },
  blacklisted: { label: 'Blacklisted', className: 'bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/20' },
  expiring_soon: { label: 'Expiring Soon', className: 'bg-[#FFAA00]/10 text-[#FFAA00] border-[#FFAA00]/20' },
  expired: { label: 'Expired', className: 'bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/20' },
  satisfactory: { label: 'Satisfactory', className: 'bg-[#00C650]/10 text-[#00C650] border-[#00C650]/20' },
  conditional: { label: 'Conditional', className: 'bg-[#FFAA00]/10 text-[#FFAA00] border-[#FFAA00]/20' },
  unsatisfactory: { label: 'Unsatisfactory', className: 'bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/20' },
  not_rated: { label: 'Not Rated', className: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20' },
  unknown: { label: 'Unknown', className: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20' },
  revoked: { label: 'Revoked', className: 'bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/20' },
};

interface StatusBadgeProps {
  status: Variant | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const v = variants[status as Variant] ?? { label: status, className: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', v.className, className)}>
      {v.label}
    </span>
  );
}
