export type PayType = 'per-mile' | 'percentage' | 'flat' | 'hourly' | 'per-stop';

export interface TripRow {
  id: string;
  description: string;
  miles: string;
  revenue: string;
  hours: string;
  stops: string;
}

export interface DeductionRow {
  id: string;
  description: string;
  amount: string;
  type: 'fixed' | 'percent';
}

export interface ReimbursementRow {
  id: string;
  description: string;
  amount: string;
}

export interface AdvanceRow {
  id: string;
  amount: string;
  date: string;
  reason: string;
}

export interface SettlementCalc {
  tripPays: number[];
  grossEarnings: number;
  totalDeductions: number;
  totalReimbursements: number;
  totalAdvances: number;
  netPay: number;
}
