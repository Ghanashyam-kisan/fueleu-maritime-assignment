import type { BankEntry } from '../../domain/entities';
import { computeCB, TARGET_INTENSITY_2025 } from '../../domain/entities';
import type { IRouteRepository, IBankingRepository } from '../../ports/repositories';

export interface BankSurplusInput {
  shipId: string;
  year: number;
}

export class BankSurplusUseCase {
  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly bankingRepo: IBankingRepository
  ) {}

  async execute({ shipId, year }: BankSurplusInput): Promise<BankEntry> {
    const routes = await this.routeRepo.findAll();
    const route = routes.find((r) => r.routeId === shipId && r.year === year);
    if (!route) throw new Error(`No route for shipId=${shipId}, year=${year}`);

    const cb = computeCB(route.ghgIntensity, route.fuelConsumption, TARGET_INTENSITY_2025);
    if (cb <= 0) {
      throw new Error(`Cannot bank a deficit or zero CB (cb=${cb.toFixed(2)})`);
    }

    return this.bankingRepo.createEntry({ shipId, year, amountGco2eq: cb });
  }
}
