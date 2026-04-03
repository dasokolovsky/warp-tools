interface ScoreRingProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#00C650';
  if (score >= 75) return '#FFAA00';
  return '#FF4444';
}

export function ScoreRing({ score, size = 48, strokeWidth = 4 }: ScoreRingProps) {
  if (score == null) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-[#1A2235] text-[#8B95A5] text-xs font-medium"
        style={{ width: size, height: size }}
      >
        —
      </div>
    );
  }

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A2235"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute text-xs font-semibold"
        style={{ color, fontSize: size < 40 ? '10px' : '12px' }}
      >
        {Math.round(score)}
      </span>
    </div>
  );
}
