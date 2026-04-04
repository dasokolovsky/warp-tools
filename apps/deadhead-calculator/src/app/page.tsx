'use client';

import { useState, useCallback } from 'react';
import { ArrowRight, Zap, BarChart2, GitCompare } from 'lucide-react';
import NavBar from '@/components/NavBar';
import InputField from '@/components/InputField';
import ResultCard from '@/components/ResultCard';
import DeadheadGauge from '@/components/DeadheadGauge';
import RevenueChart from '@/components/RevenueChart';
import ComparisonMode from '@/components/ComparisonMode';
import { calculateLoad, formatCurrency, formatRate, formatPercent } from '@/lib/calculations';

// ─── Presets ─────────────────────────────────────────────────────────────────

interface Preset {
  label: string;
  deadheadMiles: string;
  loadedMiles: string;
}

const PRESETS: Preset[] = [
  { label: 'Short deadhead', deadheadMiles: '50', loadedMiles: '500' },
  { label: 'Long deadhead', deadheadMiles: '200', loadedMiles: '800' },
  { label: 'Local run', deadheadMiles: '10', loadedMiles: '50' },
];

// ─── Worth-it banner ─────────────────────────────────────────────────────────

function getWorthItText(level: 'green' | 'yellow' | 'red'): string {
  if (level === 'green') return '✅ Worth Taking — Strong rate per mile';
  if (level === 'yellow') return '⚠️ Marginal — Consider negotiating the rate';
  return '❌ Pass — Effective rate too low after deadhead costs';
}

