// ─── Route ─────────────────────────────────────────────────────────────────
export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
  createdAt: string;
}

// ─── Comparison ────────────────────────────────────────────────────────────
export interface ComparisonResult {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}

// ─── Compliance Balance ─────────────────────────────────────────────────────
export interface ComplianceBalance {
  shipId: string;
  year: number;
  cbGco2eq: number;
  bankedSurplus?: number;
  adjustedCB?: number;
  computedAt: string;
}

// ─── Bank Entry ─────────────────────────────────────────────────────────────
export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: string;
}

export interface ApplyBankedResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

// ─── Pool ───────────────────────────────────────────────────────────────────
export interface PoolMember {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: string;
  year: number;
  createdAt: string;
  members: PoolMember[];
}

// ─── Filter state ───────────────────────────────────────────────────────────
export interface RouteFilters {
  vesselType: string;
  fuelType: string;
  year: string;
}
