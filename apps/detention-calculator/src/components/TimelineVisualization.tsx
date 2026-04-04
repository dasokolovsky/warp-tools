'use client';

interface TimelineVisualizationProps {
  arrivalMinutes: number;    // minutes from midnight
  freeStartMinutes: number;  // minutes from midnight
  freeDurationMinutes: number;
  departureMinutes: number;
  billableMinutes: number;
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function TimelineVisualization({
  arrivalMinutes,
  freeStartMinutes,
  freeDurationMinutes,
  departureMinutes,
  billableMinutes,
}: TimelineVisualizationProps) {
  const totalSpan = departureMinutes - arrivalMinutes;
  if (totalSpan <= 0) return null;

  // Calculate positions as percentages
  const freeStartPct = ((freeStartMinutes - arrivalMinutes) / totalSpan) * 100;
  const freeEndMinutes = freeStartMinutes + freeDurationMinutes;
  const freeEndPct = Math.min(((freeEndMinutes - arrivalMinutes) / totalSpan) * 100, 100);
  const freeWidthPct = freeEndPct - Math.max(freeStartPct, 0);

  const billableStartMinutes = freeEndMinutes;
  const billableStartPct = Math.min(((billableStartMinutes - arrivalMinutes) / totalSpan) * 100, 100);
  const billableWidthPct = Math.max(100 - billableStartPct, 0);

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-warp-muted uppercase tracking-wide">Timeline</div>

      {/* Bar */}
      <div className="relative h-10 bg-warp-card-hover rounded-lg overflow-hidden border border-warp-border">
        {/* Free time zone */}
        {freeWidthPct > 0 && (
          <div
            className="absolute top-0 h-full bg-warp-accent opacity-30"
            style={{ left: `${Math.max(freeStartPct, 0)}%`, width: `${freeWidthPct}%` }}
          />
        )}

        {/* Billable time zone */}
        {billableWidthPct > 0 && billableMinutes > 0 && (
          <div
            className="absolute top-0 h-full bg-red-500 opacity-40"
            style={{ left: `${billableStartPct}%`, width: `${billableWidthPct}%` }}
          />
        )}

        {/* Arrival marker */}
        <div className="absolute left-0 top-0 h-full w-0.5 bg-warp-accent" />

        {/* Departure marker */}
        <div className="absolute right-0 top-0 h-full w-0.5 bg-warp-muted" />

        {/* Labels inside bar */}
        <div className="absolute inset-0 flex items-center px-2 gap-1">
          {freeWidthPct > 15 && (
            <div
              className="absolute flex items-center justify-center text-xs text-green-300 font-medium"
              style={{
                left: `${Math.max(freeStartPct, 0)}%`,
                width: `${freeWidthPct}%`,
              }}
            >
              Free
            </div>
          )}
          {billableWidthPct > 15 && billableMinutes > 0 && (
            <div
              className="absolute flex items-center justify-center text-xs text-red-300 font-medium"
              style={{ left: `${billableStartPct}%`, width: `${billableWidthPct}%` }}
            >
              Billable
            </div>
          )}
        </div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-warp-muted">
        <div>
          <div className="font-medium text-white">{formatMinutes(arrivalMinutes)}</div>
          <div>Arrival</div>
        </div>
        {freeStartMinutes > arrivalMinutes && (
          <div className="text-center">
            <div className="font-medium text-warp-accent">{formatMinutes(freeStartMinutes)}</div>
            <div>Free starts</div>
          </div>
        )}
        {freeEndMinutes < departureMinutes && (
          <div className="text-center">
            <div className="font-medium text-red-400">{formatMinutes(freeEndMinutes)}</div>
            <div>Billable starts</div>
          </div>
        )}
        <div className="text-right">
          <div className="font-medium text-white">{formatMinutes(departureMinutes)}</div>
          <div>Departure</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-warp-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-warp-accent opacity-60" />
          <span>Free time</span>
        </div>
        {billableMinutes > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500 opacity-60" />
            <span>Billable time</span>
          </div>
        )}
      </div>
    </div>
  );
}
