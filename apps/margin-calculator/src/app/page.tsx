'use client';

import { useState } from 'react';
import { Github, Calculator, TrendingUp, Users, List, ChevronDown, ChevronUp } from 'lucide-react';
import MarginGauge from '@/components/MarginGauge';
import ProfitBreakdown from '@/components/ProfitBreakdown';
import CompareTable from '@/components/CompareTable';
import BatchEntry from '@/components/BatchEntry';
import { calcBasic, calcAdvanced, type RateType } from '@/lib/calc';

type TabId = 'basic' | 'profitability' | 'compare' | 'batch';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'basic', label: 'Basic', icon: <Calculator size={14} /> },
  { id: 'profitability', label: 'Profitability', icon: <TrendingUp size={14} /> },
  { id: 'compare', label: 'Quick Compare', icon: <Users size={14} /> },
  { id: 'batch', label: 'Batch', icon: <List size={14} /> },
];

function InputField({
  label,
  prefix,
  suffix,
  value,
  onChange,
  placeholder,
  step,
}: {
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-warp-muted uppercase tracking-wider">{label}</label>
      <div className="flex items-center bg-warp-card border border-warp-border rounded-xl overflow-hidden focus-within:border-warp-accent transition-colors">
        {prefix && (
          <span className="px-3 py-2.5 text-warp-muted text-sm font-mono border-r border-warp-border bg-warp-bg">
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
          <span className="px-3 py-2.5 text-warp-muted text-sm border-l border-warp-border bg-warp-bg">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function RateTypeToggle({
  value,
  onChange,
}: {
  value: RateType;
  onChange: (v: RateType) => void;
}) {
  const opts: { id: RateType; label: string }[] = [
    { id: 'per-mile', label: 'Per Mile' },
    { id: 'flat', label: 'Flat Rate' },
    { id: 'per-cwt', label: 'Per CWT' },
  ];
  return (
    <div className="flex bg-warp-card border border-warp-border rounded-xl p-1 gap-1">
      {opts.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
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

function SectionCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-warp-card border border-warp-border rounded-2xl p-6 ${className ?? ''}`}>
      {title && <h2 className="text-lg font-semibold text-white mb-5">{title}</h2>}
      {children}
    </div>
  );
}

export default function MarginCalculatorPage() {
  const [activeTab, setActiveTab] = useState<TabId>('basic');

  // Shared basic inputs
  const [rateType, setRateType] = useState<RateType>('per-mile');
  const [sellRate, setSellRate] = useState('');
  const [buyRate, setBuyRate] = useState('');
  const [miles, setMiles] = useState('');
  const [weight, setWeight] = useState('');

  // Advanced costs
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fuelCost, setFuelCost] = useState('');
  const [tollCost, setTollCost] = useState('');
  const [driverPay, setDriverPay] = useState('');
  const [deadheadMiles, setDeadheadMiles] = useState('');
  const [deadheadRate, setDeadheadRate] = useState('');
  const [accessorialCost, setAccessorialCost] = useState('');
  const [factoringFee, setFactoringFee] = useState('');

  const basicInputs = {
    rateType,
    sellRate: parseFloat(sellRate) || 0,
    buyRate: parseFloat(buyRate) || 0,
    miles: parseFloat(miles) || 0,
    weight: parseFloat(weight) || 0,
  };

  const advCosts = {
    fuelCost: parseFloat(fuelCost) || 0,
    tollCost: parseFloat(tollCost) || 0,
    driverPay: parseFloat(driverPay) || 0,
    deadheadMiles: parseFloat(deadheadMiles) || 0,
    deadheadRate: parseFloat(deadheadRate) || 0,
    accessorialCost: parseFloat(accessorialCost) || 0,
    factoringFeePercent: parseFloat(factoringFee) || 0,
  };

  const basicResult = calcBasic(basicInputs);
  const advResult = calcAdvanced(basicInputs, advCosts);

  const hasBasicInputs =
    basicInputs.sellRate > 0 &&
    basicInputs.buyRate > 0 &&
    (rateType === 'flat' || (rateType === 'per-mile' && basicInputs.miles > 0) || (rateType === 'per-cwt' && basicInputs.weight > 0));

  function renderBasicInputs() {
    if (rateType === 'per-mile') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField label="Sell Rate" prefix="$" suffix="/mi" value={sellRate} onChange={setSellRate} placeholder="3.50" />
          <InputField label="Buy Rate" prefix="$" suffix="/mi" value={buyRate} onChange={setBuyRate} placeholder="2.80" />
          <InputField label="Miles" suffix="mi" value={miles} onChange={setMiles} placeholder="450" step="1" />
        </div>
      );
    }
    if (rateType === 'flat') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Sell Rate (Customer)" prefix="$" value={sellRate} onChange={setSellRate} placeholder="1500.00" />
          <InputField label="Buy Rate (Carrier)" prefix="$" value={buyRate} onChange={setBuyRate} placeholder="1200.00" />
        </div>
      );
    }
    // per-cwt
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField label="Sell Rate" prefix="$" suffix="/cwt" value={sellRate} onChange={setSellRate} placeholder="25.00" />
        <InputField label="Buy Rate" prefix="$" suffix="/cwt" value={buyRate} onChange={setBuyRate} placeholder="20.00" />
        <InputField label="Weight" suffix="lbs" value={weight} onChange={setWeight} placeholder="10000" step="1" />
      </div>
    );
  }

  function renderBasicTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-3 space-y-6">
          <SectionCard>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-warp-muted uppercase tracking-wider block mb-2">
                  Rate Type
                </label>
                <RateTypeToggle value={rateType} onChange={setRateType} />
              </div>
              {renderBasicInputs()}
            </div>
          </SectionCard>

          {/* Quick stats */}
          {hasBasicInputs && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Revenue', value: basicResult.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }), color: '#00C650' },
                { label: 'Carrier Cost', value: basicResult.cost.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }), color: '#FF4444' },
                { label: 'Gross Margin $', value: basicResult.grossMargin.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }), color: basicResult.grossMargin >= 0 ? '#00C650' : '#FF4444' },
              ].map((stat) => (
                <div key={stat.label} className="bg-warp-card border border-warp-border rounded-xl p-4">
                  <div className="text-xs text-warp-muted mb-1">{stat.label}</div>
                  <div className="font-mono font-bold text-base" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gauge */}
        <div className="lg:col-span-2">
          <SectionCard>
            {hasBasicInputs ? (
              <MarginGauge
                marginPercent={basicResult.marginPercent}
                grossMargin={basicResult.grossMargin}
                revenue={basicResult.revenue}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-32 h-16 rounded-t-full border-4 border-warp-border border-b-0 mb-4 opacity-30" />
                <p className="text-warp-muted text-sm">Enter rates to see your margin</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  function renderProfitabilityTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <SectionCard title="Base Rate">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-warp-muted uppercase tracking-wider block mb-2">
                  Rate Type
                </label>
                <RateTypeToggle value={rateType} onChange={setRateType} />
              </div>
              {renderBasicInputs()}
            </div>
          </SectionCard>

          <SectionCard title="Additional Costs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Fuel Cost / FSC" prefix="$" value={fuelCost} onChange={setFuelCost} placeholder="0.00" />
              <InputField label="Toll Costs" prefix="$" value={tollCost} onChange={setTollCost} placeholder="0.00" />
              <InputField label="Driver Pay" prefix="$" value={driverPay} onChange={setDriverPay} placeholder="0.00" />
              <InputField label="Accessorials (Detention, Lumper…)" prefix="$" value={accessorialCost} onChange={setAccessorialCost} placeholder="0.00" />
              <InputField label="Deadhead Miles" suffix="mi" value={deadheadMiles} onChange={setDeadheadMiles} placeholder="0" step="1" />
              <InputField label="Deadhead Rate" prefix="$" suffix="/mi" value={deadheadRate} onChange={setDeadheadRate} placeholder="1.50" />
              <InputField label="Factoring Fee" suffix="%" value={factoringFee} onChange={setFactoringFee} placeholder="3.0" />
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <SectionCard>
            {hasBasicInputs ? (
              <MarginGauge
                marginPercent={advResult.trueMarginPercent}
                grossMargin={advResult.trueMargin}
                revenue={advResult.revenue}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-32 h-16 rounded-t-full border-4 border-warp-border border-b-0 mb-4 opacity-30" />
                <p className="text-warp-muted text-sm">Enter rates to see true profit</p>
              </div>
            )}
          </SectionCard>

          {hasBasicInputs && (
            <SectionCard title="Profit Breakdown">
              <ProfitBreakdown
                result={advResult}
                fuelCost={advCosts.fuelCost}
                tollCost={advCosts.tollCost}
                driverPay={advCosts.driverPay}
                deadheadCost={advResult.deadheadCost}
                accessorialCost={advCosts.accessorialCost}
                factoringFee={advResult.factoringFee}
              />
            </SectionCard>
          )}
        </div>
      </div>
    );
  }

  function renderCompareTab() {
    return (
      <div className="space-y-6">
        <SectionCard title="Sell Rate">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-warp-muted uppercase tracking-wider block mb-2">
                Rate Type
              </label>
              <RateTypeToggle value={rateType} onChange={setRateType} />
            </div>
            <InputField
              label={rateType === 'per-mile' ? 'Sell Rate $/mi' : rateType === 'per-cwt' ? 'Sell Rate $/cwt' : 'Sell Rate $'}
              prefix="$"
              value={sellRate}
              onChange={setSellRate}
              placeholder="3.50"
            />
            {rateType === 'per-mile' && (
              <InputField label="Miles" suffix="mi" value={miles} onChange={setMiles} placeholder="450" step="1" />
            )}
            {rateType === 'per-cwt' && (
              <InputField label="Weight" suffix="lbs" value={weight} onChange={setWeight} placeholder="10000" step="1" />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Carrier Buy Rates">
          <CompareTable
            sellRate={parseFloat(sellRate) || 0}
            miles={parseFloat(miles) || 0}
            rateType={rateType}
            weight={parseFloat(weight) || 0}
          />
        </SectionCard>
      </div>
    );
  }

  function renderBatchTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 bg-warp-accent-muted border border-warp-accent/20 rounded-xl px-4 py-3">
          <div className="text-warp-accent mt-0.5">
            <List size={14} />
          </div>
          <p className="text-sm text-warp-muted">
            Batch mode uses per-mile rates. Add loads manually or paste from a spreadsheet (columns: Load Ref, Sell Rate, Buy Rate, Miles).
          </p>
        </div>
        <SectionCard title="Multiple Loads">
          <BatchEntry />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warp-bg">
      {/* Top Nav */}
      <nav className="border-b border-warp-border bg-warp-bg/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-warp-accent flex items-center justify-center">
              <Calculator size={14} className="text-black" />
            </div>
            <span className="font-semibold text-white">Freight Margin Calculator</span>
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
          <h1 className="text-3xl font-bold text-white mb-2">Freight Margin Calculator</h1>
          <p className="text-warp-muted">
            Calculate broker margins, analyze load profitability, compare carrier rates, and batch-process multiple loads.
            Free, open-source, no account needed.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-warp-card border border-warp-border rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-warp-accent text-black'
                  : 'text-warp-muted hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'profitability' && renderProfitabilityTab()}
        {activeTab === 'compare' && renderCompareTab()}
        {activeTab === 'batch' && renderBatchTab()}

        {/* Advanced toggle for basic tab */}
        {activeTab === 'basic' && hasBasicInputs && (
          <div className="mt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-warp-muted hover:text-white transition-colors"
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showAdvanced ? 'Hide' : 'Show'} advanced profit breakdown
            </button>
            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Additional Costs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Fuel Cost / FSC" prefix="$" value={fuelCost} onChange={setFuelCost} placeholder="0.00" />
                    <InputField label="Toll Costs" prefix="$" value={tollCost} onChange={setTollCost} placeholder="0.00" />
                    <InputField label="Driver Pay" prefix="$" value={driverPay} onChange={setDriverPay} placeholder="0.00" />
                    <InputField label="Accessorials" prefix="$" value={accessorialCost} onChange={setAccessorialCost} placeholder="0.00" />
                    <InputField label="Deadhead Miles" suffix="mi" value={deadheadMiles} onChange={setDeadheadMiles} placeholder="0" step="1" />
                    <InputField label="Deadhead Rate" prefix="$" suffix="/mi" value={deadheadRate} onChange={setDeadheadRate} placeholder="1.50" />
                    <InputField label="Factoring Fee %" suffix="%" value={factoringFee} onChange={setFactoringFee} placeholder="3.0" />
                  </div>
                </SectionCard>
                <SectionCard title="Profit Breakdown">
                  <ProfitBreakdown
                    result={advResult}
                    fuelCost={advCosts.fuelCost}
                    tollCost={advCosts.tollCost}
                    driverPay={advCosts.driverPay}
                    deadheadCost={advResult.deadheadCost}
                    accessorialCost={advCosts.accessorialCost}
                    factoringFee={advResult.factoringFee}
                  />
                </SectionCard>
              </div>
            )}
          </div>
        )}

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
