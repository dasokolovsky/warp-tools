'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import InputField from './InputField';
import ComparisonTable from './ComparisonTable';
import { calculateLoad } from '@/lib/calculations';

export interface ComparisonLoad {
  name: string;
  deadheadMiles: number;
  loadedMiles: number;
  loadRate: number;
  fuelCostPerGallon: number;
  mpg: number;
  tolls: number;
  driverPayPerHour: number;
  deadheadHours: number;
  carrierCosts: number;
}

interface LoadForm {
  id: string;
  name: string;
  deadheadMiles: string;
  loadedMiles: string;
  loadRate: string;
  tolls: string;
  driverPayPerHour: string;
  deadheadHours: string;
  carrierCosts: string;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeForm(defaults?: Partial<LoadForm>): LoadForm {
  return {
    id: makeId(),
    name: '',
    deadheadMiles: '',
    loadedMiles: '',
    loadRate: '',
    tolls: '0',
    driverPayPerHour: '0',
    deadheadHours: '0',
    carrierCosts: '0',
    ...defaults,
  };
}

function parseForm(form: LoadForm, fuelCostPerGallon: number, mpg: number): ComparisonLoad {
  return {
    name: form.name,
    deadheadMiles: parseFloat(form.deadheadMiles) || 0,
    loadedMiles: parseFloat(form.loadedMiles) || 0,
    loadRate: parseFloat(form.loadRate) || 0,
    fuelCostPerGallon,
    mpg,
    tolls: parseFloat(form.tolls) || 0,
    driverPayPerHour: parseFloat(form.driverPayPerHour) || 0,
    deadheadHours: parseFloat(form.deadheadHours) || 0,
    carrierCosts: parseFloat(form.carrierCosts) || 0,
  };
}

const INITIAL_FORMS: LoadForm[] = [makeForm({ name: 'Load A' }), makeForm({ name: 'Load B' })];

interface ComparisonModeProps {
  fuelCostPerGallon: number;
  mpg: number;
}

function findBestIndex(loads: ComparisonLoad[]): number {
  if (loads.length === 0) return -1;
  let best = 0;
  let bestProfit = -Infinity;
  for (let i = 0; i < loads.length; i++) {
    const res = calculateLoad(loads[i]);
    if (res.netProfit > bestProfit) {
      bestProfit = res.netProfit;
      best = i;
    }
  }
  return best;
}

export default function ComparisonMode({ fuelCostPerGallon, mpg }: ComparisonModeProps) {
  const [forms, setForms] = useState<LoadForm[]>(INITIAL_FORMS);

  const handleAdd = useCallback(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const idx = forms.length;
    setForms((prev) => [...prev, makeForm({ name: `Load ${letters[idx] ?? idx + 1}` })]);
  }, [forms.length]);

  const handleRemove = useCallback((id: string) => {
    setForms((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleChange = useCallback((id: string, field: keyof LoadForm, value: string) => {
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  }, []);

  const loads = forms.map((f) => parseForm(f, fuelCostPerGallon, mpg));
  const bestIndex = findBestIndex(loads);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {forms.map((form, idx) => (
          <div key={form.id} className="bg-warp-card border border-warp-border rounded-warp p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">
                {form.name || `Load ${idx + 1}`}
              </span>
              {forms.length > 1 && (
                <button
                  onClick={() => handleRemove(form.id)}
                  className="p-1.5 rounded-lg text-warp-muted hover:text-[#FF4444] hover:bg-[#FF4444]/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <InputField
                label="Name"
                value={form.name}
                onChange={(v) => handleChange(form.id, 'name', v)}
                placeholder="Load A"
              />
              <InputField
                label="Deadhead Miles"
                value={form.deadheadMiles}
                onChange={(v) => handleChange(form.id, 'deadheadMiles', v)}
                type="number"
                placeholder="50"
                suffix="mi"
              />
              <InputField
                label="Loaded Miles"
                value={form.loadedMiles}
                onChange={(v) => handleChange(form.id, 'loadedMiles', v)}
                type="number"
                placeholder="500"
                suffix="mi"
              />
              <InputField
                label="Load Rate"
                value={form.loadRate}
                onChange={(v) => handleChange(form.id, 'loadRate', v)}
                type="number"
                placeholder="1500"
                prefix="$"
              />
              <InputField
                label="Tolls"
                value={form.tolls}
                onChange={(v) => handleChange(form.id, 'tolls', v)}
                type="number"
                placeholder="0"
                prefix="$"
              />
              <InputField
                label="Driver $/hr"
                value={form.driverPayPerHour}
                onChange={(v) => handleChange(form.id, 'driverPayPerHour', v)}
                type="number"
                placeholder="0"
                prefix="$"
              />
              <InputField
                label="DH Hours"
                value={form.deadheadHours}
                onChange={(v) => handleChange(form.id, 'deadheadHours', v)}
                type="number"
                placeholder="0"
                suffix="hr"
              />
              <InputField
                label="Carrier Costs"
                value={form.carrierCosts}
                onChange={(v) => handleChange(form.id, 'carrierCosts', v)}
                type="number"
                placeholder="0"
                prefix="$"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="flex items-center gap-2 self-start px-4 py-2 rounded-lg border border-warp-border text-warp-muted hover:text-white hover:border-warp-accent/50 transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Load
      </button>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Comparison Results</h3>
        <ComparisonTable loads={loads} bestIndex={bestIndex} />
      </div>
    </div>
  );
}
