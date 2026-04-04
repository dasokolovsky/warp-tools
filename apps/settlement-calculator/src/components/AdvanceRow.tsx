'use client';

import { X } from 'lucide-react';
import type { AdvanceRow as AdvanceRowType } from '@/lib/types';
import { fmt } from '@/lib/calculations';

interface Props {
  advance: AdvanceRowType;
  index: number;
  onChange: (id: string, field: keyof AdvanceRowType, value: string) => void;
  onRemove: (id: string) => void;
}

export default function AdvanceRow({ advance, index, onChange, onRemove }: Props) {
  const amt = parseFloat(advance.amount) || 0;

  return (
    <div className="bg-warp-bg border border-warp-border rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-warp-muted font-medium">Advance {index + 1}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-warp-warning">-{fmt(amt)}</span>
          <button
            onClick={() => onRemove(advance.id)}
            className="w-6 h-6 flex items-center justify-center rounded text-warp-muted hover:text-warp-danger hover:bg-warp-danger/10 transition-colors"
            aria-label="Remove advance"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center bg-warp-card border border-warp-border rounded-lg overflow-hidden">
          <span className="px-2 text-xs text-warp-muted border-r border-warp-border">$</span>
          <input
            type="number"
            value={advance.amount}
            onChange={(e) => onChange(advance.id, 'amount', e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none min-w-0"
          />
        </div>
        <input
          type="date"
          value={advance.date}
          onChange={(e) => onChange(advance.id, 'date', e.target.value)}
          className="bg-warp-card border border-warp-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none focus:border-warp-accent/50 transition-colors"
        />
      </div>

      <input
        type="text"
        value={advance.reason}
        onChange={(e) => onChange(advance.id, 'reason', e.target.value)}
        placeholder="Reason (e.g. Fuel advance)"
        className="w-full bg-warp-card border border-warp-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none focus:border-warp-accent/50 transition-colors"
      />
    </div>
  );
}
