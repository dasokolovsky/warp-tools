'use client';

import { type CostBreakdownItem, fmt } from '@/lib/calc';

interface CostBreakdownChartProps {
  items: CostBreakdownItem[];
  totalCost: number;
  totalRevenue: number;
}

export default function CostBreakdownChart({
  items,
  totalCost,
  totalRevenue,
}: CostBreakdownChartProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-warp-muted text-sm">
        Enter costs to see breakdown
      </div>
    );
  }

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;
  const innerRadius = 50;

  // Build donut segments
  const total = items.reduce((s, i) => s + i.amount, 0);
  const INIT_ANGLE = -Math.PI / 2;

  function polarToXY(angle: number, r: number) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function describeArc(startAngle: number, endAngle: number, r: number, ir: number) {
    const s = polarToXY(startAngle, r);
    const e = polarToXY(endAngle, r);
    const si = polarToXY(startAngle, ir);
    const ei = polarToXY(endAngle, ir);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    return [
      `M ${s.x} ${s.y}`,
      `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
      `L ${ei.x} ${ei.y}`,
      `A ${ir} ${ir} 0 ${large} 0 ${si.x} ${si.y}`,
      'Z',
    ].join(' ');
  }

  const segments = items.reduce<
    Array<CostBreakdownItem & { start: number; end: number; path: string }>
  >((acc, item) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].end : INIT_ANGLE;
    const angle = total > 0 ? (item.amount / total) * 2 * Math.PI : 0;
    const start = prevEnd;
    const end = start + angle;
    return [...acc, { ...item, start, end, path: describeArc(start, end, radius, innerRadius) }];
  }, []);

  const profitAmount = totalRevenue - totalCost;
  const profitIsPositive = profitAmount >= 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {segments.map((seg) => (
              <path
                key={seg.label}
                d={seg.path}
                fill={seg.color}
                className="opacity-90 hover:opacity-100 transition-opacity"
              />
            ))}
            {/* Center text */}
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#8B95A5" fontSize="10" fontFamily="Inter, sans-serif">
              Total Cost
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="JetBrains Mono, monospace">
              {fmt(totalCost, 0)}
            </text>
          </svg>
        </div>
      </div>

      {/* Revenue vs Cost bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-warp-muted">
          <span>Revenue</span>
          <span>{fmt(totalRevenue)}</span>
        </div>
        <div className="h-2 bg-warp-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: totalRevenue > 0 ? `${Math.min((totalCost / totalRevenue) * 100, 100)}%` : '0%',
              background: profitIsPositive ? '#FF4444' : '#FF4444',
            }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-warp-muted">Cost ratio</span>
          <span style={{ color: profitIsPositive ? '#00C650' : '#FF4444' }}>
            {totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(1) : '0'}%
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-warp-muted truncate">{item.label}</span>
            <span className="text-xs text-white font-mono ml-auto">{fmt(item.amount, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
