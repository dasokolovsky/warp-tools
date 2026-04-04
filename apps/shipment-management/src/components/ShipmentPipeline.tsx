import Link from 'next/link';
import type { ShipmentStatus } from '@/db/schema';

interface PipelineItem {
  status: ShipmentStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PIPELINE_ITEMS: PipelineItem[] = [
  { status: 'quote', label: 'Quote', color: 'text-slate-400', bgColor: 'bg-slate-400/10', borderColor: 'border-slate-400/20' },
  { status: 'booked', label: 'Booked', color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/20' },
  { status: 'dispatched', label: 'Dispatched', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/20' },
  { status: 'in_transit', label: 'In Transit', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10', borderColor: 'border-cyan-400/20' },
  { status: 'delivered', label: 'Delivered', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', borderColor: 'border-emerald-400/20' },
  { status: 'invoiced', label: 'Invoiced', color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/20' },
  { status: 'paid', label: 'Paid', color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/20' },
  { status: 'closed', label: 'Closed', color: 'text-slate-500', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
];

interface ShipmentPipelineProps {
  statusCounts: Record<string, number>;
}

export function ShipmentPipeline({ statusCounts }: ShipmentPipelineProps) {
  return (
    <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-4">
      <h2 className="text-sm font-semibold text-white mb-3">Pipeline</h2>
      <div className="flex flex-wrap gap-2">
        {PIPELINE_ITEMS.map((item) => {
          const count = statusCounts[item.status] ?? 0;
          return (
            <Link
              key={item.status}
              href={`/shipments?status=${item.status}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${item.bgColor} ${item.borderColor} hover:opacity-80 transition-opacity cursor-pointer`}
            >
              <span className={`text-xs font-medium ${item.color}`}>{item.label}</span>
              <span className={`text-sm font-bold ${item.color}`}>{count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
