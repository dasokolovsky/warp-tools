export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { loadTemplates } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { formatCurrency, getEquipmentLabel } from '@/lib/utils';

export default async function TemplatesPage() {
  const templates = await db.select().from(loadTemplates).orderBy(desc(loadTemplates.use_count));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Templates</h1>
          <p className="text-sm text-[#8B95A5] mt-1">Reusable templates for common lanes</p>
        </div>
        <button className="rounded-lg bg-[#00C650] text-black px-4 py-2 text-sm font-semibold hover:bg-[#00C650]/90 transition-colors">
          + New Template
        </button>
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 hover:bg-[#0C1528] transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">{tmpl.name}</h3>
              <span className="text-xs text-[#8B95A5] bg-[#1A2235] px-2 py-0.5 rounded-full">
                Used {tmpl.use_count}x
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-[#8B95A5]">
              {tmpl.customer_name && (
                <div>
                  <span className="text-slate-400">Customer:</span> {tmpl.customer_name}
                </div>
              )}
              {tmpl.origin_city && (
                <div>
                  <span className="text-slate-400">Lane:</span>{' '}
                  {tmpl.origin_city}, {tmpl.origin_state} → {tmpl.dest_city}, {tmpl.dest_state}
                </div>
              )}
              {tmpl.equipment_type && (
                <div>
                  <span className="text-slate-400">Equipment:</span>{' '}
                  {getEquipmentLabel(tmpl.equipment_type)}
                </div>
              )}
              {tmpl.commodity && (
                <div>
                  <span className="text-slate-400">Commodity:</span> {tmpl.commodity}
                </div>
              )}
              {tmpl.customer_rate && (
                <div>
                  <span className="text-slate-400">Rate:</span>{' '}
                  <span className="text-[#00C650] font-medium">{formatCurrency(tmpl.customer_rate)}</span>
                </div>
              )}
            </div>
            {tmpl.special_instructions && (
              <div className="mt-3 p-2.5 rounded-lg bg-[#040810] border border-[#1A2235] text-xs text-[#8B95A5]">
                {tmpl.special_instructions}
              </div>
            )}
            <div className="mt-4">
              <button className="w-full rounded-lg border border-[#00C650]/30 text-[#00C650] text-xs py-2 hover:bg-[#00C650]/10 transition-colors font-medium">
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
