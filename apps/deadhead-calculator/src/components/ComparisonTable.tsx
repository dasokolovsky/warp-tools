'use client';

import { formatCurrency, formatRate } from '@/lib/calculations';
import type { ComparisonLoad } from './ComparisonMode';
import { Star } from 'lucide-react';

interface ComparisonTableProps {
  loads: ComparisonLoad[];
  bestIndex: number;
}

function renderRow(load: ComparisonLoad, index: number, isBest: boolean) {
  const totalMiles = load.deadheadMiles + load.loadedMiles;
  const effectivePerTotal = totalMiles > 0 ? load.loadRate / totalMiles : 0;
  const effectivePerLoaded = load.loadedMiles > 0 ? load.loadRate / load.loadedMiles : 0;
  const driverCost = load.driverPayPerHour * load.deadheadHours;
  const fuelCost = load.mpg > 0 ? (load.deadheadMiles / load.mpg) * load.fuelCostPerGallon : 0;
  const totalDeadhead = fuelCost + load.tolls + driverCost;
  const profit = load.loadRate - load.carrierCosts - totalDeadhead;
  const ratio = totalMiles > 0 ? (load.deadheadMiles / totalMiles) * 100 : 0;

  return (
    <tr
      key={index}
      className={`border-b border-warp-border/50 ${isBest ? 'bg-warp-accent-muted' : 'hover:bg-warp-card-hover'} transition-colors`}
    >
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          {isBest && <Star className="w-3.5 h-3.5 text-warp-accent fill-warp-accent" />}
          <span className={isBest ? 'text-warp-accent font-medium' : 'text-warp-muted'}>
            {load.name || `Load ${index + 1}`}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-mono text-right">{load.deadheadMiles}</td>
      <td className="px-4 py-3 text-sm font-mono text-right">{load.loadedMiles}</td>
      <td className="px-4 py-3 text-sm font-mono text-right">{formatCurrency(load.loadRate)}</td>
      <td className="px-4 py-3 text-sm font-mono text-right">{ratio.toFixed(1)}%</td>
      <td className="px-4 py-3 text-sm font-mono text-right">{formatRate(effectivePerTotal)}</td>
      <td className="px-4 py-3 text-sm font-mono text-right">{formatRate(effectivePerLoaded)}</td>
      <td className={`px-4 py-3 text-sm font-mono text-right font-semibold ${profit >= 0 ? 'text-[#00C650]' : 'text-[#FF4444]'}`}>
        {formatCurrency(profit)}
      </td>
    </tr>
  );
}

export default function ComparisonTable({ loads, bestIndex }: ComparisonTableProps) {
  if (loads.length === 0) {
    return (
      <p className="text-warp-muted text-sm text-center py-8">
        Add loads above to compare them side by side.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-warp border border-warp-border">
      <table className="w-full text-white">
        <thead>
          <tr className="bg-warp-bg border-b border-warp-border">
            <th className="px-4 py-3 text-left text-xs font-medium text-warp-muted uppercase tracking-wide">Load</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-warp-muted uppercase tracking-wide">DH Mi</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-warp-muted uppercase tracking-wide">Loaded Mi</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-warp-muted uppercase tracking-wide">Rate</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-warp-muted uppercase tracking-wide">DH%</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-warp-muted uppercase tracking-wide">$/Total Mi</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-warp-muted uppercase tracking-wide">$/Loaded Mi</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-warp-muted uppercase tracking-wide">Net Profit</th>
          </tr>
        </thead>
        <tbody>
          {loads.map((load, i) => renderRow(load, i, i === bestIndex))}
        </tbody>
      </table>
    </div>
  );
}
