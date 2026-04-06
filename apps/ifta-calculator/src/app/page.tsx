'use client';

import { useState, useCallback } from 'react';
import { Plus, Github, Fuel } from 'lucide-react';
import QuarterSelector from '@/components/QuarterSelector';
import StateRow from '@/components/StateRow';
import CalculationSummary from '@/components/CalculationSummary';
import IFTAReport from '@/components/IFTAReport';
import { getRateByCode, LAST_UPDATED } from '@/data/ifta-rates';
import type { FuelType } from '@/components/QuarterSelector';
import type { StateEntry } from '@/components/StateRow';

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function makeEntry(): StateEntry {
  return { id: makeId(), jurisdictionCode: '', miles: '', gallons: '' };
}

function computeTotals(
  entries: StateEntry[],
  fuelType: FuelType
): {
  totalMiles: number;
  totalGallons: number;
  fleetMPG: number;
  totalTaxOwed: number;
  totalTaxPaid: number;
  netTax: number;
} {
  let totalMiles = 0;
  let totalGallons = 0;

  for (const e of entries) {
    totalMiles += parseFloat(e.miles) || 0;
    totalGallons += parseFloat(e.gallons) || 0;
  }

  const fleetMPG = totalGallons > 0 ? totalMiles / totalGallons : 0;

  let totalTaxOwed = 0;
  let totalTaxPaid = 0;

  for (const e of entries) {
    if (!e.jurisdictionCode) continue;
    const miles = parseFloat(e.miles) || 0;
    const gallonsPurchased = parseFloat(e.gallons) || 0;
    if (miles === 0 && gallonsPurchased === 0) continue;

    const rateInfo = getRateByCode(e.jurisdictionCode);
    if (!rateInfo) continue;

    const taxRate = fuelType === 'diesel' ? rateInfo.dieselRate : rateInfo.gasolineRate;
    const taxableGallons = fleetMPG > 0 ? miles / fleetMPG : 0;

    totalTaxOwed += taxableGallons * taxRate;
    totalTaxPaid += gallonsPurchased * taxRate;
  }

  return {
    totalMiles,
    totalGallons,
    fleetMPG,
    totalTaxOwed,
    totalTaxPaid,
    netTax: totalTaxOwed - totalTaxPaid,
  };
}

const INITIAL_ENTRIES: StateEntry[] = [
  makeEntry(),
  makeEntry(),
  makeEntry(),
];

