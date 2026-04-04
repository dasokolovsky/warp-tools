'use client';

import type { Shipment, ShipmentStatus } from '@/db/schema';
import { ShipmentCard } from '@/components/ShipmentCard';

interface KanbanColumn {
  status: ShipmentStatus;
  label: string;
  color: string;
  headerBg: string;
}

const COLUMNS: KanbanColumn[] = [
  { status: 'quote', label: 'Quote', color: 'text-slate-400', headerBg: 'border-slate-400/30' },
  { status: 'booked', label: 'Booked', color: 'text-blue-400', headerBg: 'border-blue-400/30' },
  { status: 'dispatched', label: 'Dispatched', color: 'text-yellow-400', headerBg: 'border-yellow-400/30' },
  { status: 'in_transit', label: 'In Transit', color: 'text-cyan-400', headerBg: 'border-cyan-400/30' },
  { status: 'delivered', label: 'Delivered', color: 'text-emerald-400', headerBg: 'border-emerald-400/30' },
  { status: 'invoiced', label: 'Invoiced', color: 'text-purple-400', headerBg: 'border-purple-400/30' },
];

interface ShipmentKanbanProps {
  shipments: Shipment[];
}

export function ShipmentKanban({ shipments }: ShipmentKanbanProps) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.status] = shipments.filter((s) => s.status === col.status);
      return acc;
    },
    {} as Record<string, Shipment[]>
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((col) => {
          const colShipments = grouped[col.status] ?? [];
          return (
            <div key={col.status} className="w-64 flex flex-col gap-2">
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg bg-[#080F1E] border ${col.headerBg}`}>
                <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                <span className={`text-xs font-bold ${col.color}`}>{colShipments.length}</span>
              </div>
              <div className="space-y-2">
                {colShipments.map((s) => (
                  <ShipmentCard
                    key={s.id}
                    shipment={s}
                    today={today}
                    tomorrow={tomorrow}
                  />
                ))}
                {colShipments.length === 0 && (
                  <div className="text-xs text-[#8B95A5] text-center py-4 bg-[#080F1E] border border-[#1A2235] rounded-lg">
                    No shipments
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
