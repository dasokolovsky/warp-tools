export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { appointments, dockDoors } from '@/db/schema';
import { desc } from 'drizzle-orm';
import {
  formatDate,
  formatTime,
  formatDuration,
  getAppointmentStatusLabel,
  getAppointmentStatusColor,
} from '@/lib/utils';
import type { AppointmentStatus } from '@/db/schema';

export default async function AppointmentsPage() {
  const allAppts = await db
    .select()
    .from(appointments)
    .orderBy(desc(appointments.scheduled_date), appointments.scheduled_time)
    .limit(100);

  const allDoors = await db.select().from(dockDoors).orderBy(dockDoors.sort_order);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-sm text-[#8B95A5] mt-1">{allAppts.length} appointments total</p>
        </div>
        <button className="rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00C650]/90 transition-colors">
          + New Appointment
        </button>
      </div>

      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Date / Time</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Door</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Carrier</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Driver</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Commodity</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Duration</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Dwell</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {allAppts.map((appt) => {
                const door = allDoors.find((d) => d.id === appt.dock_door_id);
                return (
                  <tr
                    key={appt.id}
                    className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="text-slate-300">{formatDate(appt.scheduled_date)}</div>
                      <div className="text-xs text-[#8B95A5]">
                        {formatTime(appt.scheduled_time)} &mdash; {formatTime(appt.end_time ?? undefined)}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[#00C650] text-xs">
                      {door?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-300">{appt.carrier_name ?? '—'}</td>
                    <td className="px-5 py-3 text-[#8B95A5]">{appt.driver_name ?? '—'}</td>
                    <td className="px-5 py-3 text-[#8B95A5]">{appt.commodity ?? '—'}</td>
                    <td className="px-5 py-3 text-[#8B95A5]">{formatDuration(appt.duration_minutes)}</td>
                    <td className="px-5 py-3 text-[#8B95A5]">
                      {appt.total_dwell_minutes != null ? formatDuration(appt.total_dwell_minutes) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getAppointmentStatusColor(appt.status as AppointmentStatus)}`}
                      >
                        {getAppointmentStatusLabel(appt.status as AppointmentStatus)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
