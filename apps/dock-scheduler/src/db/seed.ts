import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { facilities, dockDoors, appointments } from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'dock-scheduler.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

async function main() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  // Run migrations first
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });

  // Clear existing data
  await db.delete(appointments);
  await db.delete(dockDoors);
  await db.delete(facilities);

  console.log('Seeding...');

  // ─── Facility ────────────────────────────────────────────────────────────────
  const [facility] = await db
    .insert(facilities)
    .values({
      name: 'Central Distribution Center',
      address_street: '4500 Logistics Pkwy',
      address_city: 'Dallas',
      address_state: 'TX',
      address_zip: '75201',
      operating_hours_start: '06:00',
      operating_hours_end: '18:00',
      timezone: 'America/Chicago',
      buffer_minutes: 30,
    })
    .returning();

  console.log(`Created facility: ${facility.name}`);

  // ─── Dock Doors ──────────────────────────────────────────────────────────────
  const doorValues = [
    { facility_id: facility.id, name: 'Door 1', door_type: 'inbound' as const,  status: 'active' as const,      sort_order: 1 },
    { facility_id: facility.id, name: 'Door 2', door_type: 'inbound' as const,  status: 'active' as const,      sort_order: 2 },
    { facility_id: facility.id, name: 'Door 3', door_type: 'outbound' as const, status: 'active' as const,      sort_order: 3 },
    { facility_id: facility.id, name: 'Door 4', door_type: 'outbound' as const, status: 'active' as const,      sort_order: 4 },
    { facility_id: facility.id, name: 'Door 5', door_type: 'both' as const,     status: 'active' as const,      sort_order: 5 },
    { facility_id: facility.id, name: 'Door 6', door_type: 'both' as const,     status: 'active' as const,      sort_order: 6 },
    { facility_id: facility.id, name: 'Door 7', door_type: 'both' as const,     status: 'maintenance' as const, sort_order: 7, notes: 'Dock leveler repair scheduled' },
    { facility_id: facility.id, name: 'Door 8', door_type: 'inbound' as const,  status: 'inactive' as const,    sort_order: 8, notes: 'Decommissioned pending rebuild' },
  ];

  const insertedDoors = await db.insert(dockDoors).values(doorValues).returning();
  console.log(`Created ${insertedDoors.length} dock doors`);

  const door = (name: string) => insertedDoors.find((d) => d.name === name)!;

  // ─── Dates ───────────────────────────────────────────────────────────────────
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  // ─── Appointments ─────────────────────────────────────────────────────────────
  const apptValues: (typeof appointments.$inferInsert)[] = [];

  // Helper
  function appt(
    overrides: Omit<Partial<typeof appointments.$inferInsert>, 'appointment_type'> & {
      dockDoor: (typeof insertedDoors)[0];
      scheduledTime: string;
      durationMinutes?: number;
      scheduledDate?: string;
      appointment_type: 'inbound' | 'outbound';
    }
  ): typeof appointments.$inferInsert {
    const { dockDoor, scheduledTime, durationMinutes = 60, scheduledDate = today, ...rest } = overrides;
    return {
      facility_id: facility.id,
      dock_door_id: dockDoor.id,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      duration_minutes: durationMinutes,
      end_time: addMinutes(scheduledTime, durationMinutes),
      status: 'scheduled',
      ...rest,
    };
  }

  // ── 6 completed (morning) ────────────────────────────────────────────────────
  apptValues.push(appt({
    dockDoor: door('Door 1'), scheduledTime: '06:00', durationMinutes: 90,
    status: 'completed',
    appointment_type: 'inbound',
    carrier_name: 'Apex Freight', driver_name: 'Mike Torres', truck_number: 'APX-4421', trailer_number: 'TR-8801',
    load_ref: 'APX-20240101', po_number: 'PO-55001', commodity: 'Auto Parts',
    checked_in_at: `${today}T05:52:00`, in_progress_at: `${today}T06:18:00`, completed_at: `${today}T07:44:00`,
    wait_minutes: 26, dock_minutes: 86, total_dwell_minutes: 112,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 2'), scheduledTime: '06:30', durationMinutes: 75,
    status: 'completed',
    appointment_type: 'inbound',
    carrier_name: 'Midwest Express', driver_name: 'Sandra Kim', truck_number: 'MWX-7732', trailer_number: 'TR-2244',
    load_ref: 'MWX-20240102', po_number: 'PO-55002', commodity: 'Frozen Foods',
    checked_in_at: `${today}T06:25:00`, in_progress_at: `${today}T06:35:00`, completed_at: `${today}T07:52:00`,
    wait_minutes: 10, dock_minutes: 77, total_dwell_minutes: 87,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 3'), scheduledTime: '07:00', durationMinutes: 60,
    status: 'completed',
    appointment_type: 'outbound',
    carrier_name: 'Pacific Coast', driver_name: 'James Nguyen', truck_number: 'PCL-1195', trailer_number: 'TR-3355',
    load_ref: 'PCL-20240103', commodity: 'Electronics',
    checked_in_at: `${today}T06:55:00`, in_progress_at: `${today}T07:00:00`, completed_at: `${today}T08:05:00`,
    wait_minutes: 5, dock_minutes: 65, total_dwell_minutes: 70,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 4'), scheduledTime: '07:30', durationMinutes: 60,
    status: 'completed',
    appointment_type: 'outbound',
    carrier_name: 'Blue Ridge Transport', driver_name: 'Carla Williams', truck_number: 'BRT-0029', trailer_number: 'TR-6677',
    load_ref: 'BRT-20240104', po_number: 'PO-55004', commodity: 'Building Materials',
    checked_in_at: `${today}T07:15:00`, in_progress_at: `${today}T07:58:00`, completed_at: `${today}T09:25:00`,
    wait_minutes: 43, dock_minutes: 87, total_dwell_minutes: 130,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 5'), scheduledTime: '08:00', durationMinutes: 45,
    status: 'completed',
    appointment_type: 'inbound',
    carrier_name: 'Lone Star Logistics', driver_name: 'Roberto Garza', truck_number: 'LSL-5580', trailer_number: 'TR-9900',
    load_ref: 'LSL-20240105', commodity: 'Produce',
    checked_in_at: `${today}T07:48:00`, in_progress_at: `${today}T08:06:00`, completed_at: `${today}T08:52:00`,
    wait_minutes: 18, dock_minutes: 46, total_dwell_minutes: 64,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 6'), scheduledTime: '08:30', durationMinutes: 90,
    status: 'completed',
    appointment_type: 'inbound',
    carrier_name: 'Great Lakes Freight', driver_name: 'Tom Petersen', truck_number: 'GLF-3341', trailer_number: 'TR-1122',
    load_ref: 'GLF-20240106', po_number: 'PO-55006', commodity: 'Chemicals',
    special_instructions: 'Hazmat — placard required. Stage in bay C.',
    checked_in_at: `${today}T08:18:00`, in_progress_at: `${today}T08:40:00`, completed_at: `${today}T10:12:00`,
    wait_minutes: 22, dock_minutes: 92, total_dwell_minutes: 114,
  }));

  // ── 2 no_show (morning) ──────────────────────────────────────────────────────
  apptValues.push(appt({
    dockDoor: door('Door 1'), scheduledTime: '09:00', durationMinutes: 60,
    status: 'no_show',
    appointment_type: 'inbound',
    carrier_name: 'Sunrise Expedited', driver_name: 'Derrick Moore', truck_number: 'SXP-8811',
    load_ref: 'SXP-20240107', commodity: 'Auto Parts',
  }));

  apptValues.push(appt({
    dockDoor: door('Door 3'), scheduledTime: '09:30', durationMinutes: 60,
    status: 'no_show',
    appointment_type: 'outbound',
    carrier_name: 'Coastal Refrigerated', driver_name: 'Helen Park', truck_number: 'CRF-2209',
    load_ref: 'CRF-20240108', commodity: 'Frozen Foods',
  }));

  // ── 2 cancelled ──────────────────────────────────────────────────────────────
  apptValues.push(appt({
    dockDoor: door('Door 2'), scheduledTime: '10:00', durationMinutes: 60,
    status: 'cancelled',
    appointment_type: 'inbound',
    carrier_name: 'Apex Freight', driver_name: 'Luis Reyes', truck_number: 'APX-5519',
    load_ref: 'APX-20240109', commodity: 'Electronics',
    cancelled_at: `${today}T09:15:00`, cancellation_reason: 'Customer cancelled order',
  }));

  apptValues.push(appt({
    dockDoor: door('Door 4'), scheduledTime: '10:30', durationMinutes: 60,
    status: 'cancelled',
    appointment_type: 'outbound',
    carrier_name: 'Midwest Express', driver_name: 'Patricia Lee', truck_number: 'MWX-6644',
    load_ref: 'MWX-20240110', commodity: 'Building Materials',
    cancelled_at: `${today}T08:50:00`, cancellation_reason: 'Carrier breakdown — rescheduled for tomorrow',
  }));

  // ── 4 in_progress (current) ──────────────────────────────────────────────────
  apptValues.push(appt({
    dockDoor: door('Door 1'), scheduledTime: '11:00', durationMinutes: 90,
    status: 'in_progress',
    appointment_type: 'inbound',
    carrier_name: 'Pacific Coast', driver_name: 'Danny Chan', truck_number: 'PCL-7733', trailer_number: 'TR-4411',
    load_ref: 'PCL-20240111', po_number: 'PO-55011', commodity: 'Auto Parts',
    checked_in_at: `${today}T10:55:00`, in_progress_at: `${today}T11:08:00`,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 2'), scheduledTime: '11:00', durationMinutes: 60,
    status: 'in_progress',
    appointment_type: 'inbound',
    carrier_name: 'Blue Ridge Transport', driver_name: 'Angela Davis', truck_number: 'BRT-8822', trailer_number: 'TR-5522',
    load_ref: 'BRT-20240112', commodity: 'Produce',
    checked_in_at: `${today}T10:48:00`, in_progress_at: `${today}T11:02:00`,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 5'), scheduledTime: '11:30', durationMinutes: 60,
    status: 'in_progress',
    appointment_type: 'outbound',
    carrier_name: 'Lone Star Logistics', driver_name: 'Frank Ortega', truck_number: 'LSL-3310', trailer_number: 'TR-7733',
    load_ref: 'LSL-20240113', po_number: 'PO-55013', commodity: 'Electronics',
    checked_in_at: `${today}T11:22:00`, in_progress_at: `${today}T11:35:00`,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 6'), scheduledTime: '11:30', durationMinutes: 75,
    status: 'in_progress',
    appointment_type: 'outbound',
    carrier_name: 'Great Lakes Freight', driver_name: 'Wendy Scott', truck_number: 'GLF-6650', trailer_number: 'TR-8844',
    load_ref: 'GLF-20240114', commodity: 'Frozen Foods',
    special_instructions: 'Temp-controlled. Keep doors closed until ready.',
    checked_in_at: `${today}T11:15:00`, in_progress_at: `${today}T11:30:00`,
  }));

  // ── 3 checked_in (waiting for dock) ──────────────────────────────────────────
  apptValues.push(appt({
    dockDoor: door('Door 3'), scheduledTime: '12:00', durationMinutes: 60,
    status: 'checked_in',
    appointment_type: 'inbound',
    carrier_name: 'Sunrise Expedited', driver_name: 'Marcus Brown', truck_number: 'SXP-4420', trailer_number: 'TR-9955',
    load_ref: 'SXP-20240115', commodity: 'Building Materials',
    checked_in_at: `${today}T11:45:00`,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 4'), scheduledTime: '12:00', durationMinutes: 90,
    status: 'checked_in',
    appointment_type: 'outbound',
    carrier_name: 'Coastal Refrigerated', driver_name: 'Nina Rodriguez', truck_number: 'CRF-5540', trailer_number: 'TR-6610',
    load_ref: 'CRF-20240116', po_number: 'PO-55016', commodity: 'Frozen Foods',
    checked_in_at: `${today}T11:52:00`,
  }));

  apptValues.push(appt({
    dockDoor: door('Door 1'), scheduledTime: '12:30', durationMinutes: 60,
    status: 'checked_in',
    appointment_type: 'inbound',
    carrier_name: 'Apex Freight', driver_name: 'Greg Martinez', truck_number: 'APX-2233', trailer_number: 'TR-1133',
    load_ref: 'APX-20240117', commodity: 'Chemicals',
    special_instructions: 'SDS sheets required at dock.',
    checked_in_at: `${today}T12:18:00`,
  }));

  // ── 8 scheduled (upcoming afternoon) ─────────────────────────────────────────
  const scheduledTimes: { door: string; time: string; duration: number; type: 'inbound' | 'outbound'; carrier: string; driver: string; commodity: string; ref: string }[] = [
    { door: 'Door 2', time: '13:00', duration: 60,  type: 'inbound',  carrier: 'Midwest Express',        driver: 'Terry Johnson',  commodity: 'Auto Parts',        ref: 'MWX-20240118' },
    { door: 'Door 3', time: '13:30', duration: 90,  type: 'outbound', carrier: 'Pacific Coast',           driver: 'Amy Chen',       commodity: 'Electronics',       ref: 'PCL-20240119' },
    { door: 'Door 5', time: '13:30', duration: 60,  type: 'inbound',  carrier: 'Blue Ridge Transport',    driver: 'Carl Wilson',    commodity: 'Building Materials', ref: 'BRT-20240120' },
    { door: 'Door 6', time: '14:00', duration: 60,  type: 'inbound',  carrier: 'Lone Star Logistics',     driver: 'Maria Ramirez',  commodity: 'Produce',           ref: 'LSL-20240121' },
    { door: 'Door 2', time: '14:30', duration: 75,  type: 'outbound', carrier: 'Great Lakes Freight',     driver: 'Kevin Park',     commodity: 'Frozen Foods',      ref: 'GLF-20240122' },
    { door: 'Door 3', time: '15:00', duration: 60,  type: 'inbound',  carrier: 'Sunrise Expedited',       driver: 'Denise Taylor',  commodity: 'Chemicals',         ref: 'SXP-20240123' },
    { door: 'Door 4', time: '15:30', duration: 60,  type: 'outbound', carrier: 'Coastal Refrigerated',    driver: 'Brian Lee',      commodity: 'Frozen Foods',      ref: 'CRF-20240124' },
    { door: 'Door 6', time: '16:00', duration: 90,  type: 'inbound',  carrier: 'Apex Freight',            driver: 'Rachel Green',   commodity: 'Auto Parts',        ref: 'APX-20240125' },
  ];

  for (const s of scheduledTimes) {
    apptValues.push(appt({
      dockDoor: door(s.door),
      scheduledTime: s.time,
      durationMinutes: s.duration,
      status: 'scheduled',
      appointment_type: s.type,
      carrier_name: s.carrier,
      driver_name: s.driver,
      commodity: s.commodity,
      load_ref: s.ref,
    }));
  }

  // ── 5 for tomorrow (all scheduled) ───────────────────────────────────────────
  const tomorrowAppts: { door: string; time: string; duration: number; type: 'inbound' | 'outbound'; carrier: string; driver: string; commodity: string; ref: string }[] = [
    { door: 'Door 1', time: '07:00', duration: 60,  type: 'inbound',  carrier: 'Midwest Express',      driver: 'Paul Simmons',   commodity: 'Auto Parts',        ref: 'MWX-20240201' },
    { door: 'Door 2', time: '08:00', duration: 90,  type: 'inbound',  carrier: 'Pacific Coast',         driver: 'Laura Tran',     commodity: 'Electronics',       ref: 'PCL-20240202' },
    { door: 'Door 3', time: '09:30', duration: 60,  type: 'outbound', carrier: 'Lone Star Logistics',   driver: 'Steve Hill',     commodity: 'Building Materials', ref: 'LSL-20240203' },
    { door: 'Door 4', time: '11:00', duration: 75,  type: 'inbound',  carrier: 'Great Lakes Freight',   driver: 'Nancy Adams',    commodity: 'Frozen Foods',      ref: 'GLF-20240204' },
    { door: 'Door 5', time: '14:00', duration: 60,  type: 'outbound', carrier: 'Coastal Refrigerated',  driver: 'Chris Baker',    commodity: 'Produce',           ref: 'CRF-20240205' },
  ];

  for (const t of tomorrowAppts) {
    apptValues.push(appt({
      dockDoor: door(t.door),
      scheduledDate: tomorrow,
      scheduledTime: t.time,
      durationMinutes: t.duration,
      status: 'scheduled',
      appointment_type: t.type,
      carrier_name: t.carrier,
      driver_name: t.driver,
      commodity: t.commodity,
      load_ref: t.ref,
    }));
  }

  const inserted = await db.insert(appointments).values(apptValues).returning();
  console.log(`Created ${inserted.length} appointments (${apptValues.filter(a => a.scheduled_date === today).length} today, 5 tomorrow)`);
  console.log('Seed complete!');

  client.close();
}

main().catch(console.error);
