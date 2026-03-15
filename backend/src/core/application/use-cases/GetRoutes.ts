import type { Route } from '../../domain/entities';
import type { IRouteRepository } from '../../ports/repositories';

export class GetRoutesUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(filters?: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]> {
    const routes = await this.routeRepo.findAll();
    if (!filters) return routes;

    return routes.filter((r) => {
      if (filters.vesselType && r.vesselType !== filters.vesselType) return false;
      if (filters.fuelType && r.fuelType !== filters.fuelType) return false;
      if (filters.year && r.year !== filters.year) return false;
      return true;
    });
  }
}
