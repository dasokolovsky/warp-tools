'use client';

import { useState, useCallback } from 'react';
import { Clock, Package, Github, Printer, ClipboardCopy, Check } from 'lucide-react';
import TimelineVisualization from '@/components/TimelineVisualization';
import CalendarVisualization from '@/components/CalendarVisualization';
import FeeBreakdown from '@/components/FeeBreakdown';
import PresetSelector from '@/components/PresetSelector';
import type { DetentionPreset, DemurragePreset } from '@/components/PresetSelector';
import type { TierRow } from '@/components/FeeBreakdown';

// ─── Utility ─────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function parseNum(s: string, fallback = 0): number {
  const n = parseFloat(s);
  return isNaN(n) ? fallback : n;
}

// ─── Detention Calculator ─────────────────────────────────────

interface DetentionState {
  arrival: string;
  freeTimeStart: string;
  freeDuration: string;
  departure: string;
  hourlyRate: string;
  maxDailyCap: string;
}

const DEFAULT_DETENTION: DetentionState = {
  arrival: '08:00',
  freeTimeStart: '08:00',
  freeDuration: '2',
  departure: '11:30',
  hourlyRate: '75',
  maxDailyCap: '',
};

function computeDetention(state: DetentionState) {
  const arrivalMin = timeToMinutes(state.arrival);
  const freeStartMin = timeToMinutes(state.freeTimeStart);
  const freeDurMin = Math.round(parseNum(state.freeDuration, 2) * 60);
  const departureMin = timeToMinutes(state.departure);
  const hourlyRate = parseNum(state.hourlyRate, 75);
  const maxCap = state.maxDailyCap ? parseNum(state.maxDailyCap) : null;

  const totalMinutes = Math.max(departureMin - arrivalMin, 0);
  const freeEndMin = freeStartMin + freeDurMin;
  const billableStartMin = Math.max(freeEndMin, arrivalMin);
  const billableMinutes = Math.max(departureMin - billableStartMin, 0);
  const billableHours = billableMinutes / 60;
  const rawFee = billableHours * hourlyRate;
  const fee = maxCap !== null ? Math.min(rawFee, maxCap) : rawFee;

  return {
    arrivalMin,
    freeStartMin,
    freeDurMin,
    departureMin,
    totalMinutes,
    billableMinutes,
    billableHours,
    fee,
    hourlyRate,
    maxCap,
  };
}

interface DetentionCalculatorProps {
  state: DetentionState;
  onChange: (field: keyof DetentionState, value: string) => void;
  onPreset: (preset: DetentionPreset) => void;
}

