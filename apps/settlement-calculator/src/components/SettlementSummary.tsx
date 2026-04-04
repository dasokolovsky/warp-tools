'use client';

import { Printer } from 'lucide-react';
import type { SettlementCalc } from '@/lib/types';
import { fmt } from '@/lib/calculations';

interface Props {
  calc: SettlementCalc;
  onPrint: () => void;
}

export default function SettlementSummary({ calc, onPrint }: Props) {
  const { grossEarnings, totalDeductions, totalAdvances, totalReimbursements, netPay } = calc;

  const hasData = grossEarnings > 0 || totalDeductions > 0 || totalReimbursements > 0 || totalAdvances > 0;

  // Breakdown bar percentages
  const total = grossEarnings + totalReimbursements;
  const deductPct = total > 0 ? Math.min(100, (totalDeductions / total) * 100) : 0;
  const advancePct = total > 0 ? Math.min(100 - deductPct, (totalAdvances / total) * 100) : 0;
  const reimbPct = total > 0 ? Math.min(100, (totalReimbursements / total) * 100) : 0;
  const netPct = Math.max(0, 100 - deductPct - advancePct);

  return (
    <div className="bg-warp-card border border-warp-border rounded-warp p-5 flex flex-col gap-4 sticky top-20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Settlement Summary</h2>
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warp-bg border border-warp-border text-xs text-warp-muted hover:text-white hover:border-warp-accent/50 transition-colors no-print"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Statement
        </button>
      </div>

      {!hasData && (
        <p className="text-warp-muted text-sm text-center py-6">
          Add trips above to see your settlement.
        </p>
      )}

      {hasData && (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between py-2 border-b border-warp-border">
              <span className="text-sm text-warp-muted">Gross Earnings</span>
              <span className="text-sm font-medium text-white">{fmt(grossEarnings)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-warp-border">
              <span className="text-sm text-warp-muted flex items-center gap-1">
                <span className="text-warp-danger text-xs">−</span> Total Deductions
              </span>
              <span className="text-sm font-medium text-warp-danger">-{fmt(totalDeductions)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-warp-border">
              <span className="text-sm text-warp-muted flex items-center gap-1">
                <span className="text-warp-warning text-xs">−</span> Total Advances
              </span>
              <span className="text-sm font-medium text-warp-warning">-{fmt(totalAdvances)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-warp-border">
              <span className="text-sm text-warp-muted flex items-center gap-1">
                <span className="text-warp-accent text-xs">+</span> Reimbursements
              </span>
              <span className="text-sm font-medium text-warp-accent">+{fmt(totalReimbursements)}</span>
            </div>
          </div>

          {/* NET PAY */}
          <div className={`rounded-lg p-4 flex items-center justify-between ${
            netPay >= 0 ? 'bg-warp-accent/10 border border-warp-accent/30' : 'bg-warp-danger/10 border border-warp-danger/30'
          }`}>
            <span className="font-semibold text-white">NET PAY</span>
            <span className={`text-2xl font-bold ${netPay >= 0 ? 'text-warp-accent' : 'text-warp-danger'}`}>
              {fmt(netPay)}
            </span>
          </div>

          {/* Breakdown bar */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-warp-muted uppercase tracking-wide">Breakdown</p>
            <div className="h-3 rounded-full overflow-hidden flex bg-warp-bg">
              <div
                className="bg-warp-accent transition-all duration-300"
                style={{ width: `${netPct}%` }}
              />
              <div
                className="bg-warp-danger transition-all duration-300"
                style={{ width: `${deductPct}%` }}
              />
              <div
                className="bg-warp-warning transition-all duration-300"
                style={{ width: `${advancePct}%` }}
              />
              <div
                className="bg-blue-500 transition-all duration-300"
                style={{ width: `${reimbPct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-warp-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warp-accent inline-block" />
                Net {netPct.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warp-danger inline-block" />
                Deductions {deductPct.toFixed(0)}%
              </span>
              {totalAdvances > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-warp-warning inline-block" />
                  Advances {advancePct.toFixed(0)}%
                </span>
              )}
              {totalReimbursements > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  Reimb. {reimbPct.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
