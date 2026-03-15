import type {
  Route,
  ComplianceBalance,
  BankEntry,
  Pool,
  PoolMember,
} from '../domain/entities';

// ─── Route Repository Port ────────────────────────────────────────────────────
export interface IRouteRepository {
  findAll(): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  setBaseline(id: string): Promise<Route>;
  upsert(route: Omit<Route, 'id' | 'createdAt'>): Promise<Route>;
}

// ─── Compliance Repository Port ───────────────────────────────────────────────
export interface IComplianceRepository {
  saveCB(cb: Omit<ComplianceBalance, 'computedAt'>): Promise<ComplianceBalance>;
  findCB(shipId: string, year: number): Promise<ComplianceBalance | null>;
}

// ─── Banking Repository Port ──────────────────────────────────────────────────
export interface IBankingRepository {
  createEntry(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry>;
  findByShip(shipId: string, year: number): Promise<BankEntry[]>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  deductBanked(shipId: string, year: number, amount: number): Promise<void>;
}

// ─── Pool Repository Port ─────────────────────────────────────────────────────
export interface IPoolRepository {
  createPool(year: number, members: Omit<PoolMember, 'poolId'>[]): Promise<Pool>;
  findPool(id: string): Promise<Pool | null>;
}