function DetentionCalculator({ state, onChange, onPreset }: DetentionCalculatorProps) {
  const calc = computeDetention(state);

  const invoiceText = `DETENTION CHARGE
Date: ${new Date().toLocaleDateString()}
Arrival: ${state.arrival || '-'}
Departure: ${state.departure || '-'}
Free Time: ${state.freeDuration || 2}h starting ${state.freeTimeStart || '-'}
Billable Time: ${(calc.billableHours).toFixed(2)} hours
Rate: ${formatCurrency(calc.hourlyRate)}/hr
${calc.maxCap ? `Daily Cap: ${formatCurrency(calc.maxCap)}\n` : ''}DETENTION FEE: ${formatCurrency(calc.fee)}`;

  return (
    <div className="space-y-6">
      <PresetSelector mode="detention" onSelect={(p) => onPreset(p as DetentionPreset)} />

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Arrival Time
          </label>
          <input
            type="time"
            value={state.arrival}
            onChange={(e) => onChange('arrival', e.target.value)}
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Free Time Starts
          </label>
          <input
            type="time"
            value={state.freeTimeStart}
            onChange={(e) => onChange('freeTimeStart', e.target.value)}
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Free Time Duration (hours)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={state.freeDuration}
            onChange={(e) => onChange('freeDuration', e.target.value)}
            placeholder="2"
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Departure Time
          </label>
          <input
            type="time"
            value={state.departure}
            onChange={(e) => onChange('departure', e.target.value)}
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Hourly Rate ($/hr)
          </label>
          <input
            type="number"
            min="0"
            step="5"
            value={state.hourlyRate}
            onChange={(e) => onChange('hourlyRate', e.target.value)}
            placeholder="75"
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Max Daily Cap (optional)
          </label>
          <input
            type="number"
            min="0"
            step="25"
            value={state.maxDailyCap}
            onChange={(e) => onChange('maxDailyCap', e.target.value)}
            placeholder="No cap"
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Timeline */}
      {calc.totalMinutes > 0 && (
        <div className="bg-warp-card-hover rounded-lg p-4 border border-warp-border">
          <TimelineVisualization
            arrivalMinutes={calc.arrivalMin}
            freeStartMinutes={calc.freeStartMin}
            freeDurationMinutes={calc.freeDurMin}
            departureMinutes={calc.departureMin}
            billableMinutes={calc.billableMinutes}
          />
        </div>
      )}

      {/* Fee Breakdown */}
      <FeeBreakdown
        mode="detention"
        totalMinutes={calc.totalMinutes}
        freeDurationMinutes={calc.freeDurMin}
        billableMinutes={calc.billableMinutes}
        hourlyRate={calc.hourlyRate}
        maxDailyCap={calc.maxCap}
        fee={calc.fee}
      />

      {/* Invoice text */}
      {calc.fee > 0 && (
        <InvoiceBlock text={invoiceText} />
      )}
    </div>
  );
}

// ─── Demurrage Calculator ─────────────────────────────────────

interface DemurrageState {
  availableDate: string;
  freeDays: string;
  pickupDate: string;
  dailyRate: string;
  tier1Rate: string;
  tier2Rate: string;
  tier3Rate: string;
}

const DEFAULT_DEMURRAGE: DemurrageState = {
  availableDate: '',
  freeDays: '5',
  pickupDate: '',
  dailyRate: '150',
  tier1Rate: '',
  tier2Rate: '',
  tier3Rate: '',
};

function computeDemurrage(state: DemurrageState) {
  const freeDays = Math.max(parseNum(state.freeDays, 5), 0);
  const dailyRate = parseNum(state.dailyRate, 0);

  let daysHeld = 0;
  if (state.availableDate && state.pickupDate) {
    const avail = new Date(state.availableDate + 'T00:00:00');
    const pickup = new Date(state.pickupDate + 'T00:00:00');
    daysHeld = Math.max(Math.round((pickup.getTime() - avail.getTime()) / (1000 * 60 * 60 * 24)), 0);
  }

  const billableDays = Math.max(daysHeld - freeDays, 0);

  const hasTiers = state.tier1Rate || state.tier2Rate || state.tier3Rate;
  let fee = 0;
  let tierRows: TierRow[] | null = null;

  if (hasTiers && billableDays > 0) {
    const t1 = parseNum(state.tier1Rate, dailyRate);
    const t2 = parseNum(state.tier2Rate, t1);
    const t3 = parseNum(state.tier3Rate, t2);

    tierRows = [];
    let remaining = billableDays;

    // Tier 1: days 1-5 (billable)
    const d1 = Math.min(remaining, 5);
    if (d1 > 0) {
      const sub = d1 * t1;
      fee += sub;
      tierRows.push({ label: 'Days 1–5', days: d1, rate: t1, subtotal: sub });
      remaining -= d1;
    }
    // Tier 2: days 6-10 (billable)
    const d2 = Math.min(remaining, 5);
    if (d2 > 0) {
      const sub = d2 * t2;
      fee += sub;
      tierRows.push({ label: 'Days 6–10', days: d2, rate: t2, subtotal: sub });
      remaining -= d2;
    }
    // Tier 3: days 11+
    if (remaining > 0) {
      const sub = remaining * t3;
      fee += sub;
      tierRows.push({ label: 'Days 11+', days: remaining, rate: t3, subtotal: sub });
    }
  } else if (billableDays > 0) {
    fee = billableDays * dailyRate;
  }

  return { daysHeld, freeDays, billableDays, fee, dailyRate, hasTiers: !!hasTiers, tierRows };
}

