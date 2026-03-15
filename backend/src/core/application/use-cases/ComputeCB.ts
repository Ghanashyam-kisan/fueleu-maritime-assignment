import type { ComplianceBalance } from '../../domain/entities';
import { computeCB, TARGET_INTENSITY_2025 } from '../../domain/entities';
import type { IRouteRepository, IComplianceRepository } from '../../ports/repositories';

export interface ComputeCBInput {
  shipId: string;
  year: number;
}

export class ComputeCBUseCase {
  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly complianceRepo: IComplianceRepository
  ) {}

  async execute({ shipId, year }: ComputeCBInput): Promise<ComplianceBalance> {
    // Find the route matching this shipId (routeId) and year
    const routes = await this.routeRepo.findAll();
    const route = routes.find(
      (r) => r.routeId === shipId && r.year === year
    );

    if (!route) {
      throw new Error(`No route found for shipId=${shipId}, year=${year}`);
    }

    const cbValue = computeCB(route.ghgIntensity, route.fuelConsumption, TARGET_INTENSITY_2025);

    return this.complianceRepo.saveCB({
      shipId,
      year,
      cbGco2eq: cbValue,
    });
  }
}
