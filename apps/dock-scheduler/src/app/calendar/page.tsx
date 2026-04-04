export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { appointments, dockDoors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatTime, getAppointmentStatusColor, getAppointmentStatusLabel, getDockDoorTypeLabel } from '@/lib/utils';
import type { AppointmentStatus } from '@/db/schema';

export default async function CalendarPage() {
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = await db
    .select()
    .from(appointments)
    .where(eq(appointments.scheduled_date, today))
    .orderBy(appointments.scheduled_time);

  const allDoors = await db.select().from(dockDoors).orderBy(dockDoors.sort_order);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Schedule view — dock door timeline</p>
      </div>

      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
        <div className="text-sm text-[#8B95A5] mb-4">
          Today &mdash; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>

        <div className="space-y-4">
          {allDoors.map((door) => {
            const doorAppts = todayAppts.filter((a) => a.dock_door_id === door.id);
            return (
              <div key={door.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-white w-16">{door.name}</span>
                  <span className="text-xs text-[#8B95A5]">{getDockDoorTypeLabel(door.door_type)}</span>
                  {door.status !== 'active' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${
                      door.status === 'maintenance'
                        ? 'text-[#FFAA00] bg-[#FFAA00]/10 border-[#FFAA00]/20'
                        : 'text-[#8B95A5] bg-[#8B95A5]/10 border-[#8B95A5]/20'
                    }`}>
                      {door.status}
                    </span>
                  )}
                </div>
                {doorAppts.length > 0 ? (
                  <div className="flex flex-wrap gap-2 ml-16">
                    {doorAppts.map((appt) => (
                      <div
                        key={appt.id}
                        className={`text-xs px-2 py-1.5 rounded-lg border ${getAppointmentStatusColor(appt.status as AppointmentStatus)}`}
                      >
                        <div className="font-medium">{formatTime(appt.scheduled_time)}</div>
                        <div className="opacity-80">{appt.carrier_name ?? '—'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ml-16 text-xs text-[#8B95A5]/50">No appointments</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
        <p className="text-sm text-[#8B95A5]">
          Full drag-and-drop calendar view coming soon. This page will show an interactive timeline
          grid with dock doors as rows and time slots as columns.
        </p>
      </div>
    </div>
  );
}
