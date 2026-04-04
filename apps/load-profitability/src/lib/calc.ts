// ── Types ────────────────────────────────────────────────────────────────────

export type DriverPayMode = 'per-mile' | 'percentage' | 'flat';

export interface AccessorialItem {
  id: string;
  label: string;
  amount: string;
}

export interface LoadInputs {
  // Revenue
  customerRate: number;
  ratePerMile: boolean; // true = per-mile rate, false = flat rate
  loadedMiles: number;
  fuelSurcharge: number;
  accessorials: AccessorialItem[];

  // Direct costs
  mpg: number;
  fuelPricePerGallon: number;
  driverPayMode: DriverPayMode;
  driverPayPerMile: number;
  driverPayPercent: number;
  driverPayFlat: number;
  tolls: number;
  deadheadMiles: number;

  // Fixed cost allocation
  monthlyMiles: number;
  truckPaymentMonthly: number;
  insuranceMonthly: number;
  maintenancePerMile: number;
  permitsMonthly: number;
  overheadMonthly: number;
}

export interface CostBreakdownItem {
  label: string;
  amount: number;
  color: string;
}

export interface LoadResult {
  // Revenue
  grossRevenue: number;
  revenuePerMile: number;

  // Direct costs
  fuelCost: number;
  driverPay: number;
  tollCost: number;
  deadheadFuelCost: number;
  totalDirectCosts: number;
  grossMargin: number;

  // Fixed (allocated) costs
  truckPaymentPerMile: number;
  insurancePerMile: number;
  maintenancePerMile: number;
  permitsPerMile: number;
  overheadPerMile: number;
  totalFixedPerMile: number;
  totalFixedAllocated: number;

  // Net
  trueNetProfit: number;
  trueNetMarginPercent: number;
  costPerMile: number;
  totalCostPerMile: number;
  breakEvenRateFlat: number;
  breakEvenRatePerMile: number;

  // Chart data
  costBreakdown: CostBreakdownItem[];
}

// ── Calculator ───────────────────────────────────────────────────────────────

export function calcLoad(inputs: LoadInputs): LoadResult {
  const miles = inputs.loadedMiles || 0;
  const monthlyMiles = inputs.monthlyMiles || 10000;

  // Revenue
  const baseRevenue = inputs.ratePerMile
    ? inputs.customerRate * miles
    : inputs.customerRate;
  const accessorialTotal = inputs.accessorials.reduce(
    (sum, a) => sum + (parseFloat(a.amount) || 0),
    0,
  );
  const grossRevenue = baseRevenue + inputs.fuelSurcharge + accessorialTotal;
  const revenuePerMile = miles > 0 ? grossRevenue / miles : 0;

  // Direct costs
  const fuelCost = miles > 0 && inputs.mpg > 0
    ? (miles / inputs.mpg) * inputs.fuelPricePerGallon
    : 0;

  let driverPay = 0;
  if (inputs.driverPayMode === 'per-mile') {
    driverPay = inputs.driverPayPerMile * miles;
  } else if (inputs.driverPayMode === 'percentage') {
    driverPay = (inputs.driverPayPercent / 100) * grossRevenue;
  } else {
    driverPay = inputs.driverPayFlat;
  }

  const deadheadFuelCost = inputs.deadheadMiles > 0 && inputs.mpg > 0
    ? (inputs.deadheadMiles / inputs.mpg) * inputs.fuelPricePerGallon
    : 0;

  const totalDirectCosts = fuelCost + driverPay + inputs.tolls + deadheadFuelCost;
  const grossMargin = grossRevenue - totalDirectCosts;

  // Fixed costs → per-mile allocation
  const truckPaymentPerMile = inputs.truckPaymentMonthly / monthlyMiles;
  const insurancePerMile = inputs.insuranceMonthly / monthlyMiles;
  const maintenancePerMile = inputs.maintenancePerMile;
  const permitsPerMile = inputs.permitsMonthly / monthlyMiles;
  const overheadPerMile = inputs.overheadMonthly / monthlyMiles;

  const totalFixedPerMile =
    truckPaymentPerMile +
    insurancePerMile +
    maintenancePerMile +
    permitsPerMile +
    overheadPerMile;

  // Fixed costs allocated to this load (using loaded miles only)
  const totalFixedAllocated = totalFixedPerMile * miles;

  // True net
  const trueNetProfit = grossRevenue - totalDirectCosts - totalFixedAllocated;
  const trueNetMarginPercent = grossRevenue > 0
    ? (trueNetProfit / grossRevenue) * 100
    : 0;

  // Cost per mile (direct only)
  const directCostPerMile = miles > 0 ? totalDirectCosts / miles : 0;
  const totalCostPerMile = directCostPerMile + totalFixedPerMile;

  // Break-even: minimum rate needed to cover all costs
  const totalAllCosts = totalDirectCosts + totalFixedAllocated;
  const breakEvenRateFlat = totalAllCosts;
  const breakEvenRatePerMile = miles > 0 ? totalAllCosts / miles : 0;

  // Cost breakdown for chart
  const costBreakdown: CostBreakdownItem[] = [
    { label: 'Fuel', amount: fuelCost, color: '#FF6B35' },
    { label: 'Driver Pay', amount: driverPay, color: '#4ECDC4' },
    { label: 'Tolls', amount: inputs.tolls, color: '#FFE66D' },
    { label: 'Deadhead Fuel', amount: deadheadFuelCost, color: '#FF8E53' },
    { label: 'Truck Payment', amount: truckPaymentPerMile * miles, color: '#A78BFA' },
    { label: 'Insurance', amount: insurancePerMile * miles, color: '#60A5FA' },
    { label: 'Maintenance', amount: maintenancePerMile * miles, color: '#34D399' },
    { label: 'Permits', amount: permitsPerMile * miles, color: '#F472B6' },
    { label: 'Overhead', amount: overheadPerMile * miles, color: '#94A3B8' },
  ].filter((item) => item.amount > 0);

  return {
    grossRevenue,
    revenuePerMile,
    fuelCost,
    driverPay,
    tollCost: inputs.tolls,
    deadheadFuelCost,
    totalDirectCosts,
    grossMargin,
    truckPaymentPerMile,
    insurancePerMile,
    maintenancePerMile,
    permitsPerMile,
    overheadPerMile,
    totalFixedPerMile,
    totalFixedAllocated,
    trueNetProfit,
    trueNetMarginPercent,
    costPerMile: directCostPerMile,
    totalCostPerMile,
    breakEvenRateFlat,
    breakEvenRatePerMile,
    costBreakdown,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function fmt(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtNum(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

export function defaultInputs(): LoadInputs {
  return {
    customerRate: 0,
    ratePerMile: false,
    loadedMiles: 0,
    fuelSurcharge: 0,
    accessorials: [],
    mpg: 6.5,
    fuelPricePerGallon: 3.5,
    driverPayMode: 'per-mile',
    driverPayPerMile: 0,
    driverPayPercent: 0,
    driverPayFlat: 0,
    tolls: 0,
    deadheadMiles: 0,
    monthlyMiles: 10000,
    truckPaymentMonthly: 0,
    insuranceMonthly: 0,
    maintenancePerMile: 0.15,
    permitsMonthly: 0,
    overheadMonthly: 0,
  };
}
