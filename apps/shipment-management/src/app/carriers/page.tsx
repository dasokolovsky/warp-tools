export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments } from '@/db/schema';
import { sql, isNotNull } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';

export default async function CarriersPage() {
  const rows = await db
    .select({
      carrierName: shipments.carrierName,
      carrierId: shipments.carrierId,
      shipmentCount: sql<number>`count(*)`,
      totalCarrierCost: sql<number>`sum(${shipments.carrierRate})`,
    })
    .from(shipments)
    .where(isNotNull(shipments.carrierName))
    .groupBy(shipments.carrierName, shipments.carrierId);

  const sorted = [...rows].sort((a, b) => (b.shipmentCount ?? 0) - (a.shipmentCount ?? 0));

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Carriers</h1>
        <p className="text-[#8B95A5] text-sm mt-1">{sorted.length} carriers used</p>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Carrier</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Shipments</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Total Paid</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Avg per Load</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.carrierName} className="border-b border-[#1A2235]/50 hover:bg-[#0C1528] transition-colors">
                <td className="px-4 py-3 text-white font-medium">{c.carrierName}</td>
                <td className="px-4 py-3 text-right text-[#8B95A5]">{c.shipmentCount}</td>
                <td className="px-4 py-3 text-right text-white">{formatCurrency(c.totalCarrierCost)}</td>
                <td className="px-4 py-3 text-right text-[#8B95A5]">
                  {c.shipmentCount > 0 ? formatCurrency((c.totalCarrierCost ?? 0) / c.shipmentCount) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