export default function IFTAPage() {
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(2026);
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [baseJurisdiction, setBaseJurisdiction] = useState('');
  const [entries, setEntries] = useState<StateEntry[]>(INITIAL_ENTRIES);

  const handleUpdate = useCallback(
    (id: string, field: keyof StateEntry, value: string) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
      );
    },
    []
  );

  const handleRemove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleAdd = useCallback(() => {
    setEntries((prev) => [...prev, makeEntry()]);
  }, []);

  const totals = computeTotals(entries, fuelType);

  return (
    <div className="min-h-screen bg-warp-bg flex flex-col">
      {/* Nav */}
      <nav className="no-print border-b border-warp-border bg-warp-card px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-warp-accent rounded-lg flex items-center justify-center">
            <Fuel size={16} className="text-black" />
          </div>
          <div>
            <span className="text-white font-semibold text-sm">IFTA Calculator</span>
            <span className="text-warp-muted text-xs ml-2">by Warp Tools</span>
          </div>
        </div>
        <a
          href="https://github.com/wearewarp/warp-tools"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-warp-muted hover:text-white text-sm transition-colors"
        >
          <Github size={16} />
          <span className="hidden sm:inline">warp-tools</span>
        </a>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="no-print">
          <h1 className="text-2xl font-bold text-white mb-1">
            IFTA Mileage &amp; Fuel Tax Calculator
          </h1>
          <p className="text-warp-muted">
            Calculate your state-by-state fuel tax for quarterly IFTA reporting.
            Rates updated {LAST_UPDATED}.
          </p>
        </div>

        {/* Quarter / Config */}
        <div className="no-print bg-warp-card border border-warp-border rounded-warp p-5">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
            Report Settings
          </h2>
          <QuarterSelector
            quarter={quarter}
            year={year}
            fuelType={fuelType}
            baseJurisdiction={baseJurisdiction}
            onQuarterChange={setQuarter}
            onYearChange={setYear}
            onFuelTypeChange={setFuelType}
            onBaseJurisdictionChange={setBaseJurisdiction}
          />
        </div>

        {/* Trip Entry */}
        <div className="no-print bg-warp-card border border-warp-border rounded-warp overflow-hidden">
          <div className="px-5 py-4 border-b border-warp-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                Mileage &amp; Fuel Entry
              </h2>
              <p className="text-xs text-warp-muted mt-0.5">
                Enter miles driven and gallons purchased in each jurisdiction
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-warp-accent text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              Add State
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warp-border bg-warp-card-hover">
                  <th className="text-left py-2.5 px-3 text-warp-muted font-medium text-xs uppercase tracking-wide w-10">
                    #
                  </th>
                  <th className="text-left py-2.5 px-2 text-warp-muted font-medium text-xs uppercase tracking-wide">
                    Jurisdiction
                  </th>
                  <th className="text-right py-2.5 px-2 text-warp-muted font-medium text-xs uppercase tracking-wide w-40">
                    Miles Driven
                  </th>
                  <th className="text-right py-2.5 px-2 text-warp-muted font-medium text-xs uppercase tracking-wide w-44">
                    Gallons Purchased
                  </th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <StateRow
                    key={entry.id}
                    entry={entry}
                    index={i}
                    onUpdate={handleUpdate}
                    onRemove={handleRemove}
                    canRemove={entries.length > 1}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-warp-border">
            <button
              onClick={handleAdd}
              className="text-sm text-warp-muted hover:text-warp-accent transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              Add another jurisdiction
            </button>
          </div>
        </div>

        {/* Summary */}
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 no-print">
            Summary
          </h2>
          <CalculationSummary
            totalMiles={totals.totalMiles}
            totalGallons={totals.totalGallons}
            fleetMPG={totals.fleetMPG}
            totalTaxOwed={totals.totalTaxOwed}
            totalTaxPaid={totals.totalTaxPaid}
            netTax={totals.netTax}
          />
        </div>

        {/* IFTA Report */}
        <div className="bg-warp-card border border-warp-border rounded-warp p-5">
          <IFTAReport
            entries={entries}
            fuelType={fuelType}
            fleetMPG={totals.fleetMPG}
            quarter={quarter}
            year={year}
            baseJurisdiction={baseJurisdiction}
          />
        </div>

        {/* How IFTA Works */}
        <div className="no-print bg-warp-card border border-warp-border rounded-warp p-5">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
            How IFTA Works
          </h2>
          <div className="text-sm text-warp-muted space-y-2 leading-relaxed">
            <p>
              The <strong className="text-white">International Fuel Tax Agreement (IFTA)</strong> simplifies
              fuel tax reporting for carriers operating in multiple U.S. states and Canadian provinces.
              Instead of filing separately in each jurisdiction, you file one quarterly return with
              your base jurisdiction.
            </p>
            <p>
              <strong className="text-white">How it&apos;s calculated:</strong> IFTA computes your
              fleet&apos;s average MPG across all miles driven. For each state, it calculates how many
              gallons you &quot;should have consumed&quot; (taxable gallons = state miles ÷ fleet MPG).
              You owe that state&apos;s tax rate on those taxable gallons, minus any tax already paid
              on fuel purchased in that state.
            </p>
            <p>
              States where you drove more than you fueled up will show tax <span className="text-warp-danger">owed</span>.
              States where you fueled up more than you drove will show a <span className="text-warp-accent">credit</span>.
              The net amount is what you pay (or get refunded) each quarter.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-warp-border py-5 px-6 text-center text-sm text-warp-muted">
        Part of{' '}
        <a
          href="https://github.com/wearewarp/warp-tools"
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
