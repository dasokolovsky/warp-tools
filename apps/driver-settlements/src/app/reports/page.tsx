'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Calendar, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ReportsPaySummary } from './ReportsPaySummary';
import { ReportsDeductionBreakdown } from './ReportsDeductionBreakdown';
import { ReportsPerMileCost } from './ReportsPerMileCost';
import { ReportsAdvanceBalance } from './ReportsAdvanceBalance';

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Payroll and cost analysis</p>
      </div>

      {/* Date range */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Calendar className="h-4 w-4 text-[#8B95A5]" />
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white focus:outline-none"
            />
            <span className="text-sm text-[#8B95A5]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg bg-[#1A2235] border border-[#243050] px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
        </div>
        <button className="inline-flex items-center gap-2 bg-[#00C650] px-4 py-2 rounded-lg text-sm font-semibold text-black hover:bg-[#00C650]/90 transition-colors self-start sm:self-center">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <Tabs defaultValue="pay-summary" className="w-full">
        <TabsList className="inline-grid grid-cols-4 bg-[#080F1E] border border-[#1A2235] p-1 rounded-xl">
          <TabsTrigger value="pay-summary" className="rounded-lg data-[state=active]:bg-[#00C650] data-[state=active]:text-black data-[state=active]:shadow-sm text-xs py-2.5 font-medium">
            Pay Summary
          </TabsTrigger>
          <TabsTrigger value="deductions" className="rounded-lg data-[state=active]:bg-[#00C650] data-[state=active]:text-black data-[state=active]:shadow-sm text-xs py-2.5 font-medium">
            Deduction Breakdown
          </TabsTrigger>
          <TabsTrigger value="per-mile" className="rounded-lg data-[state=active]:bg-[#00C650] data-[state=active]:text-black data-[state=active]:shadow-sm text-xs py-2.5 font-medium">
            Per-Mile Cost
          </TabsTrigger>
          <TabsTrigger value="advances" className="rounded-lg data-[state=active]:bg-[#00C650] data-[state=active]:text-black data-[state=active]:shadow-sm text-xs py-2.5 font-medium">
            Advance Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pay-summary" className="mt-6">
          <ReportsPaySummary dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
        <TabsContent value="deductions" className="mt-6">
          <ReportsDeductionBreakdown dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
        <TabsContent value="per-mile" className="mt-6">
          <ReportsPerMileCost dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
        <TabsContent value="advances" className="mt-6">
          <ReportsAdvanceBalance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
