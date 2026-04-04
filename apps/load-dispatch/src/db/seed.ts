import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { loads, checkCalls, loadTemplates } from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'load-dispatch.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

// ─── Date helpers ────────────────────────────────────────────────────────────

function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function daysAgo(n: number): string {
  return today(-n);
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

function calcMargin(customerRate: number, carrierRate: number) {
  const margin = customerRate - carrierRate;
  const margin_pct = (margin / customerRate) * 100;
  return { margin: parseFloat(margin.toFixed(2)), margin_pct: parseFloat(margin_pct.toFixed(1)) };
}

async function main() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });

  console.log('Clearing existing data...');
  await db.delete(checkCalls);
  await db.delete(loadTemplates);
  await db.delete(loads);

  console.log('Seeding loads...');

  // ── 1. NEW (2) ─────────────────────────────────────────────────────────────
  const [load1] = await db.insert(loads).values({
    load_number: 'WLD-10001',
    customer_id: 1,
    customer_name: 'Dallas Distribution Co.',
    status: 'new',
    origin_city: 'Dallas', origin_state: 'TX', origin_zip: '75201',
    origin_address: '1234 Commerce St', origin_contact_name: 'Mike Torres',
    origin_contact_phone: '214-555-0101',
    pickup_date: today(3), pickup_time_from: '08:00', pickup_time_to: '12:00',
    pickup_number: 'PU-88201',
    dest_city: 'Los Angeles', dest_state: 'CA', dest_zip: '90001',
    dest_address: '5678 Industrial Blvd', dest_contact_name: 'Ana Reyes',
    dest_contact_phone: '310-555-0202',
    delivery_date: today(6), delivery_time_from: '08:00', delivery_time_to: '17:00',
    delivery_number: 'DEL-44101',
    equipment_type: 'dry_van', weight: 42000, commodity: 'General Merchandise',
    miles: 1430, customer_rate: 4200, carrier_rate: 3360,
    ...calcMargin(4200, 3360),
    rate_type: 'flat', customer_ref: 'DD-9901',
    created_by: 'jsmith',
  }).returning();

  const [load2] = await db.insert(loads).values({
    load_number: 'WLD-10002',
    customer_id: 2,
    customer_name: 'Pacific Foods Inc.',
    status: 'new',
    origin_city: 'Miami', origin_state: 'FL', origin_zip: '33101',
    origin_address: '900 Port Blvd', origin_contact_name: 'Carlos Ruiz',
    origin_contact_phone: '305-555-0303',
    pickup_date: today(2), pickup_time_from: '06:00', pickup_time_to: '10:00',
    pickup_number: 'PU-88202',
    dest_city: 'New York', dest_state: 'NY', dest_zip: '10001',
    dest_address: '200 Distribution Ave', dest_contact_name: 'Sarah Kim',
    dest_contact_phone: '212-555-0404',
    delivery_date: today(4), delivery_time_from: '07:00', delivery_time_to: '15:00',
    equipment_type: 'reefer', weight: 38000, commodity: 'Frozen Seafood',
    temperature_min: 28, temperature_max: 32,
    miles: 1280, customer_rate: 5800, carrier_rate: 4640,
    ...calcMargin(5800, 4640),
    rate_type: 'flat', customer_ref: 'PF-2202',
    created_by: 'jsmith',
  }).returning();

  // ── 2. POSTED (2) ──────────────────────────────────────────────────────────
  const [load3] = await db.insert(loads).values({
    load_number: 'WLD-10003',
    customer_id: 3,
    customer_name: 'Midwest Freight Solutions',
    status: 'posted',
    origin_city: 'Chicago', origin_state: 'IL', origin_zip: '60601',
    origin_address: '3300 W Fullerton Ave', origin_contact_name: 'Dave Kowalski',
    origin_contact_phone: '312-555-0505',
    pickup_date: today(1), pickup_time_from: '07:00', pickup_time_to: '11:00',
    pickup_number: 'PU-88203',
    dest_city: 'Atlanta', dest_state: 'GA', dest_zip: '30301',
    dest_address: '1100 Peachtree Rd', dest_contact_name: 'Linda Barnes',
    dest_contact_phone: '404-555-0606',
    delivery_date: today(2), delivery_time_from: '08:00', delivery_time_to: '16:00',
    equipment_type: 'dry_van', weight: 44000, commodity: 'Auto Parts',
    miles: 720, customer_rate: 2800, carrier_rate: 2240,
    ...calcMargin(2800, 2240),
    rate_type: 'flat', customer_ref: 'MFS-7730',
    posted_at: daysAgo(1),
    created_by: 'alopez',
  }).returning();

  const [load4] = await db.insert(loads).values({
    load_number: 'WLD-10004',
    customer_id: 4,
    customer_name: 'Lone Star Logistics',
    status: 'posted',
    origin_city: 'Houston', origin_state: 'TX', origin_zip: '77001',
    origin_address: '500 Houston Ship Channel', origin_contact_name: 'Bob White',
    origin_contact_phone: '713-555-0707',
    pickup_date: today(2), pickup_time_from: '09:00', pickup_time_to: '13:00',
    pickup_number: 'PU-88204',
    dest_city: 'Phoenix', dest_state: 'AZ', dest_zip: '85001',
    dest_address: '2200 E Broadway Rd', dest_contact_name: 'Maria Diaz',
    dest_contact_phone: '602-555-0808',
    delivery_date: today(3), delivery_time_from: '08:00', delivery_time_to: '17:00',
    equipment_type: 'flatbed', weight: 48000, commodity: 'Steel Coils',
    dims_length: 48, dims_width: 8.5, dims_height: 6,
    miles: 900, customer_rate: 3600, carrier_rate: 2880,
    ...calcMargin(3600, 2880),
    rate_type: 'flat', customer_ref: 'LSL-3344',
    posted_at: daysAgo(1),
    created_by: 'alopez',
  }).returning();

  // ── 3. COVERED (3) ─────────────────────────────────────────────────────────
  const [load5] = await db.insert(loads).values({
    load_number: 'WLD-10005',
    customer_id: 1,
    customer_name: 'Dallas Distribution Co.',
    status: 'covered',
    origin_city: 'Denver', origin_state: 'CO', origin_zip: '80201',
    origin_address: '4500 Brighton Blvd', origin_contact_name: 'Tom Reed',
    origin_contact_phone: '720-555-0909',
    pickup_date: today(1), pickup_time_from: '06:00', pickup_time_to: '10:00',
    pickup_number: 'PU-88205',
    dest_city: 'Seattle', dest_state: 'WA', dest_zip: '98101',
    dest_address: '3000 S Lucile St', dest_contact_name: 'Jenny Park',
    dest_contact_phone: '206-555-1010',
    delivery_date: today(2), delivery_time_from: '09:00', delivery_time_to: '17:00',
    equipment_type: 'dry_van', weight: 40000, commodity: 'Consumer Electronics',
    miles: 1320, customer_rate: 3800, carrier_rate: 3040,
    ...calcMargin(3800, 3040),
    rate_type: 'flat',
    carrier_id: 1, carrier_name: 'Apex Freight LLC',
    carrier_contact: 'Pete Sosa', carrier_phone: '214-555-2020',
    carrier_email: 'pete@apexfreight.com',
    posted_at: daysAgo(2), covered_at: daysAgo(1),
    created_by: 'jsmith',
  }).returning();

  const [load6] = await db.insert(loads).values({
    load_number: 'WLD-10006',
    customer_id: 2,
    customer_name: 'Pacific Foods Inc.',
    status: 'covered',
    origin_city: 'Los Angeles', origin_state: 'CA', origin_zip: '90011',
    origin_address: '7200 S Alameda St', origin_contact_name: 'Rosa Flores',
    origin_contact_phone: '323-555-1111',
    pickup_date: today(0), pickup_time_from: '07:00', pickup_time_to: '11:00',
    pickup_number: 'PU-88206',
    dest_city: 'San Francisco', dest_state: 'CA', dest_zip: '94105',
    dest_address: '850 Bryant St', dest_contact_name: 'James Liu',
    dest_contact_phone: '415-555-1212',
    delivery_date: today(0), delivery_time_from: '14:00', delivery_time_to: '18:00',
    equipment_type: 'reefer', weight: 36000, commodity: 'Fresh Produce',
    temperature_min: 34, temperature_max: 38,
    miles: 380, customer_rate: 1800, carrier_rate: 1440,
    ...calcMargin(1800, 1440),
    rate_type: 'flat',
    carrier_id: 3, carrier_name: 'Pacific Coast Carriers',
    carrier_contact: 'Dan Wong', carrier_phone: '310-555-2222',
    carrier_email: 'dispatch@pcc.com',
    posted_at: daysAgo(2), covered_at: daysAgo(1),
    created_by: 'alopez',
    tags: ['fresh', 'time-sensitive'],
  }).returning();

  const [load7] = await db.insert(loads).values({
    load_number: 'WLD-10007',
    customer_id: 5,
    customer_name: 'Atlantic Shipping Corp.',
    status: 'covered',
    origin_city: 'Charlotte', origin_state: 'NC', origin_zip: '28201',
    origin_address: '600 W Trade St', origin_contact_name: 'Amy Shaw',
    origin_contact_phone: '704-555-1313',
    pickup_date: today(1), pickup_time_from: '08:00', pickup_time_to: '12:00',
    pickup_number: 'PU-88207',
    dest_city: 'Nashville', dest_state: 'TN', dest_zip: '37201',
    dest_address: '400 Commerce St', dest_contact_name: 'Greg Hall',
    dest_contact_phone: '615-555-1414',
    delivery_date: today(1), delivery_time_from: '16:00', delivery_time_to: '20:00',
    equipment_type: 'dry_van', weight: 38000, commodity: 'Packaged Goods',
    miles: 410, customer_rate: 1600, carrier_rate: 1280,
    ...calcMargin(1600, 1280),
    rate_type: 'flat',
    carrier_id: 2, carrier_name: 'Midwest Express Transport',
    carrier_contact: 'Carl Jensen', carrier_phone: '312-555-2323',
    carrier_email: 'carl@midwestexpress.com',
    posted_at: daysAgo(1), covered_at: daysAgo(0),
    created_by: 'jsmith',
  }).returning();

  // ── 4. DISPATCHED (3) ──────────────────────────────────────────────────────
  const [load8] = await db.insert(loads).values({
    load_number: 'WLD-10008',
    customer_id: 3,
    customer_name: 'Midwest Freight Solutions',
    status: 'dispatched',
    origin_city: 'Kansas City', origin_state: 'MO', origin_zip: '64101',
    origin_address: '1800 Genessee St', origin_contact_name: 'Frank Olsen',
    origin_contact_phone: '816-555-1515',
    pickup_date: today(0), pickup_time_from: '10:00', pickup_time_to: '14:00',
    pickup_number: 'PU-88208',
    dest_city: 'Memphis', dest_state: 'TN', dest_zip: '38101',
    dest_address: '2500 Thomas St', dest_contact_name: 'Sandra Ford',
    dest_contact_phone: '901-555-1616',
    delivery_date: today(1), delivery_time_from: '07:00', delivery_time_to: '12:00',
    delivery_number: 'DEL-44108',
    equipment_type: 'dry_van', weight: 43000, commodity: 'Industrial Supplies',
    miles: 450, customer_rate: 2100, carrier_rate: 1680,
    ...calcMargin(2100, 1680),
    rate_type: 'flat',
    carrier_id: 4, carrier_name: 'Heartland Haulers',
    carrier_contact: 'Steve Grant', carrier_phone: '816-555-2424',
    carrier_email: 'steve@heartlandhaulers.com',
    bol_number: 'BOL-88208', pro_number: 'PRO-10008',
    posted_at: daysAgo(3), covered_at: daysAgo(2), dispatched_at: daysAgo(1),
    created_by: 'alopez',
  }).returning();

  const [load9] = await db.insert(loads).values({
    load_number: 'WLD-10009',
    customer_id: 1,
    customer_name: 'Dallas Distribution Co.',
    status: 'dispatched',
    origin_city: 'St. Louis', origin_state: 'MO', origin_zip: '63101',
    origin_address: '3400 Chouteau Ave', origin_contact_name: 'Patty Collins',
    origin_contact_phone: '314-555-1717',
    pickup_date: today(0), pickup_time_from: '08:00', pickup_time_to: '12:00',
    pickup_number: 'PU-88209',
    dest_city: 'Dallas', dest_state: 'TX', dest_zip: '75201',
    dest_address: '1234 Commerce St', dest_contact_name: 'Mike Torres',
    dest_contact_phone: '214-555-0101',
    delivery_date: today(1), delivery_time_from: '08:00', delivery_time_to: '16:00',
    delivery_number: 'DEL-44109',
    equipment_type: 'reefer', weight: 40000, commodity: 'Dairy Products',
    temperature_min: 34, temperature_max: 40,
    miles: 640, customer_rate: 3200, carrier_rate: 2560,
    ...calcMargin(3200, 2560),
    rate_type: 'flat',
    carrier_id: 5, carrier_name: 'Southern Star Freight',
    carrier_contact: 'Ray Dominguez', carrier_phone: '214-555-2525',
    carrier_email: 'ray@southernstar.com',
    bol_number: 'BOL-88209', pro_number: 'PRO-10009',
    posted_at: daysAgo(4), covered_at: daysAgo(3), dispatched_at: daysAgo(1),
    created_by: 'jsmith',
    tags: ['temp-sensitive'],
  }).returning();

  const [load10] = await db.insert(loads).values({
    load_number: 'WLD-10010',
    customer_id: 4,
    customer_name: 'Lone Star Logistics',
    status: 'dispatched',
    origin_city: 'Indianapolis', origin_state: 'IN', origin_zip: '46201',
    origin_address: '1200 E Washington St', origin_contact_name: 'Don Murphy',
    origin_contact_phone: '317-555-1818',
    pickup_date: today(0), pickup_time_from: '07:00', pickup_time_to: '10:00',
    pickup_number: 'PU-88210',
    dest_city: 'Columbus', dest_state: 'OH', dest_zip: '43201',
    dest_address: '500 Dublin Ave', dest_contact_name: 'Ellen Burke',
    dest_contact_phone: '614-555-1919',
    delivery_date: today(0), delivery_time_from: '15:00', delivery_time_to: '19:00',
    delivery_number: 'DEL-44110',
    equipment_type: 'flatbed', weight: 45000, commodity: 'Lumber',
    dims_length: 53, dims_width: 8.5, dims_height: 4,
    miles: 175, customer_rate: 1500, carrier_rate: 1200,
    ...calcMargin(1500, 1200),
    rate_type: 'flat',
    carrier_id: 6, carrier_name: 'Great Lakes Transport',
    carrier_contact: 'Nick Petrov', carrier_phone: '317-555-2626',
    carrier_email: 'nick@greatlakestransport.com',
    bol_number: 'BOL-88210', pro_number: 'PRO-10010',
    posted_at: daysAgo(2), covered_at: daysAgo(1), dispatched_at: daysAgo(0),
    created_by: 'alopez',
  }).returning();

  // ── 5. PICKED UP (2) ───────────────────────────────────────────────────────
  const [load11] = await db.insert(loads).values({
    load_number: 'WLD-10011',
    customer_id: 2,
    customer_name: 'Pacific Foods Inc.',
    status: 'picked_up',
    origin_city: 'Portland', origin_state: 'OR', origin_zip: '97201',
    origin_address: '1800 NW Quimby St', origin_contact_name: 'Hana Watanabe',
    origin_contact_phone: '503-555-2020',
    pickup_date: today(0), pickup_time_from: '06:00', pickup_time_to: '10:00',
    pickup_number: 'PU-88211',
    dest_city: 'San Diego', dest_state: 'CA', dest_zip: '92101',
    dest_address: '3300 Sports Arena Blvd', dest_contact_name: 'Marco Ruiz',
    dest_contact_phone: '619-555-2121',
    delivery_date: today(1), delivery_time_from: '09:00', delivery_time_to: '17:00',
    delivery_number: 'DEL-44111',
    equipment_type: 'reefer', weight: 37000, commodity: 'Organic Produce',
    temperature_min: 36, temperature_max: 40,
    miles: 1090, customer_rate: 4800, carrier_rate: 3840,
    ...calcMargin(4800, 3840),
    rate_type: 'flat',
    carrier_id: 3, carrier_name: 'Pacific Coast Carriers',
    carrier_contact: 'Dan Wong', carrier_phone: '310-555-2222',
    carrier_email: 'dispatch@pcc.com',
    bol_number: 'BOL-88211', pro_number: 'PRO-10011',
    posted_at: daysAgo(4), covered_at: daysAgo(3), dispatched_at: daysAgo(2),
    picked_up_at: new Date().toISOString(),
    created_by: 'jsmith',
    tags: ['organic'],
  }).returning();

  const [load12] = await db.insert(loads).values({
    load_number: 'WLD-10012',
    customer_id: 5,
    customer_name: 'Atlantic Shipping Corp.',
    status: 'picked_up',
    origin_city: 'Boston', origin_state: 'MA', origin_zip: '02101',
    origin_address: '100 Seaport Blvd', origin_contact_name: 'Donna Walsh',
    origin_contact_phone: '617-555-2222',
    pickup_date: today(0), pickup_time_from: '09:00', pickup_time_to: '13:00',
    pickup_number: 'PU-88212',
    dest_city: 'Philadelphia', dest_state: 'PA', dest_zip: '19101',
    dest_address: '3200 S 61st St', dest_contact_name: 'Chris Vega',
    dest_contact_phone: '215-555-2323',
    delivery_date: today(0), delivery_time_from: '17:00', delivery_time_to: '21:00',
    delivery_number: 'DEL-44112',
    equipment_type: 'dry_van', weight: 39000, commodity: 'Medical Supplies',
    miles: 300, customer_rate: 2200, carrier_rate: 1760,
    ...calcMargin(2200, 1760),
    rate_type: 'flat',
    carrier_id: 7, carrier_name: 'Northeast Fleet Inc.',
    carrier_contact: 'Janet Moore', carrier_phone: '617-555-2727',
    carrier_email: 'janet@northeastfleet.com',
    bol_number: 'BOL-88212', pro_number: 'PRO-10012',
    posted_at: daysAgo(3), covered_at: daysAgo(2), dispatched_at: daysAgo(1),
    picked_up_at: new Date().toISOString(),
    created_by: 'alopez',
    tags: ['medical', 'priority'],
  }).returning();

  // ── 6. IN TRANSIT (3) ──────────────────────────────────────────────────────
  const [load13] = await db.insert(loads).values({
    load_number: 'WLD-10013',
    customer_id: 3,
    customer_name: 'Midwest Freight Solutions',
    status: 'in_transit',
    origin_city: 'Minneapolis', origin_state: 'MN', origin_zip: '55401',
    origin_address: '500 Washington Ave N', origin_contact_name: 'Kevin Larson',
    origin_contact_phone: '612-555-2424',
    pickup_date: daysAgo(1), pickup_time_from: '07:00', pickup_time_to: '11:00',
    pickup_number: 'PU-88213',
    dest_city: 'Chicago', dest_state: 'IL', dest_zip: '60601',
    dest_address: '3300 W Fullerton Ave', dest_contact_name: 'Dave Kowalski',
    dest_contact_phone: '312-555-0505',
    delivery_date: today(0), delivery_time_from: '14:00', delivery_time_to: '18:00',
    delivery_number: 'DEL-44113',
    equipment_type: 'dry_van', weight: 41000, commodity: 'Food Grade Products',
    miles: 410, customer_rate: 2400, carrier_rate: 1920,
    ...calcMargin(2400, 1920),
    rate_type: 'flat',
    carrier_id: 2, carrier_name: 'Midwest Express Transport',
    carrier_contact: 'Carl Jensen', carrier_phone: '312-555-2323',
    carrier_email: 'carl@midwestexpress.com',
    bol_number: 'BOL-88213', pro_number: 'PRO-10013',
    posted_at: daysAgo(5), covered_at: daysAgo(4), dispatched_at: daysAgo(3),
    picked_up_at: daysAgo(1),
    created_by: 'jsmith',
  }).returning();

  const [load14] = await db.insert(loads).values({
    load_number: 'WLD-10014',
    customer_id: 1,
    customer_name: 'Dallas Distribution Co.',
    status: 'in_transit',
    origin_city: 'Atlanta', origin_state: 'GA', origin_zip: '30301',
    origin_address: '1800 Century Blvd', origin_contact_name: 'Stacy Turner',
    origin_contact_phone: '404-555-2525',
    pickup_date: daysAgo(2), pickup_time_from: '08:00', pickup_time_to: '12:00',
    pickup_number: 'PU-88214',
    dest_city: 'Dallas', dest_state: 'TX', dest_zip: '75201',
    dest_address: '1234 Commerce St', dest_contact_name: 'Mike Torres',
    dest_contact_phone: '214-555-0101',
    delivery_date: today(0), delivery_time_from: '10:00', delivery_time_to: '15:00',
    delivery_number: 'DEL-44114',
    equipment_type: 'dry_van', weight: 44500, commodity: 'Retail Goods',
    miles: 780, customer_rate: 3100, carrier_rate: 2480,
    ...calcMargin(3100, 2480),
    rate_type: 'flat',
    carrier_id: 5, carrier_name: 'Southern Star Freight',
    carrier_contact: 'Ray Dominguez', carrier_phone: '214-555-2525',
    carrier_email: 'ray@southernstar.com',
    bol_number: 'BOL-88214', pro_number: 'PRO-10014',
    posted_at: daysAgo(6), covered_at: daysAgo(5), dispatched_at: daysAgo(4),
    picked_up_at: daysAgo(2),
    created_by: 'alopez',
    tags: ['overdue-check-call'],
  }).returning();

  const [load15] = await db.insert(loads).values({
    load_number: 'WLD-10015',
    customer_id: 4,
    customer_name: 'Lone Star Logistics',
    status: 'in_transit',
    origin_city: 'El Paso', origin_state: 'TX', origin_zip: '79901',
    origin_address: '2200 Montana Ave', origin_contact_name: 'Luis Morales',
    origin_contact_phone: '915-555-2626',
    pickup_date: daysAgo(1), pickup_time_from: '06:00', pickup_time_to: '10:00',
    pickup_number: 'PU-88215',
    dest_city: 'Dallas', dest_state: 'TX', dest_zip: '75201',
    dest_address: '4400 Singleton Blvd', dest_contact_name: 'Raul Gutierrez',
    dest_contact_phone: '214-555-2727',
    delivery_date: today(1), delivery_time_from: '08:00', delivery_time_to: '14:00',
    delivery_number: 'DEL-44115',
    equipment_type: 'flatbed', weight: 47000, commodity: 'Construction Materials',
    dims_length: 48, dims_width: 8.5, dims_height: 5,
    miles: 630, customer_rate: 2900, carrier_rate: 2320,
    ...calcMargin(2900, 2320),
    rate_type: 'flat',
    carrier_id: 8, carrier_name: 'Southwest Cargo Group',
    carrier_contact: 'Pablo Espinoza', carrier_phone: '915-555-2828',
    carrier_email: 'pablo@swcargo.com',
    bol_number: 'BOL-88215', pro_number: 'PRO-10015',
    posted_at: daysAgo(5), covered_at: daysAgo(4), dispatched_at: daysAgo(3),
    picked_up_at: daysAgo(1),
    created_by: 'jsmith',
    tags: ['overdue-check-call'],
  }).returning();

  // ── 7. DELIVERED (2) ───────────────────────────────────────────────────────
  const [load16] = await db.insert(loads).values({
    load_number: 'WLD-10016',
    customer_id: 5,
    customer_name: 'Atlantic Shipping Corp.',
    status: 'delivered',
    origin_city: 'New York', origin_state: 'NY', origin_zip: '10001',
    origin_address: '500 W 36th St', origin_contact_name: 'Joan Perkins',
    origin_contact_phone: '212-555-2828',
    pickup_date: daysAgo(3), pickup_time_from: '08:00', pickup_time_to: '12:00',
    pickup_number: 'PU-88216',
    dest_city: 'Chicago', dest_state: 'IL', dest_zip: '60601',
    dest_address: '1600 E 87th St', dest_contact_name: 'Tony Rizzo',
    dest_contact_phone: '312-555-2929',
    delivery_date: daysAgo(1), delivery_time_from: '09:00', delivery_time_to: '17:00',
    delivery_number: 'DEL-44116',
    equipment_type: 'dry_van', weight: 42000, commodity: 'Apparel',
    miles: 790, customer_rate: 3300, carrier_rate: 2640,
    ...calcMargin(3300, 2640),
    rate_type: 'flat',
    carrier_id: 1, carrier_name: 'Apex Freight LLC',
    carrier_contact: 'Pete Sosa', carrier_phone: '214-555-2020',
    carrier_email: 'pete@apexfreight.com',
    bol_number: 'BOL-88216', pro_number: 'PRO-10016',
    customer_ref: 'ASC-5501',
    posted_at: daysAgo(7), covered_at: daysAgo(6), dispatched_at: daysAgo(5),
    picked_up_at: daysAgo(3), delivered_at: daysAgo(1),
    created_by: 'alopez',
  }).returning();

  const [load17] = await db.insert(loads).values({
    load_number: 'WLD-10017',
    customer_id: 2,
    customer_name: 'Pacific Foods Inc.',
    status: 'delivered',
    origin_city: 'Sacramento', origin_state: 'CA', origin_zip: '95814',
    origin_address: '2400 Del Monte St', origin_contact_name: 'Rita Gomez',
    origin_contact_phone: '916-555-3030',
    pickup_date: daysAgo(4), pickup_time_from: '07:00', pickup_time_to: '11:00',
    pickup_number: 'PU-88217',
    dest_city: 'Portland', dest_state: 'OR', dest_zip: '97201',
    dest_address: '1900 N Williams Ave', dest_contact_name: 'Hana Watanabe',
    dest_contact_phone: '503-555-3131',
    delivery_date: daysAgo(2), delivery_time_from: '10:00', delivery_time_to: '16:00',
    delivery_number: 'DEL-44117',
    equipment_type: 'reefer', weight: 35000, commodity: 'Wine & Spirits',
    temperature_min: 55, temperature_max: 65,
    miles: 580, customer_rate: 3500, carrier_rate: 2800,
    ...calcMargin(3500, 2800),
    rate_type: 'flat',
    carrier_id: 3, carrier_name: 'Pacific Coast Carriers',
    carrier_contact: 'Dan Wong', carrier_phone: '310-555-2222',
    carrier_email: 'dispatch@pcc.com',
    bol_number: 'BOL-88217', pro_number: 'PRO-10017',
    customer_ref: 'PF-3303',
    posted_at: daysAgo(8), covered_at: daysAgo(7), dispatched_at: daysAgo(6),
    picked_up_at: daysAgo(4), delivered_at: daysAgo(2),
    created_by: 'jsmith',
  }).returning();

  // ── 8. INVOICED (1) ────────────────────────────────────────────────────────
  const [load18] = await db.insert(loads).values({
    load_number: 'WLD-10018',
    customer_id: 3,
    customer_name: 'Midwest Freight Solutions',
    status: 'invoiced',
    origin_city: 'Detroit', origin_state: 'MI', origin_zip: '48201',
    origin_address: '1400 E Jefferson Ave', origin_contact_name: 'Greg Nowak',
    origin_contact_phone: '313-555-3232',
    pickup_date: daysAgo(6), pickup_time_from: '08:00', pickup_time_to: '12:00',
    pickup_number: 'PU-88218',
    dest_city: 'Cleveland', dest_state: 'OH', dest_zip: '44101',
    dest_address: '600 Superior Ave', dest_contact_name: 'Paul Zimmerman',
    dest_contact_phone: '216-555-3333',
    delivery_date: daysAgo(5), delivery_time_from: '09:00', delivery_time_to: '15:00',
    delivery_number: 'DEL-44118',
    equipment_type: 'dry_van', weight: 43000, commodity: 'Auto Components',
    miles: 170, customer_rate: 1700, carrier_rate: 1360,
    ...calcMargin(1700, 1360),
    rate_type: 'flat',
    carrier_id: 6, carrier_name: 'Great Lakes Transport',
    carrier_contact: 'Nick Petrov', carrier_phone: '317-555-2626',
    carrier_email: 'nick@greatlakestransport.com',
    bol_number: 'BOL-88218', pro_number: 'PRO-10018',
    customer_ref: 'MFS-8840',
    posted_at: daysAgo(10), covered_at: daysAgo(9), dispatched_at: daysAgo(8),
    picked_up_at: daysAgo(6), delivered_at: daysAgo(5), invoiced_at: daysAgo(3),
    created_by: 'alopez',
  }).returning();

  // ── 9. CLOSED (1) ──────────────────────────────────────────────────────────
  const [load19] = await db.insert(loads).values({
    load_number: 'WLD-10019',
    customer_id: 1,
    customer_name: 'Dallas Distribution Co.',
    status: 'closed',
    origin_city: 'San Antonio', origin_state: 'TX', origin_zip: '78201',
    origin_address: '3300 Fredericksburg Rd', origin_contact_name: 'Juan Salinas',
    origin_contact_phone: '210-555-3434',
    pickup_date: daysAgo(10), pickup_time_from: '07:00', pickup_time_to: '11:00',
    pickup_number: 'PU-88219',
    dest_city: 'Oklahoma City', dest_state: 'OK', dest_zip: '73101',
    dest_address: '700 N Broadway Ave', dest_contact_name: 'Sharon Cross',
    dest_contact_phone: '405-555-3535',
    delivery_date: daysAgo(9), delivery_time_from: '09:00', delivery_time_to: '17:00',
    delivery_number: 'DEL-44119',
    equipment_type: 'dry_van', weight: 40000, commodity: 'General Freight',
    miles: 340, customer_rate: 2000, carrier_rate: 1600,
    ...calcMargin(2000, 1600),
    rate_type: 'flat',
    carrier_id: 5, carrier_name: 'Southern Star Freight',
    carrier_contact: 'Ray Dominguez', carrier_phone: '214-555-2525',
    carrier_email: 'ray@southernstar.com',
    bol_number: 'BOL-88219', pro_number: 'PRO-10019',
    customer_ref: 'DD-7702',
    posted_at: daysAgo(14), covered_at: daysAgo(13), dispatched_at: daysAgo(12),
    picked_up_at: daysAgo(10), delivered_at: daysAgo(9), invoiced_at: daysAgo(7),
    closed_at: daysAgo(2),
    created_by: 'jsmith',
  }).returning();

  // ── 10. CANCELLED (1) ──────────────────────────────────────────────────────
  const [load20] = await db.insert(loads).values({
    load_number: 'WLD-10020',
    customer_id: 4,
    customer_name: 'Lone Star Logistics',
    status: 'cancelled',
    origin_city: 'Albuquerque', origin_state: 'NM', origin_zip: '87101',
    origin_address: '400 Rio Grande Blvd', origin_contact_name: 'Teresa Barela',
    origin_contact_phone: '505-555-3636',
    pickup_date: daysAgo(2), pickup_time_from: '08:00', pickup_time_to: '12:00',
    pickup_number: 'PU-88220',
    dest_city: 'Tucson', dest_state: 'AZ', dest_zip: '85701',
    dest_address: '1500 E Speedway Blvd', dest_contact_name: 'Oscar Reyna',
    dest_contact_phone: '520-555-3737',
    delivery_date: daysAgo(1),
    equipment_type: 'dry_van', weight: 38000, commodity: 'Retail Merchandise',
    miles: 450, customer_rate: 2200, carrier_rate: 1760,
    ...calcMargin(2200, 1760),
    rate_type: 'flat',
    posted_at: daysAgo(5), covered_at: daysAgo(4),
    cancelled_at: daysAgo(2),
    cancellation_reason: 'Shipper cancelled — cargo not ready',
    customer_ref: 'LSL-5510',
    created_by: 'alopez',
  }).returning();

  // Suppress unused variable warnings
  void load1; void load2; void load3; void load4;
  void load6; void load7; void load16; void load17;
  void load18; void load19; void load20;

  console.log('Seeding check calls...');

  // Check calls for dispatched/in-transit loads
  // load8 (dispatched, KC→Memphis) — 3 check calls, last one recent
  await db.insert(checkCalls).values([
    {
      load_id: load8.id, status: 'at_pickup',
      location_city: 'Kansas City', location_state: 'MO',
      eta: today(0) + 'T16:00:00',
      notes: 'Driver arrived at shipper. Loading begins shortly.',
      contact_method: 'phone', called_by: 'alopez',
      created_at: hoursAgo(5),
    },
    {
      load_id: load8.id, status: 'loaded',
      location_city: 'Kansas City', location_state: 'MO',
      eta: today(1) + 'T09:00:00',
      notes: 'Loaded and sealed. 43,200 lbs. Departing now.',
      contact_method: 'phone', called_by: 'alopez',
      created_at: hoursAgo(3),
    },
    {
      load_id: load8.id, status: 'in_transit',
      location_city: 'Joplin', location_state: 'MO',
      eta: today(1) + 'T09:00:00',
      notes: 'Driver 180 miles out. On schedule.',
      contact_method: 'text', called_by: 'jsmith',
      created_at: hoursAgo(1),
    },
  ]);

  // load9 (dispatched, STL→Dallas) — 2 check calls, recent
  await db.insert(checkCalls).values([
    {
      load_id: load9.id, status: 'at_pickup',
      location_city: 'St. Louis', location_state: 'MO',
      eta: today(1) + 'T10:00:00',
      notes: 'At shipper waiting for dock assignment.',
      contact_method: 'phone', called_by: 'jsmith',
      created_at: hoursAgo(4),
    },
    {
      load_id: load9.id, status: 'loaded',
      location_city: 'St. Louis', location_state: 'MO',
      eta: today(1) + 'T10:00:00',
      notes: 'Loaded. Temp reading 36°F. Doors sealed.',
      contact_method: 'phone', called_by: 'jsmith',
      created_at: hoursAgo(2),
    },
  ]);

  // load10 (dispatched, Indy→Columbus) — 2 check calls
  await db.insert(checkCalls).values([
    {
      load_id: load10.id, status: 'at_pickup',
      location_city: 'Indianapolis', location_state: 'IN',
      eta: today(0) + 'T18:00:00',
      notes: 'Driver on site. Forklift loading in progress.',
      contact_method: 'phone', called_by: 'alopez',
      created_at: hoursAgo(3),
    },
    {
      load_id: load10.id, status: 'loaded',
      location_city: 'Indianapolis', location_state: 'IN',
      eta: today(0) + 'T17:00:00',
      notes: '47,200 lbs lumber secured with chains. En route.',
      contact_method: 'text', called_by: 'alopez',
      created_at: hoursAgo(1),
    },
  ]);

  // load11 (picked_up, Portland→San Diego) — 3 check calls, last one recent
  await db.insert(checkCalls).values([
    {
      load_id: load11.id, status: 'at_pickup',
      location_city: 'Portland', location_state: 'OR',
      eta: today(1) + 'T11:00:00',
      notes: 'Arrived at Willamette cold storage. Temp pre-cooled.',
      contact_method: 'phone', called_by: 'jsmith',
      created_at: hoursAgo(6),
    },
    {
      load_id: load11.id, status: 'loaded',
      location_city: 'Portland', location_state: 'OR',
      eta: today(1) + 'T11:00:00',
      notes: 'Loaded 37,200 lbs. Reefer set at 38°F confirmed.',
      contact_method: 'phone', called_by: 'jsmith',
      created_at: hoursAgo(5),
    },
    {
      load_id: load11.id, status: 'in_transit',
      location_city: 'Medford', location_state: 'OR',
      eta: today(1) + 'T11:00:00',
      notes: 'Through Medford. Temp 37°F. Running on time.',
      contact_method: 'tracking', called_by: 'system',
      created_at: hoursAgo(2),
    },
  ]);

  // load12 (picked_up, Boston→Philly) — 2 check calls
  await db.insert(checkCalls).values([
    {
      load_id: load12.id, status: 'at_pickup',
      location_city: 'Boston', location_state: 'MA',
      eta: today(0) + 'T19:00:00',
      notes: 'At Seaport dock. Medical supplies being loaded.',
      contact_method: 'phone', called_by: 'alopez',
      created_at: hoursAgo(4),
    },
    {
      load_id: load12.id, status: 'in_transit',
      location_city: 'Providence', location_state: 'RI',
      eta: today(0) + 'T19:00:00',
      notes: 'Through Providence. Light traffic. On time.',
      contact_method: 'text', called_by: 'alopez',
      created_at: hoursAgo(1),
    },
  ]);

  // load13 (in_transit, Minneapolis→Chicago) — 3 check calls, OVERDUE (last 6+ hrs ago)
  await db.insert(checkCalls).values([
    {
      load_id: load13.id, status: 'loaded',
      location_city: 'Minneapolis', location_state: 'MN',
      eta: today(0) + 'T16:00:00',
      notes: 'Loaded and sealed at distribution center.',
      contact_method: 'phone', called_by: 'jsmith',
      created_at: hoursAgo(22),
    },
    {
      load_id: load13.id, status: 'in_transit',
      location_city: 'Madison', location_state: 'WI',
      eta: today(0) + 'T16:00:00',
      notes: 'Through Madison. Driver mentioned some rain.',
      contact_method: 'phone', called_by: 'jsmith',
      created_at: hoursAgo(14),
    },
    {
      load_id: load13.id, status: 'in_transit',
      location_city: 'Rockford', location_state: 'IL',
      eta: today(0) + 'T16:00:00',
      notes: 'Approaching Rockford. ETA Chicago ~2hrs.',
      contact_method: 'phone', called_by: 'jsmith',
      created_at: hoursAgo(6),
    },
  ]);

  // load14 (in_transit, Atlanta→Dallas) — OVERDUE (last check call 8hrs ago)
  await db.insert(checkCalls).values([
    {
      load_id: load14.id, status: 'loaded',
      location_city: 'Atlanta', location_state: 'GA',
      eta: today(0) + 'T14:00:00',
      notes: 'Loaded 44,500 lbs retail goods.',
      contact_method: 'phone', called_by: 'alopez',
      created_at: hoursAgo(16),
    },
    {
      load_id: load14.id, status: 'in_transit',
      location_city: 'Birmingham', location_state: 'AL',
      eta: today(0) + 'T14:00:00',
      notes: 'Through Birmingham. Driver okay.',
      contact_method: 'text', called_by: 'alopez',
      created_at: hoursAgo(12),
    },
    {
      load_id: load14.id, status: 'in_transit',
      location_city: 'Jackson', location_state: 'MS',
      eta: today(0) + 'T14:00:00',
      notes: 'Jackson area. On track for delivery.',
      contact_method: 'phone', called_by: 'alopez',
      created_at: hoursAgo(8),
    },
  ]);

  // load15 (in_transit, El Paso→Dallas) — OVERDUE (last check call 5hrs ago)
  await db.insert(checkCalls).values([
    {
      load_id: load15.id, status: 'loaded',
      location_city: 'El Paso', location_state: 'TX',
      eta: today(1) + 'T10:00:00',
      notes: 'Construction materials tarped and strapped.',
      contact_method: 'phone', called_by: 'jsmith',
      created_at: hoursAgo(14),
    },
    {
      load_id: load15.id, status: 'in_transit',
      location_city: 'Midland', location_state: 'TX',
      eta: today(1) + 'T10:00:00',
      notes: 'Midland check. Tarp secure. No issues.',
      contact_method: 'phone', called_by: 'jsmith',
      created_at: hoursAgo(9),
    },
    {
      load_id: load15.id, status: 'in_transit',
      location_city: 'Abilene', location_state: 'TX',
      eta: today(1) + 'T10:00:00',
      notes: 'Approaching Abilene. Wind picking up but manageable.',
      contact_method: 'text', called_by: 'jsmith',
      created_at: hoursAgo(5),
    },
  ]);

  console.log('Seeding load templates...');

  await db.insert(loadTemplates).values([
    {
      name: 'DAL → LA Dry Van',
      customer_id: 1, customer_name: 'Dallas Distribution Co.',
      origin_city: 'Dallas', origin_state: 'TX',
      dest_city: 'Los Angeles', dest_state: 'CA',
      equipment_type: 'dry_van', weight: 42000,
      commodity: 'General Merchandise', customer_rate: 4200,
      use_count: 14,
    },
    {
      name: 'CHI → ATL Dry Van',
      customer_id: 3, customer_name: 'Midwest Freight Solutions',
      origin_city: 'Chicago', origin_state: 'IL',
      dest_city: 'Atlanta', dest_state: 'GA',
      equipment_type: 'dry_van', weight: 44000,
      commodity: 'General Freight', customer_rate: 2800,
      use_count: 9,
    },
    {
      name: 'MIA → NYC Reefer',
      customer_id: 2, customer_name: 'Pacific Foods Inc.',
      origin_city: 'Miami', origin_state: 'FL',
      dest_city: 'New York', dest_state: 'NY',
      equipment_type: 'reefer', weight: 38000,
      commodity: 'Perishable Food', customer_rate: 5800,
      special_instructions: 'Temperature 28-32°F. No exceptions.',
      use_count: 7,
    },
    {
      name: 'HOU → PHX Flatbed',
      customer_id: 4, customer_name: 'Lone Star Logistics',
      origin_city: 'Houston', origin_state: 'TX',
      dest_city: 'Phoenix', dest_state: 'AZ',
      equipment_type: 'flatbed', weight: 48000,
      commodity: 'Steel Products', customer_rate: 3600,
      special_instructions: 'Tarping required. Verify straps at each stop.',
      use_count: 5,
    },
    {
      name: 'NYC → CHI Dry Van',
      customer_id: 5, customer_name: 'Atlantic Shipping Corp.',
      origin_city: 'New York', origin_state: 'NY',
      dest_city: 'Chicago', dest_state: 'IL',
      equipment_type: 'dry_van', weight: 42000,
      commodity: 'Retail Merchandise', customer_rate: 3300,
      use_count: 11,
    },
  ]);

  console.log('✅ Seed complete!');
  console.log('  → 20 loads across all statuses');
  console.log('  → 25 check calls on dispatched/in-transit loads');
  console.log('  → 5 load templates');
  console.log('  → 2 loads pickup today, 2 delivery today');
  console.log('  → 3 in-transit loads with overdue check calls (5-8+ hrs)');

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
