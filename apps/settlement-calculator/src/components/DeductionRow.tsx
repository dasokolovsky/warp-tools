'use client';

import { X } from 'lucide-react';
import type { DeductionRow as DeductionRowType } from '@/lib/types';
import { fmt, calcDeduction } from '@/lib/calculations';

interface Props {
  deduction: DeductionRowType;
  grossEarnings: number;
  index: number;
  onChange: (id: string, field: keyof DeductionRowType, value: string) => void;
  onRemove: (id: string) => void;
}

export default function DeductionRow({ deduction, grossEarnings, index, onChange, onRemove }: Props) {
  const amt = parseFloat(deduction.amount) || 0;
  const computed = calcDeduction(amt, deduction.type, grossEarnings);

  return (
    <div className="bg-warp-bg border border-warp-border rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-warp-muted font-medium">Deduction {index + 1}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-warp-danger">-{fmt(computed)}</span>
          <button
            onClick={() => onRemove(deduction.id)}
            className="w-6 h-6 flex items-center justify-center rounded text-warp-muted hover:text-warp-danger hover:bg-warp-danger/10 transition-colors"
            aria-label="Remove deduction"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <input
        type="text"
        value={deduction.description}
        onChange={(e) => onChange(deduction.id, 'description', e.target.value)}
        placeholder="Description"
        className="w-full bg-warp-card border border-warp-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none focus:border-warp-accent/50 transition-colors"
      />

      <div className="flex gap-2">
        <div className="flex items-center bg-warp-card border border-warp-border rounded-lg overflow-hidden flex-1">
          {deduction.type === 'fixed' && (
            <span className="px-2 text-xs text-warp-muted border-r border-warp-border">$</span>
          )}
          <input
            type="number"
            value={deduction.amount}
            onChange={(e) => onChange(deduction.id, 'amount', e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none min-w-0"
          />
          {deduction.type === 'percent' && (
            <span className="px-2 text-xs text-warp-muted border-l border-warp-border">%</span>
          )}
        </div>

        <div className="flex rounded-lg border border-warp-border overflow-hidden">
          <button
            onClick={() => onChange(deduction.id, 'type', 'fixed')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              deduction.type === 'fixed'
                ? 'bg-warp-accent text-black'
                : 'bg-warp-card text-warp-muted hover:text-white'
            }`}
          >
            $
          </button>
          <button
            onClick={() => onChange(deduction.id, 'type', 'percent')}
            className={`px-3 py-2 text-xs font-medium transition-colors border-l border-warp-border ${
              deduction.type === 'percent'
                ? 'bg-warp-accent text-black'
                : 'bg-warp-card text-warp-muted hover:text-white'
            }`}
          >
            %
          </button>
        </div>
      </div>

      {deduction.type === 'percent' && grossEarnings > 0 && (
        <p className="text-xs text-warp-muted">
          = {fmt(computed)} of {fmt(grossEarnings)} gross
        </p>
      )}
    </div>
  );
}
