export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatDuration } from '@/lib/utils';

export default async function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = await db
    .select()
    .from(appointments)
    .where(eq(appointments.scheduled_date, today));

  const completed = todayAppts.filter((a) => a.status === 'completed');
  const noShow = todayAppts.filter((a) => a.status === 'no_show');
  const cancelled = todayAppts.filter((a) => a.status === 'cancelled');

  const avgWait =
    completed.length > 0
      ? Math.round(completed.reduce((s, a) => s + (a.wait_minutes ?? 0), 0) / completed.length)
      : null;

  const avgDock =
    completed.length > 0
      ? Math.round(completed.reduce((s, a) => s + (a.dock_minutes ?? 0), 0) / completed.length)
      : null;

  const avgDwell =
    completed.length > 0
      ? Math.round(completed.reduce((s, a) => s + (a.total_dwell_minutes ?? 0), 0) / completed.length)
      : null;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Dwell time, throughput, and on-time performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Completed Today</div>
          <div className="text-2xl font-bold text-white">{completed.length}</div>
        </div>
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Avg Wait Time</div>
          <div className="text-2xl font-bold text-white">{avgWait != null ? formatDuration(avgWait) : '—'}</div>
          <div className="text-xs text-[#8B95A5] mt-1">check-in to dock start</div>
        </div>
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Avg Dock Time</div>
          <div className="text-2xl font-bold text-white">{avgDock != null ? formatDuration(avgDock) : '—'}</div>
          <div className="text-xs text-[#8B95A5] mt-1">dock start to completion</div>
        </div>
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Avg Dwell</div>
          <div className="text-2xl font-bold text-white">{avgDwell != null ? formatDuration(avgDwell) : '—'}</div>
          <div className="text-xs text-[#8B95A5] mt-1">total facility time</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">No Shows</div>
          <div className="text-2xl font-bold text-[#FF4444]">{noShow.length}</div>
          <div className="text-xs text-[#8B95A5] mt-1">today</div>
        </div>
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Cancelled</div>
          <div className="text-2xl font-bold text-[#FFAA00]">{cancelled.length}</div>
          <div className="text-xs text-[#8B95A5] mt-1">today</div>
        </div>
      </div>

      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
        <p className="text-sm text-[#8B95A5]">
          Full reports with historical trends, carrier performance rankings, and on-time percentage
          charts coming soon.
        </p>
      </div>
    </div>
  );
}
