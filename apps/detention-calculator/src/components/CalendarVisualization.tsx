'use client';

interface CalendarVisualizationProps {
  daysHeld: number;
  freeDays: number;
  billableDays: number;
}

export default function CalendarVisualization({
  daysHeld,
  freeDays,
  billableDays,
}: CalendarVisualizationProps) {
  if (daysHeld <= 0) return null;

  const maxDisplay = 45;
  const displayDays = Math.min(daysHeld, maxDisplay);

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-warp-muted uppercase tracking-wide">Calendar View</div>

      {/* Day boxes */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: displayDays }).map((_, i) => {
          const dayNum = i + 1;
          const isFree = dayNum <= freeDays;
          const isBillable = dayNum > freeDays;

          return (
            <div
              key={dayNum}
              title={`Day ${dayNum}: ${isFree ? 'Free' : 'Billable'}`}
              className={[
                'w-8 h-8 rounded flex items-center justify-center text-xs font-medium border',
                isFree
                  ? 'bg-warp-accent bg-opacity-20 border-warp-accent border-opacity-40 text-green-300'
                  : 'bg-red-500 bg-opacity-20 border-red-500 border-opacity-40 text-red-300',
              ].join(' ')}
            >
              {dayNum}
            </div>
          );
        })}
        {daysHeld > maxDisplay && (
          <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium border border-warp-border text-warp-muted">
            +{daysHeld - maxDisplay}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-warp-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-warp-accent opacity-40 border border-warp-accent border-opacity-40" />
          <span>Free days ({freeDays})</span>
        </div>
        {billableDays > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500 opacity-40 border border-red-500 border-opacity-40" />
            <span>Billable days ({billableDays})</span>
          </div>
        )}
      </div>
    </div>
  );
}
