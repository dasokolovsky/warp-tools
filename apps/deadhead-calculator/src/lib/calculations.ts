export interface LoadInputs {
  deadheadMiles: number;
  loadedMiles: number;
  loadRate: number; // flat dollar amount
  fuelCostPerGallon: number;
  mpg: number;
  tolls: number;
  driverPayPerHour: number;
  deadheadHours: number;
  carrierCosts: number; // other carrier costs (insurance, etc.)
}

export interface LoadResult {
  totalMiles: number;
  deadheadRatio: number; // 0–1
  fuelCostDeadhead: number;
  totalDeadheadCost: number;
  effectiveRatePerTotalMile: number;
  effectiveRatePerLoadedMile: number;
  netProfit: number;
  worthItLevel: 'green' | 'yellow' | 'red';
}

export function calculateLoad(inputs: LoadInputs): LoadResult {
  const {
    deadheadMiles,
    loadedMiles,
    loadRate,
    fuelCostPerGallon,
    mpg,
    tolls,
    driverPayPerHour,
    deadheadHours,
    carrierCosts,
  } = inputs;

  const totalMiles = deadheadMiles + loadedMiles;
  const deadheadRatio = totalMiles > 0 ? deadheadMiles / totalMiles : 0;

  const fuelCostDeadhead = mpg > 0 ? (deadheadMiles / mpg) * fuelCostPerGallon : 0;
  const driverCostDeadhead = driverPayPerHour * deadheadHours;
  const totalDeadheadCost = fuelCostDeadhead + tolls + driverCostDeadhead;

  const effectiveRatePerTotalMile = totalMiles > 0 ? loadRate / totalMiles : 0;
  const effectiveRatePerLoadedMile = loadedMiles > 0 ? loadRate / loadedMiles : 0;

  const netProfit = loadRate - carrierCosts - totalDeadheadCost;

  let worthItLevel: 'green' | 'yellow' | 'red';
  if (effectiveRatePerTotalMile >= 1.5) {
    worthItLevel = 'green';
  } else if (effectiveRatePerTotalMile >= 1.0) {
    worthItLevel = 'yellow';
  } else {
    worthItLevel = 'red';
  }

  return {
    totalMiles,
    deadheadRatio,
    fuelCostDeadhead,
    totalDeadheadCost,
    effectiveRatePerTotalMile,
    effectiveRatePerLoadedMile,
    netProfit,
    worthItLevel,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatRate(value: number): string {
  return `$${value.toFixed(2)}/mi`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