function getWorthItBg(level: 'green' | 'yellow' | 'red'): string {
  if (level === 'green') return 'bg-[#00C650]/15 border-[#00C650]/30 text-[#00C650]';
  if (level === 'yellow') return 'bg-[#FFAA00]/15 border-[#FFAA00]/30 text-[#FFAA00]';
  return 'bg-[#FF4444]/15 border-[#FF4444]/30 text-[#FF4444]';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'calculator' | 'compare';

export default function DeadheadPage() {
  // Locations (display only)
  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');

  // Core inputs
  const [deadheadMiles, setDeadheadMiles] = useState('');
  const [loadedMiles, setLoadedMiles] = useState('');
  const [loadRate, setLoadRate] = useState('');

  // Cost inputs
  const [fuelCostPerGallon, setFuelCostPerGallon] = useState('3.50');
  const [mpg, setMpg] = useState('6.5');
  const [tolls, setTolls] = useState('0');
  const [driverPayPerHour, setDriverPayPerHour] = useState('0');
  const [deadheadHours, setDeadheadHours] = useState('0');
  const [carrierCosts, setCarrierCosts] = useState('0');

  // Tab
  const [tab, setTab] = useState<Tab>('calculator');

  const applyPreset = useCallback((preset: Preset) => {
    setDeadheadMiles(preset.deadheadMiles);
    setLoadedMiles(preset.loadedMiles);
  }, []);

  // Parse inputs
  const dh = parseFloat(deadheadMiles) || 0;
  const loaded = parseFloat(loadedMiles) || 0;
  const rate = parseFloat(loadRate) || 0;
  const fuel = parseFloat(fuelCostPerGallon) || 3.5;
  const mpgVal = parseFloat(mpg) || 6.5;
  const tollsVal = parseFloat(tolls) || 0;
  const driverPay = parseFloat(driverPayPerHour) || 0;
  const dhHours = parseFloat(deadheadHours) || 0;
  const carrier = parseFloat(carrierCosts) || 0;

  const hasInputs = dh > 0 || loaded > 0 || rate > 0;

  const result = calculateLoad({
    deadheadMiles: dh,
    loadedMiles: loaded,
    loadRate: rate,
    fuelCostPerGallon: fuel,
    mpg: mpgVal,
    tolls: tollsVal,
    driverPayPerHour: driverPay,
    deadheadHours: dhHours,
    carrierCosts: carrier,
  });

  const driverCostDeadhead = driverPay * dhHours;

  return (
    <div className="min-h-screen bg-warp-bg">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Deadhead Mileage Calculator</h1>
          <p className="text-warp-muted">
            Calculate the true cost of empty miles — know before you go.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-warp-card border border-warp-border rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'calculator'
                ? 'bg-warp-accent text-black'
                : 'text-warp-muted hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Calculator
          </button>
          <button
            onClick={() => setTab('compare')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'compare'
                ? 'bg-warp-accent text-black'
                : 'text-warp-muted hover:text-white'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Compare Loads
          </button>
        </div>

        {tab === 'compare' && (
          <ComparisonMode fuelCostPerGallon={fuel} mpg={mpgVal} />
        )}

        {tab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ── LEFT: Inputs ── */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Presets */}
              <div className="bg-warp-card border border-warp-border rounded-warp p-4">
                <p className="text-xs font-medium text-warp-muted uppercase tracking-wide mb-3">
                  Quick Presets
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warp-bg border border-warp-border text-xs text-warp-muted hover:text-white hover:border-warp-accent/50 transition-colors"
                    >
                      <Zap className="w-3 h-3" />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div className="bg-warp-card border border-warp-border rounded-warp p-4 flex flex-col gap-3">
                <p className="text-xs font-medium text-warp-muted uppercase tracking-wide">Route</p>
                <InputField
                  label="Current Location"
                  value={currentLocation}
                  onChange={setCurrentLocation}
                  placeholder="Chicago, IL"
                  hint="City, state or zip"
                />
                <InputField
                  label="Pickup Location"
                  value={pickupLocation}
                  onChange={setPickupLocation}
                  placeholder="Indianapolis, IN"
                  hint="City, state or zip"
                />
                <InputField
                  label="Delivery Location"
                  value={deliveryLocation}
                  onChange={setDeliveryLocation}
                  placeholder="Columbus, OH"
                  hint="City, state or zip"
                />
              </div>

              {/* Core */}
              <div className="bg-warp-card border border-warp-border rounded-warp p-4 flex flex-col gap-3">
                <p className="text-xs font-medium text-warp-muted uppercase tracking-wide">Miles &amp; Rate</p>
                <InputField
                  label="Deadhead Miles (empty)"
                  value={deadheadMiles}
                  onChange={setDeadheadMiles}
                  type="number"
                  placeholder="50"
                  suffix="mi"
                />
                <InputField
                  label="Loaded Miles"
                  value={loadedMiles}
                  onChange={setLoadedMiles}
                  type="number"
                  placeholder="500"
                  suffix="mi"
                />
                <InputField
                  label="Load Rate (flat)"
                  value={loadRate}
                  onChange={setLoadRate}
                  type="number"
                  placeholder="1500"
                  prefix="$"
                  hint="Total $ for the load"
                />
              </div>

              {/* Costs */}
              <div className="bg-warp-card border border-warp-border rounded-warp p-4 flex flex-col gap-3">
                <p className="text-xs font-medium text-warp-muted uppercase tracking-wide">Operating Costs</p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Fuel $/gal"
                    value={fuelCostPerGallon}
                    onChange={setFuelCostPerGallon}
                    type="number"
                    placeholder="3.50"
                    prefix="$"
                  />
                  <InputField
                    label="MPG"
                    value={mpg}
                    onChange={setMpg}
                    type="number"
                    placeholder="6.5"
                  />
                </div>
                <InputField
                  label="Tolls (deadhead leg)"
                  value={tolls}
                  onChange={setTolls}
                  type="number"
                  placeholder="0"
                  prefix="$"
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Driver $/hr"
                    value={driverPayPerHour}
                    onChange={setDriverPayPerHour}
                    type="number"
                    placeholder="0"
                    prefix="$"
                  />
                  <InputField
                    label="DH Hours"
                    value={deadheadHours}
                    onChange={setDeadheadHours}
                    type="number"
                    placeholder="0"
                    suffix="hr"
                  />
                </div>
                <InputField
                  label="Other Carrier Costs"
                  value={carrierCosts}
                  onChange={setCarrierCosts}
                  type="number"
                  placeholder="0"
                  prefix="$"
                  hint="Insurance, permits, etc."
                />
              </div>
            </div>

            {/* ── RIGHT: Results ── */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* Route summary */}
              {(currentLocation || pickupLocation || deliveryLocation) && (
                <div className="bg-warp-card border border-warp-border rounded-warp p-4">
                  <p className="text-xs font-medium text-warp-muted uppercase tracking-wide mb-3">Route</p>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="px-3 py-1.5 rounded-lg bg-warp-border/50 text-white font-medium">
                      {currentLocation || 'Current'}
                    </span>
                    <span className="flex items-center gap-1 text-warp-muted text-xs">
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span className="bg-[#FFAA00]/20 text-[#FFAA00] text-xs px-1.5 py-0.5 rounded">empty {dh > 0 ? `${dh}mi` : ''}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-warp-border/50 text-white font-medium">
                      {pickupLocation || 'Pickup'}
                    </span>
                    <span className="flex items-center gap-1 text-warp-muted text-xs">
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span className="bg-[#00C650]/20 text-[#00C650] text-xs px-1.5 py-0.5 rounded">loaded {loaded > 0 ? `${loaded}mi` : ''}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-warp-border/50 text-white font-medium">
                      {deliveryLocation || 'Delivery'}
                    </span>
                  </div>
                </div>
              )}

              {/* Worth it banner */}
              {hasInputs && rate > 0 && (
                <div className={`border rounded-warp px-4 py-3 text-sm font-semibold ${getWorthItBg(result.worthItLevel)}`}>
                  {getWorthItText(result.worthItLevel)}
                </div>
              )}

              {/* Key metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                <ResultCard
                  label="Effective Rate / Total Mile"
                  value={hasInputs ? formatRate(result.effectiveRatePerTotalMile) : '—'}
                  sub="Revenue ÷ total miles driven"
                  highlight={
                    !hasInputs ? 'neutral' :
                    result.worthItLevel === 'green' ? 'green' :
                    result.worthItLevel === 'yellow' ? 'yellow' : 'red'
                  }
                />
                <ResultCard
                  label="Effective Rate / Loaded Mile"
                  value={hasInputs ? formatRate(result.effectiveRatePerLoadedMile) : '—'}
                  sub="Revenue ÷ loaded miles only"
                  highlight="neutral"
                />
                <ResultCard
                  label="Total Deadhead Cost"
                  value={hasInputs ? formatCurrency(result.totalDeadheadCost) : '—'}
                  sub={hasInputs ? `Fuel ${formatCurrency(result.fuelCostDeadhead)} + tolls + driver` : undefined}
                  highlight={result.totalDeadheadCost > rate * 0.2 ? 'red' : 'neutral'}
                />
                <ResultCard
                  label="Net Profit"
                  value={hasInputs ? formatCurrency(result.netProfit) : '—'}
                  sub="After deadhead + carrier costs"
                  highlight={!hasInputs ? 'neutral' : result.netProfit >= 0 ? 'green' : 'red'}
                />
                <ResultCard
                  label="Total Trip Miles"
                  value={hasInputs ? `${result.totalMiles.toLocaleString()} mi` : '—'}
                  sub={`${dh} empty + ${loaded} loaded`}
                />
                <ResultCard
                  label="Deadhead Ratio"
                  value={hasInputs ? formatPercent(result.deadheadRatio) : '—'}
                  sub="Should be < 15%"
                  highlight={
                    !hasInputs ? 'neutral' :
                    result.deadheadRatio < 0.1 ? 'green' :
                    result.deadheadRatio < 0.15 ? 'yellow' : 'red'
                  }
                />
              </div>

              {/* Gauge */}
              {hasInputs && (
                <div className="bg-warp-card border border-warp-border rounded-warp p-6">
                  <p className="text-xs font-medium text-warp-muted uppercase tracking-wide mb-4">
                    Deadhead Ratio Gauge
                  </p>
                  <div className="flex justify-center">
                    <DeadheadGauge ratio={result.deadheadRatio} />
                  </div>
                </div>
              )}

              {/* Revenue chart */}
              {hasInputs && rate > 0 && (
                <div className="bg-warp-card border border-warp-border rounded-warp p-6">
                  <p className="text-xs font-medium text-warp-muted uppercase tracking-wide mb-4">
                    Revenue vs. Costs Breakdown
                  </p>
                  <RevenueChart
                    loadRate={rate}
                    fuelCostDeadhead={result.fuelCostDeadhead}
                    tolls={tollsVal}
                    driverCostDeadhead={driverCostDeadhead}
                    carrierCosts={carrier}
                    netProfit={result.netProfit}
                  />
                </div>
              )}

              {/* Empty state */}
              {!hasInputs && (
                <div className="bg-warp-card border border-warp-border rounded-warp p-12 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-xl bg-warp-accent-muted flex items-center justify-center">
                    <BarChart2 className="w-6 h-6 text-warp-accent" />
                  </div>
                  <p className="text-white font-medium">Enter your load details</p>
                  <p className="text-warp-muted text-sm max-w-xs">
                    Fill in miles and rate to see the true cost of deadhead miles and whether this load is worth taking.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-warp-border mt-16 py-8 text-center text-warp-muted text-sm">
        <p>
          Deadhead Calculator by{' '}
          <a href="https://wearewarp.com" className="text-warp-accent hover:underline" target="_blank" rel="noopener noreferrer">
            Warp
          </a>{' '}
          &mdash; free, open-source logistics tools.{' '}
          <a href="https://github.com/dasokolovsky/warp-tools" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
