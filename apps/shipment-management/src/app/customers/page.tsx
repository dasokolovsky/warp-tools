export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';

export default async function CustomersPage() {
  const rows = await db
    .select({
      customerName: shipments.customerName,
      customerId: shipments.customerId,
      shipmentCount: sql<number>`count(*)`,
      totalRevenue: sql<number>`sum(${shipments.customerRate})`,
    })
    .from(shipments)
    .groupBy(shipments.customerName, shipments.customerId);

  const sorted = [...rows].sort((a, b) => (b.totalRevenue ?? 0) - (a.totalRevenue ?? 0));

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-[#8B95A5] text-sm mt-1">{sorted.length} customers</p>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Customer</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Shipments</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Total Revenue</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Avg per Load</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.customerName} className="border-b border-[#1A2235]/50 hover:bg-[#0C1528] transition-colors">
                <td className="px-4 py-3 text-white font-medium">{c.customerName}</td>
                <td className="px-4 py-3 text-right text-[#8B95A5]">{c.shipmentCount}</td>
                <td className="px-4 py-3 text-right text-white">{formatCurrency(c.totalRevenue)}</td>
                <td className="px-4 py-3 text-right text-[#8B95A5]">
                  {c.shipmentCount > 0 ? formatCurrency((c.totalRevenue ?? 0) / c.shipmentCount) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
