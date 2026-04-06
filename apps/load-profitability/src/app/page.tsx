'use client';

import { useState, useId, useCallback } from 'react';
import { Github, Truck, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import CostBreakdownChart from '@/components/CostBreakdownChart';
import ProfitWaterfall from '@/components/ProfitWaterfall';
import BreakEvenDisplay from '@/components/BreakEvenDisplay';
import ScenarioCompare from '@/components/ScenarioCompare';
import {
  calcLoad,
  defaultInputs,
  fmt,
  fmtNum,
  type LoadInputs,
  type AccessorialItem,
  type DriverPayMode,
} from '@/lib/calc';

// ── Small pure UI helpers (NOT components — just render functions) ────────────

function renderLabel(text: string) {
  return (
    <label className="text-xs font-medium text-warp-muted uppercase tracking-wider block mb-1.5">
      {text}
    </label>
  );
}

function renderSectionCard(title: string | null, children: React.ReactNode, className?: string) {
  return (
    <div className={`bg-warp-card border border-warp-border rounded-2xl p-6 ${className ?? ''}`}>
      {title && (
        <h2 className="text-base font-semibold text-white mb-5">{title}</h2>
      )}
      {children}
    </div>
  );
}

function renderStatCard(label: string, value: string, color: string) {
  return (
    <div className="bg-warp-card border border-warp-border rounded-xl p-4">
      <div className="text-xs text-warp-muted mb-1">{label}</div>
      <div className="font-mono font-bold text-base" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Scenario {
  name: string;
  result: ReturnType<typeof calcLoad>;
  miles: number;
}

// ── Field components (defined at module level — never nested) ─────────────────

interface NumFieldProps {
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}

function NumField({ label, prefix, suffix, value, onChange, placeholder, step }: NumFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {renderLabel(label)}
      <div className="flex items-center bg-warp-bg border border-warp-border rounded-xl overflow-hidden focus-within:border-warp-accent transition-colors">
        {prefix && (
          <span className="px-3 py-2.5 text-warp-muted text-sm font-mono border-r border-warp-border">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '0.00'}
          step={step ?? '0.01'}
          min="0"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm font-mono text-white outline-none placeholder:text-warp-muted/50 text-right"
        />
        {suffix && (
          <span className="px-3 py-2.5 text-warp-muted text-sm border-l border-warp-border">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface ToggleGroupProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

function ToggleGroup<T extends string>({ options, value, onChange }: ToggleGroupProps<T>) {
  return (
    <div className="flex bg-warp-bg border border-warp-border rounded-xl p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
            value === opt.id
              ? 'bg-warp-accent text-black'
              : 'text-warp-muted hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LoadProfitabilityPage() {
  const uid = useId();

  // ── Inputs state ──
  const [inputs, setInputs] = useState<LoadInputs>(() => defaultInputs());

  // String versions of numeric inputs (for controlled inputs)
  const [customerRate, setCustomerRate] = useState('');
  const [loadedMiles, setLoadedMiles] = useState('');
  const [fuelSurcharge, setFuelSurcharge] = useState('');
  const [mpg, setMpg] = useState('6.5');
  const [fuelPrice, setFuelPrice] = useState('3.50');
  const [driverPayPerMile, setDriverPayPerMile] = useState('');
  const [driverPayPercent, setDriverPayPercent] = useState('');
  const [driverPayFlat, setDriverPayFlat] = useState('');
  const [tolls, setTolls] = useState('');
  const [deadheadMiles, setDeadheadMiles] = useState('');
  const [monthlyMiles, setMonthlyMiles] = useState('10000');
  const [truckPayment, setTruckPayment] = useState('');
  const [insurance, setInsurance] = useState('');
  const [maintenancePerMile, setMaintenancePerMile] = useState('0.15');
  const [permits, setPermits] = useState('');
  const [overhead, setOverhead] = useState('');

  const [ratePerMile, setRatePerMile] = useState(false);
  const [driverPayMode, setDriverPayMode] = useState<DriverPayMode>('per-mile');
  const [accessorials, setAccessorials] = useState<AccessorialItem[]>([]);

  // UI state
  const [showFixed, setShowFixed] = useState(true);
  const [scenarioName, setScenarioName] = useState('Scenario 1');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  // Build current inputs object from string state
  const currentInputs: LoadInputs = {
    customerRate: parseFloat(customerRate) || 0,
    ratePerMile,
    loadedMiles: parseFloat(loadedMiles) || 0,
    fuelSurcharge: parseFloat(fuelSurcharge) || 0,
    accessorials,
    mpg: parseFloat(mpg) || 6.5,
    fuelPricePerGallon: parseFloat(fuelPrice) || 3.5,
    driverPayMode,
    driverPayPerMile: parseFloat(driverPayPerMile) || 0,
    driverPayPercent: parseFloat(driverPayPercent) || 0,
    driverPayFlat: parseFloat(driverPayFlat) || 0,
    tolls: parseFloat(tolls) || 0,
    deadheadMiles: parseFloat(deadheadMiles) || 0,
    monthlyMiles: parseFloat(monthlyMiles) || 10000,
    truckPaymentMonthly: parseFloat(truckPayment) || 0,
    insuranceMonthly: parseFloat(insurance) || 0,
    maintenancePerMile: parseFloat(maintenancePerMile) || 0.15,
    permitsMonthly: parseFloat(permits) || 0,
    overheadMonthly: parseFloat(overhead) || 0,
  };

  const result = calcLoad(currentInputs);
  const hasRevenue = currentInputs.customerRate > 0;
  const netColor = result.trueNetProfit >= 0 ? '#00C650' : '#FF4444';

  // ── Accessorial helpers ──

  const addAccessorial = useCallback(() => {
    setAccessorials((prev) => [
      ...prev,
      { id: `${uid}-${Date.now()}`, label: '', amount: '' },
    ]);
  }, [uid]);

  const removeAccessorial = useCallback((id: string) => {
    setAccessorials((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAccessorialLabel = useCallback((id: string, label: string) => {
    setAccessorials((prev) =>
      prev.map((a) => (a.id === id ? { ...a, label } : a)),
    );
  }, []);

  const updateAccessorialAmount = useCallback((id: string, amount: string) => {
    setAccessorials((prev) =>
      prev.map((a) => (a.id === id ? { ...a, amount } : a)),
    );
  }, []);

  // ── Scenario helpers ──

  const saveScenario = useCallback(() => {
    const miles = parseFloat(loadedMiles) || 0;
    const snap: LoadInputs = {
      customerRate: parseFloat(customerRate) || 0,
      ratePerMile,
      loadedMiles: miles,
      fuelSurcharge: parseFloat(fuelSurcharge) || 0,
      accessorials,
      mpg: parseFloat(mpg) || 6.5,
      fuelPricePerGallon: parseFloat(fuelPrice) || 3.5,
      driverPayMode,
      driverPayPerMile: parseFloat(driverPayPerMile) || 0,
      driverPayPercent: parseFloat(driverPayPercent) || 0,
      driverPayFlat: parseFloat(driverPayFlat) || 0,
      tolls: parseFloat(tolls) || 0,
      deadheadMiles: parseFloat(deadheadMiles) || 0,
      monthlyMiles: parseFloat(monthlyMiles) || 10000,
      truckPaymentMonthly: parseFloat(truckPayment) || 0,
      insuranceMonthly: parseFloat(insurance) || 0,
      maintenancePerMile: parseFloat(maintenancePerMile) || 0.15,
      permitsMonthly: parseFloat(permits) || 0,
      overheadMonthly: parseFloat(overhead) || 0,
    };
    setScenarios((prev) =>
      [
        ...prev,
        { name: scenarioName, result: calcLoad(snap), miles },
      ].slice(-2),
    );
    setScenarioName(`Scenario ${scenarios.length + 2}`);
  }, [
    scenarioName, loadedMiles, customerRate, ratePerMile, fuelSurcharge, accessorials,
    mpg, fuelPrice, driverPayMode, driverPayPerMile, driverPayPercent, driverPayFlat,
    tolls, deadheadMiles, monthlyMiles, truckPayment, insurance, maintenancePerMile,
    permits, overhead, scenarios.length,
  ]);

  const removeScenario = useCallback((idx: number) => {
    setScenarios((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Render helpers (NOT components — render functions called inline) ──────

  function renderRateTypeToggle() {
    return (
      <ToggleGroup
        options={[
          { id: 'flat', label: 'Flat Rate' },
          { id: 'per-mile', label: 'Per Mile' },
        ]}
        value={ratePerMile ? 'per-mile' : 'flat'}
        onChange={(v: string) => setRatePerMile(v === 'per-mile')}
      />
    );
  }

  function renderDriverPayToggle() {
    return (
      <ToggleGroup
        options={[
          { id: 'per-mile', label: '$/mile' },
          { id: 'percentage', label: '% Rev' },
          { id: 'flat', label: 'Flat' },
        ]}
        value={driverPayMode}
        onChange={(v: string) => setDriverPayMode(v as DriverPayMode)}
      />
    );
  }

  function renderDriverPayInput() {
    if (driverPayMode === 'per-mile') {
      return (
        <NumField
          label="Driver Pay Rate"
          prefix="$"
          suffix="/mi"
          value={driverPayPerMile}
          onChange={setDriverPayPerMile}
          placeholder="0.45"
        />
      );
    }
    if (driverPayMode === 'percentage') {
      return (
        <NumField
          label="Driver Pay %"
          suffix="%"
          value={driverPayPercent}
          onChange={setDriverPayPercent}
          placeholder="25"
        />
      );
    }
    return (
      <NumField
        label="Driver Pay (Flat)"
        prefix="$"
        value={driverPayFlat}
        onChange={setDriverPayFlat}
        placeholder="300.00"
      />
    );
  }

  function renderRevenueSection() {
    return renderSectionCard('Revenue', (
      <div className="space-y-4">
        <div>
          {renderLabel('Rate Type')}
          {renderRateTypeToggle()}
        </div>
        <div className={`grid gap-4 ${ratePerMile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          <NumField
            label={ratePerMile ? 'Customer Rate ($/mi)' : 'Customer Rate (Flat)'}
            prefix="$"
            suffix={ratePerMile ? '/mi' : undefined}
            value={customerRate}
            onChange={setCustomerRate}
            placeholder={ratePerMile ? '3.25' : '1500.00'}
          />
          {ratePerMile && (
            <NumField
              label="Loaded Miles"
              suffix="mi"
              value={loadedMiles}
              onChange={setLoadedMiles}
              placeholder="450"
              step="1"
            />
          )}
        </div>
        {!ratePerMile && (
          <NumField
            label="Loaded Miles"
            suffix="mi"
            value={loadedMiles}
            onChange={setLoadedMiles}
            placeholder="450"
            step="1"
          />
        )}
        <NumField
          label="Fuel Surcharge"
          prefix="$"
          value={fuelSurcharge}
          onChange={setFuelSurcharge}
          placeholder="0.00"
        />

        {/* Accessorials */}
        <div>
          {renderLabel('Accessorials')}
          <div className="space-y-2">
            {accessorials.map((acc) => (
              <div key={acc.id} className="flex gap-2">
                <input
                  type="text"
                  value={acc.label}
                  onChange={(e) => updateAccessorialLabel(acc.id, e.target.value)}
                  placeholder="Description (e.g. Detention)"
                  className="flex-1 bg-warp-bg border border-warp-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-warp-accent transition-colors placeholder:text-warp-muted/50"
                />
                <div className="flex items-center bg-warp-bg border border-warp-border rounded-xl overflow-hidden focus-within:border-warp-accent transition-colors w-28">
                  <span className="px-2 text-warp-muted text-sm border-r border-warp-border py-2.5">$</span>
                  <input
                    type="number"
                    value={acc.amount}
                    onChange={(e) => updateAccessorialAmount(acc.id, e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="flex-1 bg-transparent px-2 py-2.5 text-sm font-mono text-white outline-none text-right"
                  />
                </div>
                <button
                  onClick={() => removeAccessorial(acc.id)}
                  className="text-warp-muted hover:text-warp-danger transition-colors p-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addAccessorial}
              className="flex items-center gap-1.5 text-xs text-warp-accent hover:text-warp-accent/80 transition-colors"
            >
              <Plus size={12} />
              Add accessorial
            </button>
          </div>
        </div>

        {/* Total revenue */}
        <div className="border-t border-warp-border pt-3 flex justify-between items-center">
          <span className="text-sm text-warp-muted">Total Revenue</span>
          <span className="text-lg font-bold font-mono text-warp-accent">
            {hasRevenue ? fmt(result.grossRevenue) : '—'}
          </span>
        </div>
      </div>
    ));
  }

  function renderDirectCostsSection() {
    return renderSectionCard('Direct Costs', (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumField label="MPG" suffix="mpg" value={mpg} onChange={setMpg} placeholder="6.5" />
          <NumField label="Fuel Price" prefix="$" suffix="/gal" value={fuelPrice} onChange={setFuelPrice} placeholder="3.50" />
          <div className="bg-warp-bg border border-warp-border rounded-xl p-3 flex flex-col gap-0.5">
            <div className="text-xs text-warp-muted">Fuel Cost (calc)</div>
            <div className="text-sm font-mono font-semibold text-white">
              {hasRevenue && result.fuelCost > 0 ? fmt(result.fuelCost) : '—'}
            </div>
            {hasRevenue && result.fuelCost > 0 && currentInputs.loadedMiles > 0 && (
              <div className="text-xs text-warp-muted">
                {currentInputs.loadedMiles} mi ÷ {currentInputs.mpg} mpg × ${fmtNum(currentInputs.fuelPricePerGallon)}
              </div>
            )}
          </div>
        </div>

        <div>
          {renderLabel('Driver Pay Method')}
          {renderDriverPayToggle()}
        </div>
        {renderDriverPayInput()}

        <NumField label="Tolls" prefix="$" value={tolls} onChange={setTolls} placeholder="0.00" />

        <div className="border-t border-warp-border pt-4">
          <div className="text-xs text-warp-muted uppercase tracking-wider mb-3 font-medium">
            Deadhead
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumField
              label="Deadhead Miles"
              suffix="mi"
              value={deadheadMiles}
              onChange={setDeadheadMiles}
              placeholder="0"
              step="1"
            />
            <div className="bg-warp-bg border border-warp-border rounded-xl p-3 flex flex-col gap-0.5">
              <div className="text-xs text-warp-muted">Deadhead Fuel Cost</div>
              <div className="text-sm font-mono font-semibold text-white">
                {result.deadheadFuelCost > 0 ? fmt(result.deadheadFuelCost) : '—'}
              </div>
              {result.deadheadFuelCost > 0 && (
                <div className="text-xs text-warp-muted">
                  {currentInputs.deadheadMiles} mi ÷ {currentInputs.mpg} mpg × ${fmtNum(currentInputs.fuelPricePerGallon)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtotal */}
        <div className="border-t border-warp-border pt-3 space-y-1">
          {hasRevenue && (
            <div className="space-y-1 text-xs text-warp-muted mb-2">
              <div className="flex justify-between">
                <span>Fuel</span><span className="font-mono">{fmt(result.fuelCost)}</span>
              </div>
              {result.driverPay > 0 && (
                <div className="flex justify-between">
                  <span>Driver Pay</span><span className="font-mono">{fmt(result.driverPay)}</span>
                </div>
              )}
              {result.tollCost > 0 && (
                <div className="flex justify-between">
                  <span>Tolls</span><span className="font-mono">{fmt(result.tollCost)}</span>
                </div>
              )}
              {result.deadheadFuelCost > 0 && (
                <div className="flex justify-between">
                  <span>Deadhead Fuel</span><span className="font-mono">{fmt(result.deadheadFuelCost)}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-warp-muted">Total Direct Costs</span>
            <span className="text-lg font-bold font-mono text-warp-danger">
              {hasRevenue ? fmt(result.totalDirectCosts) : '—'}
            </span>
          </div>
        </div>
      </div>
    ));
  }

  function renderFixedCostsSection() {
    return renderSectionCard(null, (
      <div>
        <button
          onClick={() => setShowFixed((v) => !v)}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-base font-semibold text-white">Fixed Cost Allocation</h2>
          <span className="text-warp-muted">
            {showFixed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        {showFixed && (
          <div className="space-y-4">
            <div className="bg-warp-accent-muted border border-warp-accent/20 rounded-xl px-4 py-3 text-xs text-warp-muted">
              Monthly costs are automatically converted to per-mile rates based on your monthly mileage.
            </div>

            <NumField
              label="Monthly Miles (for cost conversion)"
              suffix="mi/mo"
              value={monthlyMiles}
              onChange={setMonthlyMiles}
              placeholder="10000"
              step="1"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumField label="Truck Payment ($/mo)" prefix="$" suffix="/mo" value={truckPayment} onChange={setTruckPayment} placeholder="2500.00" />
              <div className="bg-warp-bg border border-warp-border rounded-xl p-3 flex flex-col gap-0.5">
                <div className="text-xs text-warp-muted">Per-Mile Rate</div>
                <div className="text-sm font-mono font-semibold text-white">
                  ${fmtNum(result.truckPaymentPerMile)}/mi
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumField label="Insurance ($/mo)" prefix="$" suffix="/mo" value={insurance} onChange={setInsurance} placeholder="800.00" />
              <div className="bg-warp-bg border border-warp-border rounded-xl p-3 flex flex-col gap-0.5">
                <div className="text-xs text-warp-muted">Per-Mile Rate</div>
                <div className="text-sm font-mono font-semibold text-white">
                  ${fmtNum(result.insurancePerMile)}/mi
                </div>
              </div>
            </div>

            <NumField label="Maintenance Reserve ($/mi)" prefix="$" suffix="/mi" value={maintenancePerMile} onChange={setMaintenancePerMile} placeholder="0.15" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumField label="Permits &amp; Licensing ($/mo)" prefix="$" suffix="/mo" value={permits} onChange={setPermits} placeholder="100.00" />
              <div className="bg-warp-bg border border-warp-border rounded-xl p-3 flex flex-col gap-0.5">
                <div className="text-xs text-warp-muted">Per-Mile Rate</div>
                <div className="text-sm font-mono font-semibold text-white">
                  ${fmtNum(result.permitsPerMile)}/mi
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumField label="Overhead ($/mo)" prefix="$" suffix="/mo" value={overhead} onChange={setOverhead} placeholder="500.00" />
              <div className="bg-warp-bg border border-warp-border rounded-xl p-3 flex flex-col gap-0.5">
                <div className="text-xs text-warp-muted">Per-Mile Rate</div>
                <div className="text-sm font-mono font-semibold text-white">
                  ${fmtNum(result.overheadPerMile)}/mi
                </div>
              </div>
            </div>

            <div className="border-t border-warp-border pt-3 grid grid-cols-2 gap-3">
              <div className="flex justify-between items-center col-span-2">
                <span className="text-sm text-warp-muted">All-In Fixed (per mile)</span>
                <span className="text-base font-bold font-mono text-white">
                  ${fmtNum(result.totalFixedPerMile)}/mi
                </span>
              </div>
              <div className="flex justify-between items-center col-span-2">
                <span className="text-sm text-warp-muted">Allocated to This Load</span>
                <span className="text-base font-bold font-mono text-warp-warning">
                  {hasRevenue ? fmt(result.totalFixedAllocated) : '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    ));
  }

  function renderResultsPanel() {
    if (!hasRevenue) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-16 h-16 rounded-2xl border-2 border-warp-border flex items-center justify-center mb-4 opacity-30"
          >
            <Truck size={28} className="text-warp-muted" />
          </div>
          <p className="text-warp-muted text-sm">Enter a customer rate to see results</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* True Net Profit hero */}
        <div
          className="rounded-2xl p-6 border text-center"
          style={{
            backgroundColor: result.trueNetProfit >= 0
              ? 'rgba(0,198,80,0.08)'
              : 'rgba(255,68,68,0.08)',
            borderColor: result.trueNetProfit >= 0
              ? 'rgba(0,198,80,0.3)'
              : 'rgba(255,68,68,0.3)',
          }}
        >
          <div className="text-xs text-warp-muted uppercase tracking-wider mb-1">TRUE NET PROFIT</div>
          <div
            className="text-4xl font-bold font-mono mb-1"
            style={{ color: netColor }}
          >
            {fmt(result.trueNetProfit)}
          </div>
          <div className="text-sm" style={{ color: netColor }}>
            {fmtNum(result.trueNetMarginPercent)}% net margin
          </div>
          <div className="text-xs text-warp-muted mt-2">
            {result.revenuePerMile > 0 && (
              <span>${fmtNum(result.revenuePerMile)}/mi revenue · ${fmtNum(result.totalCostPerMile)}/mi all-in cost</span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {renderStatCard('Gross Revenue', fmt(result.grossRevenue), '#00C650')}
          {renderStatCard('Direct Costs', fmt(result.totalDirectCosts), '#FF4444')}
          {renderStatCard('Gross Margin', fmt(result.grossMargin), result.grossMargin >= 0 ? '#00C650' : '#FF4444')}
        </div>

        {/* Waterfall */}
        {renderSectionCard('Profit Waterfall', (
          <ProfitWaterfall
            grossRevenue={result.grossRevenue}
            directCosts={result.totalDirectCosts}
            fixedCosts={result.totalFixedAllocated}
            netProfit={result.trueNetProfit}
          />
        ))}

        {/* Cost breakdown chart */}
        {renderSectionCard('Cost Breakdown', (
          <CostBreakdownChart
            items={result.costBreakdown}
            totalCost={result.totalDirectCosts + result.totalFixedAllocated}
            totalRevenue={result.grossRevenue}
          />
        ))}

        {/* Break-even */}
        {renderSectionCard('Break-Even Analysis', (
          <BreakEvenDisplay
            breakEvenFlat={result.breakEvenRateFlat}
            breakEvenPerMile={result.breakEvenRatePerMile}
            currentRevenue={result.grossRevenue}
            miles={currentInputs.loadedMiles}
          />
        ))}

        {/* Cost per mile table */}
        {renderSectionCard('Cost Per Mile Breakdown', (
          <div className="space-y-2 text-sm">
            {[
              { label: 'Fuel', val: currentInputs.loadedMiles > 0 ? result.fuelCost / currentInputs.loadedMiles : 0, color: '#FF6B35' },
              { label: 'Driver Pay', val: currentInputs.loadedMiles > 0 ? result.driverPay / currentInputs.loadedMiles : 0, color: '#4ECDC4' },
              { label: 'Tolls', val: currentInputs.loadedMiles > 0 ? result.tollCost / currentInputs.loadedMiles : 0, color: '#FFE66D' },
              { label: 'Deadhead Fuel', val: currentInputs.loadedMiles > 0 ? result.deadheadFuelCost / currentInputs.loadedMiles : 0, color: '#FF8E53' },
              { label: 'Truck Payment', val: result.truckPaymentPerMile, color: '#A78BFA' },
              { label: 'Insurance', val: result.insurancePerMile, color: '#60A5FA' },
              { label: 'Maintenance', val: result.maintenancePerMile, color: '#34D399' },
              { label: 'Permits', val: result.permitsPerMile, color: '#F472B6' },
              { label: 'Overhead', val: result.overheadPerMile, color: '#94A3B8' },
            ].filter((r) => r.val > 0).map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: row.color }} />
                <span className="text-warp-muted flex-1">{row.label}</span>
                <span className="font-mono text-white">${fmtNum(row.val, 3)}/mi</span>
              </div>
            ))}
            <div className="border-t border-warp-border pt-2 flex justify-between">
              <span className="text-white font-semibold">All-In Cost / Mile</span>
              <span className="font-mono font-bold text-warp-warning">${fmtNum(result.totalCostPerMile)}/mi</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderScenarioSection() {
    return (
      <div className="mt-8">
        {renderSectionCard('Scenario Comparison', (
          <div className="space-y-5">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                {renderLabel('Scenario Name')}
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full bg-warp-bg border border-warp-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-warp-accent transition-colors"
                />
              </div>
              <button
                onClick={saveScenario}
                disabled={!hasRevenue || scenarios.length >= 2}
                className="px-4 py-2.5 bg-warp-accent text-black text-sm font-semibold rounded-xl hover:bg-warp-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Save Scenario
              </button>
            </div>

            {scenarios.length >= 2 && (
              <div className="text-xs text-warp-muted bg-warp-bg border border-warp-border rounded-xl px-3 py-2">
                Remove a scenario to add a new one (max 2 for side-by-side comparison)
              </div>
            )}

            <ScenarioCompare scenarios={scenarios} onRemove={removeScenario} />
          </div>
        ))}
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-warp-bg">
      {/* Top Nav */}
      <nav className="border-b border-warp-border bg-warp-bg/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-warp-accent flex items-center justify-center">
              <Truck size={14} className="text-black" />
            </div>
            <span className="font-semibold text-white">Load Profitability Calculator</span>
            <span className="hidden sm:inline text-xs text-warp-muted bg-warp-card border border-warp-border rounded-full px-2 py-0.5">
              by Warp Tools
            </span>
          </div>
          <a
            href="https://github.com/wearewarp/warp-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-warp-muted hover:text-white transition-colors"
          >
            <Github size={16} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Load Profitability Calculator</h1>
          <p className="text-warp-muted max-w-2xl">
            True cost-per-load analysis. Goes beyond simple margin — factors in fuel, driver pay, tolls,
            maintenance, insurance, truck payment, deadhead, and overhead. See the real number, not the &quot;looks good on paper&quot; number.
          </p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Inputs */}
          <div className="space-y-6">
            {renderRevenueSection()}
            {renderDirectCostsSection()}
            {renderFixedCostsSection()}
          </div>

          {/* Right: Results */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            {renderResultsPanel()}
          </div>
        </div>

        {/* Scenario comparison */}
        {renderScenarioSection()}

        {/* Footer */}
        <footer className="mt-16 border-t border-warp-border pt-8 text-center">
          <p className="text-warp-muted text-sm">
            <a
              href="https://wearewarp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warp-accent hover:underline"
            >
              Warp
            </a>
            {' '}· Free, open-source logistics tools ·{' '}
            <a
              href="https://github.com/wearewarp/warp-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              github.com/wearewarp/warp-tools
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
