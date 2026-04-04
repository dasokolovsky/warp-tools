export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments } from '@/db/schema';
import { formatCurrency, formatDate, getShipmentStatusLabel, getShipmentStatusColor, getEquipmentLabel } from '@/lib/utils';
import Link from 'next/link';

export default async function ShipmentsPage() {
  const allShipments = await db.select().from(shipments).orderBy(shipments.createdAt);

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Shipments</h1>
          <p className="text-[#8B95A5] text-sm mt-1">{allShipments.length} total shipments</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium rounded-lg bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors">
          + New Shipment
        </button>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Shipment #</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Origin</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Destination</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Equipment</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Pickup</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Carrier</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Rate</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Margin</th>
            </tr>
          </thead>
          <tbody>
            {allShipments.map((s) => (
              <tr key={s.id} className="border-b border-[#1A2235]/50 hover:bg-[#0C1528] transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/shipments/${s.id}`} className="text-[#00C650] hover:underline font-medium">
                    {s.shipmentNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getShipmentStatusColor(s.status)}`}>
                    {getShipmentStatusLabel(s.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#8B95A5]">{s.customerName}</td>
                <td className="px-4 py-3 text-[#8B95A5]">{s.originCity}, {s.originState}</td>
                <td className="px-4 py-3 text-[#8B95A5]">{s.destCity}, {s.destState}</td>
                <td className="px-4 py-3 text-[#8B95A5]">{getEquipmentLabel(s.equipmentType)}</td>
                <td className="px-4 py-3 text-[#8B95A5]">{formatDate(s.pickupDate)}</td>
                <td className="px-4 py-3 text-[#8B95A5]">{s.carrierName ?? '—'}</td>
                <td className="px-4 py-3 text-right text-white">{formatCurrency(s.customerRate)}</td>
                <td className="px-4 py-3 text-right">
                  {s.marginPct != null ? (
                    <span className={s.marginPct >= 20 ? 'text-green-400' : s.marginPct >= 12 ? 'text-yellow-400' : 'text-red-400'}>
                      {s.marginPct.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-[#8B95A5]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
