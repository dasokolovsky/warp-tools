import { getShipmentStatusLabel, getShipmentStatusColor } from '@/lib/utils';
import type { ShipmentStatus } from '@/db/schema';

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
  size?: 'sm' | 'md';
}

export function ShipmentStatusBadge({ status, size = 'md' }: ShipmentStatusBadgeProps) {
  const colorClass = getShipmentStatusColor(status);
  const label = getShipmentStatusLabel(status);
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${colorClass} ${sizeClass}`}
    >
      {label}
    </span>
  );
}
