export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { loads } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor, getEquipmentLabel } from '@/lib/utils';

export default async function LoadBoardPage() {
  const allLoads = await db.select().from(loads).orderBy(desc(loads.created_at));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Board</h1>
          <p className="text-sm text-[#8B95A5] mt-1">{allLoads.length} loads total</p>
        </div>
        <button className="rounded-lg bg-[#00C650] text-black px-4 py-2 text-sm font-semibold hover:bg-[#00C650]/90 transition-colors">
          + New Load
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Load #</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Customer</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Origin</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Destination</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Pickup</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Equipment</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Rate</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Carrier</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {allLoads.map((load) => (
                <tr
                  key={load.id}
                  className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-mono text-[#00C650] text-xs whitespace-nowrap">{load.load_number}</td>
                  <td className="px-5 py-3 text-slate-300 whitespace-nowrap">{load.customer_name}</td>
                  <td className="px-5 py-3 text-[#8B95A5] whitespace-nowrap">
                    {load.origin_city}, {load.origin_state}
                  </td>
                  <td className="px-5 py-3 text-[#8B95A5] whitespace-nowrap">
                    {load.dest_city}, {load.dest_state}
                  </td>
                  <td className="px-5 py-3 text-[#8B95A5] whitespace-nowrap">{formatDate(load.pickup_date)}</td>
                  <td className="px-5 py-3 text-[#8B95A5] whitespace-nowrap">{getEquipmentLabel(load.equipment_type)}</td>
                  <td className="px-5 py-3 text-slate-300 whitespace-nowrap">{formatCurrency(load.customer_rate)}</td>
                  <td className="px-5 py-3 text-[#8B95A5] whitespace-nowrap">
                    {load.carrier_name ?? <span className="text-[#8B95A5]/40 italic">Unassigned</span>}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(load.status)}`}>
                      {getStatusLabel(load.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
