'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ReportRow {
  category: string;
  count: number;
  total: number;
}

interface Props {
  dateFrom: string;
  dateTo: string;
}

export function ReportsDeductionBreakdown({ dateFrom, dateTo }: Props) {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = dateFrom || dateTo 
      ? `/api/reports/deduction-breakdown?date_from=${dateFrom}&date_to=${dateTo}`
      : '/api/reports/deduction-breakdown';
    fetch(url)
      .then((res) => res.json())
      .then((json) => setData(json.report))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  if (loading) return <div className="text-center py-12 text-[#8B95A5]">Loading...</div>;

  const grandTotal = data.reduce((s, r) => s + r.total, 0);

  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="px-6 py-4 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Category</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Count</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Total</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {data.map((row) => (
              <tr key={row.category} className="hover:bg-[#0C1528]">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-white capitalize">{row.category.replace('_', ' ')}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-300 text-right">{row.count}</td>
                <td className="px-4 py-4 text-sm text-red-400 text-right tabular-nums">{formatCurrency(row.total)}</td>
                <td className="px-4 py-4 text-sm text-slate-300 text-right">
                  {grandTotal > 0 ? Math.round((row.total / grandTotal) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#1A2235] bg-[#060C1A]">
              <td className="px-6 py-4 text-sm font-semibold text-white">Grand Total</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-300 text-right">{data.reduce((s, r) => s + r.count, 0)}</td>
              <td className="px-4 py-4 text-sm font-bold text-red-400 text-right tabular-nums">{formatCurrency(grandTotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
