import type { PayType, TripRow, DeductionRow, ReimbursementRow, AdvanceRow, SettlementCalc } from './types';

export function calcTripPay(trip: TripRow, payType: PayType, rate: number): number {
  const miles = parseFloat(trip.miles) || 0;
  const revenue = parseFloat(trip.revenue) || 0;
  const hours = parseFloat(trip.hours) || 0;
  const stops = parseFloat(trip.stops) || 0;

  switch (payType) {
    case 'per-mile':
      return miles * rate;
    case 'percentage':
      return revenue * (rate / 100);
    case 'flat':
      return rate;
    case 'hourly':
      return hours * rate;
    case 'per-stop':
      return stops * rate;
    default:
      return 0;
  }
}

export function calcDeduction(amount: number, type: 'fixed' | 'percent', gross: number): number {
  if (type === 'percent') return gross * (amount / 100);
  return amount;
}

export function calcSettlement(
  trips: TripRow[],
  payType: PayType,
  rate: number,
  deductions: DeductionRow[],
  reimbursements: ReimbursementRow[],
  advances: AdvanceRow[],
): SettlementCalc {
  const tripPays = trips.map((t) => calcTripPay(t, payType, rate));
  const grossEarnings = tripPays.reduce((a, b) => a + b, 0);

  const totalDeductions = deductions.reduce((sum, d) => {
    const amt = parseFloat(d.amount) || 0;
    return sum + calcDeduction(amt, d.type, grossEarnings);
  }, 0);

  const totalReimbursements = reimbursements.reduce((sum, r) => {
    return sum + (parseFloat(r.amount) || 0);
  }, 0);

  const totalAdvances = advances.reduce((sum, a) => {
    return sum + (parseFloat(a.amount) || 0);
  }, 0);

  const netPay = grossEarnings - totalDeductions - totalAdvances + totalReimbursements;

  return { tripPays, grossEarnings, totalDeductions, totalReimbursements, totalAdvances, netPay };
}

export function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function rateSuffix(payType: PayType): string {
  switch (payType) {
    case 'per-mile': return '$/mi';
    case 'percentage': return '%';
    case 'flat': return '$/load';
    case 'hourly': return '$/hr';
    case 'per-stop': return '$/stop';
  }
}

export function rateLabel(payType: PayType): string {
  switch (payType) {
    case 'per-mile': return 'Rate per mile';
    case 'percentage': return 'Percentage of revenue';
    case 'flat': return 'Flat rate per load';
    case 'hourly': return 'Hourly rate';
    case 'per-stop': return 'Rate per stop';
  }
}

export function ratePlaceholder(payType: PayType): string {
  switch (payType) {
    case 'per-mile': return '0.55';
    case 'percentage': return '75';
    case 'flat': return '250';
    case 'hourly': return '25';
    case 'per-stop': return '15';
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
