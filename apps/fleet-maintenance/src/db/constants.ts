// Client-safe constants — no drizzle imports
// Import these in 'use client' components instead of schema.ts

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
