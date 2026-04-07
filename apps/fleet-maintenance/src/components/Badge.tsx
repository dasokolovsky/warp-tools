import { cn, STATUS_COLORS, statusLabel } from '@/lib/utils';

interface BadgeProps {
  status: string;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        color,
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
