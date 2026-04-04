'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ReportRow {
  driver_id: number;
  driver_name: string;
  outstanding: number;
  total_advanced: number;
  total_deducted: number;
  advance_count: number;
}

export function ReportsAdvanceBalance() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/advance-balance')
      .then((res) => res.json())
      .then((json) => setData(json.report))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-[#8B95A5]">Loading...</div>;

  const totalOutstanding = data.reduce((s, r) => s + r.outstanding, 0);
  const totalAdvanced = data.reduce((s, r) => s + r.total_advanced, 0);

  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="px-6 py-4 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Driver</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Advances</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Total Advanced</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Total Deducted</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {data.map((row) => (
              <tr key={row.driver_id} className="hover:bg-[#0C1528]">
                <td className="px-6 py-4 text-sm font-medium text-white">{row.driver_name}</td>
                <td className="px-4 py-4 text-sm text-slate-300 text-right">{row.advance_count}</td>
                <td className="px-4 py-4 text-sm text-slate-300 text-right tabular-nums">{formatCurrency(row.total_advanced)}</td>
                <td className="px-4 py-4 text-sm text-green-400 text-right tabular-nums">{formatCurrency(row.total_deducted)}</td>
                <td className="px-4 py-4 text-sm font-bold text-orange-400 text-right tabular-nums">{formatCurrency(row.outstanding)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#1A2235] bg-[#060C1A]">
              <td className="px-6 py-4 text-sm font-semibold text-white">Totals</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-300 text-right">{data.reduce((s, r) => s + r.advance_count, 0)}</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-300 text-right tabular-nums">{formatCurrency(totalAdvanced)}</td>
              <td />
              <td className="px-4 py-4 text-sm font-bold text-orange-400 text-right tabular-nums">{formatCurrency(totalOutstanding)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
