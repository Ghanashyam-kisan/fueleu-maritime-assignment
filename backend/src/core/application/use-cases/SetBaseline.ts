import type { Route } from '../../domain/entities';
import type { IRouteRepository } from '../../ports/repositories';

export class SetBaselineUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(routeId: string): Promise<Route> {
    const route = await this.routeRepo.findById(routeId);
    if (!route) throw new Error(`Route ${routeId} not found`);
    return this.routeRepo.setBaseline(routeId);
  }
}
