import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DOOR_TYPES = ['inbound', 'outbound', 'both'] as const;
export type DoorType = (typeof DOOR_TYPES)[number];

export const DOOR_STATUSES = ['active', 'inactive', 'maintenance'] as const;
export type DoorStatus = (typeof DOOR_STATUSES)[number];

export const APPOINTMENT_TYPES = ['inbound', 'outbound'] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'checked_in',
  'in_progress',
  'completed',
  'no_show',
  'cancelled',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

// ─── facilities ───────────────────────────────────────────────────────────────

export const facilities = sqliteTable('facilities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address_street: text('address_street').notNull(),
  address_city: text('address_city').notNull(),
  address_state: text('address_state').notNull(),
  address_zip: text('address_zip').notNull(),
  operating_hours_start: text('operating_hours_start').notNull().default('06:00'),
  operating_hours_end: text('operating_hours_end').notNull().default('18:00'),
  timezone: text('timezone').notNull().default('America/Chicago'),
  buffer_minutes: integer('buffer_minutes').notNull().default(30),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type Facility = typeof facilities.$inferSelect;
export type NewFacility = typeof facilities.$inferInsert;

// ─── dock_doors ───────────────────────────────────────────────────────────────

export const dockDoors = sqliteTable('dock_doors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  facility_id: integer('facility_id')
    .notNull()
    .references(() => facilities.id),
  name: text('name').notNull(),
  door_type: text('door_type', { enum: DOOR_TYPES }).notNull(),
  operating_hours_start: text('operating_hours_start'),
  operating_hours_end: text('operating_hours_end'),
  status: text('status', { enum: DOOR_STATUSES }).notNull().default('active'),
  sort_order: integer('sort_order').notNull().default(0),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export type DockDoor = typeof dockDoors.$inferSelect;
export type NewDockDoor = typeof dockDoors.$inferInsert;

// ─── appointments ─────────────────────────────────────────────────────────────

export const appointments = sqliteTable('appointments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  facility_id: integer('facility_id')
    .notNull()
    .references(() => facilities.id),
  dock_door_id: integer('dock_door_id')
    .notNull()
    .references(() => dockDoors.id),

  // Schedule
  appointment_type: text('appointment_type', { enum: APPOINTMENT_TYPES }).notNull(),
  scheduled_date: text('scheduled_date').notNull(), // YYYY-MM-DD
  scheduled_time: text('scheduled_time').notNull(), // HH:MM
  duration_minutes: integer('duration_minutes').notNull().default(60),
  end_time: text('end_time'), // HH:MM computed

  // Status
  status: text('status', { enum: APPOINTMENT_STATUSES }).notNull().default('scheduled'),

  // Carrier / driver info
  carrier_id: integer('carrier_id'),
  carrier_name: text('carrier_name'),
  driver_name: text('driver_name'),
  truck_number: text('truck_number'),
  trailer_number: text('trailer_number'),
  driver_phone: text('driver_phone'),

  // Load refs
  load_ref: text('load_ref'),
  po_number: text('po_number'),
  commodity: text('commodity'),
  special_instructions: text('special_instructions'),

  // Timestamps
  checked_in_at: text('checked_in_at'),
  in_progress_at: text('in_progress_at'),
  completed_at: text('completed_at'),
  cancelled_at: text('cancelled_at'),
  cancellation_reason: text('cancellation_reason'),

  // Dwell metrics
  wait_minutes: real('wait_minutes'),
  dock_minutes: real('dock_minutes'),
  total_dwell_minutes: real('total_dwell_minutes'),

  // Misc
  notes: text('notes'),
  created_by: text('created_by'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
