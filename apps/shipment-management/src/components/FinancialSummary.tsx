import { formatCurrency, getMarginColor } from '@/lib/utils';

interface FinancialSummaryProps {
  customerRate: number | null;
  carrierRate: number | null;
  rateType?: 'flat' | 'per_mile';
  miles?: number | null;
}

export function FinancialSummary({ customerRate, carrierRate, rateType, miles }: FinancialSummaryProps) {
  const margin = customerRate != null && carrierRate != null ? customerRate - carrierRate : null;
  const marginPct =
    margin != null && customerRate != null && customerRate > 0
      ? (margin / customerRate) * 100
      : null;

  return (
    <div className="bg-[#080F1E] border border-[#1A2235] rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Financial Summary</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-[#8B95A5] mb-1">Customer Rate</div>
          <div className="text-sm font-medium text-white">{formatCurrency(customerRate)}</div>
        </div>
        <div>
          <div className="text-xs text-[#8B95A5] mb-1">Carrier Rate</div>
          <div className="text-sm font-medium text-white">{formatCurrency(carrierRate)}</div>
        </div>
        <div>
          <div className="text-xs text-[#8B95A5] mb-1">Margin</div>
          <div className={`text-sm font-bold ${getMarginColor(marginPct)}`}>
            {formatCurrency(margin)}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#8B95A5] mb-1">Margin %</div>
          <div className={`text-sm font-bold ${getMarginColor(marginPct)}`}>
            {marginPct != null ? `${marginPct.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>
      {rateType && rateType === 'per_mile' && miles != null && (
        <div className="text-xs text-[#8B95A5] border-t border-[#1A2235] pt-2">
          Rate type: Per mile · {miles.toLocaleString()} miles
        </div>
      )}
    </div>
  );
}
