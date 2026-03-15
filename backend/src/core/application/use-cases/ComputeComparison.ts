import type { ComparisonResult } from '../../domain/entities';
import { TARGET_INTENSITY_2025, computePercentDiff } from '../../domain/entities';
import type { IRouteRepository } from '../../ports/repositories';

export class ComputeComparisonUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(): Promise<ComparisonResult[]> {
    const baseline = await this.routeRepo.findBaseline();
    if (!baseline) throw new Error('No baseline route set');

    const all = await this.routeRepo.findAll();
    const comparisons = all.filter((r) => !r.isBaseline);

    return comparisons.map((comp) => {
      const percentDiff = computePercentDiff(baseline.ghgIntensity, comp.ghgIntensity);
      const compliant = comp.ghgIntensity <= TARGET_INTENSITY_2025;
      return { baseline, comparison: comp, percentDiff, compliant };
    });
  }
}
