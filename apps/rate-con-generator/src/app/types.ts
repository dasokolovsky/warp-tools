export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  mc: string;
}

export interface StopInfo {
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  date: string;
  timeWindow: string;
  contactName: string;
  contactPhone: string;
}

export interface Accessorial {
  id: string;
  description: string;
  amount: string;
}

export interface RateConData {
  // Company Info
  company: CompanyInfo;

  // Load Details
  loadNumber: string;
  date: string;

  // Pickup
  pickup: StopInfo;

  // Delivery
  delivery: StopInfo;

  // Cargo
  equipment: string;
  weight: string;
  commodity: string;
  specialInstructions: string;

  // Carrier
  carrierName: string;
  carrierMC: string;
  carrierDOT: string;
  driverName: string;
  driverPhone: string;
  truckNumber: string;
  trailerNumber: string;

  // Rate
  rateAmount: string;
  rateType: 'flat' | 'per_mile';
  miles: string;
  paymentTerms: string;
  fuelSurcharge: string;
  accessorials: Accessorial[];

  // Terms
  terms: string;
}

export interface SavedTemplate {
  id: string;
  name: string;
  savedAt: string;
  data: RateConData;
}

export const EQUIPMENT_TYPES = [
  'Dry Van (53\')',
  'Reefer (53\')',
  'Flatbed (48\')',
  'Flatbed (53\')',
  'Step Deck',
  'Lowboy',
  'Conestoga',
  'Power Only',
  'Box Truck',
  'Sprinter Van',
  'Cargo Van',
  'Hot Shot (Flatbed)',
  'LTL',
  'Tanker',
  'Car Hauler',
  'Other',
];

export const PAYMENT_TERMS_OPTIONS = [
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Quick Pay (3 days)',
  'Quick Pay (5 days)',
  'Quick Pay (7 days)',
];

export const DEFAULT_TERMS = `1. CARRIER AGREEMENT: By accepting this load, carrier agrees to all terms herein. This rate confirmation constitutes a binding contract between broker and carrier.

2. RATE: The agreed rate is full and final compensation for all services unless otherwise noted. No additional charges will be accepted without prior written approval from broker.

3. INSURANCE: Carrier must maintain minimum cargo insurance of $100,000 and auto liability of $1,000,000. Carrier must name broker as additional insured upon request.

4. DELIVERY: Carrier is responsible for pickup and delivery as specified. Any delays must be reported immediately to broker.

5. LUMPER/DETENTION: Detention and lumper fees require prior written approval. Driver must obtain a detention receipt signed by shipper/receiver.

6. DOUBLE BROKERING: Carrier agrees not to re-broker, subcontract, or assign this load to any other carrier without prior written consent.

7. PAYMENT: Payment will be made within the terms stated above upon receipt of signed BOL and rate confirmation. Carrier must submit all documents within 30 days of delivery.

8. CLAIMS: Any cargo claims must be submitted in writing within 9 months of delivery date per 49 U.S.C. § 14706.

9. COMPLIANCE: Carrier certifies compliance with all applicable federal, state, and local regulations including FMCSA hours of service requirements.

10. GOVERNING LAW: This agreement shall be governed by the laws of the state in which broker is incorporated.`;

export const DEFAULT_COMPANY: CompanyInfo = {
  name: '',
  address: '',
  phone: '',
  email: '',
  mc: '',
};

export function emptyStop(): StopInfo {
  return {
    company: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    date: '',
    timeWindow: '',
    contactName: '',
    contactPhone: '',
  };
}

export function defaultRateConData(): RateConData {
  const today = new Date().toISOString().split('T')[0];
  return {
    company: { ...DEFAULT_COMPANY },
    loadNumber: '',
    date: today,
    pickup: emptyStop(),
    delivery: emptyStop(),
    equipment: "Dry Van (53')",
    weight: '',
    commodity: '',
    specialInstructions: '',
    carrierName: '',
    carrierMC: '',
    carrierDOT: '',
    driverName: '',
    driverPhone: '',
    truckNumber: '',
    trailerNumber: '',
    rateAmount: '',
    rateType: 'flat',
    miles: '',
    paymentTerms: 'Net 30',
    fuelSurcharge: '',
    accessorials: [],
    terms: DEFAULT_TERMS,
  };
}
