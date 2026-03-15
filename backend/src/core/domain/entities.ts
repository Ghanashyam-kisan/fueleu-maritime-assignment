// ─── Route Entity ───────────────────────────────────────────────────────────
export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;       // gCO2e/MJ
  fuelConsumption: number;    // tonnes
  distance: number;           // km
  totalEmissions: number;     // tonnes
  isBaseline: boolean;
  createdAt: Date;
}

// ─── Compliance Balance ───────────────────────────────────────────────────────
export interface ComplianceBalance {
  shipId: string;
  year: number;
  cbGco2eq: number;   // positive = surplus, negative = deficit
  computedAt: Date;
}

// ─── Bank Entry ───────────────────────────────────────────────────────────────
export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: Date;
}

// ─── Pool ─────────────────────────────────────────────────────────────────────
export interface Pool {
  id: string;
  year: number;
  createdAt: Date;
  members: PoolMember[];
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

// ─── Comparison Result ────────────────────────────────────────────────────────
export interface ComparisonResult {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const TARGET_INTENSITY_2025 = 89.3368;   // gCO2e/MJ
export const ENERGY_CONVERSION_MJ_PER_TONNE = 41_000; // MJ/t (HFO approximate)

// ─── CB Calculation ───────────────────────────────────────────────────────────
export function computeCB(
  ghgIntensity: number,
  fuelConsumption: number,
  targetIntensity: number = TARGET_INTENSITY_2025
): number {
  const energyInScope = fuelConsumption * ENERGY_CONVERSION_MJ_PER_TONNE;
  return (targetIntensity - ghgIntensity) * energyInScope;
}

export function computePercentDiff(baseline: number, comparison: number): number {
  if (baseline === 0) return 0;
  return ((comparison / baseline) - 1) * 100;
}
