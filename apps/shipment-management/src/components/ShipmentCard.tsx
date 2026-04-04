import Link from 'next/link';
import { getMarginColor, getHealthScoreColor } from '@/lib/utils';
import type { Shipment } from '@/db/schema';

interface ShipmentCardProps {
  shipment: Shipment;
  today: string;
  tomorrow: string;
}

export function ShipmentCard({ shipment: s, today, tomorrow }: ShipmentCardProps) {
  const isPickupToday = s.pickupDate === today;
  const isPickupTomorrow = s.pickupDate === tomorrow;

  let urgencyBorder = 'border-[#1A2235]';
  if (isPickupToday) urgencyBorder = 'border-red-500/50';
  else if (isPickupTomorrow) urgencyBorder = 'border-yellow-500/50';

  return (
    <Link
      href={`/shipments/${s.id}`}
      className={`block bg-[#080F1E] border ${urgencyBorder} rounded-lg p-3 hover:border-[#00C650]/30 transition-colors space-y-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-[#00C650]">{s.shipmentNumber}</span>
        {s.healthScore != null && (
          <span className={`text-xs font-bold ${getHealthScoreColor(s.healthScore)}`}>
            {s.healthScore}
          </span>
        )}
      </div>

      <div className="text-xs text-white font-medium truncate">
        {s.originCity}, {s.originState} → {s.destCity}, {s.destState}
      </div>

      <div className="text-xs text-[#8B95A5] truncate">{s.customerName}</div>

      {s.carrierName && (
        <div className="text-xs text-[#8B95A5] truncate">{s.carrierName}</div>
      )}

      <div className="flex items-center justify-between gap-2">
        {s.marginPct != null ? (
          <span className={`text-xs font-semibold ${getMarginColor(s.marginPct)}`}>
            {s.marginPct.toFixed(1)}%
          </span>
        ) : (
          <span className="text-xs text-[#8B95A5]">No rate</span>
        )}
        <div className="flex gap-1 text-xs">
          <span title="BOL">{s.hasBol ? '✅' : '❌'}</span>
          <span title="POD">{s.hasPod ? '✅' : '❌'}</span>
          <span title="Rate Con">{s.hasRateCon ? '✅' : '❌'}</span>
        </div>
      </div>

      {isPickupToday && (
        <div className="text-xs text-red-400 font-medium">🔴 Pickup today</div>
      )}
      {isPickupTomorrow && !isPickupToday && (
        <div className="text-xs text-yellow-400 font-medium">🟡 Pickup tomorrow</div>
      )}
    </Link>
  );
}
