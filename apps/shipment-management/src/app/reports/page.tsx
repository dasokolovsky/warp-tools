export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments } from '@/db/schema';
import { formatCurrency } from '@/lib/utils';
import { sql } from 'drizzle-orm';

export default async function ReportsPage() {
  const all = await db.select().from(shipments);

  const total = all.length;
  const delivered = all.filter((s) => ['delivered', 'invoiced', 'paid', 'closed'].includes(s.status)).length;
  const onTimeDeliveries = all.filter((s) => s.deliveryOnTime === true).length;
  const lateDeliveries = all.filter((s) => s.deliveryOnTime === false).length;
  const deliveryOnTimePct = delivered > 0 ? (onTimeDeliveries / (onTimeDeliveries + lateDeliveries)) * 100 : 0;

  const revenueShipments = all.filter((s) => s.customerRate != null && ['invoiced', 'paid', 'closed'].includes(s.status));
  const totalRevenue = revenueShipments.reduce((sum, s) => sum + (s.customerRate ?? 0), 0);
  const totalMargin = revenueShipments.reduce((sum, s) => sum + (s.margin ?? 0), 0);
  const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-[#8B95A5] text-sm mt-1">Performance summary across all shipments</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="text-xs text-[#8B95A5] mb-2 uppercase tracking-wide">Total Shipments</div>
          <div className="text-3xl font-bold text-white">{total}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="text-xs text-[#8B95A5] mb-2 uppercase tracking-wide">Total Revenue</div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="text-xs text-[#8B95A5] mb-2 uppercase tracking-wide">Avg Margin</div>
          <div className="text-3xl font-bold text-green-400">{avgMarginPct.toFixed(1)}%</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
          <div className="text-xs text-[#8B95A5] mb-2 uppercase tracking-wide">On-Time Delivery</div>
          <div className="text-3xl font-bold text-white">{deliveryOnTimePct.toFixed(0)}%</div>
        </div>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Full reporting coming soon</h2>
        <p className="text-sm text-[#8B95A5]">
          Detailed reports with charts, lane analysis, carrier scorecards, and profitability breakdowns are planned for the next release.
        </p>
      </div>
    </div>
  );
}
