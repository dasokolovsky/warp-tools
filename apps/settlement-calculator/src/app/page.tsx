'use client';

import { useState, useCallback } from 'react';
import { Plus, Zap } from 'lucide-react';
import NavBar from '@/components/NavBar';
import TripRow from '@/components/TripRow';
import DeductionRow from '@/components/DeductionRow';
import ReimbursementRow from '@/components/ReimbursementRow';
import AdvanceRow from '@/components/AdvanceRow';
import SettlementSummary from '@/components/SettlementSummary';
import PrintableStatement from '@/components/PrintableStatement';
import type { PayType, TripRow as TripRowType, DeductionRow as DeductionRowType, ReimbursementRow as ReimbursementRowType, AdvanceRow as AdvanceRowType } from '@/lib/types';
import { calcSettlement, rateLabel, rateSuffix, ratePlaceholder, uid } from '@/lib/calculations';

// ─── Presets ─────────────────────────────────────────────────────────────────

const DEDUCTION_PRESETS: { label: string; amount: string; type: 'fixed' | 'percent' }[] = [
  { label: 'Insurance $50', amount: '50', type: 'fixed' },
  { label: 'Truck Lease $200', amount: '200', type: 'fixed' },
  { label: 'ELD $15', amount: '15', type: 'fixed' },
];

const REIMBURSEMENT_PRESETS: { label: string }[] = [
  { label: 'Fuel receipt' },
  { label: 'Toll receipt' },
];

// ─── Pay Type Option ──────────────────────────────────────────────────────────

interface PayTypeOptionProps {
  value: PayType;
  label: string;
  description: string;
  selected: boolean;
  onSelect: (v: PayType) => void;
}

function PayTypeOption({ value, label, description, selected, onSelect }: PayTypeOptionProps) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={`flex-1 min-w-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
        selected
          ? 'bg-warp-accent/15 border-warp-accent text-warp-accent'
          : 'bg-warp-bg border-warp-border text-warp-muted hover:text-white hover:border-warp-accent/30'
      }`}
    >
      <span className="font-semibold">{label}</span>
      <span className="text-[10px] opacity-70 hidden sm:block">{description}</span>
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  total: string;
  totalColor?: string;
  children: React.ReactNode;
}

