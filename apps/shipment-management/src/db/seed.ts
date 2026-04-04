import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { shipments, shipmentEvents, shipmentDocuments, checkCalls } from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'shipment-management.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

function id(prefix: string, n: number) {
  return `${prefix}_${String(n).padStart(3, '0')}`;
}

// Today's date helpers
const now = new Date();
function daysAgo(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function tsAgo(days: number, hours = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

const TODAY = daysAgo(0);

async function main() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });
  console.log('Migrations complete. Seeding...');

  // Clear existing data
  await db.delete(checkCalls);
  await db.delete(shipmentDocuments);
  await db.delete(shipmentEvents);
  await db.delete(shipments);

  // ─── SHIPMENTS ────────────────────────────────────────────────────────────────

  const shipmentData = [
    // ── QUOTE (2) ──────────────────────────────────────────────────────────────
    {
      id: id('shp', 1),
      shipmentNumber: 'SHP-2025-0001',
      status: 'quote' as const,
      customerId: 'cust_001',
      customerName: 'Dallas Distribution Co',
      originCity: 'Chicago', originState: 'IL', originZip: '60601',
      destCity: 'Dallas', destState: 'TX', destZip: '75201',
      equipmentType: 'dry_van' as const,
      pickupDate: daysFromNow(3), deliveryDate: daysFromNow(5),
      customerRate: 2800, carrierRate: null, margin: null, marginPct: null,
      rateType: 'flat' as const, miles: 921,
      commodity: 'Consumer Electronics', weight: 18000,
      healthScore: 50, docScore: 0,
      hasBol: false, hasPod: false, hasRateCon: false, hasInvoice: false,
      quotedAt: tsAgo(1),
      createdBy: 'jessica.morgan',
      tags: ['new', 'electronics'],
      notes: 'Customer wants temperature-controlled option pricing too',
    },
    {
      id: id('shp', 2),
      shipmentNumber: 'SHP-2025-0002',
      status: 'quote' as const,
      customerId: 'cust_002',
      customerName: 'Pacific Foods Inc',
      originCity: 'Los Angeles', originState: 'CA', originZip: '90001',
      destCity: 'Phoenix', destState: 'AZ', destZip: '85001',
      equipmentType: 'reefer' as const,
      pickupDate: daysFromNow(4), deliveryDate: daysFromNow(5),
      customerRate: 1900, carrierRate: null, margin: null, marginPct: null,
      rateType: 'flat' as const, miles: 372,
      commodity: 'Frozen Foods', weight: 22000,
      healthScore: 50, docScore: 0,
      hasBol: false, hasPod: false, hasRateCon: false, hasInvoice: false,
      quotedAt: tsAgo(0, 4),
      createdBy: 'jessica.morgan',
      tags: ['reefer', 'food'],
    },

    // ── BOOKED (3) ─────────────────────────────────────────────────────────────
    {
      id: id('shp', 3),
      shipmentNumber: 'SHP-2025-0003',
      status: 'booked' as const,
      customerId: 'cust_003',
      customerName: 'Great Lakes Auto Parts',
      originCity: 'Detroit', originState: 'MI', originZip: '48201',
      destCity: 'Nashville', destState: 'TN', destZip: '37201',
      equipmentType: 'flatbed' as const,
      pickupDate: daysFromNow(2), deliveryDate: daysFromNow(4),
      carrierId: 'c4',
      carrierName: 'Blue Ridge Transport',
      carrierContact: 'James Wilson',
      carrierPhone: '704-555-0401',
      customerRate: 3200, carrierRate: 2560, margin: 640, marginPct: 20.0,
      rateType: 'flat' as const, miles: 554,
      loadRef: 'LR-20250003',
      commodity: 'Auto Parts', weight: 26000,
      healthScore: 65, docScore: 25,
      hasBol: false, hasPod: false, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(2), bookedAt: tsAgo(1),
      createdBy: 'mike.chen',
      tags: ['flatbed', 'auto'],
    },
    {
      id: id('shp', 4),
      shipmentNumber: 'SHP-2025-0004',
      status: 'booked' as const,
      customerId: 'cust_004',
      customerName: 'Lone Star Retail Group',
      originCity: 'Memphis', originState: 'TN', originZip: '38101',
      destCity: 'Houston', destState: 'TX', destZip: '77001',
      equipmentType: 'dry_van' as const,
      pickupDate: daysFromNow(1), deliveryDate: daysFromNow(2),
      carrierId: 'c5',
      carrierName: 'Lone Star Trucking Co.',
      carrierContact: 'Bobby Hernandez',
      carrierPhone: '713-555-0501',
      customerRate: 2100, carrierRate: 1680, margin: 420, marginPct: 20.0,
      rateType: 'flat' as const, miles: 561,
      loadRef: 'LR-20250004',
      commodity: 'Retail Merchandise', weight: 16000,
      healthScore: 70, docScore: 25,
      hasBol: false, hasPod: false, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(3), bookedAt: tsAgo(1, 6),
      createdBy: 'jessica.morgan',
      tags: ['retail'],
    },
    {
      id: id('shp', 5),
      shipmentNumber: 'SHP-2025-0005',
      status: 'booked' as const,
      customerId: 'cust_005',
      customerName: 'Sunrise Agricultural LLC',
      originCity: 'Fresno', originState: 'CA', originZip: '93701',
      destCity: 'Las Vegas', destState: 'NV', destZip: '89101',
      equipmentType: 'reefer' as const,
      pickupDate: daysFromNow(3), deliveryDate: daysFromNow(4),
      carrierId: 'c9',
      carrierName: 'Coastal Refrigerated Transport',
      carrierContact: 'Luis Fernandez',
      carrierPhone: '904-555-0901',
      customerRate: 1600, carrierRate: 1280, margin: 320, marginPct: 20.0,
      rateType: 'flat' as const, miles: 398,
      loadRef: 'LR-20250005',
      commodity: 'Fresh Produce', weight: 20000,
      healthScore: 68, docScore: 25,
      hasBol: false, hasPod: false, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(2), bookedAt: tsAgo(0, 8),
      createdBy: 'mike.chen',
      tags: ['reefer', 'produce'],
    },

    // ── DISPATCHED (3) ─────────────────────────────────────────────────────────
    {
      id: id('shp', 6),
      shipmentNumber: 'SHP-2025-0006',
      status: 'dispatched' as const,
      customerId: 'cust_006',
      customerName: 'Midwest Building Supply',
      originCity: 'Kansas City', originState: 'MO', originZip: '64101',
      destCity: 'Denver', destState: 'CO', destZip: '80201',
      equipmentType: 'flatbed' as const,
      pickupDate: TODAY, deliveryDate: daysFromNow(2),
      carrierId: 'c8',
      carrierName: 'Mountain West Carriers',
      carrierContact: 'Rachel Green',
      carrierPhone: '720-555-0801',
      customerRate: 3800, carrierRate: 3040, margin: 760, marginPct: 20.0,
      rateType: 'flat' as const, miles: 601,
      loadRef: 'LR-20250006',
      commodity: 'Building Materials', weight: 42000,
      specialInstructions: 'Oversize load — permits required',
      healthScore: 72, docScore: 50,
      hasBol: true, hasPod: false, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(4), bookedAt: tsAgo(3), dispatchedAt: tsAgo(0, 2),
      createdBy: 'jessica.morgan',
      tags: ['flatbed', 'oversize'],
    },
    {
      id: id('shp', 7),
      shipmentNumber: 'SHP-2025-0007',
      status: 'dispatched' as const,
      customerId: 'cust_001',
      customerName: 'Dallas Distribution Co',
      originCity: 'Atlanta', originState: 'GA', originZip: '30301',
      destCity: 'Charlotte', destState: 'NC', destZip: '28201',
      equipmentType: 'dry_van' as const,
      pickupDate: TODAY, deliveryDate: daysFromNow(1),
      carrierId: 'c7',
      carrierName: 'Sunrise Expedited Services',
      carrierContact: 'Priya Patel',
      carrierPhone: '404-555-0701',
      customerRate: 1450, carrierRate: 1160, margin: 290, marginPct: 20.0,
      rateType: 'flat' as const, miles: 244,
      loadRef: 'LR-20250007',
      commodity: 'Electronics Components', weight: 8000,
      healthScore: 75, docScore: 50,
      hasBol: true, hasPod: false, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(5), bookedAt: tsAgo(3), dispatchedAt: tsAgo(0, 3),
      createdBy: 'mike.chen',
      tags: ['expedited'],
    },
    {
      id: id('shp', 8),
      shipmentNumber: 'SHP-2025-0008',
      status: 'dispatched' as const,
      customerId: 'cust_007',
      customerName: 'Atlantic Health Systems',
      originCity: 'Philadelphia', originState: 'PA', originZip: '19101',
      destCity: 'Boston', destState: 'MA', destZip: '02101',
      equipmentType: 'dry_van' as const,
      pickupDate: TODAY, deliveryDate: daysFromNow(1),
      carrierId: 'c2',
      carrierName: 'Midwest Express Logistics',
      carrierContact: 'Tom Kowalski',
      carrierPhone: '312-555-0201',
      customerRate: 1850, carrierRate: 1480, margin: 370, marginPct: 20.0,
      rateType: 'flat' as const, miles: 296,
      loadRef: 'LR-20250008',
      commodity: 'Medical Supplies', weight: 6500,
      specialInstructions: 'Handle with care — fragile medical equipment',
      healthScore: 78, docScore: 50,
      hasBol: true, hasPod: false, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(4), bookedAt: tsAgo(2), dispatchedAt: tsAgo(0, 4),
      createdBy: 'jessica.morgan',
      tags: ['medical', 'fragile'],
    },

    // ── IN TRANSIT (4) ─────────────────────────────────────────────────────────
    {
      id: id('shp', 9),
      shipmentNumber: 'SHP-2025-0009',
      status: 'in_transit' as const,
      customerId: 'cust_004',
      customerName: 'Lone Star Retail Group',
      originCity: 'Chicago', originState: 'IL', originZip: '60601',
      destCity: 'Dallas', destState: 'TX', destZip: '75201',
      equipmentType: 'dry_van' as const,
      pickupDate: daysAgo(1), deliveryDate: TODAY,
      carrierId: 'c1',
      carrierName: 'Apex Freight Solutions',
      carrierContact: 'Mike Rodriguez',
      carrierPhone: '214-555-0101',
      customerRate: 2950, carrierRate: 2360, margin: 590, marginPct: 20.0,
      rateType: 'flat' as const, miles: 921,
      loadRef: 'LR-20250009',
      commodity: 'General Merchandise', weight: 21000,
      healthScore: 80, docScore: 50,
      hasBol: true, hasPod: false, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(5), bookedAt: tsAgo(4), dispatchedAt: tsAgo(2),
      pickedUpAt: tsAgo(1, 6),
      pickupOnTime: true,
      createdBy: 'mike.chen',
      tags: ['retail'],
    },
    {
      id: id('shp', 10),
      shipmentNumber: 'SHP-2025-0010',
      status: 'in_transit' as const,
      customerId: 'cust_008',
      customerName: 'Rocky Mountain Beverages',
      originCity: 'Denver', originState: 'CO', originZip: '80201',
      destCity: 'Seattle', destState: 'WA', destZip: '98101',
      equipmentType: 'reefer' as const,
      pickupDate: daysAgo(2), deliveryDate: daysFromNow(1),
      carrierId: 'c3',
      carrierName: 'Pacific Coast Carriers',
      carrierContact: 'Carlos Vega',
      carrierPhone: '213-555-0301',
      customerRate: 4200, carrierRate: 3276, margin: 924, marginPct: 22.0,
      rateType: 'flat' as const, miles: 1320,
      loadRef: 'LR-20250010',
      commodity: 'Craft Beer & Spirits', weight: 28000,
      healthScore: 85, docScore: 75,
      hasBol: true, hasPod: false, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(7), bookedAt: tsAgo(5), dispatchedAt: tsAgo(3),
      pickedUpAt: tsAgo(2, 4),
      pickupOnTime: true,
      createdBy: 'jessica.morgan',
      tags: ['reefer', 'beverage'],
    },
    {
      id: id('shp', 11),
      shipmentNumber: 'SHP-2025-0011',
      status: 'in_transit' as const,
      customerId: 'cust_003',
      customerName: 'Great Lakes Auto Parts',
      originCity: 'Cleveland', originState: 'OH', originZip: '44101',
      destCity: 'St. Louis', destState: 'MO', destZip: '63101',
      equipmentType: 'flatbed' as const,
      pickupDate: daysAgo(1), deliveryDate: TODAY,
      carrierId: 'c6',
      carrierName: 'Great Lakes Freight',
      carrierContact: 'Dan Kowalczyk',
      carrierPhone: '313-555-0601',
      customerRate: 2600, carrierRate: 2132, margin: 468, marginPct: 18.0,
      rateType: 'flat' as const, miles: 533,
      loadRef: 'LR-20250011',
      commodity: 'Steel Coils', weight: 44000,
      healthScore: 60, docScore: 25,
      hasBol: true, hasPod: false, hasRateCon: false, hasInvoice: false,
      // Missing rate_con — alert candidate
      quotedAt: tsAgo(5), bookedAt: tsAgo(3), dispatchedAt: tsAgo(2),
      pickedUpAt: tsAgo(1, 8),
      pickupOnTime: false,
      createdBy: 'mike.chen',
      notes: 'Late pickup — driver stuck in traffic at origin',
      tags: ['flatbed', 'steel', 'alert'],
    },
    {
      id: id('shp', 12),
      shipmentNumber: 'SHP-2025-0012',
      status: 'in_transit' as const,
      customerId: 'cust_005',
      customerName: 'Sunrise Agricultural LLC',
      originCity: 'Stockton', originState: 'CA', originZip: '95201',
      destCity: 'Salt Lake City', destState: 'UT', destZip: '84101',
      equipmentType: 'reefer' as const,
      pickupDate: daysAgo(2), deliveryDate: daysFromNow(1),
      carrierId: 'c9',
      carrierName: 'Coastal Refrigerated Transport',
      carrierContact: 'Luis Fernandez',
      carrierPhone: '904-555-0901',
      customerRate: 2200, carrierRate: 1760, margin: 440, marginPct: 20.0,
      rateType: 'flat' as const, miles: 628,
      loadRef: 'LR-20250012',
      commodity: 'Stone Fruit', weight: 19000,
      healthScore: 75, docScore: 50,
      hasBol: true, hasPod: false, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(6), bookedAt: tsAgo(4), dispatchedAt: tsAgo(3),
      pickedUpAt: tsAgo(2, 5),
      pickupOnTime: true,
      createdBy: 'jessica.morgan',
      tags: ['reefer', 'produce'],
    },

    // ── DELIVERED (3) ──────────────────────────────────────────────────────────
    {
      id: id('shp', 13),
      shipmentNumber: 'SHP-2025-0013',
      status: 'delivered' as const,
      customerId: 'cust_006',
      customerName: 'Midwest Building Supply',
      originCity: 'Minneapolis', originState: 'MN', originZip: '55401',
      destCity: 'Chicago', destState: 'IL', destZip: '60601',
      equipmentType: 'dry_van' as const,
      pickupDate: daysAgo(4), deliveryDate: daysAgo(2),
      carrierId: 'c2',
      carrierName: 'Midwest Express Logistics',
      carrierContact: 'Tom Kowalski',
      carrierPhone: '312-555-0201',
      customerRate: 1750, carrierRate: 1400, margin: 350, marginPct: 20.0,
      rateType: 'flat' as const, miles: 409,
      loadRef: 'LR-20250013',
      commodity: 'Hardware & Tools', weight: 14000,
      healthScore: 82, docScore: 75,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: false,
      // Missing invoice — alert candidate
      quotedAt: tsAgo(7), bookedAt: tsAgo(6), dispatchedAt: tsAgo(5),
      pickedUpAt: tsAgo(4, 7), deliveredAt: tsAgo(2, 5),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'mike.chen',
      tags: ['hardware'],
    },
    {
      id: id('shp', 14),
      shipmentNumber: 'SHP-2025-0014',
      status: 'delivered' as const,
      customerId: 'cust_002',
      customerName: 'Pacific Foods Inc',
      originCity: 'Portland', originState: 'OR', originZip: '97201',
      destCity: 'San Francisco', destState: 'CA', destZip: '94101',
      equipmentType: 'reefer' as const,
      pickupDate: daysAgo(3), deliveryDate: daysAgo(2),
      carrierId: 'c3',
      carrierName: 'Pacific Coast Carriers',
      carrierContact: 'Carlos Vega',
      carrierPhone: '213-555-0301',
      customerRate: 1950, carrierRate: 1560, margin: 390, marginPct: 20.0,
      rateType: 'flat' as const, miles: 638,
      loadRef: 'LR-20250014',
      commodity: 'Organic Dairy', weight: 17000,
      healthScore: 88, docScore: 75,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: false,
      // Missing invoice — alert candidate
      quotedAt: tsAgo(8), bookedAt: tsAgo(6), dispatchedAt: tsAgo(4),
      pickedUpAt: tsAgo(3, 8), deliveredAt: tsAgo(2, 3),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'jessica.morgan',
      tags: ['reefer', 'dairy'],
    },
    {
      id: id('shp', 15),
      shipmentNumber: 'SHP-2025-0015',
      status: 'delivered' as const,
      customerId: 'cust_001',
      customerName: 'Dallas Distribution Co',
      originCity: 'Dallas', destCity: 'Oklahoma City', destState: 'OK', destZip: '73101',
      originState: 'TX', originZip: '75201',
      equipmentType: 'dry_van' as const,
      pickupDate: daysAgo(2), deliveryDate: daysAgo(1),
      carrierId: 'c5',
      carrierName: 'Lone Star Trucking Co.',
      carrierContact: 'Maria Santos',
      carrierPhone: '713-555-0502',
      customerRate: 1350, carrierRate: 1107, margin: 243, marginPct: 18.0,
      rateType: 'flat' as const, miles: 206,
      loadRef: 'LR-20250015',
      commodity: 'Consumer Goods', weight: 12000,
      healthScore: 78, docScore: 75,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(6), bookedAt: tsAgo(4), dispatchedAt: tsAgo(3),
      pickedUpAt: tsAgo(2, 9), deliveredAt: tsAgo(1, 4),
      pickupOnTime: true, deliveryOnTime: false,
      createdBy: 'mike.chen',
      notes: 'Delivery was 2 hours late — traffic on I-35',
      tags: ['consumer-goods'],
    },

    // ── INVOICED (3) ───────────────────────────────────────────────────────────
    {
      id: id('shp', 16),
      shipmentNumber: 'SHP-2025-0016',
      status: 'invoiced' as const,
      customerId: 'cust_007',
      customerName: 'Atlantic Health Systems',
      originCity: 'New York', originState: 'NY', originZip: '10001',
      destCity: 'Washington', destState: 'DC', destZip: '20001',
      equipmentType: 'dry_van' as const,
      pickupDate: daysAgo(8), deliveryDate: daysAgo(7),
      carrierId: 'c2',
      carrierName: 'Midwest Express Logistics',
      carrierContact: 'Tom Kowalski',
      carrierPhone: '312-555-0201',
      customerRate: 1650, carrierRate: 1320, margin: 330, marginPct: 20.0,
      rateType: 'flat' as const, miles: 227,
      loadRef: 'LR-20250016',
      invoiceRef: 'INV-2025-0016',
      commodity: 'Medical Devices', weight: 7500,
      healthScore: 90, docScore: 100,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: true,
      quotedAt: tsAgo(12), bookedAt: tsAgo(10), dispatchedAt: tsAgo(9),
      pickedUpAt: tsAgo(8, 7), deliveredAt: tsAgo(7, 4),
      invoicedAt: tsAgo(5),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'jessica.morgan',
      tags: ['medical', 'invoiced'],
    },
    {
      id: id('shp', 17),
      shipmentNumber: 'SHP-2025-0017',
      status: 'invoiced' as const,
      customerId: 'cust_008',
      customerName: 'Rocky Mountain Beverages',
      originCity: 'Denver', originState: 'CO', originZip: '80201',
      destCity: 'Albuquerque', destState: 'NM', destZip: '87101',
      equipmentType: 'reefer' as const,
      pickupDate: daysAgo(10), deliveryDate: daysAgo(9),
      carrierId: 'c8',
      carrierName: 'Mountain West Carriers',
      carrierContact: 'Rachel Green',
      carrierPhone: '720-555-0801',
      customerRate: 1750, carrierRate: 1365, margin: 385, marginPct: 22.0,
      rateType: 'flat' as const, miles: 451,
      loadRef: 'LR-20250017',
      invoiceRef: 'INV-2025-0017',
      commodity: 'Craft Beer', weight: 24000,
      healthScore: 92, docScore: 100,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: true,
      quotedAt: tsAgo(14), bookedAt: tsAgo(12), dispatchedAt: tsAgo(11),
      pickedUpAt: tsAgo(10, 7), deliveredAt: tsAgo(9, 5),
      invoicedAt: tsAgo(7),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'mike.chen',
      tags: ['reefer', 'beverage'],
    },
    {
      id: id('shp', 18),
      shipmentNumber: 'SHP-2025-0018',
      status: 'invoiced' as const,
      customerId: 'cust_004',
      customerName: 'Lone Star Retail Group',
      originCity: 'Houston', originState: 'TX', originZip: '77001',
      destCity: 'New Orleans', destState: 'LA', destZip: '70112',
      equipmentType: 'dry_van' as const,
      pickupDate: daysAgo(9), deliveryDate: daysAgo(8),
      carrierId: 'c1',
      carrierName: 'Apex Freight Solutions',
      carrierContact: 'Mike Rodriguez',
      carrierPhone: '214-555-0101',
      customerRate: 1550, carrierRate: 1240, margin: 310, marginPct: 20.0,
      rateType: 'flat' as const, miles: 348,
      loadRef: 'LR-20250018',
      invoiceRef: 'INV-2025-0018',
      commodity: 'Apparel', weight: 11000,
      healthScore: 88, docScore: 100,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: true,
      quotedAt: tsAgo(13), bookedAt: tsAgo(11), dispatchedAt: tsAgo(10),
      pickedUpAt: tsAgo(9, 8), deliveredAt: tsAgo(8, 3),
      invoicedAt: tsAgo(6),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'jessica.morgan',
      tags: ['retail', 'apparel'],
    },

    // ── PAID (2) ───────────────────────────────────────────────────────────────
    {
      id: id('shp', 19),
      shipmentNumber: 'SHP-2025-0019',
      status: 'paid' as const,
      customerId: 'cust_003',
      customerName: 'Great Lakes Auto Parts',
      originCity: 'Indianapolis', originState: 'IN', originZip: '46201',
      destCity: 'Columbus', destState: 'OH', destZip: '43201',
      equipmentType: 'flatbed' as const,
      pickupDate: daysAgo(18), deliveryDate: daysAgo(17),
      carrierId: 'c6',
      carrierName: 'Great Lakes Freight',
      carrierContact: 'Dan Kowalczyk',
      carrierPhone: '313-555-0601',
      customerRate: 2400, carrierRate: 1920, margin: 480, marginPct: 20.0,
      rateType: 'flat' as const, miles: 176,
      loadRef: 'LR-20250019',
      invoiceRef: 'INV-2025-0019',
      carrierPaymentRef: 'PAY-C-20250019',
      commodity: 'Engine Components', weight: 38000,
      healthScore: 95, docScore: 100,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: true,
      quotedAt: tsAgo(22), bookedAt: tsAgo(21), dispatchedAt: tsAgo(20),
      pickedUpAt: tsAgo(18, 7), deliveredAt: tsAgo(17, 4),
      invoicedAt: tsAgo(15), paidAt: tsAgo(5),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'mike.chen',
      tags: ['flatbed', 'auto', 'paid'],
    },
    {
      id: id('shp', 20),
      shipmentNumber: 'SHP-2025-0020',
      status: 'paid' as const,
      customerId: 'cust_002',
      customerName: 'Pacific Foods Inc',
      originCity: 'San Diego', originState: 'CA', originZip: '92101',
      destCity: 'Las Vegas', destState: 'NV', destZip: '89101',
      equipmentType: 'reefer' as const,
      pickupDate: daysAgo(20), deliveryDate: daysAgo(19),
      carrierId: 'c3',
      carrierName: 'Pacific Coast Carriers',
      carrierContact: 'Jenny Wu',
      carrierPhone: '213-555-0302',
      customerRate: 1450, carrierRate: 1131, margin: 319, marginPct: 22.0,
      rateType: 'flat' as const, miles: 333,
      loadRef: 'LR-20250020',
      invoiceRef: 'INV-2025-0020',
      carrierPaymentRef: 'PAY-C-20250020',
      commodity: 'Specialty Foods', weight: 15000,
      healthScore: 97, docScore: 100,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: true,
      quotedAt: tsAgo(24), bookedAt: tsAgo(22), dispatchedAt: tsAgo(21),
      pickedUpAt: tsAgo(20, 8), deliveredAt: tsAgo(19, 5),
      invoicedAt: tsAgo(17), paidAt: tsAgo(7),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'jessica.morgan',
      tags: ['reefer', 'food', 'paid'],
    },

    // ── CLOSED (3) ─────────────────────────────────────────────────────────────
    {
      id: id('shp', 21),
      shipmentNumber: 'SHP-2025-0021',
      status: 'closed' as const,
      customerId: 'cust_001',
      customerName: 'Dallas Distribution Co',
      originCity: 'Dallas', originState: 'TX', originZip: '75201',
      destCity: 'Austin', destState: 'TX', destZip: '78701',
      equipmentType: 'dry_van' as const,
      pickupDate: daysAgo(30), deliveryDate: daysAgo(29),
      carrierId: 'c5',
      carrierName: 'Lone Star Trucking Co.',
      carrierContact: 'Bobby Hernandez',
      carrierPhone: '713-555-0501',
      customerRate: 950, carrierRate: 760, margin: 190, marginPct: 20.0,
      rateType: 'flat' as const, miles: 195,
      loadRef: 'LR-20250021',
      invoiceRef: 'INV-2025-0021',
      carrierPaymentRef: 'PAY-C-20250021',
      commodity: 'Office Furniture', weight: 8000,
      healthScore: 98, docScore: 100,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: true,
      quotedAt: tsAgo(35), bookedAt: tsAgo(33), dispatchedAt: tsAgo(31),
      pickedUpAt: tsAgo(30, 7), deliveredAt: tsAgo(29, 4),
      invoicedAt: tsAgo(27), paidAt: tsAgo(18), closedAt: tsAgo(15),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'mike.chen',
      tags: ['closed'],
    },
    {
      id: id('shp', 22),
      shipmentNumber: 'SHP-2025-0022',
      status: 'closed' as const,
      customerId: 'cust_006',
      customerName: 'Midwest Building Supply',
      originCity: 'St. Louis', originState: 'MO', originZip: '63101',
      destCity: 'Louisville', destState: 'KY', destZip: '40201',
      equipmentType: 'dry_van' as const,
      pickupDate: daysAgo(28), deliveryDate: daysAgo(27),
      carrierId: 'c2',
      carrierName: 'Midwest Express Logistics',
      carrierContact: 'Angela Davis',
      carrierPhone: '312-555-0200',
      customerRate: 1200, carrierRate: 960, margin: 240, marginPct: 20.0,
      rateType: 'flat' as const, miles: 263,
      loadRef: 'LR-20250022',
      invoiceRef: 'INV-2025-0022',
      carrierPaymentRef: 'PAY-C-20250022',
      commodity: 'Lumber', weight: 35000,
      healthScore: 93, docScore: 100,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: true,
      quotedAt: tsAgo(32), bookedAt: tsAgo(30), dispatchedAt: tsAgo(29),
      pickedUpAt: tsAgo(28, 6), deliveredAt: tsAgo(27, 5),
      invoicedAt: tsAgo(25), paidAt: tsAgo(16), closedAt: tsAgo(12),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'jessica.morgan',
      tags: ['closed', 'lumber'],
    },
    {
      id: id('shp', 23),
      shipmentNumber: 'SHP-2025-0023',
      status: 'closed' as const,
      customerId: 'cust_008',
      customerName: 'Rocky Mountain Beverages',
      originCity: 'Salt Lake City', originState: 'UT', originZip: '84101',
      destCity: 'Boise', destState: 'ID', destZip: '83701',
      equipmentType: 'reefer' as const,
      pickupDate: daysAgo(25), deliveryDate: daysAgo(24),
      carrierId: 'c8',
      carrierName: 'Mountain West Carriers',
      carrierContact: 'Rachel Green',
      carrierPhone: '720-555-0801',
      customerRate: 1650, carrierRate: 1287, margin: 363, marginPct: 22.0,
      rateType: 'flat' as const, miles: 340,
      loadRef: 'LR-20250023',
      invoiceRef: 'INV-2025-0023',
      carrierPaymentRef: 'PAY-C-20250023',
      commodity: 'Sparkling Water', weight: 22000,
      healthScore: 90, docScore: 100,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: true,
      quotedAt: tsAgo(29), bookedAt: tsAgo(27), dispatchedAt: tsAgo(26),
      pickedUpAt: tsAgo(25, 8), deliveredAt: tsAgo(24, 6),
      invoicedAt: tsAgo(22), paidAt: tsAgo(13), closedAt: tsAgo(10),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'mike.chen',
      tags: ['closed', 'reefer'],
    },

    // ── CANCELLED (1) ──────────────────────────────────────────────────────────
    {
      id: id('shp', 24),
      shipmentNumber: 'SHP-2025-0024',
      status: 'cancelled' as const,
      customerId: 'cust_007',
      customerName: 'Atlantic Health Systems',
      originCity: 'Miami', originState: 'FL', originZip: '33101',
      destCity: 'Tampa', destState: 'FL', destZip: '33601',
      equipmentType: 'dry_van' as const,
      pickupDate: daysAgo(5), deliveryDate: daysAgo(4),
      customerRate: 1100, carrierRate: null, margin: null, marginPct: null,
      rateType: 'flat' as const, miles: 280,
      commodity: 'Lab Equipment', weight: 9000,
      healthScore: 0, docScore: 0,
      hasBol: false, hasPod: false, hasRateCon: false, hasInvoice: false,
      quotedAt: tsAgo(8), bookedAt: tsAgo(7), cancelledAt: tsAgo(5),
      cancellationReason: 'Customer cancelled — shipment rescheduled for next month',
      createdBy: 'jessica.morgan',
      tags: ['cancelled'],
    },

    // ── CLAIM (1) ──────────────────────────────────────────────────────────────
    {
      id: id('shp', 25),
      shipmentNumber: 'SHP-2025-0025',
      status: 'claim' as const,
      customerId: 'cust_005',
      customerName: 'Sunrise Agricultural LLC',
      originCity: 'Sacramento', originState: 'CA', originZip: '95801',
      destCity: 'Portland', destState: 'OR', destZip: '97201',
      equipmentType: 'reefer' as const,
      pickupDate: daysAgo(14), deliveryDate: daysAgo(12),
      carrierId: 'c9',
      carrierName: 'Coastal Refrigerated Transport',
      carrierContact: 'Kim Thompson',
      carrierPhone: '904-555-0902',
      customerRate: 2800, carrierRate: 2100, margin: 700, marginPct: 25.0,
      rateType: 'flat' as const, miles: 588,
      loadRef: 'LR-20250025',
      invoiceRef: 'INV-2025-0025',
      commodity: 'Strawberries', weight: 18000,
      healthScore: 15, docScore: 75,
      hasBol: true, hasPod: true, hasRateCon: true, hasInvoice: false,
      quotedAt: tsAgo(18), bookedAt: tsAgo(16), dispatchedAt: tsAgo(15),
      pickedUpAt: tsAgo(14, 7), deliveredAt: tsAgo(12, 6),
      pickupOnTime: true, deliveryOnTime: true,
      createdBy: 'mike.chen',
      notes: 'Reefer unit malfunctioned — product arrived damaged. Claim filed 2025-03-22.',
      tags: ['claim', 'reefer', 'damage'],
    },
  ];

  await db.insert(shipments).values(shipmentData);
  console.log(`Inserted ${shipmentData.length} shipments`);

  // ─── SHIPMENT EVENTS ─────────────────────────────────────────────────────────

  const eventsData = [
    // SHP-001 (quote)
    { id: 'evt_001', shipmentId: id('shp', 1), eventType: 'status_change' as const, description: 'Shipment created as quote', oldValue: null, newValue: 'quote', createdBy: 'jessica.morgan', createdAt: tsAgo(1) },
    { id: 'evt_002', shipmentId: id('shp', 1), eventType: 'note' as const, description: 'Customer requested reefer pricing alternative', oldValue: null, newValue: null, createdBy: 'jessica.morgan', createdAt: tsAgo(0, 3) },

    // SHP-002 (quote)
    { id: 'evt_003', shipmentId: id('shp', 2), eventType: 'status_change' as const, description: 'Shipment created as quote', oldValue: null, newValue: 'quote', createdBy: 'jessica.morgan', createdAt: tsAgo(0, 4) },

    // SHP-003 (booked)
    { id: 'evt_004', shipmentId: id('shp', 3), eventType: 'status_change' as const, description: 'Shipment created as quote', oldValue: null, newValue: 'quote', createdBy: 'mike.chen', createdAt: tsAgo(2) },
    { id: 'evt_005', shipmentId: id('shp', 3), eventType: 'carrier_assign' as const, description: 'Carrier assigned: Blue Ridge Transport', oldValue: null, newValue: 'Blue Ridge Transport', createdBy: 'mike.chen', createdAt: tsAgo(1, 8) },
    { id: 'evt_006', shipmentId: id('shp', 3), eventType: 'status_change' as const, description: 'Status changed to Booked', oldValue: 'quote', newValue: 'booked', createdBy: 'mike.chen', createdAt: tsAgo(1) },
    { id: 'evt_007', shipmentId: id('shp', 3), eventType: 'document' as const, description: 'Rate confirmation uploaded', oldValue: null, newValue: 'rate_confirmation', createdBy: 'mike.chen', createdAt: tsAgo(1) },

    // SHP-004 (booked)
    { id: 'evt_008', shipmentId: id('shp', 4), eventType: 'status_change' as const, description: 'Shipment created as quote', oldValue: null, newValue: 'quote', createdBy: 'jessica.morgan', createdAt: tsAgo(3) },
    { id: 'evt_009', shipmentId: id('shp', 4), eventType: 'carrier_assign' as const, description: 'Carrier assigned: Lone Star Trucking Co.', oldValue: null, newValue: 'Lone Star Trucking Co.', createdBy: 'jessica.morgan', createdAt: tsAgo(1, 9) },
    { id: 'evt_010', shipmentId: id('shp', 4), eventType: 'status_change' as const, description: 'Status changed to Booked', oldValue: 'quote', newValue: 'booked', createdBy: 'jessica.morgan', createdAt: tsAgo(1, 6) },
    { id: 'evt_011', shipmentId: id('shp', 4), eventType: 'document' as const, description: 'Rate confirmation uploaded', oldValue: null, newValue: 'rate_confirmation', createdBy: 'jessica.morgan', createdAt: tsAgo(1, 6) },

    // SHP-005 (booked)
    { id: 'evt_012', shipmentId: id('shp', 5), eventType: 'status_change' as const, description: 'Shipment created as quote', oldValue: null, newValue: 'quote', createdBy: 'mike.chen', createdAt: tsAgo(2) },
    { id: 'evt_013', shipmentId: id('shp', 5), eventType: 'carrier_assign' as const, description: 'Carrier assigned: Coastal Refrigerated Transport', oldValue: null, newValue: 'Coastal Refrigerated Transport', createdBy: 'mike.chen', createdAt: tsAgo(0, 10) },
    { id: 'evt_014', shipmentId: id('shp', 5), eventType: 'status_change' as const, description: 'Status changed to Booked', oldValue: 'quote', newValue: 'booked', createdBy: 'mike.chen', createdAt: tsAgo(0, 8) },

    // SHP-006 (dispatched)
    { id: 'evt_015', shipmentId: id('shp', 6), eventType: 'status_change' as const, description: 'Shipment created as quote', oldValue: null, newValue: 'quote', createdBy: 'jessica.morgan', createdAt: tsAgo(4) },
    { id: 'evt_016', shipmentId: id('shp', 6), eventType: 'status_change' as const, description: 'Status changed to Booked', oldValue: 'quote', newValue: 'booked', createdBy: 'jessica.morgan', createdAt: tsAgo(3) },
    { id: 'evt_017', shipmentId: id('shp', 6), eventType: 'document' as const, description: 'BOL uploaded', oldValue: null, newValue: 'bol', createdBy: 'jessica.morgan', createdAt: tsAgo(0, 5) },
    { id: 'evt_018', shipmentId: id('shp', 6), eventType: 'status_change' as const, description: 'Status changed to Dispatched', oldValue: 'booked', newValue: 'dispatched', createdBy: 'jessica.morgan', createdAt: tsAgo(0, 2) },

    // SHP-007 (dispatched)
    { id: 'evt_019', shipmentId: id('shp', 7), eventType: 'status_change' as const, description: 'Status changed to Dispatched', oldValue: 'booked', newValue: 'dispatched', createdBy: 'mike.chen', createdAt: tsAgo(0, 3) },
    { id: 'evt_020', shipmentId: id('shp', 7), eventType: 'check_call' as const, description: 'Driver confirmed — heading to pickup', oldValue: null, newValue: null, createdBy: 'mike.chen', createdAt: tsAgo(0, 3) },

    // SHP-008 (dispatched)
    { id: 'evt_021', shipmentId: id('shp', 8), eventType: 'status_change' as const, description: 'Status changed to Dispatched', oldValue: 'booked', newValue: 'dispatched', createdBy: 'jessica.morgan', createdAt: tsAgo(0, 4) },

    // SHP-009 (in_transit)
    { id: 'evt_022', shipmentId: id('shp', 9), eventType: 'status_change' as const, description: 'Status changed to In Transit', oldValue: 'dispatched', newValue: 'in_transit', createdBy: 'mike.chen', createdAt: tsAgo(1, 6) },
    { id: 'evt_023', shipmentId: id('shp', 9), eventType: 'check_call' as const, description: 'Check call — driver in Springfield IL, on schedule', oldValue: null, newValue: null, createdBy: 'mike.chen', createdAt: tsAgo(1, 2) },
    { id: 'evt_024', shipmentId: id('shp', 9), eventType: 'check_call' as const, description: 'Check call — crossing into Missouri, ETA on track', oldValue: null, newValue: null, createdBy: 'jessica.morgan', createdAt: tsAgo(0, 6) },

    // SHP-010 (in_transit)
    { id: 'evt_025', shipmentId: id('shp', 10), eventType: 'status_change' as const, description: 'Status changed to In Transit', oldValue: 'dispatched', newValue: 'in_transit', createdBy: 'jessica.morgan', createdAt: tsAgo(2, 4) },
    { id: 'evt_026', shipmentId: id('shp', 10), eventType: 'check_call' as const, description: 'Check call — Salt Lake City UT, temp holding at 34F', oldValue: null, newValue: null, createdBy: 'jessica.morgan', createdAt: tsAgo(1, 3) },
    { id: 'evt_027', shipmentId: id('shp', 10), eventType: 'document' as const, description: 'Rate confirmation uploaded', oldValue: null, newValue: 'rate_confirmation', createdBy: 'jessica.morgan', createdAt: tsAgo(5) },

    // SHP-011 (in_transit — late pickup)
    { id: 'evt_028', shipmentId: id('shp', 11), eventType: 'status_change' as const, description: 'Status changed to In Transit', oldValue: 'dispatched', newValue: 'in_transit', createdBy: 'mike.chen', createdAt: tsAgo(1, 8) },
    { id: 'evt_029', shipmentId: id('shp', 11), eventType: 'note' as const, description: 'Late pickup — driver arrived 3 hours late due to traffic', oldValue: null, newValue: null, createdBy: 'mike.chen', createdAt: tsAgo(1, 7) },
    { id: 'evt_030', shipmentId: id('shp', 11), eventType: 'check_call' as const, description: 'Check call — driver in Columbus OH, behind schedule', oldValue: null, newValue: null, createdBy: 'mike.chen', createdAt: tsAgo(0, 5) },

    // SHP-012 (in_transit)
    { id: 'evt_031', shipmentId: id('shp', 12), eventType: 'status_change' as const, description: 'Status changed to In Transit', oldValue: 'dispatched', newValue: 'in_transit', createdBy: 'jessica.morgan', createdAt: tsAgo(2, 5) },
    { id: 'evt_032', shipmentId: id('shp', 12), eventType: 'check_call' as const, description: 'Check call — Reno NV, temp 36F, on schedule', oldValue: null, newValue: null, createdBy: 'jessica.morgan', createdAt: tsAgo(1) },

    // SHP-016 (invoiced)
    { id: 'evt_033', shipmentId: id('shp', 16), eventType: 'status_change' as const, description: 'Status changed to Delivered', oldValue: 'in_transit', newValue: 'delivered', createdBy: 'mike.chen', createdAt: tsAgo(7, 4) },
    { id: 'evt_034', shipmentId: id('shp', 16), eventType: 'invoice' as const, description: 'Invoice INV-2025-0016 sent to Atlantic Health Systems', oldValue: null, newValue: 'INV-2025-0016', createdBy: 'jessica.morgan', createdAt: tsAgo(5) },

    // SHP-019 (paid)
    { id: 'evt_035', shipmentId: id('shp', 19), eventType: 'payment' as const, description: 'Payment received from Great Lakes Auto Parts — $2,400.00', oldValue: null, newValue: '2400.00', createdBy: 'jessica.morgan', createdAt: tsAgo(5) },

    // SHP-024 (cancelled)
    { id: 'evt_036', shipmentId: id('shp', 24), eventType: 'status_change' as const, description: 'Status changed to Cancelled', oldValue: 'booked', newValue: 'cancelled', createdBy: 'jessica.morgan', createdAt: tsAgo(5) },
    { id: 'evt_037', shipmentId: id('shp', 24), eventType: 'note' as const, description: 'Cancellation reason: Customer rescheduled shipment to next month', oldValue: null, newValue: null, createdBy: 'jessica.morgan', createdAt: tsAgo(5) },

    // SHP-025 (claim)
    { id: 'evt_038', shipmentId: id('shp', 25), eventType: 'note' as const, description: 'Reefer unit malfunction reported — product temp exceeded 50F for 4 hours', oldValue: null, newValue: null, createdBy: 'mike.chen', createdAt: tsAgo(12) },
    { id: 'evt_039', shipmentId: id('shp', 25), eventType: 'status_change' as const, description: 'Status changed to Claim', oldValue: 'delivered', newValue: 'claim', createdBy: 'mike.chen', createdAt: tsAgo(11) },
    { id: 'evt_040', shipmentId: id('shp', 25), eventType: 'note' as const, description: 'Claim filed with Coastal Refrigerated Transport — $18,000 for damaged strawberries', oldValue: null, newValue: null, createdBy: 'jessica.morgan', createdAt: tsAgo(10) },
  ];

  await db.insert(shipmentEvents).values(eventsData);
  console.log(`Inserted ${eventsData.length} shipment events`);

  // ─── SHIPMENT DOCUMENTS ──────────────────────────────────────────────────────

  const docsData = [
    // Rate confirmations (booked/dispatched/in_transit)
    { id: 'doc_001', shipmentId: id('shp', 3), docType: 'rate_confirmation' as const, filename: 'rate_con_SHP-2025-0003.pdf', docRef: 'RC-2025-0003', uploadedAt: tsAgo(1) },
    { id: 'doc_002', shipmentId: id('shp', 4), docType: 'rate_confirmation' as const, filename: 'rate_con_SHP-2025-0004.pdf', docRef: 'RC-2025-0004', uploadedAt: tsAgo(1, 6) },
    { id: 'doc_003', shipmentId: id('shp', 5), docType: 'rate_confirmation' as const, filename: 'rate_con_SHP-2025-0005.pdf', docRef: 'RC-2025-0005', uploadedAt: tsAgo(0, 8) },
    { id: 'doc_004', shipmentId: id('shp', 6), docType: 'rate_confirmation' as const, filename: 'rate_con_SHP-2025-0006.pdf', docRef: 'RC-2025-0006', uploadedAt: tsAgo(3) },
    { id: 'doc_005', shipmentId: id('shp', 7), docType: 'rate_confirmation' as const, filename: 'rate_con_SHP-2025-0007.pdf', docRef: 'RC-2025-0007', uploadedAt: tsAgo(3) },
    { id: 'doc_006', shipmentId: id('shp', 8), docType: 'rate_confirmation' as const, filename: 'rate_con_SHP-2025-0008.pdf', docRef: 'RC-2025-0008', uploadedAt: tsAgo(2) },
    { id: 'doc_007', shipmentId: id('shp', 9), docType: 'rate_confirmation' as const, filename: 'rate_con_SHP-2025-0009.pdf', docRef: 'RC-2025-0009', uploadedAt: tsAgo(4) },
    { id: 'doc_008', shipmentId: id('shp', 10), docType: 'rate_confirmation' as const, filename: 'rate_con_SHP-2025-0010.pdf', docRef: 'RC-2025-0010', uploadedAt: tsAgo(5) },
    { id: 'doc_009', shipmentId: id('shp', 12), docType: 'rate_confirmation' as const, filename: 'rate_con_SHP-2025-0012.pdf', docRef: 'RC-2025-0012', uploadedAt: tsAgo(4) },

    // BOLs (dispatched+)
    { id: 'doc_010', shipmentId: id('shp', 6), docType: 'bol' as const, filename: 'bol_SHP-2025-0006.pdf', docRef: 'BOL-2025-0006', uploadedAt: tsAgo(0, 5) },
    { id: 'doc_011', shipmentId: id('shp', 7), docType: 'bol' as const, filename: 'bol_SHP-2025-0007.pdf', docRef: 'BOL-2025-0007', uploadedAt: tsAgo(0, 3) },
    { id: 'doc_012', shipmentId: id('shp', 8), docType: 'bol' as const, filename: 'bol_SHP-2025-0008.pdf', docRef: 'BOL-2025-0008', uploadedAt: tsAgo(0, 4) },
    { id: 'doc_013', shipmentId: id('shp', 9), docType: 'bol' as const, filename: 'bol_SHP-2025-0009.pdf', docRef: 'BOL-2025-0009', uploadedAt: tsAgo(2) },
    { id: 'doc_014', shipmentId: id('shp', 10), docType: 'bol' as const, filename: 'bol_SHP-2025-0010.pdf', docRef: 'BOL-2025-0010', uploadedAt: tsAgo(3) },

    // PODs (delivered+)
    { id: 'doc_015', shipmentId: id('shp', 25), docType: 'pod' as const, filename: 'pod_SHP-2025-0025.pdf', docRef: 'POD-2025-0025', uploadedAt: tsAgo(12, 4), notes: 'Driver noted product in poor condition at delivery' },
  ];

  await db.insert(shipmentDocuments).values(docsData);
  console.log(`Inserted ${docsData.length} shipment documents`);

  // ─── CHECK CALLS ─────────────────────────────────────────────────────────────

  const checkCallData = [
    // SHP-006 (dispatched — today pickup)
    { id: 'cc_001', shipmentId: id('shp', 6), status: 'at_pickup' as const, locationCity: 'Kansas City', locationState: 'MO', eta: daysFromNow(2), notes: 'Driver on site, starting to load', contactMethod: 'phone' as const, createdAt: tsAgo(0, 2) },

    // SHP-007 (dispatched — today pickup)
    { id: 'cc_002', shipmentId: id('shp', 7), status: 'at_pickup' as const, locationCity: 'Atlanta', locationState: 'GA', eta: daysFromNow(1), notes: 'Driver arrived, waiting for dock', contactMethod: 'text' as const, createdAt: tsAgo(0, 3) },

    // SHP-008 (dispatched — today pickup)
    { id: 'cc_003', shipmentId: id('shp', 8), status: 'scheduled' as const, locationCity: 'Philadelphia', locationState: 'PA', eta: daysFromNow(1), notes: 'Driver confirmed pickup window 10am-12pm', contactMethod: 'phone' as const, createdAt: tsAgo(0, 4) },

    // SHP-009 (in_transit — delivery today)
    { id: 'cc_004', shipmentId: id('shp', 9), status: 'in_transit' as const, locationCity: 'Joplin', locationState: 'MO', eta: TODAY, notes: 'On schedule, ETA 2pm Dallas', contactMethod: 'tracking' as const, createdAt: tsAgo(0, 6) },
    { id: 'cc_005', shipmentId: id('shp', 9), status: 'in_transit' as const, locationCity: 'Springfield', locationState: 'MO', eta: TODAY, notes: 'Check call 8am — making good time', contactMethod: 'phone' as const, createdAt: tsAgo(1, 2) },

    // SHP-010 (in_transit)
    { id: 'cc_006', shipmentId: id('shp', 10), status: 'in_transit' as const, locationCity: 'Salt Lake City', locationState: 'UT', eta: daysFromNow(1), notes: 'Temp holding at 34F, driver rested and back on road', contactMethod: 'phone' as const, createdAt: tsAgo(1, 3) },
    { id: 'cc_007', shipmentId: id('shp', 10), status: 'in_transit' as const, locationCity: 'Twin Falls', locationState: 'ID', eta: daysFromNow(1), notes: 'Making good progress northward', contactMethod: 'tracking' as const, createdAt: tsAgo(0, 5) },

    // SHP-011 (in_transit — late, delivery today)
    { id: 'cc_008', shipmentId: id('shp', 11), status: 'delayed' as const, locationCity: 'Columbus', locationState: 'OH', eta: TODAY, notes: 'Running 3 hours behind — late pickup yesterday. Will try to make up time.', contactMethod: 'phone' as const, createdAt: tsAgo(0, 5) },
    { id: 'cc_009', shipmentId: id('shp', 11), status: 'loading' as const, locationCity: 'Cleveland', locationState: 'OH', eta: daysAgo(1), notes: 'Finally loaded, heading out late', contactMethod: 'phone' as const, createdAt: tsAgo(1, 7) },

    // SHP-012 (in_transit)
    { id: 'cc_010', shipmentId: id('shp', 12), status: 'in_transit' as const, locationCity: 'Reno', locationState: 'NV', eta: daysFromNow(1), notes: 'Temp at 36F, cherries look great', contactMethod: 'phone' as const, createdAt: tsAgo(1) },
    { id: 'cc_011', shipmentId: id('shp', 12), status: 'in_transit' as const, locationCity: 'Sacramento', locationState: 'CA', eta: daysFromNow(1), notes: 'Loaded and departing on time', contactMethod: 'text' as const, createdAt: tsAgo(2, 5) },

    // Additional check calls for dispatched loads
    { id: 'cc_012', shipmentId: id('shp', 6), status: 'loading' as const, locationCity: 'Kansas City', locationState: 'MO', eta: daysFromNow(2), notes: '50% loaded, should be done by noon', contactMethod: 'text' as const, createdAt: tsAgo(0, 1) },
    { id: 'cc_013', shipmentId: id('shp', 7), status: 'loading' as const, locationCity: 'Atlanta', locationState: 'GA', eta: daysFromNow(1), notes: 'Loading complete, departing shortly', contactMethod: 'phone' as const, createdAt: tsAgo(0, 2) },

    // More in_transit check calls
    { id: 'cc_014', shipmentId: id('shp', 9), status: 'in_transit' as const, locationCity: 'Oklahoma City', locationState: 'OK', eta: TODAY, notes: '200 miles out, ETA 4pm', contactMethod: 'phone' as const, createdAt: tsAgo(0, 4) },
    { id: 'cc_015', shipmentId: id('shp', 10), status: 'in_transit' as const, locationCity: 'Denver', locationState: 'CO', eta: daysFromNow(1), notes: 'Departed Denver, heading north on I-15', contactMethod: 'phone' as const, createdAt: tsAgo(2, 4) },
    { id: 'cc_016', shipmentId: id('shp', 11), status: 'issue' as const, locationCity: 'Sandusky', locationState: 'OH', eta: TODAY, notes: 'Delayed arrival — construction on I-90. May miss delivery window.', contactMethod: 'phone' as const, createdAt: tsAgo(0, 2) },
    { id: 'cc_017', shipmentId: id('shp', 12), status: 'in_transit' as const, locationCity: 'Elko', locationState: 'NV', eta: daysFromNow(1), notes: 'Everything nominal, temp good', contactMethod: 'tracking' as const, createdAt: tsAgo(0, 8) },
    { id: 'cc_018', shipmentId: id('shp', 8), status: 'scheduled' as const, locationCity: 'Philadelphia', locationState: 'PA', eta: daysFromNow(1), notes: 'Departure confirmed for 8am tomorrow', contactMethod: 'email' as const, createdAt: tsAgo(0, 1) },
    { id: 'cc_019', shipmentId: id('shp', 9), status: 'at_delivery' as const, locationCity: 'Dallas', locationState: 'TX', eta: TODAY, notes: 'Arrived at consignee, waiting for unloading crew', contactMethod: 'phone' as const, createdAt: tsAgo(0, 1) },
    { id: 'cc_020', shipmentId: id('shp', 10), status: 'in_transit' as const, locationCity: 'Boise', locationState: 'ID', eta: daysFromNow(1), notes: 'Approaching Boise, ETA Seattle 8am tomorrow', contactMethod: 'tracking' as const, createdAt: tsAgo(0, 3) },
  ];

  await db.insert(checkCalls).values(checkCallData);
  console.log(`Inserted ${checkCallData.length} check calls`);

  console.log('\n✅ Seed complete!');
  console.log('  25 shipments (2 quote, 3 booked, 3 dispatched, 4 in_transit, 3 delivered, 3 invoiced, 2 paid, 3 closed, 1 cancelled, 1 claim)');
  console.log('  40 shipment events');
  console.log('  15 shipment documents');
  console.log('  20 check calls');
  console.log('  2 pickups today, 2 deliveries today');
  console.log('  3 with missing required docs (SHP-011 no rate_con, SHP-013/014 no invoice after delivery)');

  client.close();
}

main().catch(console.error);
