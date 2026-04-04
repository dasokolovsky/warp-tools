'use client';

import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

type AgingBucket = {
  label: string;
  amount: number;
  count: number;
  color: string;
  hoverColor: string;
  agingParam: string;
};

type AgingChartProps = {
  buckets: {
    current: { amount: number; count: number };
    days1to30: { amount: number; count: number };
    days31to60: { amount: number; count: number };
    days61to90: { amount: number; count: number };
    days90plus: { amount: number; count: number };
  };
};

export function AgingChart({ buckets }: AgingChartProps) {
  const router = useRouter();

  const data: AgingBucket[] = [
    {
      label: 'Current',
      amount: buckets.current.amount,
      count: buckets.current.count,
      color: '#00C650',
      hoverColor: '#00B347',
      agingParam: 'current',
    },
    {
      label: '1–30 Days',
      amount: buckets.days1to30.amount,
      count: buckets.days1to30.count,
      color: '#FFAA00',
      hoverColor: '#E09900',
      agingParam: '1-30',
    },
    {
      label: '31–60 Days',
      amount: buckets.days31to60.amount,
      count: buckets.days31to60.count,
      color: '#FF7700',
      hoverColor: '#E06800',
      agingParam: '31-60',
    },
    {
      label: '61–90 Days',
      amount: buckets.days61to90.amount,
      count: buckets.days61to90.count,
      color: '#FF4444',
      hoverColor: '#E03030',
      agingParam: '61-90',
    },
    {
      label: '90+ Days',
      amount: buckets.days90plus.amount,
      count: buckets.days90plus.count,
      color: '#AA1111',
      hoverColor: '#8A0808',
      agingParam: '90plus',
    },
  ];

  const totalAmount = data.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-3">
      {data.map((bucket) => {
        const pct = totalAmount > 0 ? (bucket.amount / totalAmount) * 100 : 0;
        const isEmpty = bucket.amount === 0;

        return (
          <button
            key={bucket.agingParam}
            onClick={() => router.push(`/invoices?aging=${bucket.agingParam}`)}
            className="w-full text-left group"
            disabled={isEmpty}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: bucket.color }}
                />
                <span className="text-sm font-medium text-white">{bucket.label}</span>
                {bucket.count > 0 && (
                  <span className="text-xs text-[#8B95A5]">
                    {bucket.count} invoice{bucket.count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold" style={{ color: isEmpty ? '#4B5563' : bucket.color }}>
                {isEmpty ? '—' : formatCurrency(bucket.amount)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#1A2235] overflow-hidden">
              {!isEmpty && (
                <div
                  className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: bucket.color,
                  }}
                />
              )}
            </div>
          </button>
        );
      })}

      {totalAmount > 0 && (
        <div className="pt-2 border-t border-[#1A2235] flex items-center justify-between">
          <span className="text-xs text-[#8B95A5] uppercase tracking-wide font-medium">
            Total Outstanding
          </span>
          <span className="text-sm font-bold text-white">{formatCurrency(totalAmount)}</span>
        </div>
      )}
    </div>
  );
}
