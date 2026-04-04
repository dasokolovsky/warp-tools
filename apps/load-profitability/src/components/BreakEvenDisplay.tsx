'use client';

import { fmt, fmtNum } from '@/lib/calc';

interface BreakEvenDisplayProps {
  breakEvenFlat: number;
  breakEvenPerMile: number;
  currentRevenue: number;
  miles: number;
}

export default function BreakEvenDisplay({
  breakEvenFlat,
  breakEvenPerMile,
  currentRevenue,
  miles,
}: BreakEvenDisplayProps) {
  const isAboveBreakEven = currentRevenue >= breakEvenFlat;
  const gap = currentRevenue - breakEvenFlat;
  const gapPerMile = miles > 0 ? gap / miles : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-warp-bg border border-warp-border rounded-xl p-4 text-center">
          <div className="text-xs text-warp-muted mb-1">Break-Even (Flat)</div>
          <div className="text-xl font-bold font-mono text-white">{fmt(breakEvenFlat)}</div>
          <div className="text-xs text-warp-muted mt-1">minimum to cover all costs</div>
        </div>
        <div className="bg-warp-bg border border-warp-border rounded-xl p-4 text-center">
          <div className="text-xs text-warp-muted mb-1">Break-Even (Per Mile)</div>
          <div className="text-xl font-bold font-mono text-white">
            {miles > 0 ? `$${fmtNum(breakEvenPerMile)}/mi` : '—'}
          </div>
          <div className="text-xs text-warp-muted mt-1">minimum rate per mile</div>
        </div>
      </div>

      {currentRevenue > 0 && (
        <div
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: isAboveBreakEven
              ? 'rgba(0,198,80,0.08)'
              : 'rgba(255,68,68,0.08)',
            borderColor: isAboveBreakEven
              ? 'rgba(0,198,80,0.25)'
              : 'rgba(255,68,68,0.25)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-sm font-semibold"
                style={{ color: isAboveBreakEven ? '#00C650' : '#FF4444' }}
              >
                {isAboveBreakEven ? '✓ Above Break-Even' : '✗ Below Break-Even'}
              </div>
              <div className="text-xs text-warp-muted mt-0.5">
                {isAboveBreakEven
                  ? `${fmt(gap)} cushion (${fmtNum(gapPerMile)}/mi)`
                  : `Need ${fmt(Math.abs(gap))} more (${fmtNum(Math.abs(gapPerMile))}/mi)`}
              </div>
            </div>
            <div
              className="text-2xl font-bold font-mono"
              style={{ color: isAboveBreakEven ? '#00C650' : '#FF4444' }}
            >
              {isAboveBreakEven ? '+' : '-'}{fmt(Math.abs(gap))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
