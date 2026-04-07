import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'carrier-management.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

// Run migrations first
console.log('Running migrations...');
migrate(db, { migrationsFolder: MIGRATIONS_PATH });
console.log('Migrations complete.');

const now = new Date();
const futureDate = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const pastDate = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

async function seed() {
  console.log('Seeding carriers...');

  // Clear existing data
  await db.delete(schema.carrierVetting);
  await db.delete(schema.carrierPerformance);
  await db.delete(schema.carrierRates);
  await db.delete(schema.carrierInsurance);
  await db.delete(schema.carrierContacts);
  await db.delete(schema.carriers);

  // ─── Carriers ────────────────────────────────────────────────────────────

  const carrierData: schema.NewCarrier[] = [
    {
      id: 'c1',
      name: 'Apex Freight Solutions',
      mcNumber: 'MC-182934',
      dotNumber: 'DOT-2847162',
      scacCode: 'APXF',
      addressStreet: '1200 Industrial Blvd',
      addressCity: 'Dallas',
      addressState: 'TX',
      addressZip: '75201',
      addressCountry: 'US',
      website: 'https://apexfreight.com',
      equipmentTypes: JSON.stringify(['dry_van', 'reefer']),
      serviceAreas: JSON.stringify([{ origin_states: ['TX', 'OK', 'LA'], dest_states: ['CA', 'AZ', 'NV'] }]),
      notes: 'Reliable carrier, great communication. Preferred for TX-CA lane.',
      tags: JSON.stringify(['preferred', 'west-coast']),
      status: 'active',
      overallScore: 94.2,
      authorityStatus: 'active',
      safetyRating: 'satisfactory',
      vettingStatus: 'approved',
      vettingScore: 100,
      approvedAt: pastDate(30) + 'T00:00:00Z',
      approvedBy: 'Admin',
    },
    {
      id: 'c2',
      name: 'Midwest Express Logistics',
      mcNumber: 'MC-293847',
      dotNumber: 'DOT-3948271',
      scacCode: 'MXEL',
      addressStreet: '4500 Gateway Ave',
      addressCity: 'Chicago',
      addressState: 'IL',
      addressZip: '60601',
      addressCountry: 'US',
      website: 'https://midwestexpress.com',
      equipmentTypes: JSON.stringify(['dry_van', 'flatbed', 'step_deck']),
      serviceAreas: JSON.stringify([{ origin_states: ['IL', 'IN', 'OH', 'MI'], dest_states: ['TX', 'GA', 'NY', 'FL'] }]),
      notes: 'Specializes in flatbed. Good for oversized loads.',
      tags: JSON.stringify(['flatbed-specialist']),
      status: 'active',
      overallScore: 88.5,
      authorityStatus: 'active',
      safetyRating: 'satisfactory',
      vettingStatus: 'in_progress',
      vettingScore: 60,
    },
    {
      id: 'c3',
      name: 'Pacific Coast Carriers',
      mcNumber: 'MC-374859',
      dotNumber: 'DOT-4859372',
      scacCode: 'PCTC',
      addressStreet: '890 Harbor Dr',
      addressCity: 'Los Angeles',
      addressState: 'CA',
      addressZip: '90001',
      addressCountry: 'US',
      website: 'https://pacificcoastcarriers.com',
      equipmentTypes: JSON.stringify(['dry_van', 'reefer']),
      serviceAreas: JSON.stringify([{ origin_states: ['CA', 'OR', 'WA'], dest_states: ['TX', 'AZ', 'NV', 'CO'] }]),
      notes: 'West coast specialist. Good rates on CA-TX.',
      tags: JSON.stringify(['west-coast', 'refrigerated']),
      status: 'active',
      overallScore: 91.0,
      authorityStatus: 'active',
      safetyRating: 'satisfactory',
      vettingStatus: 'approved',
      vettingScore: 90,
      approvedAt: pastDate(15) + 'T00:00:00Z',
      approvedBy: 'Admin',
    },
    {
      id: 'c4',
      name: 'Blue Ridge Transport',
      mcNumber: 'MC-485960',
      dotNumber: 'DOT-5960483',
      scacCode: 'BRTX',
      addressStreet: '220 Mountain View Rd',
      addressCity: 'Charlotte',
      addressState: 'NC',
      addressZip: '28201',
      addressCountry: 'US',
      website: 'https://blueridgetransport.com',
      equipmentTypes: JSON.stringify(['dry_van']),
      serviceAreas: JSON.stringify([{ origin_states: ['NC', 'SC', 'VA', 'TN'], dest_states: ['OH', 'PA', 'NY', 'NJ'] }]),
      notes: 'Southeast to Northeast corridor specialist.',
      tags: JSON.stringify(['southeast', 'northeast']),
      status: 'active',
      overallScore: 79.3,
      authorityStatus: 'active',
      safetyRating: 'conditional',
      vettingStatus: 'in_progress',
      vettingScore: 40,
    },
    {
      id: 'c5',
      name: 'Lone Star Trucking Co.',
      mcNumber: 'MC-596071',
      dotNumber: 'DOT-6071594',
      scacCode: 'LSTX',
      addressStreet: '3300 Commerce St',
      addressCity: 'Houston',
      addressState: 'TX',
      addressZip: '77001',
      addressCountry: 'US',
      website: 'https://lonestartucking.com',
      equipmentTypes: JSON.stringify(['flatbed', 'step_deck', 'lowboy']),
      serviceAreas: JSON.stringify([{ origin_states: ['TX'], dest_states: ['TX', 'LA', 'OK', 'NM', 'CO'] }]),
      notes: 'Heavy haul and oversized specialists. Texas domiciled.',
      tags: JSON.stringify(['heavy-haul', 'texas']),
      status: 'active',
      overallScore: 85.7,
      authorityStatus: 'active',
      safetyRating: 'satisfactory',
      vettingStatus: 'in_progress',
      vettingScore: 50,
    },
    {
      id: 'c6',
      name: 'Great Lakes Freight',
      mcNumber: 'MC-607182',
      dotNumber: 'DOT-7182607',
      scacCode: 'GLFL',
      addressStreet: '750 Lakeshore Pkwy',
      addressCity: 'Detroit',
      addressState: 'MI',
      addressZip: '48201',
      addressCountry: 'US',
      website: 'https://greatlakesfreight.com',
      equipmentTypes: JSON.stringify(['dry_van', 'reefer']),
      serviceAreas: JSON.stringify([{ origin_states: ['MI', 'OH', 'IN', 'WI', 'MN'], dest_states: ['IL', 'PA', 'NY', 'GA'] }]),
      notes: 'Auto parts specialist. Strong midwest presence.',
      tags: JSON.stringify(['auto', 'midwest']),
      status: 'active',
      overallScore: 82.1,
      authorityStatus: 'active',
      safetyRating: 'satisfactory',
      vettingStatus: 'not_started',
      vettingScore: 0,
    },
    {
      id: 'c7',
      name: 'Sunrise Expedited Services',
      mcNumber: 'MC-718293',
      dotNumber: 'DOT-8293718',
      scacCode: 'SRES',
      addressStreet: '100 Airport Rd',
      addressCity: 'Atlanta',
      addressState: 'GA',
      addressZip: '30301',
      addressCountry: 'US',
      website: 'https://sunriseexpedited.com',
      equipmentTypes: JSON.stringify(['dry_van', 'sprinter_van', 'cargo_van']),
      serviceAreas: JSON.stringify([{ origin_states: ['GA', 'FL', 'AL', 'MS'], dest_states: ['NY', 'NJ', 'PA', 'MD'] }]),
      notes: 'Expedited specialist. Great for time-critical freight.',
      tags: JSON.stringify(['expedited', 'time-critical']),
      status: 'active',
      overallScore: 96.8,
      authorityStatus: 'active',
      safetyRating: 'satisfactory',
      vettingStatus: 'vetted',
      vettingScore: 80,
    },
    {
      id: 'c8',
      name: 'Mountain West Carriers',
      mcNumber: 'MC-829304',
      dotNumber: 'DOT-9304829',
      scacCode: 'MWTC',
      addressStreet: '2200 Denver Tech Center',
      addressCity: 'Denver',
      addressState: 'CO',
      addressZip: '80201',
      addressCountry: 'US',
      website: null,
      equipmentTypes: JSON.stringify(['dry_van', 'reefer', 'flatbed']),
      serviceAreas: JSON.stringify([{ origin_states: ['CO', 'UT', 'WY', 'ID'], dest_states: ['CA', 'TX', 'IL', 'WA'] }]),
      notes: 'Mountain region specialist. Good winter service.',
      tags: JSON.stringify(['mountain', 'winter-capable']),
      status: 'inactive',
      overallScore: 71.4,
      authorityStatus: 'active',
      safetyRating: 'conditional',
      vettingStatus: 'not_started',
      vettingScore: 0,
    },
    {
      id: 'c9',
      name: 'Coastal Refrigerated Transport',
      mcNumber: 'MC-930415',
      dotNumber: 'DOT-0415930',
      scacCode: 'CRFT',
      addressStreet: '500 Port Ave',
      addressCity: 'Jacksonville',
      addressState: 'FL',
      addressZip: '32099',
      addressCountry: 'US',
      website: 'https://coastalref.com',
      equipmentTypes: JSON.stringify(['reefer']),
      serviceAreas: JSON.stringify([{ origin_states: ['FL', 'GA'], dest_states: ['NY', 'NJ', 'PA', 'MA', 'CT'] }]),
      notes: 'Reefer only. Produces and perishables. Strong FL-Northeast corridor.',
      tags: JSON.stringify(['reefer-only', 'produce', 'perishables']),
      status: 'active',
      overallScore: 89.6,
      authorityStatus: 'active',
      safetyRating: 'satisfactory',
      vettingStatus: 'in_progress',
      vettingScore: 30,
    },
    {
      id: 'c10',
      name: 'Swift River Logistics',
      mcNumber: 'MC-041526',
      dotNumber: 'DOT-1526041',
      scacCode: 'SWRL',
      addressStreet: '777 Highway 40',
      addressCity: 'Memphis',
      addressState: 'TN',
      addressZip: '38101',
      addressCountry: 'US',
      website: 'https://swiftriverlogistics.com',
      equipmentTypes: JSON.stringify(['dry_van', 'flatbed']),
      serviceAreas: JSON.stringify([{ origin_states: ['TN', 'AR', 'MS', 'KY'], dest_states: ['TX', 'GA', 'OH', 'IL'] }]),
      notes: 'Mid-South specialist. Good rates. Insurance expired — DO NOT USE until renewed.',
      tags: JSON.stringify(['mid-south', 'insurance-issue']),
      status: 'active',
      overallScore: 67.2,
      authorityStatus: 'active',
      safetyRating: 'satisfactory',
      vettingStatus: 'rejected',
      vettingScore: 20,
      rejectedAt: pastDate(10) + 'T00:00:00Z',
      rejectionReason: 'Insurance lapsed. Do not use until renewed and re-vetted.',
    },
  ];

  for (const carrier of carrierData) {
    await db.insert(schema.carriers).values(carrier).onConflictDoNothing();
  }
  console.log(`Inserted ${carrierData.length} carriers`);

  // ─── Contacts ─────────────────────────────────────────────────────────────

  const contacts: schema.NewCarrierContact[] = [
    { carrierId: 'c1', name: 'Mike Rodriguez', role: 'dispatch', phone: '214-555-0101', email: 'mike.r@apexfreight.com', isPrimary: true },
    { carrierId: 'c1', name: 'Sarah Chen', role: 'billing', phone: '214-555-0102', email: 'billing@apexfreight.com', isPrimary: false },
    { carrierId: 'c2', name: 'Tom Kowalski', role: 'dispatch', phone: '312-555-0201', email: 'tom.k@midwestexpress.com', isPrimary: true },
    { carrierId: 'c2', name: 'Angela Davis', role: 'owner', phone: '312-555-0200', email: 'angela@midwestexpress.com', isPrimary: false },
    { carrierId: 'c3', name: 'Carlos Vega', role: 'operations', phone: '213-555-0301', email: 'carlos@pacificcoastcarriers.com', isPrimary: true },
    { carrierId: 'c3', name: 'Jenny Wu', role: 'dispatch', phone: '213-555-0302', email: 'dispatch@pacificcoastcarriers.com', isPrimary: false },
    { carrierId: 'c4', name: 'James Wilson', role: 'dispatch', phone: '704-555-0401', email: 'james@blueridgetransport.com', isPrimary: true },
    { carrierId: 'c5', name: 'Bobby Hernandez', role: 'owner', phone: '713-555-0501', email: 'bobby@lonestartucking.com', isPrimary: true },
    { carrierId: 'c5', name: 'Maria Santos', role: 'dispatch', phone: '713-555-0502', email: 'dispatch@lonestartucking.com', isPrimary: false },
    { carrierId: 'c6', name: 'Dan Kowalczyk', role: 'dispatch', phone: '313-555-0601', email: 'dan.k@greatlakesfreight.com', isPrimary: true },
    { carrierId: 'c7', name: 'Priya Patel', role: 'operations', phone: '404-555-0701', email: 'priya@sunriseexpedited.com', isPrimary: true },
    { carrierId: 'c7', name: 'Marcus Johnson', role: 'dispatch', phone: '404-555-0702', email: 'dispatch@sunriseexpedited.com', isPrimary: false },
    { carrierId: 'c8', name: 'Rachel Green', role: 'dispatch', phone: '720-555-0801', email: 'rachel@mwcarriers.com', isPrimary: true },
    { carrierId: 'c9', name: 'Luis Fernandez', role: 'dispatch', phone: '904-555-0901', email: 'luis@coastalref.com', isPrimary: true },
    { carrierId: 'c9', name: 'Kim Thompson', role: 'billing', phone: '904-555-0902', email: 'billing@coastalref.com', isPrimary: false },
    { carrierId: 'c10', name: 'Frank Williams', role: 'owner', phone: '901-555-1001', email: 'frank@swiftriverlogistics.com', isPrimary: true },
  ];

  for (const contact of contacts) {
    await db.insert(schema.carrierContacts).values(contact).onConflictDoNothing();
  }
  console.log(`Inserted ${contacts.length} contacts`);

  // ─── Insurance ────────────────────────────────────────────────────────────

  const insurance: schema.NewCarrierInsurance[] = [
    // c1 - Apex - all good
    { carrierId: 'c1', type: 'auto_liability', provider: 'Travelers Insurance', policyNumber: 'TRV-2024-001', coverageAmount: 1000000, effectiveDate: pastDate(180), expiryDate: futureDate(185), status: 'active' },
    { carrierId: 'c1', type: 'cargo', provider: 'Travelers Insurance', policyNumber: 'TRV-2024-002', coverageAmount: 100000, effectiveDate: pastDate(180), expiryDate: futureDate(185), status: 'active' },
    { carrierId: 'c1', type: 'general_liability', provider: 'Travelers Insurance', policyNumber: 'TRV-2024-003', coverageAmount: 1000000, effectiveDate: pastDate(180), expiryDate: futureDate(185), status: 'active' },
    // c2 - Midwest - expiring soon
    { carrierId: 'c2', type: 'auto_liability', provider: 'Progressive Commercial', policyNumber: 'PROG-2024-201', coverageAmount: 1000000, effectiveDate: pastDate(360), expiryDate: futureDate(5), status: 'expiring_soon' },
    { carrierId: 'c2', type: 'cargo', provider: 'Progressive Commercial', policyNumber: 'PROG-2024-202', coverageAmount: 100000, effectiveDate: pastDate(360), expiryDate: futureDate(5), status: 'expiring_soon' },
    // c3 - Pacific - all good
    { carrierId: 'c3', type: 'auto_liability', provider: 'Great West Casualty', policyNumber: 'GWC-2024-301', coverageAmount: 1000000, effectiveDate: pastDate(90), expiryDate: futureDate(275), status: 'active' },
    { carrierId: 'c3', type: 'cargo', provider: 'Great West Casualty', policyNumber: 'GWC-2024-302', coverageAmount: 250000, effectiveDate: pastDate(90), expiryDate: futureDate(275), status: 'active' },
    // c4 - Blue Ridge - expiring soon
    { carrierId: 'c4', type: 'auto_liability', provider: 'Canal Insurance', policyNumber: 'CAN-2024-401', coverageAmount: 1000000, effectiveDate: pastDate(355), expiryDate: futureDate(10), status: 'expiring_soon' },
    { carrierId: 'c4', type: 'cargo', provider: 'Canal Insurance', policyNumber: 'CAN-2024-402', coverageAmount: 100000, effectiveDate: pastDate(355), expiryDate: futureDate(10), status: 'expiring_soon' },
    // c5 - Lone Star - good
    { carrierId: 'c5', type: 'auto_liability', provider: 'National Indemnity', policyNumber: 'NI-2024-501', coverageAmount: 1000000, effectiveDate: pastDate(120), expiryDate: futureDate(245), status: 'active' },
    { carrierId: 'c5', type: 'cargo', provider: 'National Indemnity', policyNumber: 'NI-2024-502', coverageAmount: 100000, effectiveDate: pastDate(120), expiryDate: futureDate(245), status: 'active' },
    // c6 - Great Lakes - 3 weeks out
    { carrierId: 'c6', type: 'auto_liability', provider: 'Old Republic', policyNumber: 'OR-2024-601', coverageAmount: 1000000, effectiveDate: pastDate(345), expiryDate: futureDate(20), status: 'expiring_soon' },
    { carrierId: 'c6', type: 'cargo', provider: 'Old Republic', policyNumber: 'OR-2024-602', coverageAmount: 100000, effectiveDate: pastDate(345), expiryDate: futureDate(20), status: 'expiring_soon' },
    // c7 - Sunrise - all good
    { carrierId: 'c7', type: 'auto_liability', provider: 'Zurich North America', policyNumber: 'ZNA-2024-701', coverageAmount: 1000000, effectiveDate: pastDate(60), expiryDate: futureDate(305), status: 'active' },
    { carrierId: 'c7', type: 'cargo', provider: 'Zurich North America', policyNumber: 'ZNA-2024-702', coverageAmount: 100000, effectiveDate: pastDate(60), expiryDate: futureDate(305), status: 'active' },
    // c8 - Mountain West - expired
    { carrierId: 'c8', type: 'auto_liability', provider: 'State Auto', policyNumber: 'SA-2023-801', coverageAmount: 1000000, effectiveDate: pastDate(365), expiryDate: pastDate(5), status: 'expired' },
    { carrierId: 'c8', type: 'cargo', provider: 'State Auto', policyNumber: 'SA-2023-802', coverageAmount: 100000, effectiveDate: pastDate(365), expiryDate: pastDate(5), status: 'expired' },
    // c9 - Coastal - good
    { carrierId: 'c9', type: 'auto_liability', provider: 'Sentry Insurance', policyNumber: 'SNT-2024-901', coverageAmount: 1000000, effectiveDate: pastDate(45), expiryDate: futureDate(320), status: 'active' },
    { carrierId: 'c9', type: 'cargo', provider: 'Sentry Insurance', policyNumber: 'SNT-2024-902', coverageAmount: 500000, effectiveDate: pastDate(45), expiryDate: futureDate(320), status: 'active' },
    // c10 - Swift River - expired
    { carrierId: 'c10', type: 'auto_liability', provider: 'Protective Insurance', policyNumber: 'PRO-2023-1001', coverageAmount: 1000000, effectiveDate: pastDate(400), expiryDate: pastDate(35), status: 'expired' },
    { carrierId: 'c10', type: 'cargo', provider: 'Protective Insurance', policyNumber: 'PRO-2023-1002', coverageAmount: 100000, effectiveDate: pastDate(400), expiryDate: pastDate(35), status: 'expired' },
  ];

  for (const ins of insurance) {
    await db.insert(schema.carrierInsurance).values(ins).onConflictDoNothing();
  }
  console.log(`Inserted ${insurance.length} insurance records`);

  // ─── Rates ────────────────────────────────────────────────────────────────

  const rates: schema.NewCarrierRate[] = [
    // Apex - TX to CA
    { carrierId: 'c1', originCity: 'Dallas', originState: 'TX', destCity: 'Los Angeles', destState: 'CA', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 2.45, effectiveDate: pastDate(90), expiryDate: futureDate(90) },
    { carrierId: 'c1', originCity: 'Houston', originState: 'TX', destCity: 'Phoenix', destState: 'AZ', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 2.20, effectiveDate: pastDate(90), expiryDate: futureDate(90) },
    { carrierId: 'c1', originCity: 'Dallas', originState: 'TX', destCity: 'Las Vegas', destState: 'NV', equipmentType: 'reefer', rateType: 'per_mile', rateAmount: 3.10, effectiveDate: pastDate(90), expiryDate: futureDate(90) },
    // Pacific - CA lanes
    { carrierId: 'c3', originCity: 'Los Angeles', originState: 'CA', destCity: 'Dallas', destState: 'TX', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 2.35, effectiveDate: pastDate(60), expiryDate: futureDate(120) },
    { carrierId: 'c3', originCity: 'San Francisco', originState: 'CA', destCity: 'Phoenix', destState: 'AZ', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 2.15, effectiveDate: pastDate(60), expiryDate: futureDate(120) },
    { carrierId: 'c3', originCity: 'Los Angeles', originState: 'CA', destCity: 'Denver', destState: 'CO', equipmentType: 'reefer', rateType: 'per_mile', rateAmount: 3.25, effectiveDate: pastDate(60), expiryDate: futureDate(120) },
    // Midwest - IL to Southeast
    { carrierId: 'c2', originCity: 'Chicago', originState: 'IL', destCity: 'Atlanta', destState: 'GA', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 2.30, effectiveDate: pastDate(180), expiryDate: futureDate(5) },
    { carrierId: 'c2', originCity: 'Chicago', originState: 'IL', destCity: 'Dallas', destState: 'TX', equipmentType: 'flatbed', rateType: 'per_mile', rateAmount: 2.75, effectiveDate: pastDate(180), expiryDate: futureDate(5) },
    // Blue Ridge - Southeast to Northeast
    { carrierId: 'c4', originCity: 'Charlotte', originState: 'NC', destCity: 'New York', destState: 'NY', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 2.60, effectiveDate: pastDate(30), expiryDate: futureDate(150) },
    { carrierId: 'c4', originCity: 'Atlanta', originState: 'GA', destCity: 'Philadelphia', destState: 'PA', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 2.55, effectiveDate: pastDate(30), expiryDate: futureDate(150) },
    // Lone Star - TX heavy haul
    { carrierId: 'c5', originCity: 'Houston', originState: 'TX', destCity: 'Dallas', destState: 'TX', equipmentType: 'flatbed', rateType: 'flat', rateAmount: 850, effectiveDate: pastDate(120), expiryDate: futureDate(60) },
    { carrierId: 'c5', originCity: 'Dallas', originState: 'TX', destCity: 'Oklahoma City', destState: 'OK', equipmentType: 'flatbed', rateType: 'flat', rateAmount: 950, effectiveDate: pastDate(120), expiryDate: futureDate(60) },
    // Sunrise - Expedited Southeast to Northeast
    { carrierId: 'c7', originCity: 'Atlanta', originState: 'GA', destCity: 'New York', destState: 'NY', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 3.50, effectiveDate: pastDate(14), expiryDate: futureDate(180) },
    { carrierId: 'c7', originCity: 'Miami', originState: 'FL', destCity: 'Boston', destState: 'MA', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 3.75, effectiveDate: pastDate(14), expiryDate: futureDate(180) },
    // Coastal - Reefer FL to Northeast
    { carrierId: 'c9', originCity: 'Miami', originState: 'FL', destCity: 'New York', destState: 'NY', equipmentType: 'reefer', rateType: 'per_mile', rateAmount: 3.20, effectiveDate: pastDate(45), expiryDate: futureDate(270) },
    { carrierId: 'c9', originCity: 'Jacksonville', originState: 'FL', destCity: 'Philadelphia', destState: 'PA', equipmentType: 'reefer', rateType: 'per_mile', rateAmount: 3.05, effectiveDate: pastDate(45), expiryDate: futureDate(270) },
    // Great Lakes - Midwest
    { carrierId: 'c6', originCity: 'Detroit', originState: 'MI', destCity: 'Chicago', destState: 'IL', equipmentType: 'dry_van', rateType: 'flat', rateAmount: 650, effectiveDate: pastDate(200), expiryDate: futureDate(20) },
    { carrierId: 'c6', originCity: 'Cleveland', originState: 'OH', destCity: 'Atlanta', destState: 'GA', equipmentType: 'dry_van', rateType: 'per_mile', rateAmount: 2.40, effectiveDate: pastDate(200), expiryDate: futureDate(20) },
  ];

  for (const rate of rates) {
    await db.insert(schema.carrierRates).values(rate).onConflictDoNothing();
  }
  console.log(`Inserted ${rates.length} rate records`);

  // ─── Performance ──────────────────────────────────────────────────────────

  const performance: schema.NewCarrierPerformance[] = [
    // Apex - consistently great
    { carrierId: 'c1', shipmentRef: 'SHP-10001', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 3, communicationScore: 5, recordedAt: pastDate(60) + 'T10:00:00Z' },
    { carrierId: 'c1', shipmentRef: 'SHP-10002', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 3, communicationScore: 5, recordedAt: pastDate(45) + 'T10:00:00Z' },
    { carrierId: 'c1', shipmentRef: 'SHP-10003', pickupOnTime: true, deliveryOnTime: false, damageReported: false, claimFiled: false, transitDays: 4, communicationScore: 4, recordedAt: pastDate(30) + 'T10:00:00Z' },
    { carrierId: 'c1', shipmentRef: 'SHP-10004', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 3, communicationScore: 5, recordedAt: pastDate(15) + 'T10:00:00Z' },
    // Midwest
    { carrierId: 'c2', shipmentRef: 'SHP-20001', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 2, communicationScore: 4, recordedAt: pastDate(90) + 'T10:00:00Z' },
    { carrierId: 'c2', shipmentRef: 'SHP-20002', pickupOnTime: false, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 2, communicationScore: 3, recordedAt: pastDate(60) + 'T10:00:00Z' },
    { carrierId: 'c2', shipmentRef: 'SHP-20003', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 2, communicationScore: 4, recordedAt: pastDate(30) + 'T10:00:00Z' },
    // Pacific
    { carrierId: 'c3', shipmentRef: 'SHP-30001', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 4, communicationScore: 5, recordedAt: pastDate(45) + 'T10:00:00Z' },
    { carrierId: 'c3', shipmentRef: 'SHP-30002', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 4, communicationScore: 4, recordedAt: pastDate(20) + 'T10:00:00Z' },
    // Blue Ridge
    { carrierId: 'c4', shipmentRef: 'SHP-40001', pickupOnTime: false, deliveryOnTime: false, damageReported: false, claimFiled: false, transitDays: 2, communicationScore: 3, recordedAt: pastDate(45) + 'T10:00:00Z' },
    { carrierId: 'c4', shipmentRef: 'SHP-40002', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 2, communicationScore: 4, recordedAt: pastDate(15) + 'T10:00:00Z' },
    // Sunrise - top performer
    { carrierId: 'c7', shipmentRef: 'SHP-70001', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 1, communicationScore: 5, recordedAt: pastDate(30) + 'T10:00:00Z' },
    { carrierId: 'c7', shipmentRef: 'SHP-70002', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 1, communicationScore: 5, recordedAt: pastDate(14) + 'T10:00:00Z' },
    { carrierId: 'c7', shipmentRef: 'SHP-70003', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 1, communicationScore: 5, recordedAt: pastDate(7) + 'T10:00:00Z' },
    // Coastal
    { carrierId: 'c9', shipmentRef: 'SHP-90001', pickupOnTime: true, deliveryOnTime: true, damageReported: false, claimFiled: false, transitDays: 3, communicationScore: 4, recordedAt: pastDate(60) + 'T10:00:00Z' },
    { carrierId: 'c9', shipmentRef: 'SHP-90002', pickupOnTime: true, deliveryOnTime: false, damageReported: true, claimFiled: false, transitDays: 4, communicationScore: 3, recordedAt: pastDate(30) + 'T10:00:00Z' },
    // Swift River - issues
    { carrierId: 'c10', shipmentRef: 'SHP-100001', pickupOnTime: false, deliveryOnTime: false, damageReported: true, claimFiled: true, transitDays: 5, communicationScore: 2, recordedAt: pastDate(90) + 'T10:00:00Z' },
    { carrierId: 'c10', shipmentRef: 'SHP-100002', pickupOnTime: true, deliveryOnTime: false, damageReported: false, claimFiled: false, transitDays: 4, communicationScore: 2, recordedAt: pastDate(45) + 'T10:00:00Z' },
  ];

  for (const perf of performance) {
    await db.insert(schema.carrierPerformance).values(perf).onConflictDoNothing();
  }
  console.log(`Inserted ${performance.length} performance records`);

  // ─── Carrier Vetting ─────────────────────────────────────────────────────

  console.log('Seeding carrier vetting records...');

  const vettingRecords: schema.NewCarrierVetting[] = [
    // c1 - Apex - fully approved, all checks passed
    { carrierId: 'c1', checkType: 'authority', status: 'passed', checkedAt: pastDate(35) + 'T00:00:00Z', checkedBy: 'Admin', notes: 'Active MC, verified via FMCSA' },
    { carrierId: 'c1', checkType: 'insurance_verified', status: 'passed', checkedAt: pastDate(35) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c1', checkType: 'cargo_coverage', status: 'passed', checkedAt: pastDate(35) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c1', checkType: 'general_liability', status: 'passed', checkedAt: pastDate(35) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c1', checkType: 'workers_comp', status: 'passed', checkedAt: pastDate(35) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c1', checkType: 'safety_rating', status: 'passed', checkedAt: pastDate(35) + 'T00:00:00Z', checkedBy: 'Admin', notes: 'Satisfactory rating confirmed' },
    { carrierId: 'c1', checkType: 'w9_received', status: 'passed', checkedAt: pastDate(35) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c1', checkType: 'contract_signed', status: 'passed', checkedAt: pastDate(34) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c1', checkType: 'reference_checked', status: 'passed', checkedAt: pastDate(34) + 'T00:00:00Z', checkedBy: 'Admin', notes: 'Verified 3 broker references' },
    { carrierId: 'c1', checkType: 'drug_testing', status: 'passed', checkedAt: pastDate(34) + 'T00:00:00Z', checkedBy: 'Admin' },

    // c3 - Pacific Coast - fully approved
    { carrierId: 'c3', checkType: 'authority', status: 'passed', checkedAt: pastDate(20) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c3', checkType: 'insurance_verified', status: 'passed', checkedAt: pastDate(20) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c3', checkType: 'cargo_coverage', status: 'passed', checkedAt: pastDate(20) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c3', checkType: 'safety_rating', status: 'passed', checkedAt: pastDate(20) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c3', checkType: 'w9_received', status: 'passed', checkedAt: pastDate(20) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c3', checkType: 'contract_signed', status: 'passed', checkedAt: pastDate(19) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c3', checkType: 'general_liability', status: 'passed', checkedAt: pastDate(19) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c3', checkType: 'workers_comp', status: 'waived', checkedAt: pastDate(19) + 'T00:00:00Z', checkedBy: 'Admin', notes: 'Owner-operator, waived' },
    { carrierId: 'c3', checkType: 'reference_checked', status: 'passed', checkedAt: pastDate(18) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c3', checkType: 'drug_testing', status: 'passed', checkedAt: pastDate(18) + 'T00:00:00Z', checkedBy: 'Admin' },

    // c2 - Midwest - in progress, partial checks done
    { carrierId: 'c2', checkType: 'authority', status: 'passed', checkedAt: pastDate(5) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c2', checkType: 'insurance_verified', status: 'passed', checkedAt: pastDate(5) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c2', checkType: 'cargo_coverage', status: 'passed', checkedAt: pastDate(5) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c2', checkType: 'safety_rating', status: 'passed', checkedAt: pastDate(5) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c2', checkType: 'w9_received', status: 'passed', checkedAt: pastDate(4) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c2', checkType: 'contract_signed', status: 'pending', notes: 'Awaiting signed carrier agreement' },
    { carrierId: 'c2', checkType: 'reference_checked', status: 'pending', notes: 'Need to call 2 broker references' },

    // c4 - Blue Ridge - in progress, some checks
    { carrierId: 'c4', checkType: 'authority', status: 'passed', checkedAt: pastDate(3) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c4', checkType: 'insurance_verified', status: 'passed', checkedAt: pastDate(3) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c4', checkType: 'safety_rating', status: 'failed', checkedAt: pastDate(3) + 'T00:00:00Z', checkedBy: 'Admin', notes: 'Conditional rating — requires review' },
    { carrierId: 'c4', checkType: 'w9_received', status: 'pending' },
    { carrierId: 'c4', checkType: 'contract_signed', status: 'pending' },

    // c5 - Lone Star - in progress
    { carrierId: 'c5', checkType: 'authority', status: 'passed', checkedAt: pastDate(2) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c5', checkType: 'insurance_verified', status: 'passed', checkedAt: pastDate(2) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c5', checkType: 'cargo_coverage', status: 'passed', checkedAt: pastDate(2) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c5', checkType: 'safety_rating', status: 'passed', checkedAt: pastDate(2) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c5', checkType: 'w9_received', status: 'pending', notes: 'W-9 requested, awaiting response' },
    { carrierId: 'c5', checkType: 'contract_signed', status: 'pending' },

    // c7 - Sunrise - vetted (all required done, not yet formally approved)
    { carrierId: 'c7', checkType: 'authority', status: 'passed', checkedAt: pastDate(7) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c7', checkType: 'insurance_verified', status: 'passed', checkedAt: pastDate(7) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c7', checkType: 'cargo_coverage', status: 'passed', checkedAt: pastDate(7) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c7', checkType: 'safety_rating', status: 'passed', checkedAt: pastDate(7) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c7', checkType: 'w9_received', status: 'passed', checkedAt: pastDate(7) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c7', checkType: 'contract_signed', status: 'passed', checkedAt: pastDate(6) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c7', checkType: 'general_liability', status: 'passed', checkedAt: pastDate(6) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c7', checkType: 'drug_testing', status: 'passed', checkedAt: pastDate(6) + 'T00:00:00Z', checkedBy: 'Admin' },

    // c9 - Coastal - in progress
    { carrierId: 'c9', checkType: 'authority', status: 'passed', checkedAt: pastDate(1) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c9', checkType: 'insurance_verified', status: 'passed', checkedAt: pastDate(1) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c9', checkType: 'safety_rating', status: 'passed', checkedAt: pastDate(1) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c9', checkType: 'w9_received', status: 'pending' },
    { carrierId: 'c9', checkType: 'contract_signed', status: 'pending' },

    // c10 - Swift River - rejected, has some failed checks
    { carrierId: 'c10', checkType: 'authority', status: 'passed', checkedAt: pastDate(15) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c10', checkType: 'insurance_verified', status: 'failed', checkedAt: pastDate(15) + 'T00:00:00Z', checkedBy: 'Admin', notes: 'Auto liability expired — DO NOT USE' },
    { carrierId: 'c10', checkType: 'cargo_coverage', status: 'failed', checkedAt: pastDate(15) + 'T00:00:00Z', checkedBy: 'Admin', notes: 'Cargo policy expired' },
    { carrierId: 'c10', checkType: 'safety_rating', status: 'passed', checkedAt: pastDate(15) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c10', checkType: 'w9_received', status: 'passed', checkedAt: pastDate(15) + 'T00:00:00Z', checkedBy: 'Admin' },
    { carrierId: 'c10', checkType: 'contract_signed', status: 'passed', checkedAt: pastDate(14) + 'T00:00:00Z', checkedBy: 'Admin' },
  ];

  for (const vetting of vettingRecords) {
    await db.insert(schema.carrierVetting).values(vetting).onConflictDoNothing();
  }
  console.log(`Inserted ${vettingRecords.length} vetting records`);

  console.log('\n✅ Seed complete! Database is ready.');
}

seed().catch(console.error).finally(() => sqlite.close());
