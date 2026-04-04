'use client';

import { type LoadResult, fmt, fmtNum } from '@/lib/calc';

interface Scenario {
  name: string;
  result: LoadResult;
  miles: number;
}

interface ScenarioCompareProps {
  scenarios: Scenario[];
  onRemove: (idx: number) => void;
}

function compareRow(
  label: string,
  valueA: string,
  valueB: string | null,
  highlight?: 'a' | 'b' | null,
) {
  return { label, valueA, valueB, highlight };
}

export default function ScenarioCompare({ scenarios, onRemove }: ScenarioCompareProps) {
  if (scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-warp-muted text-sm">
        Save a scenario to start comparing
      </div>
    );
  }

  const [a, b] = scenarios;

  function buildRows(sa: Scenario, sb: Scenario | null) {
    function bestOf(aVal: number, bVal: number | null, higherIsBetter = true) {
      if (bVal === null) return null;
      if (higherIsBetter) return aVal >= bVal ? 'a' : 'b';
      return aVal <= bVal ? 'a' : 'b';
    }

    return [
      compareRow(
        'Gross Revenue',
        fmt(sa.result.grossRevenue),
        sb ? fmt(sb.result.grossRevenue) : null,
        bestOf(sa.result.grossRevenue, sb?.result.grossRevenue ?? null),
      ),
      compareRow(
        'Revenue / Mile',
        `$${fmtNum(sa.result.revenuePerMile)}/mi`,
        sb ? `$${fmtNum(sb.result.revenuePerMile)}/mi` : null,
        bestOf(sa.result.revenuePerMile, sb?.result.revenuePerMile ?? null),
      ),
      compareRow(
        'Total Direct Costs',
        fmt(sa.result.totalDirectCosts),
        sb ? fmt(sb.result.totalDirectCosts) : null,
        bestOf(sa.result.totalDirectCosts, sb?.result.totalDirectCosts ?? null, false),
      ),
      compareRow(
        'Fixed Costs Allocated',
        fmt(sa.result.totalFixedAllocated),
        sb ? fmt(sb.result.totalFixedAllocated) : null,
        bestOf(sa.result.totalFixedAllocated, sb?.result.totalFixedAllocated ?? null, false),
      ),
      compareRow(
        'Gross Margin',
        fmt(sa.result.grossMargin),
        sb ? fmt(sb.result.grossMargin) : null,
        bestOf(sa.result.grossMargin, sb?.result.grossMargin ?? null),
      ),
      compareRow(
        'TRUE NET PROFIT',
        fmt(sa.result.trueNetProfit),
        sb ? fmt(sb.result.trueNetProfit) : null,
        bestOf(sa.result.trueNetProfit, sb?.result.trueNetProfit ?? null),
      ),
      compareRow(
        'Net Margin %',
        `${fmtNum(sa.result.trueNetMarginPercent)}%`,
        sb ? `${fmtNum(sb.result.trueNetMarginPercent)}%` : null,
        bestOf(sa.result.trueNetMarginPercent, sb?.result.trueNetMarginPercent ?? null),
      ),
      compareRow(
        'Cost / Mile (all-in)',
        `$${fmtNum(sa.result.totalCostPerMile)}/mi`,
        sb ? `$${fmtNum(sb.result.totalCostPerMile)}/mi` : null,
        bestOf(sa.result.totalCostPerMile, sb?.result.totalCostPerMile ?? null, false),
      ),
      compareRow(
        'Break-Even / Mile',
        `$${fmtNum(sa.result.breakEvenRatePerMile)}/mi`,
        sb ? `$${fmtNum(sb.result.breakEvenRatePerMile)}/mi` : null,
        bestOf(sa.result.breakEvenRatePerMile, sb?.result.breakEvenRatePerMile ?? null, false),
      ),
    ];
  }

  const rows = buildRows(a, b ?? null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-warp-border">
            <th className="text-left py-3 px-2 text-warp-muted font-medium text-xs uppercase tracking-wider w-40">
              Metric
            </th>
            {scenarios.map((s, i) => (
              <th key={i} className="text-right py-3 px-3 text-white font-semibold">
                <div className="flex items-center justify-end gap-2">
                  <span>{s.name}</span>
                  <button
                    onClick={() => onRemove(i)}
                    className="text-warp-muted hover:text-warp-danger transition-colors text-xs leading-none"
                    title="Remove scenario"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-warp-muted font-normal mt-0.5">
                  {s.miles > 0 ? `${s.miles.toLocaleString()} mi` : '—'}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-warp-border/50 hover:bg-warp-card/40 transition-colors">
              <td className="py-3 px-2 text-warp-muted text-xs font-medium">{row.label}</td>
              <td
                className="py-3 px-3 text-right font-mono font-semibold text-sm"
                style={{
                  color: row.highlight === 'a' ? '#00C650' : row.label.includes('NET') && scenarios[0]?.result.trueNetProfit < 0 ? '#FF4444' : 'white',
                }}
              >
                {row.valueA}
              </td>
              {row.valueB !== null && (
                <td
                  className="py-3 px-3 text-right font-mono font-semibold text-sm"
                  style={{
                    color: row.highlight === 'b' ? '#00C650' : row.label.includes('NET') && scenarios[1]?.result.trueNetProfit < 0 ? '#FF4444' : 'white',
                  }}
                >
                  {row.valueB}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
