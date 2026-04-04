'use client';

interface ResultCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'green' | 'yellow' | 'red' | 'neutral';
}

const highlightColors = {
  green: 'text-[#00C650]',
  yellow: 'text-[#FFAA00]',
  red: 'text-[#FF4444]',
  neutral: 'text-white',
};

export default function ResultCard({ label, value, sub, highlight = 'neutral' }: ResultCardProps) {
  return (
    <div className="bg-warp-card border border-warp-border rounded-warp p-4">
      <p className="text-xs font-medium text-warp-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${highlightColors[highlight]}`}>{value}</p>
      {sub && <p className="text-xs text-warp-muted mt-1">{sub}</p>}
    </div>
  );
}
