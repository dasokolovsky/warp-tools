import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpiringItem {
  type: 'carrier' | 'tariff';
  id: number;
  name: string;
  rate: number;
  basis: string;
  expiry_date?: string | null;
  lane?: {
    origin_city: string;
    origin_state: string;
    dest_city: string;
    dest_state: string;
  } | null;
}

interface ExpiringRateAlertProps {
  items: ExpiringItem[];
  warningDays?: number;
  className?: string;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function ExpiringRateAlert({ items, warningDays = 30, className }: ExpiringRateAlertProps) {
  if (items.length === 0) return null;

  const urgent = items.filter(i => i.expiry_date && daysUntil(i.expiry_date) <= 7);
  const isUrgent = urgent.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        isUrgent
          ? 'bg-red-400/10 border-red-400/20'
          : 'bg-yellow-400/10 border-yellow-400/20',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className={cn('h-4 w-4', isUrgent ? 'text-red-400' : 'text-yellow-400')} />
        <span className={cn('text-sm font-semibold', isUrgent ? 'text-red-400' : 'text-yellow-400')}>
          {items.length} rate{items.length !== 1 ? 's' : ''} expiring within {warningDays} days
        </span>
      </div>
      <div className="space-y-2">
        {items.map(item => {
          const days = item.expiry_date ? daysUntil(item.expiry_date) : null;
          const isItemUrgent = days !== null && days <= 7;
          return (
            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between text-sm">
              <div>
                <span className={cn('font-medium', isItemUrgent ? 'text-red-300' : 'text-white')}>
                  {item.name}
                </span>
                {item.lane && (
                  <span className="text-[#8B95A5] ml-2 text-xs">
                    {item.lane.origin_city}, {item.lane.origin_state} → {item.lane.dest_city}, {item.lane.dest_state}
                  </span>
                )}
                <span className={cn('ml-2 text-xs px-1.5 py-0.5 rounded border', item.type === 'carrier' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-purple-400 bg-purple-400/10 border-purple-400/20')}>
                  {item.type === 'carrier' ? 'Carrier' : 'Tariff'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8B95A5]">
                <span>${item.rate.toLocaleString()}/{item.basis.replace('_', ' ')}</span>
                {item.expiry_date && (
                  <span className={cn('flex items-center gap-1', isItemUrgent ? 'text-red-400' : 'text-yellow-400')}>
                    <Clock className="h-3 w-3" />
                    {days === 0 ? 'Expires today' : days === 1 ? '1 day left' : `${days}d left`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
