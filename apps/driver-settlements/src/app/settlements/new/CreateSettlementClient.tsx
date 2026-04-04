'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Users, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, getPayTypeLabel } from '@/lib/utils';
import type { Driver, DeductionTemplate } from '@/db/schema';
import { calculateTripPay } from '@/lib/pay-calculator';

interface Props {
  drivers: Driver[];
  templates: DeductionTemplate[];
}

interface TripPreview {
  id: number;
  load_ref: string | null;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  miles: number | null;
  revenue: number | null;
  hours: number | null;
  stops: number | null;
  trip_date: string;
  pay_amount: number;
}

interface Props {
  drivers: Driver[];
  templates: DeductionTemplate[];
}

export function CreateSettlementClient({ drivers, templates }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [driverId, setDriverId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    trips: TripPreview[];
    gross: number;
    deductions: number;
    advances: number;
    net: number;
    driver: Driver | null;
  } | null>(null);

  const selectedDriver = drivers.find((d) => d.id === parseInt(driverId));

  const loadPreview = useCallback(async () => {
    if (!driverId || !periodStart || !periodEnd) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/settlements?driver_id=${driverId}&date_from=${periodStart}&date_to=${periodEnd}&limit=100`
      );
      const data = await res.json();
      const driver = drivers.find((d) => d.id === parseInt(driverId));
      if (!driver) return;

      // Trips (unassigned ones would be filtered client-side, but for preview use all matching)
      const trips: TripPreview[] = data.settlements[0]?.trips || []; // Approximate

      // Recalculate pay
      const updatedTrips = trips.map((t: any) => ({
        ...t,
        pay_amount: calculateTripPay(driver.pay_type as any, driver.pay_rate, {
          miles: t.miles,
          revenue: t.revenue,
          hours: t.hours,
          stops: t.stops,
        }),
      }));

      const gross = updatedTrips.reduce((s, t) => s + t.pay_amount, 0);

      // Templates
      const templateTotal = templates.reduce((s, t) => {
        const amt = t.is_percentage ? (gross * (t.amount / 100)) : t.amount;
        return s + amt;
      }, 0);

      // Mock advances for preview
      const advancesTotal = 0; // Would fetch outstanding

      const net = gross - templateTotal - advancesTotal;

      setPreview({
        trips: updatedTrips.slice(0, 10), // First 10
        gross: Math.round(gross * 100) / 100,
        deductions: Math.round(templateTotal * 100) / 100,
        advances: advancesTotal,
        net: Math.round(net * 100) / 100,
        driver,
      });
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  }, [driverId, periodStart, periodEnd, drivers, templates]);

  const createSettlement = async () => {
    if (!driverId || !periodStart || !periodEnd) return;
    setLoading(true);
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: parseInt(driverId), period_start: periodStart, period_end: periodEnd }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/settlements/${data.settlement.id}`);
        router.refresh();
      }
    } catch (err) {
      console.error('Create error:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!driverId || !selectedDriver)) return;
    if (step === 2 && (!periodStart || !periodEnd)) return;
    if (step === 3) return createSettlement();
    setStep(step + 1);
  };

  const prevStep = () => step > 1 && setStep(step - 1);

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-[#8B95A5] hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">New Settlement</h1>
        <div className="w-24 h-1 bg-gradient-to-r from-[#00C650] to-transparent mx-auto rounded-full" />
        <div className="flex justify-center gap-1 text-xs text-[#8B95A5] mt-4">
          Step {step} of 3
        </div>
      </div>

      <div className="space-y-8">
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#00C650]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#00C650]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Select Driver</h2>
                <p className="text-sm text-[#8B95A5]">Choose the driver for this settlement period</p>
              </div>
            </div>
            <select
              className="w-full rounded-xl bg-[#080F1E] border border-[#1A2235] px-4 py-3 text-lg text-white focus:outline-none focus:border-[#00C650]/50"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">Select a driver...</option>
              {drivers.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.first_name} {d.last_name} ({getPayTypeLabel(d.pay_type)} @ {d.pay_type === 'percentage' ? `${d.pay_rate}%` : `$${d.pay_rate}`})
                </option>
              ))}
            </select>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedDriver ? `${selectedDriver.first_name}'s ` : ''}Pay Period</h2>
                <p className="text-sm text-[#8B95A5]">Enter the date range for the settlement</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#8B95A5] mb-2">Start Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl bg-[#080F1E] border border-[#1A2235] px-4 py-3 text-lg text-white focus:outline-none focus:border-blue-500/50"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-[#8B95A5] mb-2">End Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl bg-[#080F1E] border border-[#1A2235] px-4 py-3 text-lg text-white focus:outline-none focus:border-blue-500/50"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#00C650]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#00C650]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Preview & Create</h2>
                <p className="text-sm text-[#8B95A5]">Review auto-populated data before creating</p>
              </div>
            </div>

            {preview ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6">
                    <div className="text-sm text-[#8B95A5] mb-4 uppercase tracking-wide">Driver</div>
                    <div className="text-lg font-bold text-white">{preview.driver?.first_name} {preview.driver?.last_name}</div>
                    <div className="text-sm text-slate-400 mt-1">{getPayTypeLabel(preview.driver!.pay_type as any)} @ {preview.driver!.pay_rate}</div>
                  </div>
                  <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6">
                    <div className="text-sm text-[#8B95A5] mb-4 uppercase tracking-wide">Period</div>
                    <div className="text-lg font-bold text-white">
                      {formatDate(periodStart)} – {formatDate(periodEnd)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#8B95A5] mb-3 uppercase tracking-wide">Trips ({preview.trips.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {preview.trips.map((t) => (
                        <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#1A2235]/50">
                          <div>
                            <div className="font-mono text-[#00C650] text-sm">{t.load_ref ?? '—'}</div>
                            <div className="text-xs text-[#8B95A5]">{t.origin_city}-{t.origin_state} → {t.dest_city}-{t.dest_state}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-white text-sm">{formatCurrency(t.pay_amount)}</div>
                            <div className="text-xs text-[#8B95A5]">{t.miles ?? 0} mi</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-[#8B95A5]">Gross Earnings</div>
                          <div className="font-bold text-white text-lg">{formatCurrency(preview.gross)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#8B95A5]">Recurring Deductions</div>
                          <div className="font-bold text-red-400 text-lg">−{formatCurrency(preview.deductions)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#8B95A5]">Outstanding Advances</div>
                          <div className="font-bold text-orange-400 text-lg">−{formatCurrency(preview.advances)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#8B95A5] uppercase tracking-wide font-semibold">Net Pay</div>
                          <div className="text-2xl font-bold text-[#00C650]">{formatCurrency(preview.net)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-[#8B95A5] space-y-1">
                      <div>• Auto-populates trips in date range not yet assigned to a settlement</div>
                      <div>• Applies active recurring deduction templates</div>
                      <div>• Includes outstanding advances for this driver</div>
                      <div>• Status starts as 'open' (editable)</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#8B95A5]">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00C650]" />
                <div>Generating preview...</div>
              </div>
            )}
          </div>
        )}

        {/* Stepper dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-all ${
                step === s ? 'bg-[#00C650] scale-125' : 'bg-[#1A2235] scale-100'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#8B95A5] hover:text-white transition-colors flex-1 md:flex-none"
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <div className="flex-1 md:w-auto" />
          <button
            onClick={nextStep}
            disabled={loading || (step === 1 && !driverId) || (step === 2 && (!periodStart || !periodEnd)) || (step === 3 && !preview)}
            className="inline-flex items-center gap-2 bg-[#00C650] text-black font-semibold px-6 py-3 rounded-xl hover:bg-[#00C650]/90 transition-all disabled:opacity-50 flex-1 md:flex-none text-sm"
          >
            {step === 3 ? 'Create Settlement' : 'Continue'}
            <ChevronRight className="h-4 w-4" />
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}
