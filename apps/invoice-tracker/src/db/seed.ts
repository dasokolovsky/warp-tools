import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'invoice-tracker.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

// Run migrations first
console.log('Running migrations...');
migrate(db, { migrationsFolder: MIGRATIONS_PATH });
console.log('Migrations complete.');

const pastDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};
const futureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

async function seed() {
  console.log('Clearing existing data...');

  // Clear in FK-safe order
  db.delete(schema.loads);
  db.delete(schema.paymentsReceived);
  db.delete(schema.invoiceLineItems);
  db.delete(schema.carrierPayments);
  db.delete(schema.invoices);
  db.delete(schema.customers);

  // ─── Customers ─────────────────────────────────────────────────────────────
  console.log('Seeding customers...');

  const customerData: schema.NewCustomer[] = [
    {
      id: 'cust1',
      name: 'Dallas Distribution Co',
      billingContact: 'Karen Mitchell',
      email: 'billing@dallasdist.com',
      phone: '214-555-0182',
      address: '8800 Commerce Park Dr, Dallas, TX 75247',
      paymentTerms: 'net_30',
      creditLimit: 150000,
      notes: 'Excellent payer — always pays within 25 days. High volume customer.',
      status: 'active',
    },
    {
      id: 'cust2',
      name: 'Pacific Foods Inc',
      billingContact: 'James Okafor',
      email: 'ar@pacificfoods.com',
      phone: '503-555-0274',
      address: '1200 NW Industrial Way, Portland, OR 97209',
      paymentTerms: 'net_30',
      creditLimit: 200000,
      notes: 'Reefer-heavy freight. Net 30 but consistently pays 5-7 days early.',
      status: 'active',
    },
    {
      id: 'cust3',
      name: 'Great Lakes Auto Parts',
      billingContact: 'Sandra Kowalski',
      email: 'ap@greatlakesauto.com',
      phone: '313-555-0391',
      address: '4450 Mound Road, Sterling Heights, MI 48314',
      paymentTerms: 'net_45',
      creditLimit: 100000,
      notes: 'Chronically late payer — avg 15 days past due. Has been escalated twice. Keep an eye on aging.',
      status: 'active',
    },
    {
      id: 'cust4',
      name: 'Lone Star Retail Group',
      billingContact: 'Bobby Tran',
      email: 'freight.billing@lonestarretail.com',
      phone: '832-555-0147',
      address: '6500 W Sam Houston Pkwy, Houston, TX 77072',
      paymentTerms: 'net_15',
      creditLimit: 75000,
      notes: 'Small-to-mid volume. Pays fast (Net 15 terms), good relationship.',
      status: 'active',
    },
    {
      id: 'cust5',
      name: 'Sunrise Agricultural LLC',
      billingContact: 'Maria Gonzalez',
      email: 'maria.g@sunriseag.com',
      phone: '559-555-0229',
      address: '2100 E McKinley Ave, Fresno, CA 93703',
      paymentTerms: 'net_60',
      creditLimit: 250000,
      notes: 'Seasonal volume spikes in summer. Long payment terms but reliable.',
      status: 'active',
    },
    {
      id: 'cust6',
      name: 'Midwest Building Supply',
      billingContact: 'Tom Hendricks',
      email: 'ap@midwestbuild.com',
      phone: '614-555-0318',
      address: '900 Alum Creek Dr, Columbus, OH 43207',
      paymentTerms: 'net_30',
      creditLimit: 80000,
      notes: 'Flatbed and step-deck freight mainly. Consistent volume, pays on time.',
      status: 'active',
    },
    {
      id: 'cust7',
      name: 'Atlantic Health Systems',
      billingContact: 'Priya Sharma',
      email: 'priya.sharma@atlantichealth.org',
      phone: '908-555-0456',
      address: '475 South Street, Morristown, NJ 07960',
      paymentTerms: 'net_45',
      creditLimit: 120000,
      notes: 'Medical supplies — time-sensitive deliveries. Account on hold pending credit review.',
      status: 'on_hold',
    },
    {
      id: 'cust8',
      name: 'Rocky Mountain Beverages',
      billingContact: 'Chad Larsen',
      email: 'chad@rmbev.com',
      phone: '720-555-0583',
      address: '3700 Brighton Blvd, Denver, CO 80216',
      paymentTerms: 'quick_pay',
      creditLimit: 50000,
      notes: 'Uses quick pay — pays immediately via ACH with 2% discount.',
      status: 'active',
    },
  ];

  db.insert(schema.customers).values(customerData).run();

  // ─── Invoices ─────────────────────────────────────────────────────────────
  console.log('Seeding invoices...');

  const invoiceData: schema.NewInvoice[] = [
    // Dallas Distribution Co — pays on time (3 invoices)
    {
      id: 'inv1',
      invoiceNumber: 'INV-2026-0041',
      customerId: 'cust1',
      loadRef: 'LD-10041',
      status: 'paid',
      invoiceDate: pastDate(45),
      dueDate: pastDate(15),
      subtotal: 5200,
      taxAmount: 0,
      total: 5200,
      amountPaid: 5200,
      notes: 'Paid via ACH on due date.',
    },
    {
      id: 'inv2',
      invoiceNumber: 'INV-2026-0058',
      customerId: 'cust1',
      loadRef: 'LD-10058',
      status: 'paid',
      invoiceDate: pastDate(35),
      dueDate: pastDate(5),
      subtotal: 3750,
      taxAmount: 0,
      total: 3750,
      amountPaid: 3750,
      notes: '',
    },
    {
      id: 'inv3',
      invoiceNumber: 'INV-2026-0071',
      customerId: 'cust1',
      loadRef: 'LD-10071',
      status: 'sent',
      invoiceDate: pastDate(10),
      dueDate: futureDate(20),
      subtotal: 6400,
      taxAmount: 0,
      total: 6400,
      amountPaid: 0,
      notes: '',
    },
    // Pacific Foods — pays early (2 invoices)
    {
      id: 'inv4',
      invoiceNumber: 'INV-2026-0044',
      customerId: 'cust2',
      loadRef: 'LD-10044',
      status: 'paid',
      invoiceDate: pastDate(38),
      dueDate: pastDate(8),
      subtotal: 7800,
      taxAmount: 0,
      total: 7800,
      amountPaid: 7800,
      notes: 'Paid 6 days early.',
    },
    {
      id: 'inv5',
      invoiceNumber: 'INV-2026-0067',
      customerId: 'cust2',
      loadRef: 'LD-10067',
      status: 'sent',
      invoiceDate: pastDate(15),
      dueDate: futureDate(15),
      subtotal: 5600,
      taxAmount: 0,
      total: 5600,
      amountPaid: 0,
      notes: '',
    },
    // Great Lakes Auto — chronically late (3 invoices)
    {
      id: 'inv6',
      invoiceNumber: 'INV-2026-0029',
      customerId: 'cust3',
      loadRef: 'LD-10029',
      status: 'overdue',
      invoiceDate: pastDate(75),
      dueDate: pastDate(30),
      subtotal: 4100,
      taxAmount: 0,
      total: 4100,
      amountPaid: 0,
      notes: 'OVERDUE — second collection notice sent. Contact Sandra Kowalski.',
    },
    {
      id: 'inv7',
      invoiceNumber: 'INV-2026-0052',
      customerId: 'cust3',
      loadRef: 'LD-10052',
      status: 'overdue',
      invoiceDate: pastDate(60),
      dueDate: pastDate(15),
      subtotal: 3200,
      taxAmount: 0,
      total: 3200,
      amountPaid: 1500,
      notes: 'Partial payment received 5 days ago.',
    },
    {
      id: 'inv8',
      invoiceNumber: 'INV-2026-0063',
      customerId: 'cust3',
      loadRef: 'LD-10063',
      status: 'partially_paid',
      invoiceDate: pastDate(30),
      dueDate: futureDate(15),
      subtotal: 2800,
      taxAmount: 0,
      total: 2800,
      amountPaid: 1000,
      notes: 'Partial payment $1,000 received. Balance outstanding.',
    },
    // Lone Star Retail — pays fast (2 invoices)
    {
      id: 'inv9',
      invoiceNumber: 'INV-2026-0061',
      customerId: 'cust4',
      loadRef: 'LD-10061',
      status: 'paid',
      invoiceDate: pastDate(20),
      dueDate: pastDate(5),
      subtotal: 2400,
      taxAmount: 0,
      total: 2400,
      amountPaid: 2400,
      notes: 'Paid 2 days early via wire.',
    },
    {
      id: 'inv10',
      invoiceNumber: 'INV-2026-0074',
      customerId: 'cust4',
      loadRef: 'LD-10074',
      status: 'sent',
      invoiceDate: pastDate(8),
      dueDate: futureDate(7),
      subtotal: 1950,
      taxAmount: 0,
      total: 1950,
      amountPaid: 0,
      notes: '',
    },
    // Sunrise Agricultural — net 60 (1 invoice)
    {
      id: 'inv11',
      invoiceNumber: 'INV-2026-0055',
      customerId: 'cust5',
      loadRef: 'LD-10055',
      status: 'sent',
      invoiceDate: pastDate(20),
      dueDate: futureDate(40),
      subtotal: 8200,
      taxAmount: 0,
      total: 8200,
      amountPaid: 0,
      notes: 'Large reefer load — refrigerated pharmaceuticals.',
    },
    // Midwest Building — on time (1 invoice)
    {
      id: 'inv12',
      invoiceNumber: 'INV-2026-0068',
      customerId: 'cust6',
      loadRef: 'LD-10068',
      status: 'partially_paid',
      invoiceDate: pastDate(25),
      dueDate: futureDate(5),
      subtotal: 3600,
      taxAmount: 0,
      total: 3600,
      amountPaid: 1800,
      notes: 'Split payment arrangement agreed — balance due by due date.',
    },
    // Rocky Mountain Beverages — sent this month
    {
      id: 'inv13',
      invoiceNumber: 'INV-2026-0076',
      customerId: 'cust8',
      loadRef: 'LD-10076',
      status: 'sent',
      invoiceDate: pastDate(2),
      dueDate: futureDate(1),
      subtotal: 2150,
      taxAmount: 0,
      total: 2150,
      amountPaid: 0,
      notes: 'Draft — awaiting delivery confirmation before sending.',
    },
    // Sent this month
    {
      id: 'inv14',
      invoiceNumber: 'INV-2026-0077',
      customerId: 'cust1',
      loadRef: 'LD-10077',
      status: 'sent',
      invoiceDate: pastDate(1),
      dueDate: futureDate(29),
      subtotal: 4500,
      taxAmount: 0,
      total: 4500,
      amountPaid: 0,
      notes: '',
    },
    // Void invoice
    {
      id: 'inv15',
      invoiceNumber: 'INV-2026-0039',
      customerId: 'cust7',
      loadRef: 'LD-10039',
      status: 'void',
      invoiceDate: pastDate(60),
      dueDate: pastDate(15),
      subtotal: 3100,
      taxAmount: 0,
      total: 3100,
      amountPaid: 0,
      notes: 'Voided — load cancelled by customer before pickup.',
    },
  ];

  db.insert(schema.invoices).values(invoiceData).run();

  // ─── Invoice Line Items ────────────────────────────────────────────────────
  console.log('Seeding invoice line items...');

  const lineItemData: schema.NewInvoiceLineItem[] = [
    // inv1 - Dallas Distribution $5,200
    { invoiceId: 'inv1', description: 'Freight — Dallas TX to Los Angeles CA, Dry Van 53ft', quantity: 1, unitPrice: 4800, amount: 4800, lineType: 'freight' },
    { invoiceId: 'inv1', description: 'Fuel Surcharge (8.3%)', quantity: 1, unitPrice: 400, amount: 400, lineType: 'fuel_surcharge' },

    // inv2 - Dallas Distribution $3,750
    { invoiceId: 'inv2', description: 'Freight — Dallas TX to Phoenix AZ, Dry Van 53ft', quantity: 1, unitPrice: 3200, amount: 3200, lineType: 'freight' },
    { invoiceId: 'inv2', description: 'Fuel Surcharge (7.9%)', quantity: 1, unitPrice: 253, amount: 253, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv2', description: 'Liftgate Delivery', quantity: 1, unitPrice: 150, amount: 150, lineType: 'accessorial' },
    { invoiceId: 'inv2', description: 'Detention — 2 hrs at shipper', quantity: 2, unitPrice: 73.5, amount: 147, lineType: 'detention' },

    // inv3 - Dallas Distribution $6,400
    { invoiceId: 'inv3', description: 'Freight — Dallas TX to Seattle WA, Dry Van 53ft', quantity: 1, unitPrice: 5700, amount: 5700, lineType: 'freight' },
    { invoiceId: 'inv3', description: 'Fuel Surcharge (9.1%)', quantity: 1, unitPrice: 519, amount: 519, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv3', description: 'Lumper Fee — receiver requires offload', quantity: 1, unitPrice: 181, amount: 181, lineType: 'lumper' },

    // inv4 - Pacific Foods $7,800
    { invoiceId: 'inv4', description: 'Freight — Portland OR to Chicago IL, Refrigerated 53ft', quantity: 1, unitPrice: 7100, amount: 7100, lineType: 'freight' },
    { invoiceId: 'inv4', description: 'Fuel Surcharge (8.8%)', quantity: 1, unitPrice: 625, amount: 625, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv4', description: 'Temp Monitoring Fee', quantity: 1, unitPrice: 75, amount: 75, lineType: 'accessorial' },

    // inv5 - Pacific Foods $5,600
    { invoiceId: 'inv5', description: 'Freight — Portland OR to Denver CO, Refrigerated 48ft', quantity: 1, unitPrice: 5000, amount: 5000, lineType: 'freight' },
    { invoiceId: 'inv5', description: 'Fuel Surcharge (8.5%)', quantity: 1, unitPrice: 425, amount: 425, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv5', description: 'Team Driver Premium', quantity: 1, unitPrice: 175, amount: 175, lineType: 'accessorial' },

    // inv6 - Great Lakes overdue $4,100
    { invoiceId: 'inv6', description: 'Freight — Sterling Heights MI to Atlanta GA, Dry Van 53ft', quantity: 1, unitPrice: 3700, amount: 3700, lineType: 'freight' },
    { invoiceId: 'inv6', description: 'Fuel Surcharge (9.5%)', quantity: 1, unitPrice: 352, amount: 352, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv6', description: 'Inside Delivery', quantity: 1, unitPrice: 48, amount: 48, lineType: 'accessorial' },

    // inv7 - Great Lakes overdue $3,200
    { invoiceId: 'inv7', description: 'Freight — Sterling Heights MI to Nashville TN, Dry Van 53ft', quantity: 1, unitPrice: 2900, amount: 2900, lineType: 'freight' },
    { invoiceId: 'inv7', description: 'Fuel Surcharge (8.1%)', quantity: 1, unitPrice: 235, amount: 235, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv7', description: 'Detention — 3 hrs at receiver', quantity: 3, unitPrice: 21.67, amount: 65, lineType: 'detention' },

    // inv8 - Great Lakes partially paid $2,800
    { invoiceId: 'inv8', description: 'Freight — Sterling Heights MI to Charlotte NC, Dry Van 53ft', quantity: 1, unitPrice: 2600, amount: 2600, lineType: 'freight' },
    { invoiceId: 'inv8', description: 'Fuel Surcharge (7.7%)', quantity: 1, unitPrice: 200, amount: 200, lineType: 'fuel_surcharge' },

    // inv9 - Lone Star paid $2,400
    { invoiceId: 'inv9', description: 'Freight — Houston TX to Dallas TX, Dry Van 48ft', quantity: 1, unitPrice: 2100, amount: 2100, lineType: 'freight' },
    { invoiceId: 'inv9', description: 'Fuel Surcharge (8.0%)', quantity: 1, unitPrice: 168, amount: 168, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv9', description: 'Expedite Fee', quantity: 1, unitPrice: 132, amount: 132, lineType: 'accessorial' },

    // inv10 - Lone Star sent $1,950
    { invoiceId: 'inv10', description: 'Freight — Houston TX to San Antonio TX, Dry Van 48ft', quantity: 1, unitPrice: 1750, amount: 1750, lineType: 'freight' },
    { invoiceId: 'inv10', description: 'Fuel Surcharge (8.0%)', quantity: 1, unitPrice: 140, amount: 140, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv10', description: 'Liftgate — destination requires', quantity: 1, unitPrice: 60, amount: 60, lineType: 'accessorial' },

    // inv11 - Sunrise Ag $8,200
    { invoiceId: 'inv11', description: 'Freight — Fresno CA to Memphis TN, Refrigerated 53ft', quantity: 1, unitPrice: 7400, amount: 7400, lineType: 'freight' },
    { invoiceId: 'inv11', description: 'Fuel Surcharge (9.2%)', quantity: 1, unitPrice: 681, amount: 681, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv11', description: 'Continuous Temp Monitoring', quantity: 1, unitPrice: 119, amount: 119, lineType: 'accessorial' },

    // inv12 - Midwest Building $3,600
    { invoiceId: 'inv12', description: 'Freight — Columbus OH to Kansas City MO, Flatbed 48ft', quantity: 1, unitPrice: 3200, amount: 3200, lineType: 'freight' },
    { invoiceId: 'inv12', description: 'Fuel Surcharge (8.3%)', quantity: 1, unitPrice: 266, amount: 266, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv12', description: 'Tarp and Straps — flatbed load securement', quantity: 1, unitPrice: 134, amount: 134, lineType: 'accessorial' },

    // inv13 - Rocky Mountain draft $2,150
    { invoiceId: 'inv13', description: 'Freight — Denver CO to Albuquerque NM, Dry Van 48ft', quantity: 1, unitPrice: 1900, amount: 1900, lineType: 'freight' },
    { invoiceId: 'inv13', description: 'Fuel Surcharge (7.8%)', quantity: 1, unitPrice: 148, amount: 148, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv13', description: 'Appointment Scheduling Fee', quantity: 1, unitPrice: 102, amount: 102, lineType: 'accessorial' },

    // inv14 - Dallas Distribution draft $4,500
    { invoiceId: 'inv14', description: 'Freight — Dallas TX to San Diego CA, Dry Van 53ft', quantity: 1, unitPrice: 4100, amount: 4100, lineType: 'freight' },
    { invoiceId: 'inv14', description: 'Fuel Surcharge (8.5%)', quantity: 1, unitPrice: 349, amount: 349, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv14', description: 'Toll Reimbursement', quantity: 1, unitPrice: 51, amount: 51, lineType: 'accessorial' },

    // inv15 - Void $3,100
    { invoiceId: 'inv15', description: 'Freight — Morristown NJ to Boston MA, Dry Van 48ft', quantity: 1, unitPrice: 2800, amount: 2800, lineType: 'freight' },
    { invoiceId: 'inv15', description: 'Fuel Surcharge (8.4%)', quantity: 1, unitPrice: 235, amount: 235, lineType: 'fuel_surcharge' },
    { invoiceId: 'inv15', description: 'Hazmat Certification Fee', quantity: 1, unitPrice: 65, amount: 65, lineType: 'accessorial' },
  ];

  db.insert(schema.invoiceLineItems).values(lineItemData).run();

  // ─── Carrier Payments ──────────────────────────────────────────────────────
  console.log('Seeding carrier payments...');

  const carrierPaymentData: schema.NewCarrierPayment[] = [
    {
      id: 'cp1',
      carrierId: 'c1',
      carrierName: 'Apex Freight Solutions',
      loadRef: 'LD-10041',
      amount: 4200,
      payType: 'standard',
      netAmount: 4200,
      status: 'paid',
      scheduledDate: pastDate(18),
      paidDate: pastDate(18),
      referenceNumber: 'CHK-00821',
      notes: '',
    },
    {
      id: 'cp2',
      carrierId: 'c2',
      carrierName: 'Midwest Express Logistics',
      loadRef: 'LD-10044',
      amount: 6100,
      payType: 'standard',
      netAmount: 6100,
      status: 'paid',
      scheduledDate: pastDate(12),
      paidDate: pastDate(12),
      referenceNumber: 'CHK-00835',
      notes: '',
    },
    {
      id: 'cp3',
      carrierId: 'c1',
      carrierName: 'Apex Freight Solutions',
      loadRef: 'LD-10058',
      amount: 2900,
      payType: 'quick_pay',
      quickPayDiscount: 2,
      netAmount: 2842,
      status: 'paid',
      scheduledDate: pastDate(32),
      paidDate: pastDate(32),
      referenceNumber: 'ACH-00412',
      notes: 'Quick pay 2% discount applied.',
    },
    {
      id: 'cp4',
      carrierId: 'c3',
      carrierName: 'Blue Ridge Carriers',
      loadRef: 'LD-10029',
      amount: 3100,
      payType: 'standard',
      netAmount: 3100,
      status: 'paid',
      scheduledDate: pastDate(50),
      paidDate: pastDate(48),
      referenceNumber: 'CHK-00794',
      notes: '',
    },
    {
      id: 'cp5',
      carrierId: 'c4',
      carrierName: 'Summit Freight LLC',
      loadRef: 'LD-10052',
      amount: 2400,
      payType: 'standard',
      netAmount: 2400,
      status: 'approved',
      scheduledDate: futureDate(3),
      referenceNumber: '',
      notes: 'Approved for payment — check run Friday.',
    },
    {
      id: 'cp6',
      carrierId: 'c2',
      carrierName: 'Midwest Express Logistics',
      loadRef: 'LD-10063',
      amount: 2100,
      payType: 'standard',
      netAmount: 2100,
      status: 'approved',
      scheduledDate: futureDate(5),
      referenceNumber: '',
      notes: '',
    },
    {
      id: 'cp7',
      carrierId: 'c5',
      carrierName: 'Cascade Transport Inc',
      loadRef: 'LD-10067',
      amount: 4200,
      payType: 'standard',
      netAmount: 4200,
      status: 'pending',
      scheduledDate: futureDate(14),
      referenceNumber: '',
      notes: 'POD received, pending billing review.',
    },
    {
      id: 'cp8',
      carrierId: 'c1',
      carrierName: 'Apex Freight Solutions',
      loadRef: 'LD-10061',
      amount: 1800,
      payType: 'standard',
      netAmount: 1800,
      status: 'pending',
      scheduledDate: futureDate(10),
      referenceNumber: '',
      notes: '',
    },
    {
      id: 'cp9',
      carrierId: 'c3',
      carrierName: 'Blue Ridge Carriers',
      loadRef: 'LD-10068',
      amount: 2700,
      payType: 'standard',
      netAmount: 2700,
      status: 'pending',
      scheduledDate: futureDate(7),
      referenceNumber: '',
      notes: '',
    },
    {
      id: 'cp10',
      carrierId: 'c6',
      carrierName: 'Desert Wind Transport',
      loadRef: 'LD-10071',
      amount: 5100,
      payType: 'standard',
      netAmount: 5100,
      status: 'disputed',
      referenceNumber: '',
      notes: 'DISPUTED — carrier invoiced for detention not agreed upon. Awaiting resolution with carrier ops.',
    },
  ];

  db.insert(schema.carrierPayments).values(carrierPaymentData).run();

  // ─── Payments Received ─────────────────────────────────────────────────────
  console.log('Seeding payments received...');

  const paymentsReceivedData: schema.NewPaymentReceived[] = [
    // inv1 fully paid
    { invoiceId: 'inv1', amount: 5200, paymentDate: pastDate(15), paymentMethod: 'ach', referenceNumber: 'ACH-29841', notes: 'Full payment received.' },
    // inv2 fully paid
    { invoiceId: 'inv2', amount: 3750, paymentDate: pastDate(7), paymentMethod: 'wire', referenceNumber: 'WR-10392', notes: '' },
    // inv4 fully paid
    { invoiceId: 'inv4', amount: 7800, paymentDate: pastDate(14), paymentMethod: 'ach', referenceNumber: 'ACH-30112', notes: 'Paid 6 days early.' },
    // inv7 partial - Great Lakes chronic late
    { invoiceId: 'inv7', amount: 1500, paymentDate: pastDate(5), paymentMethod: 'check', referenceNumber: 'CHK-4821', notes: 'Partial — promised remaining balance within 10 days.' },
    // inv8 partial - Great Lakes
    { invoiceId: 'inv8', amount: 1000, paymentDate: pastDate(10), paymentMethod: 'check', referenceNumber: 'CHK-4836', notes: '' },
    // inv9 fully paid - Lone Star fast
    { invoiceId: 'inv9', amount: 2400, paymentDate: pastDate(7), paymentMethod: 'wire', referenceNumber: 'WR-10408', notes: 'Paid 2 days early.' },
    // inv12 partial - Midwest Building split payment
    { invoiceId: 'inv12', amount: 1800, paymentDate: pastDate(5), paymentMethod: 'ach', referenceNumber: 'ACH-30447', notes: 'First half of split payment.' },
    // inv11 - no payment yet (net 60)
    // inv3, inv5, inv10, inv13, inv14 - pending/draft
  ];

  db.insert(schema.paymentsReceived).values(paymentsReceivedData).run();

  // ─── Loads ────────────────────────────────────────────────────────────────
  console.log('Seeding loads...');

  const loadData: schema.NewLoad[] = [
    // High margin loads (20%+)
    {
      id: 'load1',
      loadRef: 'LD-10041',
      customerId: 'cust1',
      carrierId: 'c1',
      carrierName: 'Apex Freight Solutions',
      revenue: 5200,
      cost: 4200,
      invoiceId: 'inv1',
      carrierPaymentId: 'cp1',
      status: 'paid',
      pickupDate: pastDate(47),
      deliveryDate: pastDate(44),
      origin: 'Dallas, TX',
      destination: 'Los Angeles, CA',
      notes: 'Full truck — great lane. 19.2% margin.',
    },
    {
      id: 'load2',
      loadRef: 'LD-10044',
      customerId: 'cust2',
      carrierId: 'c2',
      carrierName: 'Midwest Express Logistics',
      revenue: 7800,
      cost: 6100,
      invoiceId: 'inv4',
      carrierPaymentId: 'cp2',
      status: 'paid',
      pickupDate: pastDate(40),
      deliveryDate: pastDate(36),
      origin: 'Portland, OR',
      destination: 'Chicago, IL',
      notes: 'Reefer — refrigerated produce. 21.8% margin.',
    },
    {
      id: 'load3',
      loadRef: 'LD-10058',
      customerId: 'cust1',
      carrierId: 'c1',
      carrierName: 'Apex Freight Solutions',
      revenue: 3750,
      cost: 2842,
      invoiceId: 'inv2',
      carrierPaymentId: 'cp3',
      status: 'paid',
      pickupDate: pastDate(37),
      deliveryDate: pastDate(35),
      origin: 'Dallas, TX',
      destination: 'Phoenix, AZ',
      notes: 'Quick pay carrier — net after 2% discount. 24.2% margin.',
    },
    // Medium margin loads (10-20%)
    {
      id: 'load4',
      loadRef: 'LD-10029',
      customerId: 'cust3',
      carrierId: 'c3',
      carrierName: 'Blue Ridge Carriers',
      revenue: 4100,
      cost: 3100,
      invoiceId: 'inv6',
      carrierPaymentId: 'cp4',
      status: 'delivered',
      pickupDate: pastDate(77),
      deliveryDate: pastDate(73),
      origin: 'Sterling Heights, MI',
      destination: 'Atlanta, GA',
      notes: 'Customer invoice overdue 30+ days. 24.4% margin but uncollected.',
    },
    {
      id: 'load5',
      loadRef: 'LD-10052',
      customerId: 'cust3',
      carrierId: 'c4',
      carrierName: 'Summit Freight LLC',
      revenue: 3200,
      cost: 2400,
      invoiceId: 'inv7',
      carrierPaymentId: 'cp5',
      status: 'invoiced',
      pickupDate: pastDate(62),
      deliveryDate: pastDate(58),
      origin: 'Sterling Heights, MI',
      destination: 'Nashville, TN',
      notes: 'Overdue — carrier pay approved pending customer collection. 25% margin.',
    },
    {
      id: 'load6',
      loadRef: 'LD-10061',
      customerId: 'cust4',
      carrierId: 'c1',
      carrierName: 'Apex Freight Solutions',
      revenue: 2400,
      cost: 1800,
      invoiceId: 'inv9',
      carrierPaymentId: 'cp8',
      status: 'invoiced',
      pickupDate: pastDate(22),
      deliveryDate: pastDate(20),
      origin: 'Houston, TX',
      destination: 'Dallas, TX',
      notes: '25% margin. Customer paid early.',
    },
    // Thin margin loads (<10%)
    {
      id: 'load7',
      loadRef: 'LD-10067',
      customerId: 'cust2',
      carrierId: 'c5',
      carrierName: 'Cascade Transport Inc',
      revenue: 5600,
      cost: 4200,
      invoiceId: 'inv5',
      carrierPaymentId: 'cp7',
      status: 'invoiced',
      pickupDate: pastDate(17),
      deliveryDate: pastDate(14),
      origin: 'Portland, OR',
      destination: 'Denver, CO',
      notes: 'Lost backhaul opportunity — had to reposition empty. 25% margin.',
    },
    {
      id: 'load8',
      loadRef: 'LD-10063',
      customerId: 'cust3',
      carrierId: 'c2',
      carrierName: 'Midwest Express Logistics',
      revenue: 2800,
      cost: 2100,
      invoiceId: 'inv8',
      carrierPaymentId: 'cp6',
      status: 'invoiced',
      pickupDate: pastDate(32),
      deliveryDate: pastDate(28),
      origin: 'Sterling Heights, MI',
      destination: 'Charlotte, NC',
      notes: '25% margin but customer partially paid only.',
    },
    {
      id: 'load9',
      loadRef: 'LD-10068',
      customerId: 'cust6',
      carrierId: 'c3',
      carrierName: 'Blue Ridge Carriers',
      revenue: 3600,
      cost: 2700,
      invoiceId: 'inv12',
      carrierPaymentId: 'cp9',
      status: 'invoiced',
      pickupDate: pastDate(27),
      deliveryDate: pastDate(24),
      origin: 'Columbus, OH',
      destination: 'Kansas City, MO',
      notes: 'Flatbed load — securement fees. 25% margin, split payment in progress.',
    },
    {
      id: 'load10',
      loadRef: 'LD-10071',
      customerId: 'cust1',
      carrierId: 'c6',
      carrierName: 'Desert Wind Transport',
      revenue: 6400,
      cost: 5100,
      invoiceId: 'inv3',
      carrierPaymentId: 'cp10',
      status: 'invoiced',
      pickupDate: pastDate(12),
      deliveryDate: pastDate(9),
      origin: 'Dallas, TX',
      destination: 'Seattle, WA',
      notes: 'Carrier payment disputed. 20.3% margin.',
    },
    {
      id: 'load11',
      loadRef: 'LD-10074',
      customerId: 'cust4',
      carrierId: 'c1',
      carrierName: 'Apex Freight Solutions',
      revenue: 1950,
      cost: 1550,
      invoiceId: 'inv10',
      status: 'invoiced',
      pickupDate: pastDate(10),
      deliveryDate: pastDate(8),
      origin: 'Houston, TX',
      destination: 'San Antonio, TX',
      notes: 'Short haul — thin margin 20.5%.',
    },
    {
      id: 'load12',
      loadRef: 'LD-10055',
      customerId: 'cust5',
      carrierId: 'c5',
      carrierName: 'Cascade Transport Inc',
      revenue: 8200,
      cost: 6800,
      invoiceId: 'inv11',
      status: 'invoiced',
      pickupDate: pastDate(22),
      deliveryDate: pastDate(18),
      origin: 'Fresno, CA',
      destination: 'Memphis, TN',
      notes: 'Refrigerated — high value load. 17.1% margin. Net 60 — payment due in 40 days.',
    },
  ];

  db.insert(schema.loads).values(loadData).run();

  console.log('');
  console.log('✅ Seed complete!');
  console.log(`   Customers:         ${customerData.length}`);
  console.log(`   Invoices:          ${invoiceData.length}`);
  console.log(`   Line Items:        ${lineItemData.length}`);
  console.log(`   Carrier Payments:  ${carrierPaymentData.length}`);
  console.log(`   Payments Received: ${paymentsReceivedData.length}`);
  console.log(`   Loads:             ${loadData.length}`);
}

seed().catch(console.error).finally(() => {
  sqlite.close();
});
