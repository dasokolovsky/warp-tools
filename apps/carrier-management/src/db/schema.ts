import { sql } from 'drizzle-orm';
import {
  text,
  integer,
  real,
  sqliteTable,
} from 'drizzle-orm/sqlite-core';

// ─── Carriers ───────────────────────────────────────────────────────────────

export const carriers = sqliteTable('carriers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  mcNumber: text('mc_number'),
  dotNumber: text('dot_number'),
  scacCode: text('scac_code'),
  // Address stored as JSON string
  addressStreet: text('address_street'),
  addressCity: text('address_city'),
  addressState: text('address_state'),
  addressZip: text('address_zip'),
  addressCountry: text('address_country').default('US'),
  website: text('website'),
  // Equipment types stored as JSON array string
  equipmentTypes: text('equipment_types').default('[]'),
  // Service areas stored as JSON array string
  serviceAreas: text('service_areas').default('[]'),
  notes: text('notes'),
  // Tags stored as JSON array string
  tags: text('tags').default('[]'),
  status: text('status', { enum: ['active', 'inactive', 'blacklisted'] }).default('active').notNull(),
  overallScore: real('overall_score'),
  authorityStatus: text('authority_status', { enum: ['active', 'inactive', 'revoked', 'unknown'] }).default('unknown'),
  safetyRating: text('safety_rating', { enum: ['satisfactory', 'conditional', 'unsatisfactory', 'not_rated', 'unknown'] }).default('unknown'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Carrier Contacts ────────────────────────────────────────────────────────

export const carrierContacts = sqliteTable('carrier_contacts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  carrierId: text('carrier_id').notNull().references(() => carriers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role', { enum: ['dispatch', 'billing', 'operations', 'owner', 'sales', 'other'] }).default('other'),
  phone: text('phone'),
  email: text('email'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Carrier Insurance ───────────────────────────────────────────────────────

export const carrierInsurance = sqliteTable('carrier_insurance', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  carrierId: text('carrier_id').notNull().references(() => carriers.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['auto_liability', 'cargo', 'general_liability', 'workers_comp'] }).notNull(),
  provider: text('provider'),
  policyNumber: text('policy_number'),
  coverageAmount: real('coverage_amount'),
  effectiveDate: text('effective_date'),
  expiryDate: text('expiry_date').notNull(),
  documentUrl: text('document_url'),
  // Computed status: active, expiring_soon, expired
  status: text('status', { enum: ['active', 'expiring_soon', 'expired'] }).default('active'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Carrier Rates ───────────────────────────────────────────────────────────

export const carrierRates = sqliteTable('carrier_rates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  carrierId: text('carrier_id').notNull().references(() => carriers.id, { onDelete: 'cascade' }),
  originCity: text('origin_city'),
  originState: text('origin_state'),
  originZip: text('origin_zip'),
  destCity: text('dest_city'),
  destState: text('dest_state'),
  destZip: text('dest_zip'),
  equipmentType: text('equipment_type'),
  rateType: text('rate_type', { enum: ['per_mile', 'flat', 'per_cwt'] }).notNull().default('per_mile'),
  rateAmount: real('rate_amount').notNull(),
  effectiveDate: text('effective_date'),
  expiryDate: text('expiry_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Carrier Performance ─────────────────────────────────────────────────────

export const carrierPerformance = sqliteTable('carrier_performance', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  carrierId: text('carrier_id').notNull().references(() => carriers.id, { onDelete: 'cascade' }),
  shipmentRef: text('shipment_ref'),
  pickupOnTime: integer('pickup_on_time', { mode: 'boolean' }),
  deliveryOnTime: integer('delivery_on_time', { mode: 'boolean' }),
  damageReported: integer('damage_reported', { mode: 'boolean' }).default(false),
  claimFiled: integer('claim_filed', { mode: 'boolean' }).default(false),
  transitDays: integer('transit_days'),
  communicationScore: integer('communication_score'), // 1-5
  notes: text('notes'),
  recordedAt: text('recorded_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type Carrier = typeof carriers.$inferSelect;
export type NewCarrier = typeof carriers.$inferInsert;
export type CarrierContact = typeof carrierContacts.$inferSelect;
export type NewCarrierContact = typeof carrierContacts.$inferInsert;
export type CarrierInsurance = typeof carrierInsurance.$inferSelect;
export type NewCarrierInsurance = typeof carrierInsurance.$inferInsert;
export type CarrierRate = typeof carrierRates.$inferSelect;
export type NewCarrierRate = typeof carrierRates.$inferInsert;
export type CarrierPerformance = typeof carrierPerformance.$inferSelect;
export type NewCarrierPerformance = typeof carrierPerformance.$inferInsert;