interface DemurrageCalculatorProps {
  state: DemurrageState;
  onChange: (field: keyof DemurrageState, value: string) => void;
  onPreset: (preset: DemurragePreset) => void;
}

function DemurrageCalculator({ state, onChange, onPreset }: DemurrageCalculatorProps) {
  const calc = computeDemurrage(state);

  const invoiceText = `DEMURRAGE CHARGE
Date: ${new Date().toLocaleDateString()}
Container Available: ${state.availableDate || '-'}
Pickup Date: ${state.pickupDate || '-'}
Free Days: ${state.freeDays || 5}
Days Held: ${calc.daysHeld}
Billable Days: ${calc.billableDays}
${calc.hasTiers ? 'Tiered rates applied' : `Rate: ${formatCurrency(calc.dailyRate)}/day`}
DEMURRAGE FEE: ${formatCurrency(calc.fee)}`;

  return (
    <div className="space-y-6">
      <PresetSelector mode="demurrage" onSelect={(p) => onPreset(p as DemurragePreset)} />

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Container Available Date
          </label>
          <input
            type="date"
            value={state.availableDate}
            onChange={(e) => onChange('availableDate', e.target.value)}
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Pickup Date
          </label>
          <input
            type="date"
            value={state.pickupDate}
            onChange={(e) => onChange('pickupDate', e.target.value)}
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Free Days
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={state.freeDays}
            onChange={(e) => onChange('freeDays', e.target.value)}
            placeholder="5"
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
            Daily Rate ($/day)
          </label>
          <input
            type="number"
            min="0"
            step="10"
            value={state.dailyRate}
            onChange={(e) => onChange('dailyRate', e.target.value)}
            placeholder="150"
            className="w-full bg-warp-card-hover border border-warp-border rounded-lg px-3 py-2.5 text-white text-sm focus:border-warp-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Tiered rates */}
      <div className="bg-warp-card-hover rounded-lg p-4 border border-warp-border space-y-3">
        <div className="text-xs font-semibold text-warp-muted uppercase tracking-wide">
          Rate Tiers (optional — overrides flat rate)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-warp-muted mb-1">Days 1–5 ($/day)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={state.tier1Rate}
              onChange={(e) => onChange('tier1Rate', e.target.value)}
              placeholder="e.g. 150"
              className="w-full bg-warp-card border border-warp-border rounded-lg px-3 py-2 text-white text-sm focus:border-warp-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-warp-muted mb-1">Days 6–10 ($/day)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={state.tier2Rate}
              onChange={(e) => onChange('tier2Rate', e.target.value)}
              placeholder="e.g. 250"
              className="w-full bg-warp-card border border-warp-border rounded-lg px-3 py-2 text-white text-sm focus:border-warp-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-warp-muted mb-1">Days 11+ ($/day)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={state.tier3Rate}
              onChange={(e) => onChange('tier3Rate', e.target.value)}
              placeholder="e.g. 400"
              className="w-full bg-warp-card border border-warp-border rounded-lg px-3 py-2 text-white text-sm focus:border-warp-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Calendar */}
      {calc.daysHeld > 0 && (
        <div className="bg-warp-card-hover rounded-lg p-4 border border-warp-border">
          <CalendarVisualization
            daysHeld={calc.daysHeld}
            freeDays={calc.freeDays}
            billableDays={calc.billableDays}
          />
        </div>
      )}

      {/* Fee Breakdown */}
      <FeeBreakdown
        mode="demurrage"
        daysHeld={calc.daysHeld}
        freeDays={calc.freeDays}
        billableDays={calc.billableDays}
        dailyRate={calc.dailyRate}
        tiers={calc.hasTiers ? [
          { upTo: 5, rate: parseNum(state.tier1Rate, calc.dailyRate), label: 'Days 1–5' },
          { upTo: 10, rate: parseNum(state.tier2Rate, parseNum(state.tier1Rate, calc.dailyRate)), label: 'Days 6–10' },
          { upTo: Infinity, rate: parseNum(state.tier3Rate, parseNum(state.tier2Rate, parseNum(state.tier1Rate, calc.dailyRate))), label: 'Days 11+' },
        ] : null}
        tierRows={calc.tierRows ?? undefined}
        fee={calc.fee}
      />

      {/* Invoice text */}
      {calc.fee > 0 && (
        <InvoiceBlock text={invoiceText} />
      )}
    </div>
  );
}

