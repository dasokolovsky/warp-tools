'use client';

import { X } from 'lucide-react';
import type { ReimbursementRow as ReimbursementRowType } from '@/lib/types';
import { fmt } from '@/lib/calculations';

interface Props {
  reimbursement: ReimbursementRowType;
  index: number;
  onChange: (id: string, field: keyof ReimbursementRowType, value: string) => void;
  onRemove: (id: string) => void;
}

export default function ReimbursementRow({ reimbursement, index, onChange, onRemove }: Props) {
  const amt = parseFloat(reimbursement.amount) || 0;

  return (
    <div className="bg-warp-bg border border-warp-border rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-warp-muted font-medium">Reimbursement {index + 1}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#00C650]">+{fmt(amt)}</span>
          <button
            onClick={() => onRemove(reimbursement.id)}
            className="w-6 h-6 flex items-center justify-center rounded text-warp-muted hover:text-warp-danger hover:bg-warp-danger/10 transition-colors"
            aria-label="Remove reimbursement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <input
        type="text"
        value={reimbursement.description}
        onChange={(e) => onChange(reimbursement.id, 'description', e.target.value)}
        placeholder="Description (e.g. Fuel receipt)"
        className="w-full bg-warp-card border border-warp-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none focus:border-warp-accent/50 transition-colors"
      />

      <div className="flex items-center bg-warp-card border border-warp-border rounded-lg overflow-hidden">
        <span className="px-2 text-xs text-warp-muted border-r border-warp-border">$</span>
        <input
          type="number"
          value={reimbursement.amount}
          onChange={(e) => onChange(reimbursement.id, 'amount', e.target.value)}
          placeholder="0.00"
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-warp-muted/50 focus:outline-none"
        />
      </div>
    </div>
  );
}
