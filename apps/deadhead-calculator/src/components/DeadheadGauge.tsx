'use client';

interface DeadheadGaugeProps {
  ratio: number; // 0–1
}

function getGaugeColor(ratio: number): string {
  if (ratio < 0.1) return '#00C650';
  if (ratio < 0.15) return '#FFAA00';
  return '#FF4444';
}

function getGaugeLabel(ratio: number): string {
  if (ratio < 0.1) return 'Excellent';
  if (ratio < 0.15) return 'Acceptable';
  return 'High Risk';
}

export default function DeadheadGauge({ ratio }: DeadheadGaugeProps) {
  const pct = Math.min(ratio * 100, 100);
  const color = getGaugeColor(ratio);
  const label = getGaugeLabel(ratio);

  // SVG arc gauge — 180° semicircle
  const r = 54;
  const cx = 70;
  const cy = 70;
  const startAngle = Math.PI; // left
  const endAngle = 0; // right (full = 0% deadhead displayed left to right)
  // We fill from left based on ratio
  const fillAngle = Math.PI - ratio * Math.PI; // leftmost = 100%, rightmost = 0%
  const clampedFill = Math.min(Math.max(fillAngle, 0), Math.PI);

  function polarToCartesian(angle: number) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const fillEnd = polarToCartesian(clampedFill);
  const largeArcBg = 1;
  const largeArcFill = ratio > 0.5 ? 0 : 1;

  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcBg} 0 ${end.x} ${end.y}`;
  const fillPath = ratio > 0
    ? `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFill} 0 ${fillEnd.x} ${fillEnd.y}`
    : '';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="#1A2235"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Fill arc */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}
        {/* Tick marks at 10% and 15% */}
        {[0.1, 0.15].map((tick) => {
          const tickAngle = Math.PI - tick * Math.PI;
          const inner = { x: cx + (r - 8) * Math.cos(tickAngle), y: cy + (r - 8) * Math.sin(tickAngle) };
          const outer = { x: cx + (r + 6) * Math.cos(tickAngle), y: cy + (r + 6) * Math.sin(tickAngle) };
          return (
            <line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#1A2235"
              strokeWidth="2"
            />
          );
        })}
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={color}
          fontSize="18"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {pct.toFixed(1)}%
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="#8B95A5"
          fontSize="10"
          fontFamily="Inter, sans-serif"
        >
          deadhead ratio
        </text>
        {/* Labels */}
        <text x="8" y="76" fill="#8B95A5" fontSize="8" fontFamily="Inter, sans-serif">0%</text>
        <text x="116" y="76" fill="#8B95A5" fontSize="8" fontFamily="Inter, sans-serif">100%</text>
      </svg>
      <span
        className="text-xs font-semibold px-3 py-1 rounded-full"
        style={{ color, backgroundColor: `${color}22` }}
      >
        {label}
      </span>
      <p className="text-xs text-warp-muted text-center">
        &lt;10% excellent &middot; 10–15% ok &middot; &gt;15% costly
      </p>
    </div>
  );
}
