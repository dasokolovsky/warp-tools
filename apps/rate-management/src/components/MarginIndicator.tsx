import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarginIndicatorProps {
  tariffRate: number;
  carrierRate: number;
  showDollar?: boolean;
  className?: string;
}

export function MarginIndicator({ tariffRate, carrierRate, showDollar = true, className }: MarginIndicatorProps) {
  const dollarMargin = tariffRate - carrierRate;
  const pctMargin = tariffRate > 0 ? (dollarMargin / tariffRate) * 100 : 0;

  const colorClass =
    pctMargin >= 15 ? 'text-green-400' :
    pctMargin >= 10 ? 'text-yellow-400' :
    'text-red-400';

  const Icon = pctMargin >= 0 ? TrendingUp : TrendingDown;

  return (
    <span className={cn('inline-flex items-center gap-1 font-semibold', colorClass, className)}>
      <Icon className="h-3 w-3 flex-shrink-0" />
      {showDollar && (
        <span className="text-xs">
          {dollarMargin >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(dollarMargin)}
        </span>
      )}
      <span className="text-xs">({pctMargin.toFixed(1)}%)</span>
    </span>
  );
}
