'use client';

interface DetentionBreakdownProps {
  mode: 'detention';
  totalMinutes: number;
  freeDurationMinutes: number;
  billableMinutes: number;
  hourlyRate: number;
  maxDailyCap: number | null;
  fee: number;
}

interface DemurrageBreakdownProps {
  mode: 'demurrage';
  daysHeld: number;
  freeDays: number;
  billableDays: number;
  dailyRate: number;
  tiers: { upTo: number; rate: number; label: string }[] | null;
  tierRows?: TierRow[];
  fee: number;
}

type FeeBreakdownProps = DetentionBreakdownProps | DemurrageBreakdownProps;

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function DetentionBreakdown(props: DetentionBreakdownProps) {
  const { totalMinutes, freeDurationMinutes, billableMinutes, hourlyRate, maxDailyCap, fee } = props;
  const billableHours = billableMinutes / 60;
  const rawFee = billableHours * hourlyRate;
  const capped = maxDailyCap !== null && rawFee > maxDailyCap;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-warp-muted">Total time on site</span>
        <span className="text-white font-mono">{formatHours(totalMinutes)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-warp-muted">Free time</span>
        <span className="text-warp-accent font-mono">− {formatHours(freeDurationMinutes)}</span>
      </div>
      <div className="border-t border-warp-border my-1" />
      <div className="flex justify-between text-sm">
        <span className="text-warp-muted">Billable time</span>
        <span className={billableMinutes > 0 ? 'text-red-400 font-mono' : 'text-warp-muted font-mono'}>
          {formatHours(billableMinutes)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-warp-muted">Hourly rate</span>
        <span className="text-white font-mono">{formatCurrency(hourlyRate)}/hr</span>
      </div>
      {billableMinutes > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-warp-muted">Raw fee ({(billableHours).toFixed(2)} hrs × {formatCurrency(hourlyRate)})</span>
          <span className="text-white font-mono">{formatCurrency(rawFee)}</span>
        </div>
      )}
      {capped && maxDailyCap !== null && (
        <div className="flex justify-between text-sm">
          <span className="text-warp-muted">Daily cap applied</span>
          <span className="text-warp-warning font-mono">max {formatCurrency(maxDailyCap)}</span>
        </div>
      )}
    </div>
  );
}

interface TierRow {
  label: string;
  days: number;
  rate: number;
  subtotal: number;
}

type DemurrageBreakdownComponentProps = DemurrageBreakdownProps;

function DemurrageBreakdown(props: DemurrageBreakdownComponentProps) {
  const { daysHeld, freeDays, billableDays, dailyRate, tiers, fee, tierRows } = props;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-warp-muted">Days held</span>
        <span className="text-white font-mono">{daysHeld} days</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-warp-muted">Free days</span>
        <span className="text-warp-accent font-mono">− {freeDays} days</span>
      </div>
      <div className="border-t border-warp-border my-1" />
      <div className="flex justify-between text-sm">
        <span className="text-warp-muted">Billable days</span>
        <span className={billableDays > 0 ? 'text-red-400 font-mono' : 'text-warp-muted font-mono'}>
          {billableDays} days
        </span>
      </div>

      {tiers && tierRows && tierRows.length > 0 ? (
        <div className="mt-2 space-y-1.5">
          <div className="text-xs text-warp-muted uppercase tracking-wide font-semibold">Tiered breakdown</div>
          {tierRows.map((row) => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-warp-muted">{row.label} ({row.days} days × {formatCurrency(row.rate)}/day)</span>
              <span className="text-white font-mono">{formatCurrency(row.subtotal)}</span>
            </div>
          ))}
        </div>
      ) : (
        billableDays > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-warp-muted">Daily rate</span>
            <span className="text-white font-mono">{formatCurrency(dailyRate)}/day</span>
          </div>
        )
      )}
    </div>
  );
}

export default function FeeBreakdown(props: FeeBreakdownProps) {
  const { fee } = props;

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-warp-muted uppercase tracking-wide">Fee Breakdown</div>
      <div className="bg-warp-card-hover rounded-lg p-4 border border-warp-border">
        {props.mode === 'detention' ? (
          <DetentionBreakdown {...props} />
        ) : (
          <DemurrageBreakdown {...(props as DemurrageBreakdownComponentProps)} />
        )}

        <div className="border-t border-warp-border mt-3 pt-3 flex justify-between items-center">
          <span className="text-sm font-semibold text-white">Total Fee</span>
          <span className={`text-xl font-bold font-mono ${fee > 0 ? 'text-red-400' : 'text-warp-accent'}`}>
            {fee > 0 ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fee)}` : '$0.00'}
          </span>
        </div>
      </div>
    </div>
  );
}

export type { TierRow };
