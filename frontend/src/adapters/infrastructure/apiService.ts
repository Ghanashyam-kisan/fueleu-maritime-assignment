import axios from 'axios';
import type {
  Route,
  ComparisonResult,
  ComplianceBalance,
  BankEntry,
  ApplyBankedResult,
  Pool,
  RouteFilters,
} from '../../core/domain/types';
import type {
  IRouteService,
  IComplianceService,
  IBankingService,
  IPoolService,
} from '../../core/ports/services';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({ baseURL: BASE_URL });

// ─── Route Service ─────────────────────────────────────────────────────────
export const routeService: IRouteService = {
  async getRoutes(filters?: Partial<RouteFilters>): Promise<Route[]> {
    const params: Record<string, string> = {};
    if (filters?.vesselType) params.vesselType = filters.vesselType;
    if (filters?.fuelType) params.fuelType = filters.fuelType;
    if (filters?.year) params.year = filters.year;
    const res = await api.get('/routes', { params });
    return res.data.data;
  },

  async setBaseline(routeId: string): Promise<Route> {
    const res = await api.post(`/routes/${routeId}/baseline`);
    return res.data.data;
  },

  async getComparison(): Promise<ComparisonResult[]> {
    const res = await api.get('/routes/comparison');
    return res.data.data;
  },
};

// ─── Compliance Service ────────────────────────────────────────────────────
export const complianceService: IComplianceService = {
  async getCB(shipId: string, year: number): Promise<ComplianceBalance> {
    const res = await api.get('/compliance/cb', { params: { shipId, year } });
    return res.data.data;
  },

  async getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance> {
    const res = await api.get('/compliance/adjusted-cb', { params: { shipId, year } });
    return res.data.data;
  },
};

// ─── Banking Service ───────────────────────────────────────────────────────
export const bankingService: IBankingService = {
  async getRecords(shipId: string, year: number) {
    const res = await api.get('/banking/records', { params: { shipId, year } });
    return res.data.data;
  },

  async bankSurplus(shipId: string, year: number): Promise<BankEntry> {
    const res = await api.post('/banking/bank', { shipId, year });
    return res.data.data;
  },

  async applyBanked(shipId: string, year: number, amount: number): Promise<ApplyBankedResult> {
    const res = await api.post('/banking/apply', { shipId, year, amount });
    return res.data.data;
  },
};

// ─── Pool Service ──────────────────────────────────────────────────────────
export const poolService: IPoolService = {
  async createPool(year: number, members: { shipId: string }[]): Promise<Pool> {
    const res = await api.post('/pools', { year, members });
    return res.data.data;
  },
};
