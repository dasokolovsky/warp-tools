'use client';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthScoreBadge({ score, size = 'md' }: Props) {
  const color =
    score >= 85 ? '#00C650' :
    score >= 60 ? '#F59E0B' :
    '#EF4444';

  const sizes = {
    sm: { r: 14, stroke: 3, textSize: 'text-xs', wrapper: 'w-9 h-9' },
    md: { r: 18, stroke: 3.5, textSize: 'text-sm', wrapper: 'w-12 h-12' },
    lg: { r: 24, stroke: 4, textSize: 'text-base', wrapper: 'w-16 h-16' },
  };

  const { r, stroke, textSize, wrapper } = sizes[size];
  const cx = r + stroke;
  const cy = r + stroke;
  const svgSize = (r + stroke) * 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative ${wrapper} flex-shrink-0`}>
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="rotate-[-90deg]">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#1A2235"
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${textSize} font-bold`} style={{ color }}>
        {score}
      </div>
    </div>
  );
}
