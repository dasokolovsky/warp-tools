'use client';

import { fmt } from '@/lib/calc';

interface WaterfallStep {
  label: string;
  amount: number;
  type: 'revenue' | 'deduct' | 'result';
}

interface ProfitWaterfallProps {
  grossRevenue: number;
  directCosts: number;
  fixedCosts: number;
  netProfit: number;
}

export default function ProfitWaterfall({
  grossRevenue,
  directCosts,
  fixedCosts,
  netProfit,
}: ProfitWaterfallProps) {
  const steps: WaterfallStep[] = [
    { label: 'Gross Revenue', amount: grossRevenue, type: 'revenue' },
    { label: 'Direct Costs', amount: -directCosts, type: 'deduct' },
    { label: 'Gross Margin', amount: grossRevenue - directCosts, type: 'result' },
    { label: 'Fixed Costs', amount: -fixedCosts, type: 'deduct' },
    { label: 'True Net Profit', amount: netProfit, type: 'result' },
  ];

  const maxAbs = Math.max(grossRevenue, 1);

  function barConfig(step: WaterfallStep) {
    const pct = Math.min(Math.abs(step.amount) / maxAbs, 1) * 100;
    if (step.type === 'revenue') return { color: '#00C650', pct };
    if (step.type === 'deduct') return { color: '#FF4444', pct };
    if (step.amount >= 0) return { color: '#00C650', pct };
    return { color: '#FF4444', pct };
  }

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const { color, pct } = barConfig(step);
        const isDivider = step.type === 'result' && step.label === 'Gross Margin';
        return (
          <div key={step.label}>
            {isDivider && (
              <div className="border-t border-warp-border my-3" />
            )}
            <div className="flex items-center gap-3">
              <div className="w-28 text-xs text-warp-muted flex-shrink-0 text-right">{step.label}</div>
              <div className="flex-1 h-6 bg-warp-border/40 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <div
                className="w-20 text-xs font-mono font-semibold text-right flex-shrink-0"
                style={{ color }}
              >
                {fmt(step.amount)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