// ─── Invoice block ────────────────────────────────────────────

interface InvoiceBlockProps {
  text: string;
}

function InvoiceBlock({ text }: InvoiceBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-warp-muted uppercase tracking-wide">Add to Invoice</div>
      <div className="bg-warp-card-hover rounded-lg border border-warp-border overflow-hidden">
        <pre className="text-xs text-warp-muted p-4 whitespace-pre-wrap font-mono leading-relaxed">{text}</pre>
        <div className="border-t border-warp-border px-4 py-2.5 flex justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-warp-muted hover:text-warp-accent transition-colors"
          >
            {copied ? <Check size={13} className="text-warp-accent" /> : <ClipboardCopy size={13} />}
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────

interface SummaryCardProps {
  fee: number;
  label: string;
}

function SummaryCard({ fee, label }: SummaryCardProps) {
  return (
    <div className={`rounded-warp border p-6 text-center ${fee > 0 ? 'border-red-500 border-opacity-50 bg-red-500 bg-opacity-5' : 'border-warp-border bg-warp-card'}`}>
      <div className="text-xs font-semibold text-warp-muted uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-4xl font-bold font-mono ${fee > 0 ? 'text-red-400' : 'text-warp-accent'}`}>
        {formatCurrency(fee)}
      </div>
      {fee > 0 && (
        <div className="text-xs text-warp-muted mt-2">Fees apply — see breakdown below</div>
      )}
      {fee === 0 && (
        <div className="text-xs text-warp-muted mt-2">No fees — within free time</div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

type Mode = 'detention' | 'demurrage';

export default function DetentionPage() {
  const [mode, setMode] = useState<Mode>('detention');
  const [detention, setDetention] = useState<DetentionState>(DEFAULT_DETENTION);
  const [demurrage, setDemurrage] = useState<DemurrageState>(DEFAULT_DEMURRAGE);

  const handleDetentionChange = useCallback((field: keyof DetentionState, value: string) => {
    setDetention((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDemurrageChange = useCallback((field: keyof DemurrageState, value: string) => {
    setDemurrage((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDetentionPreset = useCallback((preset: DetentionPreset) => {
    setDetention({
      arrival: preset.arrival,
      freeTimeStart: preset.freeTimeStart,
      freeDuration: preset.freeDuration,
      departure: preset.departure,
      hourlyRate: preset.hourlyRate,
      maxDailyCap: preset.maxDailyCap,
    });
  }, []);

  const handleDemurragePreset = useCallback((preset: DemurragePreset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + parseNum(preset.freeDays, 5) + 3);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    setDemurrage({
      availableDate: todayStr,
      freeDays: preset.freeDays,
      pickupDate: futureDateStr,
      dailyRate: preset.dailyRate,
      tier1Rate: preset.tier1Rate,
      tier2Rate: preset.tier2Rate,
      tier3Rate: preset.tier3Rate,
    });
  }, []);

  const detCalc = computeDetention(detention);
  const demCalc = computeDemurrage(demurrage);
  const currentFee = mode === 'detention' ? detCalc.fee : demCalc.fee;
  const feeLabel = mode === 'detention' ? 'Detention Fee' : 'Demurrage Fee';

  return (
    <div className="min-h-screen bg-warp-bg flex flex-col">
      {/* Nav */}
      <nav className="no-print border-b border-warp-border bg-warp-card px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-warp-accent rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-black" />
          </div>
          <div>
            <span className="text-white font-semibold text-sm">Detention &amp; Demurrage</span>
            <span className="text-warp-muted text-xs ml-2">by Warp Tools</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-1.5 text-sm text-warp-muted hover:text-white transition-colors"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Print</span>
          </button>
          <a
            href="https://github.com/dasokolovsky/warp-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-warp-muted hover:text-white text-sm transition-colors"
          >
            <Github size={16} />
            <span className="hidden sm:inline">warp-tools</span>
          </a>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="no-print">
          <h1 className="text-2xl font-bold text-white mb-1">
            Detention &amp; Demurrage Calculator
          </h1>
          <p className="text-warp-muted">
            Calculate waiting time fees and container holding charges instantly. No account needed.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="no-print flex bg-warp-card border border-warp-border rounded-warp p-1 gap-1">
          <button
            onClick={() => setMode('detention')}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
              mode === 'detention'
                ? 'bg-warp-accent text-black'
                : 'text-warp-muted hover:text-white',
            ].join(' ')}
          >
            <Clock size={15} />
            Detention
          </button>
          <button
            onClick={() => setMode('demurrage')}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
              mode === 'demurrage'
                ? 'bg-warp-accent text-black'
                : 'text-warp-muted hover:text-white',
            ].join(' ')}
          >
            <Package size={15} />
            Demurrage
          </button>
        </div>

        {/* Summary Card */}
        <SummaryCard fee={currentFee} label={feeLabel} />

        {/* Calculator */}
        <div className="bg-warp-card border border-warp-border rounded-warp p-5 sm:p-6">
          {mode === 'detention' ? (
            <DetentionCalculator
              state={detention}
              onChange={handleDetentionChange}
              onPreset={handleDetentionPreset}
            />
          ) : (
            <DemurrageCalculator
              state={demurrage}
              onChange={handleDemurrageChange}
              onPreset={handleDemurragePreset}
            />
          )}
        </div>

        {/* Explainer */}
        <div className="no-print bg-warp-card border border-warp-border rounded-warp p-5">
          {mode === 'detention' ? (
            <>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
                What is Detention?
              </h2>
              <div className="text-sm text-warp-muted space-y-2 leading-relaxed">
                <p>
                  <strong className="text-white">Detention</strong> is a fee charged when a truck driver
                  spends more time at a shipper or receiver than the agreed-upon free time. Standard
                  free time is typically 2 hours — after that, carriers bill by the hour.
                </p>
                <p>
                  Detention rates typically range from <strong className="text-white">$50–$100/hr</strong>,
                  and many carriers cap daily detention at $500–$750. Always confirm free time and
                  rates in your rate confirmation before dispatch.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
                What is Demurrage?
              </h2>
              <div className="text-sm text-warp-muted space-y-2 leading-relaxed">
                <p>
                  <strong className="text-white">Demurrage</strong> is a fee charged by ports or
                  rail yards when a shipping container is not picked up within the allotted free days.
                  Port free time is typically 4–5 days; rail is usually 2 days.
                </p>
                <p>
                  Demurrage rates escalate quickly — often tiered, doubling or tripling after the
                  first threshold. A container left 2 weeks past free time can easily cost
                  <strong className="text-white"> $3,000–$8,000+</strong>. Always track container
                  availability dates closely.
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-warp-border py-5 px-6 text-center text-sm text-warp-muted">
        Part of{' '}
        <a
          href="https://github.com/dasokolovsky/warp-tools"
          target="_blank"
          rel="noopener noreferrer"
          className="text-warp-accent hover:underline"
        >
          Warp Tools
        </a>{' '}
        — Free, open-source logistics software
      </footer>
    </div>
  );
}
