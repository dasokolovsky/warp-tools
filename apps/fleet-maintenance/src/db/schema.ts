import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const VEHICLE_TYPES = ['tractor', 'trailer', 'straight_truck', 'van', 'reefer'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_STATUSES = ['active', 'out_of_service', 'in_shop', 'retired'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const SERVICE_TYPES = [
  'oil_change',
  'tire_rotation',
  'brake_inspection',
  'dot_annual',
  'transmission_service',
  'coolant_flush',
  'air_filter',
  'fuel_filter',
  'alignment',
  'pm_a',
  'pm_b',
  'pm_c',
  'custom',
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const WORK_ORDER_TYPES = ['preventive', 'repair', 'inspection', 'emergency', 'recall'] as const;
export type WorkOrderType = (typeof WORK_ORDER_TYPES)[number];

export const WORK_ORDER_STATUSES = ['open', 'in_progress', 'waiting_parts', 'completed', 'cancelled'] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const INSPECTION_TYPES = ['pre_trip', 'post_trip', 'en_route'] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

export const DVIR_STATUSES = ['no_defects', 'defects_noted', 'out_of_service'] as const;
export type DvirStatus = (typeof DVIR_STATUSES)[number];

export const PART_CATEGORIES = ['engine', 'brakes', 'tires', 'electrical', 'transmission', 'body', 'hvac', 'other'] as const;
export type PartCategory = (typeof PART_CATEGORIES)[number];

// ─── vehicles ─────────────────────────────────────────────────────────────────

export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  unit_number: text('unit_number').notNull().unique(),
  vin: text('vin'),
  year: integer('year'),
  make: text('make'),
  model: text('model'),
  type: text('type', { enum: VEHICLE_TYPES }),
  license_plate: text('license_plate'),
  state: text('state'),
  status: text('status', { enum: VEHICLE_STATUSES }).notNull().default('active'),
  current_mileage: integer('current_mileage').notNull().default(0),
  last_inspection_date: text('last_inspection_date'),
  next_inspection_due: text('next_inspection_due'),
  acquisition_date: text('acquisition_date'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

// ─── maintenance_schedules ────────────────────────────────────────────────────

export const maintenanceSchedules = sqliteTable('maintenance_schedules', {
  id: text('id').primaryKey(),
  vehicle_id: text('vehicle_id').notNull().references(() => vehicles.id),
  service_type: text('service_type', { enum: SERVICE_TYPES }).notNull(),
  interval_miles: integer('interval_miles'),
  interval_days: integer('interval_days'),
  last_completed_at: text('last_completed_at'),
  last_completed_miles: integer('last_completed_miles'),
  next_due_at: text('next_due_at'),
  next_due_miles: integer('next_due_miles'),
  priority: text('priority', { enum: PRIORITIES }).notNull().default('medium'),
  is_active: integer('is_active').notNull().default(1),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type NewMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert;

// ─── work_orders ──────────────────────────────────────────────────────────────

export const workOrders = sqliteTable('work_orders', {
  id: text('id').primaryKey(),
  vehicle_id: text('vehicle_id').notNull().references(() => vehicles.id),
  work_order_number: text('work_order_number').unique(),
  type: text('type', { enum: WORK_ORDER_TYPES }),
  status: text('status', { enum: WORK_ORDER_STATUSES }).notNull().default('open'),
  priority: text('priority', { enum: PRIORITIES }).notNull().default('medium'),
  title: text('title').notNull(),
  description: text('description'),
  assigned_to: text('assigned_to'),
  vendor: text('vendor'),
  parts_cost: real('parts_cost').notNull().default(0),
  labor_cost: real('labor_cost').notNull().default(0),
  total_cost: real('total_cost').notNull().default(0),
  started_at: text('started_at'),
  completed_at: text('completed_at'),
  mileage_at_service: integer('mileage_at_service'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;

// ─── dvir_reports ─────────────────────────────────────────────────────────────

export const dvirReports = sqliteTable('dvir_reports', {
  id: text('id').primaryKey(),
  vehicle_id: text('vehicle_id').notNull().references(() => vehicles.id),
  driver_name: text('driver_name').notNull(),
  inspection_type: text('inspection_type', { enum: INSPECTION_TYPES }).notNull().default('pre_trip'),
  date: text('date').notNull(),
  mileage: integer('mileage'),
  defects_found: integer('defects_found').notNull().default(0),
  status: text('status', { enum: DVIR_STATUSES }).notNull().default('no_defects'),
  defects_json: text('defects_json'),
  corrective_action: text('corrective_action'),
  reviewed_by: text('reviewed_by'),
  reviewed_at: text('reviewed_at'),
  created_at: text('created_at').notNull(),
});

export type DvirReport = typeof dvirReports.$inferSelect;
export type NewDvirReport = typeof dvirReports.$inferInsert;

// ─── parts_inventory ──────────────────────────────────────────────────────────

export const partsInventory = sqliteTable('parts_inventory', {
  id: text('id').primaryKey(),
  part_number: text('part_number'),
  name: text('name').notNull(),
  category: text('category', { enum: PART_CATEGORIES }),
  quantity_on_hand: integer('quantity_on_hand').notNull().default(0),
  minimum_stock: integer('minimum_stock').notNull().default(0),
  unit_cost: real('unit_cost').notNull().default(0),
  supplier: text('supplier'),
  location: text('location'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export type PartInventory = typeof partsInventory.$inferSelect;
export type NewPartInventory = typeof partsInventory.$inferInsert;
