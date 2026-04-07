import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import path from 'path';
import {
  vehicles,
  maintenanceSchedules,
  workOrders,
  dvirReports,
  partsInventory,
  type NewWorkOrder,
  type NewDvirReport,
} from './schema';

const DB_PATH = path.join(process.cwd(), 'fleet-maintenance.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

function id(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function woNum(n: number): string {
  return `WO-2604-${String(n).padStart(4, '0')}`;
}

const now = new Date().toISOString();
const d = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

async function main() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });
  console.log('Migrations done.');

  // Clear existing data
  await db.delete(dvirReports);
  await db.delete(workOrders);
  await db.delete(maintenanceSchedules);
  await db.delete(partsInventory);
  await db.delete(vehicles);
  console.log('Cleared old data.');

  // ─── Vehicles ────────────────────────────────────────────────────────────────
  const vehicleIds = Array.from({ length: 8 }, () => id());
  const [v1, v2, v3, v4, v5, v6, v7, v8] = vehicleIds;

  await db.insert(vehicles).values([
    {
      id: v1,
      unit_number: 'T-101',
      vin: '1FUJGBDV5CLBP8765',
      year: 2022,
      make: 'Freightliner',
      model: 'Cascadia',
      type: 'tractor',
      license_plate: 'TXA1234',
      state: 'TX',
      status: 'active',
      current_mileage: 487_320,
      last_inspection_date: d(-90),
      next_inspection_due: d(275),
      acquisition_date: '2022-03-15',
      notes: 'Primary OTR tractor. Assigned to lane TX-CA.',
      created_at: now,
      updated_at: now,
    },
    {
      id: v2,
      unit_number: 'T-102',
      vin: '2NKHHM6X2KM229877',
      year: 2021,
      make: 'Kenworth',
      model: 'T680',
      type: 'tractor',
      license_plate: 'TXB5678',
      state: 'TX',
      status: 'active',
      current_mileage: 612_450,
      last_inspection_date: d(-45),
      next_inspection_due: d(320),
      acquisition_date: '2021-07-20',
      notes: 'Regional haul unit. Aerodynamic package installed.',
      created_at: now,
      updated_at: now,
    },
    {
      id: v3,
      unit_number: 'T-103',
      vin: '1XPBDR9X5ND783290',
      year: 2023,
      make: 'Peterbilt',
      model: '579',
      type: 'tractor',
      license_plate: 'TXC9012',
      state: 'TX',
      status: 'in_shop',
      current_mileage: 145_200,
      last_inspection_date: d(-30),
      next_inspection_due: d(335),
      acquisition_date: '2023-01-10',
      notes: 'In for transmission rebuild. ETA 5 days.',
      created_at: now,
      updated_at: now,
    },
    {
      id: v4,
      unit_number: 'T-104',
      vin: '4V4NC9EH1MN303442',
      year: 2020,
      make: 'Volvo',
      model: 'VNL 860',
      type: 'tractor',
      license_plate: 'TXD3456',
      state: 'TX',
      status: 'active',
      current_mileage: 788_100,
      last_inspection_date: d(-120),
      next_inspection_due: d(245),
      acquisition_date: '2020-09-05',
      notes: 'High mileage unit. Monitor closely for upcoming engine overhaul.',
      created_at: now,
      updated_at: now,
    },
    {
      id: v5,
      unit_number: 'T-105',
      vin: '3HSDJAPR4DN683155',
      year: 2022,
      make: 'International',
      model: 'LT',
      type: 'tractor',
      license_plate: 'TXE7890',
      state: 'TX',
      status: 'active',
      current_mileage: 324_560,
      last_inspection_date: d(-60),
      next_inspection_due: d(305),
      acquisition_date: '2022-06-01',
      created_at: now,
      updated_at: now,
    },
    {
      id: v6,
      unit_number: 'T-106',
      vin: '1M1AN07Y1CM008439',
      year: 2021,
      make: 'Mack',
      model: 'Anthem',
      type: 'tractor',
      license_plate: 'TXF1122',
      state: 'TX',
      status: 'out_of_service',
      current_mileage: 521_900,
      last_inspection_date: d(-180),
      next_inspection_due: d(-15),
      acquisition_date: '2021-02-14',
      notes: 'Out of service — failed DOT roadside inspection. Brake issue.',
      created_at: now,
      updated_at: now,
    },
    {
      id: v7,
      unit_number: 'T-107',
      vin: '5KJJAED10PPKG7702',
      year: 2023,
      make: 'Western Star',
      model: '5700',
      type: 'tractor',
      license_plate: 'TXG3344',
      state: 'TX',
      status: 'active',
      current_mileage: 98_400,
      last_inspection_date: d(-15),
      next_inspection_due: d(350),
      acquisition_date: '2023-05-22',
      notes: 'Newest unit. Spec\'d for heavy haul.',
      created_at: now,
      updated_at: now,
    },
    {
      id: v8,
      unit_number: 'TL-201',
      vin: '1GRAA06248B701234',
      year: 2019,
      make: 'Great Dane',
      model: '53\' Dry Van',
      type: 'trailer',
      license_plate: 'TXH5566',
      state: 'TX',
      status: 'active',
      current_mileage: 0,
      last_inspection_date: d(-60),
      next_inspection_due: d(305),
      acquisition_date: '2019-11-30',
      notes: 'Dry van trailer. Tire rotation due.',
      created_at: now,
      updated_at: now,
    },
  ]);

  console.log('✓ Vehicles seeded (8)');

  // ─── Maintenance Schedules ────────────────────────────────────────────────────
  await db.insert(maintenanceSchedules).values([
    // T-101
    { id: id(), vehicle_id: v1, service_type: 'oil_change', interval_miles: 15000, interval_days: 90, last_completed_at: d(-45), last_completed_miles: 475000, next_due_at: d(45), next_due_miles: 490000, priority: 'high', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v1, service_type: 'dot_annual', interval_days: 365, last_completed_at: d(-90), next_due_at: d(275), priority: 'critical', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v1, service_type: 'tire_rotation', interval_miles: 50000, last_completed_miles: 450000, next_due_miles: 500000, priority: 'medium', is_active: 1, created_at: now, updated_at: now },

    // T-102
    { id: id(), vehicle_id: v2, service_type: 'oil_change', interval_miles: 15000, interval_days: 90, last_completed_at: d(-20), last_completed_miles: 600000, next_due_at: d(70), next_due_miles: 615000, priority: 'high', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v2, service_type: 'brake_inspection', interval_miles: 50000, last_completed_miles: 580000, next_due_miles: 630000, priority: 'critical', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v2, service_type: 'pm_a', interval_miles: 25000, interval_days: 90, last_completed_at: d(-60), last_completed_miles: 595000, next_due_at: d(30), next_due_miles: 620000, priority: 'medium', is_active: 1, created_at: now, updated_at: now },

    // T-103
    { id: id(), vehicle_id: v3, service_type: 'transmission_service', interval_miles: 150000, last_completed_miles: 0, next_due_miles: 150000, priority: 'critical', is_active: 1, notes: 'Currently in shop for rebuild', created_at: now, updated_at: now },
    { id: id(), vehicle_id: v3, service_type: 'oil_change', interval_miles: 15000, interval_days: 90, last_completed_at: d(-30), last_completed_miles: 138000, next_due_at: d(60), next_due_miles: 153000, priority: 'high', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v3, service_type: 'dot_annual', interval_days: 365, last_completed_at: d(-30), next_due_at: d(335), priority: 'critical', is_active: 1, created_at: now, updated_at: now },

    // T-104
    { id: id(), vehicle_id: v4, service_type: 'oil_change', interval_miles: 15000, interval_days: 90, last_completed_at: d(-80), last_completed_miles: 775000, next_due_at: d(10), next_due_miles: 790000, priority: 'high', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v4, service_type: 'coolant_flush', interval_miles: 250000, last_completed_miles: 600000, next_due_miles: 850000, priority: 'medium', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v4, service_type: 'brake_inspection', interval_miles: 50000, last_completed_miles: 750000, next_due_miles: 800000, priority: 'critical', is_active: 1, created_at: now, updated_at: now },

    // T-105
    { id: id(), vehicle_id: v5, service_type: 'oil_change', interval_miles: 15000, interval_days: 90, last_completed_at: d(-60), last_completed_miles: 315000, next_due_at: d(30), next_due_miles: 330000, priority: 'high', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v5, service_type: 'air_filter', interval_miles: 60000, last_completed_miles: 280000, next_due_miles: 340000, priority: 'low', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v5, service_type: 'dot_annual', interval_days: 365, last_completed_at: d(-60), next_due_at: d(305), priority: 'critical', is_active: 1, created_at: now, updated_at: now },

    // T-106
    { id: id(), vehicle_id: v6, service_type: 'brake_inspection', interval_miles: 50000, last_completed_miles: 480000, next_due_miles: 530000, priority: 'critical', is_active: 1, notes: 'FAILED roadside inspection — immediate repair required', created_at: now, updated_at: now },
    { id: id(), vehicle_id: v6, service_type: 'dot_annual', interval_days: 365, last_completed_at: d(-180), next_due_at: d(-15), priority: 'critical', is_active: 1, notes: 'OVERDUE — schedule immediately', created_at: now, updated_at: now },
    { id: id(), vehicle_id: v6, service_type: 'oil_change', interval_miles: 15000, interval_days: 90, last_completed_at: d(-100), last_completed_miles: 510000, next_due_at: d(-10), next_due_miles: 525000, priority: 'high', is_active: 1, created_at: now, updated_at: now },

    // T-107
    { id: id(), vehicle_id: v7, service_type: 'oil_change', interval_miles: 15000, interval_days: 90, last_completed_at: d(-15), last_completed_miles: 90000, next_due_at: d(75), next_due_miles: 105000, priority: 'high', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v7, service_type: 'pm_a', interval_miles: 25000, interval_days: 90, last_completed_at: d(-15), last_completed_miles: 85000, next_due_at: d(75), next_due_miles: 110000, priority: 'medium', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v7, service_type: 'dot_annual', interval_days: 365, last_completed_at: d(-15), next_due_at: d(350), priority: 'critical', is_active: 1, created_at: now, updated_at: now },

    // TL-201
    { id: id(), vehicle_id: v8, service_type: 'tire_rotation', interval_miles: 50000, priority: 'medium', is_active: 1, notes: 'Check trailer tires for wear', created_at: now, updated_at: now },
    { id: id(), vehicle_id: v8, service_type: 'brake_inspection', interval_days: 180, last_completed_at: d(-60), next_due_at: d(120), priority: 'high', is_active: 1, created_at: now, updated_at: now },
    { id: id(), vehicle_id: v8, service_type: 'dot_annual', interval_days: 365, last_completed_at: d(-60), next_due_at: d(305), priority: 'critical', is_active: 1, created_at: now, updated_at: now },
  ]);

  console.log('✓ Maintenance schedules seeded (24)');

  // ─── Work Orders ─────────────────────────────────────────────────────────────
  const woIds = Array.from({ length: 12 }, () => id());
  const [w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12] = woIds;

  const woRows: NewWorkOrder[] = [
    // Open (3)
    {
      id: w1, vehicle_id: v1, work_order_number: woNum(1), type: 'preventive', status: 'open', priority: 'high',
      title: 'Oil Change & Filter Replacement', description: 'Scheduled PM — 15k mile oil change. Replace engine oil filter and fuel filter.',
      assigned_to: 'Mike Torres', parts_cost: 145.00, labor_cost: 120.00, total_cost: 265.00,
      notes: 'Use Rotella T6 15W-40', created_at: now, updated_at: now,
    },
    {
      id: w2, vehicle_id: v4, work_order_number: woNum(2), type: 'inspection', status: 'open', priority: 'critical',
      title: 'DOT Annual Inspection — OVERDUE', description: 'Annual DOT inspection overdue by 15 days. Schedule immediately.',
      assigned_to: 'State Certified Shop', parts_cost: 0, labor_cost: 350.00, total_cost: 350.00,
      created_at: now, updated_at: now,
    },
    {
      id: w3, vehicle_id: v6, work_order_number: woNum(3), type: 'repair', status: 'open', priority: 'critical',
      title: 'Brake Repair — Roadside Failure', description: 'Vehicle failed roadside inspection for brake adjustment. S-cam brake issue on drive axle.',
      assigned_to: 'FleetServ Shop', parts_cost: 380.00, labor_cost: 280.00, total_cost: 660.00,
      created_at: now, updated_at: now,
    },
    // In Progress (2)
    {
      id: w4, vehicle_id: v3, work_order_number: woNum(4), type: 'repair', status: 'in_progress', priority: 'critical',
      title: 'Transmission Rebuild', description: 'Full transmission rebuild on T-103. Syncros worn, 3rd gear slipping.',
      assigned_to: 'Dallas Truck & Diesel', vendor: 'Peterbilt Dallas', parts_cost: 4200.00, labor_cost: 2800.00, total_cost: 7000.00,
      started_at: d(-3), mileage_at_service: 145200,
      notes: 'ETA 2 more days. Parts ordered.', created_at: now, updated_at: now,
    },
    {
      id: w5, vehicle_id: v2, work_order_number: woNum(5), type: 'preventive', status: 'in_progress', priority: 'high',
      title: 'PM-A Service', description: 'Full PM-A service: oil, filters, belts, hoses, lights, fluid check.',
      assigned_to: 'Shop Bay 2', parts_cost: 320.00, labor_cost: 180.00, total_cost: 500.00,
      started_at: d(-1), mileage_at_service: 612450,
      created_at: now, updated_at: now,
    },
    // Waiting Parts (1)
    {
      id: w6, vehicle_id: v4, work_order_number: woNum(6), type: 'repair', status: 'waiting_parts', priority: 'medium',
      title: 'EGR Cooler Replacement', description: 'EGR cooler leaking coolant. Part on order from Volvo dealer.',
      assigned_to: 'Shop Bay 1', vendor: 'Volvo Trucks North America', parts_cost: 890.00, labor_cost: 420.00, total_cost: 1310.00,
      started_at: d(-5),
      notes: 'Part expected in 2 days. Backordered at dealer.', created_at: now, updated_at: now,
    },
    // Completed (5)
    {
      id: w7, vehicle_id: v1, work_order_number: woNum(7), type: 'preventive', status: 'completed', priority: 'high',
      title: 'Oil Change', description: 'Routine 15k mile oil change.',
      assigned_to: 'Mike Torres', parts_cost: 140.00, labor_cost: 100.00, total_cost: 240.00,
      started_at: d(-50), completed_at: d(-45), mileage_at_service: 475000,
      created_at: d(-50) + 'T00:00:00Z', updated_at: now,
    },
    {
      id: w8, vehicle_id: v2, work_order_number: woNum(8), type: 'repair', status: 'completed', priority: 'medium',
      title: 'Headlight Assembly Replacement', description: 'Driver side headlight assembly cracked. Replaced full assembly.',
      assigned_to: 'Shop Bay 3', parts_cost: 320.00, labor_cost: 90.00, total_cost: 410.00,
      started_at: d(-30), completed_at: d(-29), mileage_at_service: 608200,
      created_at: d(-30) + 'T00:00:00Z', updated_at: now,
    },
    {
      id: w9, vehicle_id: v5, work_order_number: woNum(9), type: 'preventive', status: 'completed', priority: 'medium',
      title: 'Tire Rotation & Alignment', description: '4-wheel alignment and full tire rotation. Steer tires showing even wear.',
      assigned_to: 'TireHub Dallas', vendor: 'TireHub', parts_cost: 60.00, labor_cost: 280.00, total_cost: 340.00,
      started_at: d(-60), completed_at: d(-60), mileage_at_service: 322000,
      created_at: d(-60) + 'T00:00:00Z', updated_at: now,
    },
    {
      id: w10, vehicle_id: v7, work_order_number: woNum(10), type: 'inspection', status: 'completed', priority: 'critical',
      title: 'DOT Annual Inspection', description: 'Annual DOT inspection. Passed with no violations.',
      assigned_to: 'Certified Inspection Center', vendor: 'TX DOT Certified', parts_cost: 0, labor_cost: 350.00, total_cost: 350.00,
      started_at: d(-15), completed_at: d(-15), mileage_at_service: 97500,
      created_at: d(-15) + 'T00:00:00Z', updated_at: now,
    },
    {
      id: w11, vehicle_id: v8, work_order_number: woNum(11), type: 'repair', status: 'completed', priority: 'low',
      title: 'Trailer Door Seal Replacement', description: 'Rear door seals deteriorated. Replaced both upper and lower seals.',
      assigned_to: 'Shop Bay 4', parts_cost: 85.00, labor_cost: 120.00, total_cost: 205.00,
      started_at: d(-45), completed_at: d(-44), mileage_at_service: 0,
      created_at: d(-45) + 'T00:00:00Z', updated_at: now,
    },
    // Cancelled (1)
    {
      id: w12, vehicle_id: v5, work_order_number: woNum(12), type: 'repair', status: 'cancelled', priority: 'low',
      title: 'Mirror Heater Repair', description: 'Passenger mirror heater not working. Issue resolved itself — voltage was intermittent.',
      parts_cost: 0, labor_cost: 0, total_cost: 0,
      notes: 'Cancelled — self-resolved', created_at: now, updated_at: now,
    },
  ];
  await db.insert(workOrders).values(woRows);

  console.log('✓ Work orders seeded (12)');

  // ─── DVIR Reports ─────────────────────────────────────────────────────────────
  const dvirData: NewDvirReport[] = [
    // no_defects (10)
    { id: id(), vehicle_id: v1, driver_name: 'Carlos Rivera', inspection_type: 'pre_trip', date: d(0), mileage: 487320, defects_found: 0, status: 'no_defects', created_at: now },
    { id: id(), vehicle_id: v2, driver_name: 'James Patterson', inspection_type: 'pre_trip', date: d(-1), mileage: 612100, defects_found: 0, status: 'no_defects', created_at: now },
    { id: id(), vehicle_id: v1, driver_name: 'Carlos Rivera', inspection_type: 'post_trip', date: d(-1), mileage: 487000, defects_found: 0, status: 'no_defects', created_at: now },
    { id: id(), vehicle_id: v5, driver_name: 'Angela Kim', inspection_type: 'pre_trip', date: d(-2), mileage: 324200, defects_found: 0, status: 'no_defects', created_at: now },
    { id: id(), vehicle_id: v7, driver_name: 'Dwayne Jackson', inspection_type: 'pre_trip', date: d(-2), mileage: 98100, defects_found: 0, status: 'no_defects', created_at: now },
    { id: id(), vehicle_id: v4, driver_name: 'Maria Santos', inspection_type: 'pre_trip', date: d(-3), mileage: 787900, defects_found: 0, status: 'no_defects', created_at: now },
    { id: id(), vehicle_id: v8, driver_name: 'Carlos Rivera', inspection_type: 'pre_trip', date: d(-4), mileage: 0, defects_found: 0, status: 'no_defects', created_at: now },
    { id: id(), vehicle_id: v2, driver_name: 'James Patterson', inspection_type: 'post_trip', date: d(-5), mileage: 611800, defects_found: 0, status: 'no_defects', created_at: now },
    { id: id(), vehicle_id: v5, driver_name: 'Angela Kim', inspection_type: 'post_trip', date: d(-7), mileage: 323800, defects_found: 0, status: 'no_defects', created_at: now },
    { id: id(), vehicle_id: v7, driver_name: 'Dwayne Jackson', inspection_type: 'en_route', date: d(-10), mileage: 97000, defects_found: 0, status: 'no_defects', created_at: now },

    // defects_noted (3)
    {
      id: id(), vehicle_id: v4, driver_name: 'Maria Santos', inspection_type: 'pre_trip', date: d(-14), mileage: 787000, defects_found: 2, status: 'defects_noted',
      defects_json: JSON.stringify([
        { area: 'lights', description: 'Left marker light out', severity: 'minor', corrected: true },
        { area: 'body', description: 'Minor dent on passenger door', severity: 'minor', corrected: false },
      ]),
      corrective_action: 'Marker light replaced by driver. Door dent noted for body shop.',
      created_at: now,
    },
    {
      id: id(), vehicle_id: v8, driver_name: 'Carlos Rivera', inspection_type: 'pre_trip', date: d(-20), mileage: 0, defects_found: 1, status: 'defects_noted',
      defects_json: JSON.stringify([
        { area: 'body', description: 'Rear door seal partially detached', severity: 'minor', corrected: false },
      ]),
      corrective_action: 'WO created for seal replacement.',
      created_at: now,
    },
    {
      id: id(), vehicle_id: v1, driver_name: 'Carlos Rivera', inspection_type: 'post_trip', date: d(-21), mileage: 485000, defects_found: 1, status: 'defects_noted',
      defects_json: JSON.stringify([
        { area: 'tires', description: 'Low air pressure on left rear steer tire', severity: 'minor', corrected: true },
      ]),
      corrective_action: 'Inflated to 110 PSI.',
      created_at: now,
    },

    // out_of_service (2)
    {
      id: id(), vehicle_id: v6, driver_name: 'Robert Diaz', inspection_type: 'en_route', date: d(-5), mileage: 521900, defects_found: 2, status: 'out_of_service',
      defects_json: JSON.stringify([
        { area: 'brakes', description: 'Drive axle S-cam brake out of adjustment', severity: 'out_of_service', corrected: false },
        { area: 'brakes', description: 'Brake fade noticed during descent', severity: 'major', corrected: false },
      ]),
      corrective_action: 'Vehicle placed out of service. WO created. Towed to FleetServ Shop.',
      reviewed_by: 'Fleet Manager',
      reviewed_at: d(-4),
      created_at: now,
    },
    {
      id: id(), vehicle_id: v3, driver_name: 'Angela Kim', inspection_type: 'pre_trip', date: d(-8), mileage: 145100, defects_found: 1, status: 'out_of_service',
      defects_json: JSON.stringify([
        { area: 'engine', description: 'Transmission slipping badly, unable to get into 3rd gear', severity: 'out_of_service', corrected: false },
      ]),
      corrective_action: 'Vehicle taken out of service and dispatched to Peterbilt dealer for rebuild.',
      reviewed_by: 'Fleet Manager',
      reviewed_at: d(-7),
      created_at: now,
    },
  ];

  await db.insert(dvirReports).values(dvirData);
  console.log('✓ DVIR reports seeded (15)');

  // ─── Parts Inventory ─────────────────────────────────────────────────────────
  await db.insert(partsInventory).values([
    { id: id(), part_number: 'PF454', name: 'Engine Oil Filter', category: 'engine', quantity_on_hand: 24, minimum_stock: 10, unit_cost: 14.99, supplier: 'FleetPride', location: 'Shelf A-1', created_at: now, updated_at: now },
    { id: id(), part_number: 'FF5786', name: 'Fuel Filter Primary', category: 'engine', quantity_on_hand: 8, minimum_stock: 6, unit_cost: 22.50, supplier: 'FleetPride', location: 'Shelf A-2', created_at: now, updated_at: now },
    { id: id(), part_number: 'FF5782', name: 'Fuel Filter Secondary', category: 'engine', quantity_on_hand: 6, minimum_stock: 6, unit_cost: 18.75, supplier: 'FleetPride', location: 'Shelf A-3', notes: 'At minimum stock — reorder', created_at: now, updated_at: now },
    { id: id(), part_number: 'BA-S180', name: 'S-Cam Brake Shoe Set', category: 'brakes', quantity_on_hand: 4, minimum_stock: 8, unit_cost: 185.00, supplier: 'Meritor', location: 'Shelf B-1', notes: 'LOW STOCK — order immediately', created_at: now, updated_at: now },
    { id: id(), part_number: 'BR-ADJ01', name: 'Brake Adjustment Cans (pair)', category: 'brakes', quantity_on_hand: 12, minimum_stock: 6, unit_cost: 28.50, supplier: 'Bendix', location: 'Shelf B-2', created_at: now, updated_at: now },
    { id: id(), part_number: 'TR-295R', name: 'Steer Tire 295/75R22.5', category: 'tires', quantity_on_hand: 2, minimum_stock: 4, unit_cost: 485.00, supplier: 'Michelin Tire Center', location: 'Rack T-1', notes: 'LOW STOCK', created_at: now, updated_at: now },
    { id: id(), part_number: 'TR-275D', name: 'Drive Tire 275/70R22.5', category: 'tires', quantity_on_hand: 6, minimum_stock: 4, unit_cost: 420.00, supplier: 'Michelin Tire Center', location: 'Rack T-2', created_at: now, updated_at: now },
    { id: id(), part_number: 'ELC-BLB', name: 'LED Marker Light Bulb (10-pack)', category: 'electrical', quantity_on_hand: 5, minimum_stock: 3, unit_cost: 32.00, supplier: 'GreatLakes Electric', location: 'Shelf C-1', created_at: now, updated_at: now },
    { id: id(), part_number: 'ELC-HLT', name: 'Headlight Assembly - Driver Side', category: 'electrical', quantity_on_hand: 1, minimum_stock: 1, unit_cost: 395.00, supplier: 'Freightliner Parts', location: 'Shelf C-2', created_at: now, updated_at: now },
    { id: id(), part_number: 'TR-FLD10', name: 'Transmission Fluid (gallon)', category: 'transmission', quantity_on_hand: 10, minimum_stock: 5, unit_cost: 28.99, supplier: 'Eaton', location: 'Shelf D-1', created_at: now, updated_at: now },
    { id: id(), part_number: 'TR-FILT', name: 'Transmission Filter Kit', category: 'transmission', quantity_on_hand: 2, minimum_stock: 2, unit_cost: 145.00, supplier: 'Eaton', location: 'Shelf D-2', notes: 'At minimum stock', created_at: now, updated_at: now },
    { id: id(), part_number: 'EG-CLT50', name: 'Coolant (50/50 premix, gallon)', category: 'engine', quantity_on_hand: 18, minimum_stock: 10, unit_cost: 12.50, supplier: 'Old World Industries', location: 'Fluid Bay', created_at: now, updated_at: now },
    { id: id(), part_number: 'EG-OIL15', name: 'Shell Rotella T6 15W-40 (gallon)', category: 'engine', quantity_on_hand: 30, minimum_stock: 20, unit_cost: 21.99, supplier: 'Shell', location: 'Fluid Bay', created_at: now, updated_at: now },
    { id: id(), part_number: 'EG-AIRF', name: 'Air Filter Element (outer)', category: 'engine', quantity_on_hand: 5, minimum_stock: 4, unit_cost: 68.00, supplier: 'Donaldson', location: 'Shelf A-4', created_at: now, updated_at: now },
    { id: id(), part_number: 'EG-AIRI', name: 'Air Filter Element (inner/safety)', category: 'engine', quantity_on_hand: 3, minimum_stock: 3, unit_cost: 42.00, supplier: 'Donaldson', location: 'Shelf A-5', notes: 'At minimum stock — reorder soon', created_at: now, updated_at: now },
    { id: id(), part_number: 'HV-BELT', name: 'Serpentine Belt', category: 'hvac', quantity_on_hand: 3, minimum_stock: 2, unit_cost: 89.00, supplier: 'Gates Rubber', location: 'Shelf E-1', created_at: now, updated_at: now },
    { id: id(), part_number: 'HV-FILT', name: 'Cabin Air Filter', category: 'hvac', quantity_on_hand: 8, minimum_stock: 4, unit_cost: 24.00, supplier: 'Wix', location: 'Shelf E-2', created_at: now, updated_at: now },
    { id: id(), part_number: 'BD-SEAL', name: 'Trailer Door Seal (linear ft)', category: 'body', quantity_on_hand: 50, minimum_stock: 20, unit_cost: 4.25, supplier: 'Kinedyne', location: 'Shelf F-1', created_at: now, updated_at: now },
    { id: id(), part_number: 'EG-SPRK', name: 'DEF Fluid (2.5 gal)', category: 'engine', quantity_on_hand: 12, minimum_stock: 6, unit_cost: 19.99, supplier: 'BlueDEF', location: 'Fluid Bay', created_at: now, updated_at: now },
    { id: id(), part_number: 'EG-GASK', name: 'Valve Cover Gasket Set', category: 'engine', quantity_on_hand: 2, minimum_stock: 2, unit_cost: 115.00, supplier: 'Victor Reinz', location: 'Shelf A-6', notes: 'At minimum stock', created_at: now, updated_at: now },
  ]);

  console.log('✓ Parts inventory seeded (20)');
  console.log('\n🎉 All seed data inserted successfully!');
  client.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
