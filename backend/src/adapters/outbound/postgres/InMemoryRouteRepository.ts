import { v4 as uuidv4 } from 'uuid';
import type { Route } from '../../../core/domain/entities';
import type { IRouteRepository } from '../../../core/ports/repositories';

const SEED_ROUTES: Route[] = [
  {
    id: uuidv4(), routeId: 'R001', vesselType: 'Container', fuelType: 'HFO',
    year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000,
    totalEmissions: 4500, isBaseline: true, createdAt: new Date(),
  },
  {
    id: uuidv4(), routeId: 'R002', vesselType: 'BulkCarrier', fuelType: 'LNG',
    year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500,
    totalEmissions: 4200, isBaseline: false, createdAt: new Date(),
  },
  {
    id: uuidv4(), routeId: 'R003', vesselType: 'Tanker', fuelType: 'MGO',
    year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100, distance: 12500,
    totalEmissions: 4700, isBaseline: false, createdAt: new Date(),
  },
  {
    id: uuidv4(), routeId: 'R004', vesselType: 'RoRo', fuelType: 'HFO',
    year: 2025, ghgIntensity: 89.2, fuelConsumption: 4900, distance: 11800,
    totalEmissions: 4300, isBaseline: false, createdAt: new Date(),
  },
  {
    id: uuidv4(), routeId: 'R005', vesselType: 'Container', fuelType: 'LNG',
    year: 2025, ghgIntensity: 90.5, fuelConsumption: 4950, distance: 11900,
    totalEmissions: 4400, isBaseline: false, createdAt: new Date(),
  },
];

export class InMemoryRouteRepository implements IRouteRepository {
  private routes: Map<string, Route> = new Map(
    SEED_ROUTES.map((r) => [r.id, r])
  );

  async findAll(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async findById(id: string): Promise<Route | null> {
    // Accept both internal uuid and routeId
    const byUuid = this.routes.get(id);
    if (byUuid) return byUuid;
    return Array.from(this.routes.values()).find((r) => r.routeId === id) ?? null;
  }

  async findBaseline(): Promise<Route | null> {
    return Array.from(this.routes.values()).find((r) => r.isBaseline) ?? null;
  }

  async setBaseline(id: string): Promise<Route> {
    // Clear existing baseline
    for (const [key, route] of this.routes.entries()) {
      this.routes.set(key, { ...route, isBaseline: false });
    }
    const route = await this.findById(id);
    if (!route) throw new Error(`Route ${id} not found`);
    const updated = { ...route, isBaseline: true };
    this.routes.set(route.id, updated);
    return updated;
  }

  async upsert(data: Omit<Route, 'id' | 'createdAt'>): Promise<Route> {
    const existing = Array.from(this.routes.values()).find(
      (r) => r.routeId === data.routeId
    );
    if (existing) {
      const updated = { ...existing, ...data };
      this.routes.set(existing.id, updated);
      return updated;
    }
    const newRoute: Route = { ...data, id: uuidv4(), createdAt: new Date() };
    this.routes.set(newRoute.id, newRoute);
    return newRoute;
  }
}
