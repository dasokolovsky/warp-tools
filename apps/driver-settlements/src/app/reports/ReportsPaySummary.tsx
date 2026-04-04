'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ReportRow {
  driver_id: number;
  driver_name: string;
  pay_type: string;
  settlement_count: number;
  gross: number;
  deductions: number;
  reimbursements: number;
  advances: number;
  net: number;
}

interface Props {
  dateFrom: string;
  dateTo: string;
}

export function ReportsPaySummary({ dateFrom, dateTo }: Props) {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = dateFrom || dateTo 
      ? `/api/reports/pay-summary?date_from=${dateFrom}&date_to=${dateTo}`
      : '/api/reports/pay-summary';
    fetch(url)
      .then((res) => res.json())
      .then((json) => setData(json.report))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  if (loading) return <div className="text-center py-12 text-[#8B95A5]">Loading...</div>;

  const totalGross = data.reduce((s, r) => s + r.gross, 0);
  const totalNet = data.reduce((s, r) => s + r.net, 0);

  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="px-6 py-4 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Driver</th>
              <th className="px-4 py-4 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Settlements</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Gross</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Deductions</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Reimbursements</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Advances</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {data.map((row) => (
              <tr key={row.driver_id} className="hover:bg-[#0C1528]">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-white">{row.driver_name}</div>
                  <div className="text-xs text-slate-400 capitalize">{row.pay_type.replace('_', ' ')}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-300">{row.settlement_count}</td>
                <td className="px-4 py-4 text-sm text-slate-300 text-right tabular-nums">{formatCurrency(row.gross)}</td>
                <td className="px-4 py-4 text-sm text-red-400 text-right tabular-nums">{formatCurrency(row.deductions)}</td>
                <td className="px-4 py-4 text-sm text-blue-400 text-right tabular-nums">{formatCurrency(row.reimbursements)}</td>
                <td className="px-4 py-4 text-sm text-orange-400 text-right tabular-nums">{formatCurrency(row.advances)}</td>
                <td className="px-4 py-4 text-sm font-bold text-white text-right tabular-nums">{formatCurrency(row.net)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#1A2235] bg-[#060C1A]">
              <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-white">Totals</td>
              <td className="px-4 py-4 text-sm font-bold text-white text-right tabular-nums">{formatCurrency(totalGross)}</td>
              <td colSpan={4} />
              <td className="px-4 py-4 text-sm font-bold text-[#00C650] text-right tabular-nums">{formatCurrency(totalNet)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
