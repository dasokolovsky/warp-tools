/**
 * FMCSA Simulated Lookup for v1
 *
 * In production, connect to the FMCSA SAFER API:
 * https://safer.fmcsa.dot.gov/
 *
 * The SAFER Web API provides carrier authority status, safety ratings,
 * insurance information, and out-of-service history.
 */

export interface FmcsaLookupResult {
  found: boolean;
  mcNumber?: string;
  dotNumber?: string;
  legalName?: string;
  dbaName?: string;
  authorityStatus?: 'active' | 'inactive' | 'revoked';
  safetyRating?: 'satisfactory' | 'conditional' | 'unsatisfactory' | 'not_rated';
  insuranceOnFile?: boolean;
  insuranceAmount?: number;
  outOfServiceDate?: string | null;
  outOfServiceReason?: string | null;
  entityType?: string;
  operatingStatus?: string;
  lastUpdated?: string;
  simulatedNote: string;
}

// Seed data MC numbers → simulated FMCSA responses
const FMCSA_SEED_DATA: Record<string, Omit<FmcsaLookupResult, 'found' | 'simulatedNote'>> = {
  'MC-182934': {
    mcNumber: 'MC-182934',
    dotNumber: 'DOT-2847162',
    legalName: 'APEX FREIGHT SOLUTIONS LLC',
    dbaName: 'Apex Freight Solutions',
    authorityStatus: 'active',
    safetyRating: 'satisfactory',
    insuranceOnFile: true,
    insuranceAmount: 1000000,
    outOfServiceDate: null,
    outOfServiceReason: null,
    entityType: 'Carrier',
    operatingStatus: 'Authorized For Property',
    lastUpdated: '2025-11-15',
  },
  'MC-293847': {
    mcNumber: 'MC-293847',
    dotNumber: 'DOT-3948271',
    legalName: 'MIDWEST EXPRESS LOGISTICS INC',
    dbaName: 'Midwest Express Logistics',
    authorityStatus: 'active',
    safetyRating: 'satisfactory',
    insuranceOnFile: true,
    insuranceAmount: 1000000,
    outOfServiceDate: null,
    outOfServiceReason: null,
    entityType: 'Carrier',
    operatingStatus: 'Authorized For Property',
    lastUpdated: '2025-10-22',
  },
  'MC-374859': {
    mcNumber: 'MC-374859',
    dotNumber: 'DOT-4859372',
    legalName: 'PACIFIC COAST CARRIERS LLC',
    dbaName: 'Pacific Coast Carriers',
    authorityStatus: 'active',
    safetyRating: 'satisfactory',
    insuranceOnFile: true,
    insuranceAmount: 1000000,
    outOfServiceDate: null,
    outOfServiceReason: null,
    entityType: 'Carrier',
    operatingStatus: 'Authorized For Property',
    lastUpdated: '2025-12-01',
  },
  'MC-485920': {
    mcNumber: 'MC-485920',
    dotNumber: 'DOT-5920483',
    legalName: 'BLUE RIDGE TRANSPORT CO',
    dbaName: 'Blue Ridge Transport',
    authorityStatus: 'active',
    safetyRating: 'satisfactory',
    insuranceOnFile: true,
    insuranceAmount: 750000,
    outOfServiceDate: null,
    outOfServiceReason: null,
    entityType: 'Carrier',
    operatingStatus: 'Authorized For Property',
    lastUpdated: '2025-09-30',
  },
  'MC-596031': {
    mcNumber: 'MC-596031',
    dotNumber: 'DOT-6031596',
    legalName: 'LONE STAR TRUCKING LLC',
    dbaName: 'Lone Star Trucking',
    authorityStatus: 'active',
    safetyRating: 'satisfactory',
    insuranceOnFile: true,
    insuranceAmount: 1000000,
    outOfServiceDate: null,
    outOfServiceReason: null,
    entityType: 'Carrier',
    operatingStatus: 'Authorized For Property',
    lastUpdated: '2025-11-10',
  },
  'MC-607142': {
    mcNumber: 'MC-607142',
    dotNumber: 'DOT-7142607',
    legalName: 'GREAT LAKES FREIGHT SYSTEMS INC',
    dbaName: 'Great Lakes Freight',
    authorityStatus: 'active',
    safetyRating: 'conditional',
    insuranceOnFile: true,
    insuranceAmount: 1000000,
    outOfServiceDate: null,
    outOfServiceReason: null,
    entityType: 'Carrier',
    operatingStatus: 'Authorized For Property',
    lastUpdated: '2025-08-15',
  },
  'MC-718253': {
    mcNumber: 'MC-718253',
    dotNumber: 'DOT-8253718',
    legalName: 'SUNRISE EXPEDITED LLC',
    dbaName: 'Sunrise Expedited',
    authorityStatus: 'active',
    safetyRating: 'satisfactory',
    insuranceOnFile: true,
    insuranceAmount: 1000000,
    outOfServiceDate: null,
    outOfServiceReason: null,
    entityType: 'Carrier',
    operatingStatus: 'Authorized For Property',
    lastUpdated: '2025-12-10',
  },
  'MC-829364': {
    mcNumber: 'MC-829364',
    dotNumber: 'DOT-9364829',
    legalName: 'MOUNTAIN WEST CARRIERS LLC',
    dbaName: 'Mountain West Carriers',
    authorityStatus: 'inactive',
    safetyRating: 'conditional',
    insuranceOnFile: false,
    insuranceAmount: 0,
    outOfServiceDate: '2025-03-15',
    outOfServiceReason: 'Insurance lapse',
    entityType: 'Carrier',
    operatingStatus: 'Not Authorized',
    lastUpdated: '2025-03-20',
  },
  'MC-930475': {
    mcNumber: 'MC-930475',
    dotNumber: 'DOT-0475930',
    legalName: 'COASTAL REFRIGERATED TRANSPORT INC',
    dbaName: 'Coastal Refrigerated',
    authorityStatus: 'active',
    safetyRating: 'satisfactory',
    insuranceOnFile: true,
    insuranceAmount: 1000000,
    outOfServiceDate: null,
    outOfServiceReason: null,
    entityType: 'Carrier',
    operatingStatus: 'Authorized For Property',
    lastUpdated: '2025-11-28',
  },
  'MC-041586': {
    mcNumber: 'MC-041586',
    dotNumber: 'DOT-1586041',
    legalName: 'SWIFT RIVER LOGISTICS LLC',
    dbaName: 'Swift River Logistics',
    authorityStatus: 'revoked',
    safetyRating: 'unsatisfactory',
    insuranceOnFile: false,
    insuranceAmount: 0,
    outOfServiceDate: '2024-11-01',
    outOfServiceReason: 'Safety rating downgrade — unsatisfactory',
    entityType: 'Carrier',
    operatingStatus: 'Not Authorized',
    lastUpdated: '2024-11-05',
  },
};

export function lookupByMC(mcNumber: string): FmcsaLookupResult {
  // Normalize — strip leading zeros and spaces for matching
  const normalized = mcNumber.replace(/\s+/g, '').toUpperCase();

  const match = FMCSA_SEED_DATA[normalized];

  if (match) {
    return {
      found: true,
      ...match,
      simulatedNote:
        'This is simulated FMCSA data for demo purposes. In production, connect to the FMCSA SAFER API (https://safer.fmcsa.dot.gov/).',
    };
  }

  return {
    found: false,
    simulatedNote:
      'Carrier not found in simulated database. In production, this would query the FMCSA SAFER API (https://safer.fmcsa.dot.gov/).',
  };
}
