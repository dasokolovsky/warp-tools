'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ReportRow {
  driver_id: number;
  driver_name: string;
  pay_rate: number;
  trip_count: number;
  total_miles: number;
  total_pay: number;
  cost_per_mile: number;
}

interface Props {
  dateFrom: string;
  dateTo: string;
}

export function ReportsPerMileCost({ dateFrom, dateTo }: Props) {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = dateFrom || dateTo 
      ? `/api/reports/per-mile-cost?date_from=${dateFrom}&date_to=${dateTo}`
      : '/api/reports/per-mile-cost';
    fetch(url)
      .then((res) => res.json())
      .then((json) => setData(json.report))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  if (loading) return <div className="text-center py-12 text-[#8B95A5]">Loading...</div>;
  if (data.length === 0) return <div className="text-center py-12 text-[#8B95A5]">No per-mile drivers</div>;

  const totalMiles = data.reduce((s, r) => s + r.total_miles, 0);
  const totalPay = data.reduce((s, r) => s + r.total_pay, 0);
  const avgPerMile = totalMiles > 0 ? totalPay / totalMiles : 0;

  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="px-6 py-4 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Driver</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Rate</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Trips</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Total Miles</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Total Pay</th>
              <th className="px-4 py-4 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">$/Mile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {data.map((row) => (
              <tr key={row.driver_id} className="hover:bg-[#0C1528]">
                <td className="px-6 py-4 text-sm font-medium text-white">{row.driver_name}</td>
                <td className="px-4 py-4 text-sm text-slate-300 text-right tabular-nums">${row.pay_rate}</td>
                <td className="px-4 py-4 text-sm text-slate-300 text-right">{row.trip_count}</td>
                <td className="px-4 py-4 text-sm text-slate-300 text-right tabular-nums">{row.total_miles.toFixed(1)}</td>
                <td className="px-4 py-4 text-sm text-slate-300 text-right tabular-nums">{formatCurrency(row.total_pay)}</td>
                <td className="px-4 py-4 text-sm font-bold text-orange-400 text-right tabular-nums">${row.cost_per_mile.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#1A2235] bg-[#060C1A]">
              <td className="px-6 py-4 text-sm font-semibold text-white">Averages</td>
              <td colSpan={2} />
              <td className="px-4 py-4 text-sm font-bold text-slate-300 text-right tabular-nums">{totalMiles.toFixed(1)}</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-300 text-right tabular-nums">{formatCurrency(totalPay)}</td>
              <td className="px-4 py-4 text-sm font-bold text-orange-400 text-right tabular-nums">${avgPerMile.toFixed(3)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
