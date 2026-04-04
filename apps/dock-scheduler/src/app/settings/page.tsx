export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { facilities, dockDoors } from '@/db/schema';

export default async function SettingsPage() {
  const [facility] = await db.select().from(facilities).limit(1);
  const allDoors = await db.select().from(dockDoors).orderBy(dockDoors.sort_order);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Facility configuration and dock door management</p>
      </div>

      {/* Facility info */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Facility</h2>
        {facility ? (
          <div className="space-y-3 text-sm">
            <div className="flex gap-4">
              <span className="text-[#8B95A5] w-32 flex-shrink-0">Name</span>
              <span className="text-slate-300">{facility.name}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-[#8B95A5] w-32 flex-shrink-0">Address</span>
              <span className="text-slate-300">
                {facility.address_street}, {facility.address_city}, {facility.address_state}{' '}
                {facility.address_zip}
              </span>
            </div>
            <div className="flex gap-4">
              <span className="text-[#8B95A5] w-32 flex-shrink-0">Hours</span>
              <span className="text-slate-300">
                {facility.operating_hours_start} &mdash; {facility.operating_hours_end}
              </span>
            </div>
            <div className="flex gap-4">
              <span className="text-[#8B95A5] w-32 flex-shrink-0">Timezone</span>
              <span className="text-slate-300">{facility.timezone}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-[#8B95A5] w-32 flex-shrink-0">Buffer</span>
              <span className="text-slate-300">{facility.buffer_minutes} min between appointments</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#8B95A5]">No facility configured.</p>
        )}
      </div>

      {/* Dock doors */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Dock Doors ({allDoors.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Name</th>
              <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Type</th>
              <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Status</th>
              <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {allDoors.map((door) => (
              <tr key={door.id} className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] transition-colors">
                <td className="px-5 py-3 font-medium text-white">{door.name}</td>
                <td className="px-5 py-3 text-[#8B95A5] capitalize">{door.door_type}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    door.status === 'active'
                      ? 'text-green-400 bg-green-400/10 border-green-400/20'
                      : door.status === 'maintenance'
                      ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                      : 'text-slate-500 bg-slate-500/10 border-slate-500/20'
                  }`}>
                    {door.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-[#8B95A5] text-xs">{door.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
        <p className="text-sm text-[#8B95A5]">
          Full facility and dock door editing coming soon.
        </p>
      </div>
    </div>
  );
}
