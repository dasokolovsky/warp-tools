import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Enums (as const arrays for type safety) ────────────────────────────────

export const LOAD_STATUSES = [
  'new',
  'posted',
  'covered',
  'dispatched',
  'picked_up',
  'in_transit',
  'delivered',
  'invoiced',
  'closed',
  'cancelled',
] as const;
export type LoadStatus = (typeof LOAD_STATUSES)[number];

export const EQUIPMENT_TYPES = [
  'dry_van',
  'reefer',
  'flatbed',
  'step_deck',
  'lowboy',
  'tanker',
  'intermodal',
  'power_only',
  'other',
] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const RATE_TYPES = ['flat', 'per_mile'] as const;
export type RateType = (typeof RATE_TYPES)[number];

export const CHECK_CALL_STATUSES = [
  'scheduled',
  'at_pickup',
  'loading',
  'loaded',
  'in_transit',
  'at_delivery',
  'unloading',
  'delivered',
  'delayed',
  'issue',
] as const;
export type CheckCallStatus = (typeof CHECK_CALL_STATUSES)[number];

export const CONTACT_METHODS = ['phone', 'text', 'email', 'tracking', 'other'] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

// ─── Loads ───────────────────────────────────────────────────────────────────

export const loads = sqliteTable('loads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  load_number: text('load_number').notNull().unique(),

  // Customer
  customer_id: integer('customer_id'),
  customer_name: text('customer_name').notNull(),
  status: text('status', { enum: LOAD_STATUSES }).notNull().default('new'),

  // Origin
  origin_city: text('origin_city').notNull(),
  origin_state: text('origin_state').notNull(),
  origin_zip: text('origin_zip'),
  origin_address: text('origin_address'),
  origin_contact_name: text('origin_contact_name'),
  origin_contact_phone: text('origin_contact_phone'),
  pickup_date: text('pickup_date'),
  pickup_time_from: text('pickup_time_from'),
  pickup_time_to: text('pickup_time_to'),
  pickup_number: text('pickup_number'),

  // Destination
  dest_city: text('dest_city').notNull(),
  dest_state: text('dest_state').notNull(),
  dest_zip: text('dest_zip'),
  dest_address: text('dest_address'),
  dest_contact_name: text('dest_contact_name'),
  dest_contact_phone: text('dest_contact_phone'),
  delivery_date: text('delivery_date'),
  delivery_time_from: text('delivery_time_from'),
  delivery_time_to: text('delivery_time_to'),
  delivery_number: text('delivery_number'),

  // Freight
  equipment_type: text('equipment_type', { enum: EQUIPMENT_TYPES }).notNull().default('dry_van'),
  weight: integer('weight'),
  commodity: text('commodity'),
  temperature_min: real('temperature_min'),
  temperature_max: real('temperature_max'),
  dims_length: real('dims_length'),
  dims_width: real('dims_width'),
  dims_height: real('dims_height'),
  special_instructions: text('special_instructions'),

  // Carrier
  carrier_id: integer('carrier_id'),
  carrier_name: text('carrier_name'),
  carrier_contact: text('carrier_contact'),
  carrier_phone: text('carrier_phone'),
  carrier_email: text('carrier_email'),

  // Financials
  customer_rate: real('customer_rate'),
  carrier_rate: real('carrier_rate'),
  margin: real('margin'),
  margin_pct: real('margin_pct'),
  rate_type: text('rate_type', { enum: RATE_TYPES }).default('flat'),
  miles: integer('miles'),

  // References
  customer_ref: text('customer_ref'),
  bol_number: text('bol_number'),
  pro_number: text('pro_number'),

  // Status timestamps
  posted_at: text('posted_at'),
  covered_at: text('covered_at'),
  dispatched_at: text('dispatched_at'),
  picked_up_at: text('picked_up_at'),
  delivered_at: text('delivered_at'),
  invoiced_at: text('invoiced_at'),
  closed_at: text('closed_at'),
  cancelled_at: text('cancelled_at'),
  cancellation_reason: text('cancellation_reason'),

  // Meta
  notes: text('notes'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  created_by: text('created_by'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type Load = typeof loads.$inferSelect;
export type NewLoad = typeof loads.$inferInsert;

// ─── Check Calls ─────────────────────────────────────────────────────────────

export const checkCalls = sqliteTable('check_calls', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  load_id: integer('load_id')
    .notNull()
    .references(() => loads.id, { onDelete: 'cascade' }),
  status: text('status', { enum: CHECK_CALL_STATUSES }).notNull(),
  location_city: text('location_city'),
  location_state: text('location_state'),
  eta: text('eta'),
  notes: text('notes'),
  contact_method: text('contact_method', { enum: CONTACT_METHODS }).default('phone'),
  called_by: text('called_by'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export type CheckCall = typeof checkCalls.$inferSelect;
export type NewCheckCall = typeof checkCalls.$inferInsert;

// ─── Load Templates ──────────────────────────────────────────────────────────

export const loadTemplates = sqliteTable('load_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  customer_id: integer('customer_id'),
  customer_name: text('customer_name'),
  origin_city: text('origin_city'),
  origin_state: text('origin_state'),
  dest_city: text('dest_city'),
  dest_state: text('dest_state'),
  equipment_type: text('equipment_type', { enum: EQUIPMENT_TYPES }).default('dry_van'),
  weight: integer('weight'),
  commodity: text('commodity'),
  customer_rate: real('customer_rate'),
  special_instructions: text('special_instructions'),
  use_count: integer('use_count').notNull().default(0),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export type LoadTemplate = typeof loadTemplates.$inferSelect;
export type NewLoadTemplate = typeof loadTemplates.$inferInsert;
