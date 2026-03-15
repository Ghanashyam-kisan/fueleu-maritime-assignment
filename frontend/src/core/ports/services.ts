import type {
  Route,
  ComparisonResult,
  ComplianceBalance,
  BankEntry,
  ApplyBankedResult,
  Pool,
  RouteFilters,
} from '../domain/types';

export interface IRouteService {
  getRoutes(filters?: Partial<RouteFilters>): Promise<Route[]>;
  setBaseline(routeId: string): Promise<Route>;
  getComparison(): Promise<ComparisonResult[]>;
}

export interface IComplianceService {
  getCB(shipId: string, year: number): Promise<ComplianceBalance>;
  getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance>;
}

export interface IBankingService {
  getRecords(shipId: string, year: number): Promise<{ records: BankEntry[]; totalBanked: number }>;
  bankSurplus(shipId: string, year: number): Promise<BankEntry>;
  applyBanked(shipId: string, year: number, amount: number): Promise<ApplyBankedResult>;
}

export interface IPoolService {
  createPool(year: number, members: { shipId: string }[]): Promise<Pool>;
}
