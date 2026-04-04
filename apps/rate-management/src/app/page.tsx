export const dynamic = 'force-dynamic';
import Link from "next/link";

import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs, rfqs } from '@/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { ExpiringRateAlert } from '@/components/ExpiringRateAlert';
import { RFQStatusBadge } from '@/components/RFQStatusBadge';
import {
  formatCurrency, formatDate, getEquipmentLabel, getMarginColor, getMarginLabel, cn
} from '@/lib/utils';
import {
  Map, DollarSign, TrendingUp, FileQuestion, AlertTriangle,
  ArrowRight, Clock, CheckCircle2, Activity
} from 'lucide-react';

function calculateMargin(tariff: number, carrier: number): number {
  if (tariff <= 0) return 0;
  return ((tariff - carrier) / tariff) * 100;
}

export default async function DashboardPage() {
  const today = new Date();
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);
  const todayStr = today.toISOString().split('T')[0];
  const in30Str = in30.toISOString().split('T')[0];

  // Overview counts
  const [totalLanes] = await db.select({ count: count() }).from(lanes).where(eq(lanes.status, 'active'));
  const [activeRates] = await db.select({ count: count() }).from(carrier_rates);
  const [activeTariffs] = await db.select({ count: count() }).from(customer_tariffs).where(eq(customer_tariffs.status, 'active'));
  const [openRFQs] = await db.select({ count: count() }).from(rfqs).where(sql`status IN ('draft','sent','responses')`);

  // Expiring rates
  const expiringCarrierRates = await db
    .select()
    .from(carrier_rates)
    .where(sql`expiry_date IS NOT NULL AND expiry_date >= ${todayStr} AND expiry_date <= ${in30Str}`);

  const expiringTariffs = await db
    .select()
    .from(customer_tariffs)
    .where(sql`expiry_date IS NOT NULL AND expiry_date >= ${todayStr} AND expiry_date <= ${in30Str} AND status = 'active'`);

  const allLanesData = await db.select().from(lanes);
  const laneMap = Object.fromEntries(allLanesData.map(l => [l.id, l]));

  type ExpiringItem = {
    type: 'carrier' | 'tariff';
    id: number;
    name: string;
    rate: number;
    basis: string;
    expiry_date: string | null;
    lane: { origin_city: string; origin_state: string; dest_city: string; dest_state: string } | null;
  };

  const expiringItems: ExpiringItem[] = [
    ...expiringCarrierRates.map(r => ({
      type: 'carrier' as const,
      id: r.id,
      name: r.carrier_name,
      rate: r.rate_amount,
      basis: r.rate_basis,
      expiry_date: r.expiry_date ?? null,
      lane: laneMap[r.lane_id] ?? null,
    })),
    ...expiringTariffs.map(t => ({
      type: 'tariff' as const,
      id: t.id,
      name: t.customer_name,
      rate: t.rate_amount,
      basis: t.rate_basis,
      expiry_date: t.expiry_date ?? null,
      lane: t.lane_id ? (laneMap[t.lane_id] ?? null) : null,
    })),
  ].sort((a, b) => (a.expiry_date ?? '').localeCompare(b.expiry_date ?? ''));

  // Margin analysis
  const activeLanes = allLanesData.filter(l => l.status === 'active');
  const marginData = await Promise.all(
    activeLanes.map(async lane => {
      const rates = await db.select().from(carrier_rates).where(eq(carrier_rates.lane_id, lane.id)).orderBy(carrier_rates.rate_amount);
      const tariffs = await db.select().from(customer_tariffs).where(eq(customer_tariffs.lane_id, lane.id));
      const bestRate = rates[0];
      const activeTariff = tariffs.find(t => t.status === 'active') ?? tariffs[0];
      const margin = bestRate && activeTariff ? calculateMargin(activeTariff.rate_amount, bestRate.rate_amount) : null;
      return { lane, bestRate, activeTariff, margin, rateCount: rates.length };
    })
  );

  const marginAlerts = marginData.filter(d => d.margin !== null && d.margin < 15);
  const topLanes = [...marginData]
    .filter(d => d.rateCount > 0)
    .sort((a, b) => b.rateCount - a.rateCount)
    .slice(0, 5);

  // Recent rate changes
  const recentRateChanges = await db
    .select()
    .from(carrier_rates)
    .orderBy(sql`created_at DESC`)
    .limit(10);

  // Open RFQs
  const openRFQList = await db
    .select()
    .from(rfqs)
    .where(sql`status IN ('draft','sent','responses')`)
    .orderBy(sql`created_at DESC`);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#8B95A5] mt-1 text-sm">Overview of your freight rate network.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8B95A5] text-xs mb-2"><Map className="h-4 w-4" /> Total Lanes</div>
          <div className="text-2xl font-bold text-white">{totalLanes.count}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8B95A5] text-xs mb-2"><DollarSign className="h-4 w-4" /> Active Rates</div>
          <div className="text-2xl font-bold text-white">{activeRates.count}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8B95A5] text-xs mb-2"><TrendingUp className="h-4 w-4" /> Active Tariffs</div>
          <div className="text-2xl font-bold text-white">{activeTariffs.count}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8B95A5] text-xs mb-2"><FileQuestion className="h-4 w-4" /> Open RFQs</div>
          <div className="text-2xl font-bold text-white">{openRFQs.count}</div>
        </div>
      </div>

      {/* Expiring Rates Alert */}
      {expiringItems.length > 0 && (
        <ExpiringRateAlert items={expiringItems} warningDays={30} />
      )}

      {/* Margin Alerts */}
      {marginAlerts.length > 0 && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">
              Margin Alert — {marginAlerts.length} lane{marginAlerts.length !== 1 ? 's' : ''} below 15%
            </span>
          </div>
          <div className="space-y-2">
            {marginAlerts.sort((a, b) => (a.margin ?? 0) - (b.margin ?? 0)).map(({ lane, margin, bestRate, activeTariff }) => (
              <div key={lane.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-white">
                  <span>{lane.origin_city}</span>
                  <ArrowRight className="h-3 w-3 text-[#8B95A5]" />
                  <span>{lane.dest_city}</span>
                  <span className="text-[#8B95A5] ml-1 text-xs">({getEquipmentLabel(lane.equipment_type)})</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#8B95A5]">Carrier: {bestRate ? formatCurrency(bestRate.rate_amount) : '—'}</span>
                  <span className="text-[#8B95A5]">Tariff: {activeTariff ? formatCurrency(activeTariff.rate_amount) : '—'}</span>
                  <span className="text-red-400 font-semibold">{margin?.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Lanes */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00C650]" />
              Top Lanes
            </h2>
            <Link href="/lanes" className="text-xs text-[#00C650] hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {topLanes.length === 0 && <p className="text-sm text-[#8B95A5] py-4 text-center">No lane data yet</p>}
            {topLanes.map(({ lane, bestRate, activeTariff, margin }) => (
              <div key={lane.id} className="flex items-center justify-between py-2 border-b border-[#1A2235] last:border-0">
                <div>
                  <div className="flex items-center gap-1 text-sm text-white">
                    <span>{lane.origin_city}</span>
                    <ArrowRight className="h-3 w-3 text-[#8B95A5]" />
                    <span>{lane.dest_city}</span>
                  </div>
                  <div className="text-xs text-[#8B95A5] mt-0.5">{getEquipmentLabel(lane.equipment_type)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{bestRate ? formatCurrency(bestRate.rate_amount) : '—'}</div>
                  {margin !== null && (
                    <div className={cn('text-xs font-medium', getMarginColor(margin))}>
                      {margin.toFixed(1)}% ({getMarginLabel(margin)})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open RFQs */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-[#00C650]" />
              Open RFQs
            </h2>
            <Link href="/rfqs" className="text-xs text-[#00C650] hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {openRFQList.length === 0 && <p className="text-sm text-[#8B95A5] py-4 text-center">No open RFQs</p>}
            {openRFQList.map(rfq => (
              <Link key={rfq.id} href={`/rfqs/${rfq.id}`} className="flex items-center justify-between py-2 border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] -mx-2 px-2 rounded transition-colors">
                <div>
                  <div className="text-sm font-medium text-white">{rfq.rfq_number}</div>
                  <div className="text-xs text-[#8B95A5] mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(rfq.pickup_date)}
                  </div>
                </div>
                <RFQStatusBadge status={rfq.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Rate Changes */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#00C650]" />
              Recent Rate Changes
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="text-left py-2 text-xs text-[#8B95A5] font-medium">Lane</th>
                  <th className="text-left py-2 text-xs text-[#8B95A5] font-medium">Carrier</th>
                  <th className="text-right py-2 text-xs text-[#8B95A5] font-medium">Rate</th>
                  <th className="text-left py-2 text-xs text-[#8B95A5] font-medium">Type</th>
                  <th className="text-left py-2 text-xs text-[#8B95A5] font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2235]">
                {recentRateChanges.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-[#8B95A5]">No rate changes yet</td></tr>
                )}
                {recentRateChanges.map(rate => {
                  const lane = laneMap[rate.lane_id];
                  return (
                    <tr key={rate.id} className="hover:bg-[#0C1528] transition-colors">
                      <td className="py-2.5">
                        {lane ? (
                          <div className="flex items-center gap-1 text-[#8B95A5] text-xs">
                            <span>{lane.origin_city}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{lane.dest_city}</span>
                          </div>
                        ) : <span className="text-[#8B95A5]">—</span>}
                      </td>
                      <td className="py-2.5 text-white">{rate.carrier_name}</td>
                      <td className="py-2.5 text-right text-white font-semibold">{formatCurrency(rate.rate_amount)}</td>
                      <td className="py-2.5">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded border', rate.rate_type === 'contract' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20')}>
                          {rate.rate_type}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#8B95A5] text-xs">{formatDate(rate.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
