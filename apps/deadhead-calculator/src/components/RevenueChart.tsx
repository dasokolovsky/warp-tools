'use client';

import { formatCurrency } from '@/lib/calculations';

interface RevenueChartProps {
  loadRate: number;
  fuelCostDeadhead: number;
  tolls: number;
  driverCostDeadhead: number;
  carrierCosts: number;
  netProfit: number;
}

interface BarSegment {
  label: string;
  value: number;
  color: string;
}

function renderBar(segment: BarSegment, widthPct: number) {
  return (
    <div key={segment.label} className="flex items-center gap-3">
      <div className="w-32 text-xs text-warp-muted text-right shrink-0">{segment.label}</div>
      <div className="flex-1 h-6 bg-warp-border/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${widthPct}%`,
            backgroundColor: segment.color,
          }}
        />
      </div>
      <div className="w-24 text-xs font-mono text-right text-white shrink-0">
        {formatCurrency(segment.value)}
      </div>
    </div>
  );
}

export default function RevenueChart({
  loadRate,
  fuelCostDeadhead,
  tolls,
  driverCostDeadhead,
  carrierCosts,
  netProfit,
}: RevenueChartProps) {
  const totalDeadhead = fuelCostDeadhead + tolls + driverCostDeadhead;
  const totalCosts = totalDeadhead + carrierCosts;
  const maxVal = Math.max(loadRate, totalCosts, 1);

  const segments: BarSegment[] = [
    { label: 'Load Revenue', value: loadRate, color: '#00C650' },
    { label: 'Deadhead Fuel', value: fuelCostDeadhead, color: '#FF6B35' },
    { label: 'Deadhead Tolls', value: tolls, color: '#FF9500' },
    { label: 'Driver Pay', value: driverCostDeadhead, color: '#FFAA00' },
    { label: 'Carrier Costs', value: carrierCosts, color: '#8B5CF6' },
    { label: 'Net Profit', value: Math.max(netProfit, 0), color: netProfit >= 0 ? '#00C650' : '#FF4444' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {segments.map((seg) => renderBar(seg, (seg.value / maxVal) * 100))}
    </div>
  );
}
