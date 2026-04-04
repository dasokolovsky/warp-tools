export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { appointments, dockDoors, facilities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  formatTime,
  getAppointmentStatusLabel,
  getAppointmentStatusColor,
  formatDuration,
} from '@/lib/utils';
import type { AppointmentStatus } from '@/db/schema';

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
      <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color: accent ?? '#ffffff' }}>{value}</div>
      {sub && <div className="text-xs text-[#8B95A5] mt-1">{sub}</div>}
    </div>
  );
}

const STATUS_ORDER: AppointmentStatus[] = ['in_progress', 'checked_in', 'scheduled', 'completed', 'no_show', 'cancelled'];

export default async function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];

  const [facility] = await db.select().from(facilities).limit(1);
  const allDoors = await db.select().from(dockDoors).orderBy(dockDoors.sort_order);
  const todayAppts = await db
    .select()
    .from(appointments)
    .where(eq(appointments.scheduled_date, today))
    .orderBy(appointments.scheduled_time);

  const statusCounts = todayAppts.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const activeDoors = allDoors.filter((d) => d.status === 'active');
  const inProgress = todayAppts.filter((a) => a.status === 'in_progress');
  const checkedIn = todayAppts.filter((a) => a.status === 'checked_in');
  const upcoming = todayAppts.filter((a) => a.status === 'scheduled');

  const completedAppts = todayAppts.filter((a) => a.status === 'completed');
  const avgDwell =
    completedAppts.length > 0
      ? Math.round(
          completedAppts.reduce((sum, a) => sum + (a.total_dwell_minutes ?? 0), 0) /
            completedAppts.length
        )
      : null;

  // Latest activity — last 8 non-scheduled, non-upcoming
  const activityAppts = todayAppts
    .filter((a) => !['scheduled'].includes(a.status))
    .sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.status as AppointmentStatus);
      const bi = STATUS_ORDER.indexOf(b.status as AppointmentStatus);
      return ai - bi;
    })
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-[#8B95A5] mt-1">
          {facility?.name ?? 'Facility'} &mdash;{' '}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alert: checked-in waiting */}
      {checkedIn.length > 0 && (
        <div className="rounded-xl border border-[#FFAA00]/30 bg-[#FFAA00]/5 p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-[#FFAA00]/20 flex items-center justify-center">
            <span className="text-[#FFAA00] text-xs font-bold">!</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-[#FFAA00]">
              {checkedIn.length} truck{checkedIn.length !== 1 ? 's' : ''} checked in and waiting for a dock
            </div>
            <div className="text-xs text-[#8B95A5] mt-0.5">
              {checkedIn.map((a) => a.carrier_name ?? a.load_ref ?? `Appt #${a.id}`).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Doors" value={`${inProgress.length} / ${activeDoors.length}`} sub="in use today" accent="#00C650" />
        <StatCard label="In Progress" value={inProgress.length} sub="loading/unloading" />
        <StatCard label="Checked In" value={checkedIn.length} sub="waiting for dock" accent={checkedIn.length > 0 ? '#FFAA00' : undefined} />
        <StatCard
          label="Avg Dwell Time"
          value={avgDwell != null ? formatDuration(avgDwell) : '—'}
          sub={completedAppts.length > 0 ? `from ${completedAppts.length} completed` : 'no data yet'}
        />
      </div>

      {/* Status summary */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Today&apos;s Appointments</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(['scheduled', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled'] as AppointmentStatus[]).map((status) => (
            <div key={status} className="text-center">
              <div className="text-xl font-bold text-white">{statusCounts[status] ?? 0}</div>
              <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block border ${getAppointmentStatusColor(status)}`}>
                {getAppointmentStatusLabel(status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dock door overview */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Dock Door Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allDoors.map((door) => {
            const active = todayAppts.find(
              (a) => a.dock_door_id === door.id && ['in_progress', 'checked_in'].includes(a.status)
            );
            const isActive = door.status === 'active';
            const isMaint = door.status === 'maintenance';
            return (
              <div
                key={door.id}
                className={`rounded-lg border p-3 ${
                  active
                    ? 'border-[#00C650]/30 bg-[#00C650]/5'
                    : isMaint
                    ? 'border-[#FFAA00]/20 bg-[#FFAA00]/5'
                    : isActive
                    ? 'border-[#1A2235] bg-[#0C1528]'
                    : 'border-[#1A2235]/50 bg-[#040810] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">{door.name}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      active ? 'bg-[#00C650]' : isMaint ? 'bg-[#FFAA00]' : isActive ? 'bg-[#1A2235]' : 'bg-[#1A2235]/50'
                    }`}
                  />
                </div>
                {active ? (
                  <div>
                    <div className="text-xs text-[#8B95A5] truncate">{active.carrier_name ?? '—'}</div>
                    <div className={`text-xs mt-0.5 px-1.5 py-0.5 rounded-full inline-block border ${getAppointmentStatusColor(active.status as AppointmentStatus)}`}>
                      {getAppointmentStatusLabel(active.status as AppointmentStatus)}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#8B95A5]">
                    {isMaint ? 'Maintenance' : isActive ? 'Available' : 'Inactive'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Door</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Time</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Carrier</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Commodity</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Duration</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {activityAppts.map((appt) => {
                const doorName = allDoors.find((d) => d.id === appt.dock_door_id)?.name ?? '—';
                return (
                  <tr key={appt.id} className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] transition-colors">
                    <td className="px-5 py-3 font-mono text-[#00C650] text-xs">{doorName}</td>
                    <td className="px-5 py-3 text-slate-300">{formatTime(appt.scheduled_time)}</td>
                    <td className="px-5 py-3 text-slate-300">{appt.carrier_name ?? '—'}</td>
                    <td className="px-5 py-3 text-[#8B95A5]">{appt.commodity ?? '—'}</td>
                    <td className="px-5 py-3 text-[#8B95A5]">
                      {appt.total_dwell_minutes != null ? formatDuration(appt.total_dwell_minutes) : formatDuration(appt.duration_minutes)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getAppointmentStatusColor(appt.status as AppointmentStatus)}`}>
                        {getAppointmentStatusLabel(appt.status as AppointmentStatus)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {activityAppts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#8B95A5] text-sm">
                    No activity yet today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1A2235]">
            <h2 className="text-sm font-semibold text-white">Upcoming Today</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Door</th>
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Time</th>
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Carrier</th>
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Type</th>
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Commodity</th>
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((appt) => {
                  const doorName = allDoors.find((d) => d.id === appt.dock_door_id)?.name ?? '—';
                  return (
                    <tr key={appt.id} className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] transition-colors">
                      <td className="px-5 py-3 font-mono text-[#00C650] text-xs">{doorName}</td>
                      <td className="px-5 py-3 text-slate-300">{formatTime(appt.scheduled_time)}</td>
                      <td className="px-5 py-3 text-slate-300">{appt.carrier_name ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          appt.appointment_type === 'inbound'
                            ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                            : 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                        }`}>
                          {appt.appointment_type === 'inbound' ? 'Inbound' : 'Outbound'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#8B95A5]">{appt.commodity ?? '—'}</td>
                      <td className="px-5 py-3 text-[#8B95A5]">{formatDuration(appt.duration_minutes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