function SectionCard({ title, total, totalColor = 'text-white', children }: SectionProps) {
  return (
    <div className="bg-warp-card border border-warp-border rounded-warp p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-warp-muted uppercase tracking-wide">{title}</h2>
        <span className={`text-sm font-semibold ${totalColor}`}>{total}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettlementCalculatorPage() {
  // Driver setup
  const [driverName, setDriverName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [payType, setPayType] = useState<PayType>('per-mile');
  const [rate, setRate] = useState('');

  // Rows
  const [trips, setTrips] = useState<TripRowType[]>(() => [{
    id: uid(), description: '', miles: '', revenue: '', hours: '', stops: '',
  }]);
  const [deductions, setDeductions] = useState<DeductionRowType[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRowType[]>([]);
  const [advances, setAdvances] = useState<AdvanceRowType[]>([]);

  const rateNum = parseFloat(rate) || 0;

  const calc = calcSettlement(trips, payType, rateNum, deductions, reimbursements, advances);

  // ── Trip handlers ──
  const addTrip = useCallback(() => {
    setTrips((prev) => [...prev, { id: uid(), description: '', miles: '', revenue: '', hours: '', stops: '' }]);
  }, []);

  const removeTrip = useCallback((id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTrip = useCallback((id: string, field: keyof TripRowType, value: string) => {
    setTrips((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t));
  }, []);

  // ── Deduction handlers ──
  const addDeduction = useCallback(() => {
    setDeductions((prev) => [...prev, { id: uid(), description: '', amount: '', type: 'fixed' }]);
  }, []);

  const addDeductionPreset = useCallback((preset: typeof DEDUCTION_PRESETS[0]) => {
    setDeductions((prev) => [...prev, { id: uid(), description: preset.label, amount: preset.amount, type: preset.type }]);
  }, []);

  const removeDeduction = useCallback((id: string) => {
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDeduction = useCallback((id: string, field: keyof DeductionRowType, value: string) => {
    setDeductions((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  }, []);

  // ── Reimbursement handlers ──
  const addReimbursement = useCallback(() => {
    setReimbursements((prev) => [...prev, { id: uid(), description: '', amount: '' }]);
  }, []);

  const addReimbursementPreset = useCallback((label: string) => {
    setReimbursements((prev) => [...prev, { id: uid(), description: label, amount: '' }]);
  }, []);

  const removeReimbursement = useCallback((id: string) => {
    setReimbursements((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateReimbursement = useCallback((id: string, field: keyof ReimbursementRowType, value: string) => {
    setReimbursements((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  // ── Advance handlers ──
  const addAdvance = useCallback(() => {
    setAdvances((prev) => [...prev, { id: uid(), amount: '', date: '', reason: '' }]);
  }, []);

  const removeAdvance = useCallback((id: string) => {
    setAdvances((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAdvance = useCallback((id: string, field: keyof AdvanceRowType, value: string) => {
    setAdvances((prev) => prev.map((a) => a.id === id ? { ...a, [field]: value } : a));
  }, []);

  // ── Print ──
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const { fmt } = { fmt: (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) };

  return (
    <div className="min-h-screen bg-warp-bg">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8 no-print">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Driver Settlement Calculator</h1>
          <p className="text-warp-muted">
            Enter trips and expenses to calculate your net settlement. No account needed — all calculations happen locally.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT / MAIN COL */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* ── Driver Setup ── */}
            <div className="bg-warp-card border border-warp-border rounded-warp p-4 flex flex-col gap-4">
              <h2 className="text-xs font-semibold text-warp-muted uppercase tracking-wide">Driver Setup</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-warp-muted">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="John Smith"
                    className="bg-warp-bg border border-warp-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none focus:border-warp-accent/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-warp-muted">Period Start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="bg-warp-bg border border-warp-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-warp-accent/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-warp-muted">Period End</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="bg-warp-bg border border-warp-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-warp-accent/50 transition-colors"
                  />
                </div>
              </div>

              {/* Pay type */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-warp-muted">Pay Type</label>
                <div className="flex gap-2 flex-wrap">
                  <PayTypeOption value="per-mile" label="Per Mile" description="$/mi" selected={payType === 'per-mile'} onSelect={setPayType} />
                  <PayTypeOption value="percentage" label="Percentage" description="% of revenue" selected={payType === 'percentage'} onSelect={setPayType} />
                  <PayTypeOption value="flat" label="Flat Rate" description="$/load" selected={payType === 'flat'} onSelect={setPayType} />
                  <PayTypeOption value="hourly" label="Hourly" description="$/hr" selected={payType === 'hourly'} onSelect={setPayType} />
                  <PayTypeOption value="per-stop" label="Per Stop" description="$/stop" selected={payType === 'per-stop'} onSelect={setPayType} />
                </div>
              </div>

              {/* Rate */}
              <div className="flex flex-col gap-1 max-w-xs">
                <label className="text-xs text-warp-muted">{rateLabel(payType)}</label>
                <div className="flex items-center bg-warp-bg border border-warp-border rounded-lg overflow-hidden">
                  {payType !== 'percentage' && (
                    <span className="px-2 text-xs text-warp-muted border-r border-warp-border">$</span>
                  )}
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder={ratePlaceholder(payType)}
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none"
                  />
                  <span className="px-2 text-xs text-warp-muted border-l border-warp-border">{rateSuffix(payType)}</span>
                </div>
              </div>
            </div>

            {/* ── Trips ── */}
            <SectionCard
              title="Trips"
              total={`Gross: ${fmt(calc.grossEarnings)}`}
              totalColor="text-warp-accent"
            >
              <div className="flex flex-col gap-2">
                {trips.map((trip, i) => (
                  <TripRow
                    key={trip.id}
                    trip={trip}
                    payType={payType}
                    rate={rateNum}
                    index={i}
                    onChange={updateTrip}
                    onRemove={removeTrip}
                  />
                ))}
              </div>
              <button
                onClick={addTrip}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-warp-border text-warp-muted hover:text-white hover:border-warp-accent/50 text-xs transition-colors w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Trip
              </button>
            </SectionCard>

            {/* ── Deductions ── */}
            <SectionCard
              title="Deductions"
              total={deductions.length > 0 ? `-${fmt(calc.totalDeductions)}` : '$0.00'}
              totalColor="text-warp-danger"
            >
              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {DEDUCTION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => addDeductionPreset(preset)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warp-bg border border-warp-border text-xs text-warp-muted hover:text-white hover:border-warp-accent/30 transition-colors"
                  >
                    <Zap className="w-3 h-3" />
                    {preset.label}
                  </button>
                ))}
              </div>

              {deductions.length > 0 && (
                <div className="flex flex-col gap-2">
                  {deductions.map((d, i) => (
                    <DeductionRow
                      key={d.id}
                      deduction={d}
                      grossEarnings={calc.grossEarnings}
                      index={i}
                      onChange={updateDeduction}
                      onRemove={removeDeduction}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={addDeduction}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-warp-border text-warp-muted hover:text-white hover:border-warp-accent/50 text-xs transition-colors w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Deduction
              </button>
            </SectionCard>

            {/* ── Reimbursements ── */}
            <SectionCard
              title="Reimbursements"
              total={reimbursements.length > 0 ? `+${fmt(calc.totalReimbursements)}` : '$0.00'}
              totalColor="text-warp-accent"
            >
              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {REIMBURSEMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => addReimbursementPreset(preset.label)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warp-bg border border-warp-border text-xs text-warp-muted hover:text-white hover:border-warp-accent/30 transition-colors"
                  >
                    <Zap className="w-3 h-3" />
                    {preset.label}
                  </button>
                ))}
              </div>

              {reimbursements.length > 0 && (
                <div className="flex flex-col gap-2">
                  {reimbursements.map((r, i) => (
                    <ReimbursementRow
                      key={r.id}
                      reimbursement={r}
                      index={i}
                      onChange={updateReimbursement}
                      onRemove={removeReimbursement}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={addReimbursement}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-warp-border text-warp-muted hover:text-white hover:border-warp-accent/50 text-xs transition-colors w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Reimbursement
              </button>
            </SectionCard>

            {/* ── Advances ── */}
            <SectionCard
              title="Advances"
              total={advances.length > 0 ? `-${fmt(calc.totalAdvances)}` : '$0.00'}
              totalColor="text-warp-warning"
            >
              {advances.length > 0 && (
                <div className="flex flex-col gap-2">
                  {advances.map((a, i) => (
                    <AdvanceRow
                      key={a.id}
                      advance={a}
                      index={i}
                      onChange={updateAdvance}
                      onRemove={removeAdvance}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={addAdvance}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-warp-border text-warp-muted hover:text-white hover:border-warp-accent/50 text-xs transition-colors w-full justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Advance
              </button>
            </SectionCard>
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:col-span-1">
            <SettlementSummary calc={calc} onPrint={handlePrint} />
          </div>
        </div>
      </main>

      <footer className="border-t border-warp-border mt-16 py-8 text-center text-warp-muted text-sm no-print">
        <p>
          Settlement Calculator by{' '}
          <a href="https://wearewarp.com" className="text-warp-accent hover:underline" target="_blank" rel="noopener noreferrer">
            Warp
          </a>{' '}
          &mdash; free, open-source logistics tools.{' '}
          <a href="https://github.com/dasokolovsky/warp-tools" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>

      {/* Printable version — only visible when printing */}
      <PrintableStatement
        driverName={driverName}
        periodStart={periodStart}
        periodEnd={periodEnd}
        trips={trips}
        deductions={deductions}
        reimbursements={reimbursements}
        advances={advances}
        payType={payType}
        rate={rateNum}
        calc={calc}
      />
    </div>
  );
}
