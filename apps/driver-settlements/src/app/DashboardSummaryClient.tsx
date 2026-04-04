'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, DollarSign, AlertTriangle, TrendingUp, Clock, Calendar, Settings } from 'lucide-react';
import { formatCurrency, formatDate, getSettlementStatusLabel } from '@/lib/utils';
import { SettlementStatusBadge } from '@/components/SettlementStatusBadge';

interface DashboardData {
  period: { start: string; end: string };
  stats: { open: number; submitted: number; approved: number; paid: number };
  payroll: { gross: number; deductions: number; net: number };
  driver_status_grid: Array<{
    driver_id: number;
    driver_name: string;
    pay_type: string;
    status: string | null;
    gross: number;
    settlement_number: string | null;
    settlement_id: number | null;
  }>;
  alerts: Array<{ type: string; message: string; driver_id?: number }>;
  recent_activity: Array<{
    settlement_id: number;
    settlement_number: string;
    status: string;
    driver_name: string;
    updated_at: string;
  }>;
}

export function DashboardSummaryClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#8B95A5]">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!data) return <div>Error loading dashboard</div>;

  const periodLabel = `${formatDate(data.period.start)} – ${formatDate(data.period.end)}`;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Driver pay and settlement overview</p>
      </div>

      {/* Current period card */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Current Period</h2>
            <div className="text-sm text-slate-400">{periodLabel}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-400">{data.stats.open}</div>
            <div className="text-xs text-[#8B95A5]">Open</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{data.stats.submitted}</div>
            <div className="text-xs text-[#8B95A5]">Submitted</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{data.stats.approved}</div>
            <div className="text-xs text-[#8B95A5]">Approved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{data.stats.paid}</div>
            <div className="text-xs text-[#8B95A5]">Paid</div>
          </div>
        </div>
      </div>

      {/* Payroll summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-5 w-5 text-[#00C650]" />
            <span className="text-sm text-[#8B95A5]">Total Gross (2 weeks)</span>
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(data.payroll.gross)}</div>
        </div>
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-5 w-5 text-red-400" />
            <span className="text-sm text-[#8B95A5]">Total Deductions</span>
          </div>
          <div className="text-3xl font-bold text-red-400">−{formatCurrency(data.payroll.deductions)}</div>
        </div>
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-5 w-5 text-[#00C650]" />
            <span className="text-sm text-[#8B95A5]">Total Net Pay</span>
          </div>
          <div className="text-3xl font-bold text-[#00C650]">{formatCurrency(data.payroll.net)}</div>
        </div>
      </div>

      {/* Driver status grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {data.driver_status_grid.map((driver) => (
          <div key={driver.driver_id} className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-4 hover:bg-[#0C1528] transition-colors cursor-pointer group" onClick={() => window.location.href = `/settlements/${driver.settlement_id || ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-white truncate">{driver.driver_name}</div>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${driver.status ? `text-blue-400 bg-blue-400/10` : 'text-slate-400 bg-slate-400/10'}`}>
                {driver.status ? getSettlementStatusLabel(driver.status as any) : 'No settlement'}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{formatCurrency(driver.gross)}</div>
            <div className="text-xs text-[#8B95A5] capitalize">{driver.pay_type.replace('_', ' ')}</div>
            {driver.settlement_number && (
              <div className="text-xs text-slate-400 font-mono mt-1 group-hover:underline">{driver.settlement_number}</div>
            )}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Alerts ({data.alerts.length})</h3>
          </div>
          <div className="space-y-2">
            {data.alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-yellow-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h3 className="text-sm font-semibold text-white">Recent Activity (last 10)</h3>
        </div>
        <div className="divide-y divide-[#1A2235]">
          {data.recent_activity.map((activity) => (
            <div key={activity.settlement_id} className="px-5 py-4 hover:bg-[#0C1528] transition-colors">
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm text-[#00C650]">{activity.settlement_number}</div>
                <SettlementStatusBadge status={activity.status as any} />
              </div>
              <div className="text-sm text-white mt-1">{activity.driver_name}</div>
              <div className="text-xs text-[#8B95A5] mt-1">{formatDate(activity.updated_at)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <a href="/settlements" className="group rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 hover:bg-[#0C1528] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-400/10 group-hover:bg-blue-400/20 flex items-center justify-center transition-colors">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-sm text-[#8B95A5] group-hover:text-white transition-colors">Process Settlements</span>
          </div>
          <p className="text-xs text-[#8B95A5] mb-3">Review and approve pending settlements</p>
          <span className="inline-flex items-center gap-1.5 bg-[#00C650] px-3 py-1.5 text-xs font-semibold text-black rounded-lg hover:bg-[#00C650]/90 transition-colors">
            View Settlements →
          </span>
        </a>
        <a href="/drivers" className="group rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 hover:bg-[#0C1528] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-400/10 group-hover:bg-green-400/20 flex items-center justify-center transition-colors">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-sm text-[#8B95A5] group-hover:text-white transition-colors">Manage Drivers</span>
          </div>
          <p className="text-xs text-[#8B95A5] mb-3">Add/edit driver profiles</p>
          <span className="inline-flex items-center gap-1.5 bg-[#00C650] px-3 py-1.5 text-xs font-semibold text-black rounded-lg hover:bg-[#00C650]/90 transition-colors">
            Manage Drivers →
          </span>
        </a>
        <a href="/reports" className="group rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 hover:bg-[#0C1528] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-400/10 group-hover:bg-purple-400/20 flex items-center justify-center transition-colors">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-sm text-[#8B95A5] group-hover:text-white transition-colors">Run Reports</span>
          </div>
          <p className="text-xs text-[#8B95A5] mb-3">Pay summary, costs, advances</p>
          <span className="inline-flex items-center gap-1.5 bg-[#00C650] px-3 py-1.5 text-xs font-semibold text-black rounded-lg hover:bg-[#00C650]/90 transition-colors">
            View Reports →
          </span>
        </a>
        <a href="/settings" className="group rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 hover:bg-[#0C1528] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-400/10 group-hover:bg-orange-400/20 flex items-center justify-center transition-colors">
              <Settings className="h-5 w-5 text-orange-400" />
            </div>
            <span className="text-sm text-[#8B95A5] group-hover:text-white transition-colors">Settings</span>
          </div>
          <p className="text-xs text-[#8B95A5] mb-3">Company info & templates</p>
          <span className="inline-flex items-center gap-1.5 bg-[#00C650] px-3 py-1.5 text-xs font-semibold text-black rounded-lg hover:bg-[#00C650]/90 transition-colors">
            Configure →
          </span>
        </a>
      </div>
    </div>
  );
}
