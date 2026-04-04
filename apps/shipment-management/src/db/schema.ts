import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core';

// ─── Enums (as string union types) ─────────────────────────────────────────────

export type ShipmentStatus =
  | 'quote'
  | 'booked'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'invoiced'
  | 'paid'
  | 'closed'
  | 'cancelled'
  | 'claim';

export type EquipmentType =
  | 'dry_van'
  | 'reefer'
  | 'flatbed'
  | 'step_deck'
  | 'lowboy'
  | 'sprinter_van'
  | 'cargo_van'
  | 'power_only';

export type RateType = 'flat' | 'per_mile';

export type EventType =
  | 'status_change'
  | 'note'
  | 'check_call'
  | 'document'
  | 'invoice'
  | 'payment'
  | 'carrier_assign';

export type DocType =
  | 'bol'
  | 'pod'
  | 'rate_confirmation'
  | 'invoice'
  | 'insurance_cert'
  | 'other';

export type CheckCallStatus =
  | 'scheduled'
  | 'at_pickup'
  | 'loading'
  | 'in_transit'
  | 'at_delivery'
  | 'delivered'
  | 'delayed'
  | 'issue';

export type ContactMethod = 'phone' | 'text' | 'email' | 'tracking';

// ─── Shipments ────────────────────────────────────────────────────────────────

export const shipments = sqliteTable('shipments', {
  id: text('id').primaryKey(),
  shipmentNumber: text('shipment_number').notNull().unique(),
  status: text('status').$type<ShipmentStatus>().notNull().default('quote'),

  // Customer
  customerId: text('customer_id'),
  customerName: text('customer_name').notNull(),

  // Route
  originCity: text('origin_city').notNull(),
  originState: text('origin_state').notNull(),
  originZip: text('origin_zip'),
  destCity: text('dest_city').notNull(),
  destState: text('dest_state').notNull(),
  destZip: text('dest_zip'),
  equipmentType: text('equipment_type').$type<EquipmentType>().notNull().default('dry_van'),
  pickupDate: text('pickup_date'),
  deliveryDate: text('delivery_date'),

  // Carrier
  carrierId: text('carrier_id'),
  carrierName: text('carrier_name'),
  carrierContact: text('carrier_contact'),
  carrierPhone: text('carrier_phone'),

  // Financials
  customerRate: real('customer_rate'),
  carrierRate: real('carrier_rate'),
  margin: real('margin'),
  marginPct: real('margin_pct'),
  rateType: text('rate_type').$type<RateType>().default('flat'),
  miles: integer('miles'),

  // References
  loadRef: text('load_ref'),
  invoiceRef: text('invoice_ref'),
  carrierPaymentRef: text('carrier_payment_ref'),

  // Documents
  hasBol: integer('has_bol', { mode: 'boolean' }).default(false),
  hasPod: integer('has_pod', { mode: 'boolean' }).default(false),
  hasRateCon: integer('has_rate_con', { mode: 'boolean' }).default(false),
  hasInvoice: integer('has_invoice', { mode: 'boolean' }).default(false),
  docScore: integer('doc_score').default(0),

  // Performance
  pickupOnTime: integer('pickup_on_time', { mode: 'boolean' }),
  deliveryOnTime: integer('delivery_on_time', { mode: 'boolean' }),
  healthScore: integer('health_score').default(50),

  // Timestamps
  quotedAt: text('quoted_at'),
  bookedAt: text('booked_at'),
  dispatchedAt: text('dispatched_at'),
  pickedUpAt: text('picked_up_at'),
  deliveredAt: text('delivered_at'),
  invoicedAt: text('invoiced_at'),
  paidAt: text('paid_at'),
  closedAt: text('closed_at'),
  cancelledAt: text('cancelled_at'),
  cancellationReason: text('cancellation_reason'),

  // Meta
  commodity: text('commodity'),
  weight: integer('weight'),
  specialInstructions: text('special_instructions'),
  notes: text('notes'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Shipment Events ──────────────────────────────────────────────────────────

export const shipmentEvents = sqliteTable('shipment_events', {
  id: text('id').primaryKey(),
  shipmentId: text('shipment_id')
    .notNull()
    .references(() => shipments.id, { onDelete: 'cascade' }),
  eventType: text('event_type').$type<EventType>().notNull(),
  description: text('description').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Shipment Documents ───────────────────────────────────────────────────────

export const shipmentDocuments = sqliteTable('shipment_documents', {
  id: text('id').primaryKey(),
  shipmentId: text('shipment_id')
    .notNull()
    .references(() => shipments.id, { onDelete: 'cascade' }),
  docType: text('doc_type').$type<DocType>().notNull(),
  filename: text('filename').notNull(),
  docRef: text('doc_ref'),
  uploadedAt: text('uploaded_at').notNull().default(sql`(datetime('now'))`),
  notes: text('notes'),
});

// ─── Check Calls ──────────────────────────────────────────────────────────────

export const checkCalls = sqliteTable('check_calls', {
  id: text('id').primaryKey(),
  shipmentId: text('shipment_id')
    .notNull()
    .references(() => shipments.id, { onDelete: 'cascade' }),
  status: text('status').$type<CheckCallStatus>().notNull(),
  locationCity: text('location_city'),
  locationState: text('location_state'),
  eta: text('eta'),
  notes: text('notes'),
  contactMethod: text('contact_method').$type<ContactMethod>().default('phone'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;
export type ShipmentEvent = typeof shipmentEvents.$inferSelect;
export type NewShipmentEvent = typeof shipmentEvents.$inferInsert;
export type ShipmentDocument = typeof shipmentDocuments.$inferSelect;
export type NewShipmentDocument = typeof shipmentDocuments.$inferInsert;
export type CheckCall = typeof checkCalls.$inferSelect;
export type NewCheckCall = typeof checkCalls.$inferInsert;
