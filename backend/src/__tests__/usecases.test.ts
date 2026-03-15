import { computeCB, computePercentDiff, TARGET_INTENSITY_2025 } from '../core/domain/entities';
import { BankSurplusUseCase } from '../core/application/use-cases/BankSurplus';
import { ApplyBankedUseCase } from '../core/application/use-cases/ApplyBanked';
import { ComputeCBUseCase } from '../core/application/use-cases/ComputeCB';
import { CreatePoolUseCase } from '../core/application/use-cases/CreatePool';
import { ComputeComparisonUseCase } from '../core/application/use-cases/ComputeComparison';
import { InMemoryRouteRepository } from '../adapters/outbound/postgres/InMemoryRouteRepository';
import { InMemoryComplianceRepository } from '../adapters/outbound/postgres/InMemoryComplianceRepository';
import { InMemoryBankingRepository } from '../adapters/outbound/postgres/InMemoryBankingRepository';
import { InMemoryPoolRepository } from '../adapters/outbound/postgres/InMemoryPoolRepository';

// ─── Domain formula tests ─────────────────────────────────────────────────────
describe('computeCB', () => {
  it('returns positive CB for low GHG intensity (surplus)', () => {
    // LNG route: 88.0 < 89.3368 → surplus
    const cb = computeCB(88.0, 4800);
    const energy = 4800 * 41_000;
    const expected = (TARGET_INTENSITY_2025 - 88.0) * energy;
    expect(cb).toBeCloseTo(expected, 2);
    expect(cb).toBeGreaterThan(0);
  });

  it('returns negative CB for high GHG intensity (deficit)', () => {
    // HFO route: 91.0 > 89.3368 → deficit
    const cb = computeCB(91.0, 5000);
    expect(cb).toBeLessThan(0);
  });

  it('returns zero when intensity equals target', () => {
    const cb = computeCB(TARGET_INTENSITY_2025, 5000);
    expect(cb).toBeCloseTo(0, 5);
  });
});

describe('computePercentDiff', () => {
  it('returns 0 for identical values', () => {
    expect(computePercentDiff(91.0, 91.0)).toBeCloseTo(0);
  });

  it('returns negative when comparison is lower', () => {
    const diff = computePercentDiff(91.0, 88.0);
    expect(diff).toBeLessThan(0);
  });

  it('returns positive when comparison is higher', () => {
    const diff = computePercentDiff(88.0, 93.5);
    expect(diff).toBeGreaterThan(0);
  });

  it('returns 0 when baseline is 0', () => {
    expect(computePercentDiff(0, 10)).toBe(0);
  });
});

// ─── ComputeCB use case ────────────────────────────────────────────────────────
describe('ComputeCBUseCase', () => {
  it('computes and stores CB for a valid route', async () => {
    const routeRepo = new InMemoryRouteRepository();
    const complianceRepo = new InMemoryComplianceRepository();
    const uc = new ComputeCBUseCase(routeRepo, complianceRepo);

    const result = await uc.execute({ shipId: 'R002', year: 2024 });
    expect(result.shipId).toBe('R002');
    expect(result.year).toBe(2024);
    expect(result.cbGco2eq).toBeGreaterThan(0); // LNG is compliant
  });

  it('throws for unknown route', async () => {
    const routeRepo = new InMemoryRouteRepository();
    const complianceRepo = new InMemoryComplianceRepository();
    const uc = new ComputeCBUseCase(routeRepo, complianceRepo);

    await expect(uc.execute({ shipId: 'UNKNOWN', year: 2024 })).rejects.toThrow();
  });
});

// ─── BankSurplus use case ─────────────────────────────────────────────────────
describe('BankSurplusUseCase', () => {
  it('banks a surplus route successfully', async () => {
    const routeRepo = new InMemoryRouteRepository();
    const bankingRepo = new InMemoryBankingRepository();
    const uc = new BankSurplusUseCase(routeRepo, bankingRepo);

    const entry = await uc.execute({ shipId: 'R002', year: 2024 });
    expect(entry.shipId).toBe('R002');
    expect(entry.amountGco2eq).toBeGreaterThan(0);
  });

  it('throws when trying to bank a deficit route', async () => {
    const routeRepo = new InMemoryRouteRepository();
    const bankingRepo = new InMemoryBankingRepository();
    const uc = new BankSurplusUseCase(routeRepo, bankingRepo);

    // R001 HFO 91.0 > target → deficit
    await expect(uc.execute({ shipId: 'R001', year: 2024 })).rejects.toThrow(/deficit/i);
  });
});

// ─── ApplyBanked use case ─────────────────────────────────────────────────────
describe('ApplyBankedUseCase', () => {
  it('applies banked surplus correctly', async () => {
    const routeRepo = new InMemoryRouteRepository();
    const bankingRepo = new InMemoryBankingRepository();
    const bankUC = new BankSurplusUseCase(routeRepo, bankingRepo);
    const applyUC = new ApplyBankedUseCase(bankingRepo);

    await bankUC.execute({ shipId: 'R002', year: 2024 });
    const total = await bankingRepo.getTotalBanked('R002', 2024);

    const result = await applyUC.execute({ shipId: 'R002', year: 2024, amount: 100 });
    expect(result.applied).toBe(100);
    expect(result.cbAfter).toBeCloseTo(total - 100, 2);
  });

  it('throws if amount exceeds available banked', async () => {
    const bankingRepo = new InMemoryBankingRepository();
    const applyUC = new ApplyBankedUseCase(bankingRepo);

    await expect(
      applyUC.execute({ shipId: 'R002', year: 2024, amount: 999999 })
    ).rejects.toThrow();
  });

  it('throws if no banked surplus exists', async () => {
    const bankingRepo = new InMemoryBankingRepository();
    const applyUC = new ApplyBankedUseCase(bankingRepo);

    await expect(
      applyUC.execute({ shipId: 'R001', year: 2024, amount: 50 })
    ).rejects.toThrow(/No banked surplus/i);
  });
});

// ─── ComputeComparison use case ───────────────────────────────────────────────
describe('ComputeComparisonUseCase', () => {
  it('returns comparison results with percentDiff and compliant flag', async () => {
    const routeRepo = new InMemoryRouteRepository();
    const uc = new ComputeComparisonUseCase(routeRepo);

    const results = await uc.execute();
    expect(results.length).toBeGreaterThan(0);

    for (const r of results) {
      expect(r).toHaveProperty('percentDiff');
      expect(r).toHaveProperty('compliant');
      expect(typeof r.compliant).toBe('boolean');
    }
  });

  it('marks routes above target as non-compliant', async () => {
    const routeRepo = new InMemoryRouteRepository();
    const uc = new ComputeComparisonUseCase(routeRepo);

    const results = await uc.execute();
    const r003 = results.find((r) => r.comparison.routeId === 'R003');
    expect(r003?.compliant).toBe(false); // MGO 93.5 > 89.3368
  });
});

// ─── CreatePool use case ──────────────────────────────────────────────────────
describe('CreatePoolUseCase', () => {
  async function setupRepos() {
    const routeRepo = new InMemoryRouteRepository();
    const complianceRepo = new InMemoryComplianceRepository();
    const poolRepo = new InMemoryPoolRepository();

    // Pre-compute CB for members
    const computeUC = new ComputeCBUseCase(routeRepo, complianceRepo);
    await computeUC.execute({ shipId: 'R002', year: 2024 }); // surplus
    await computeUC.execute({ shipId: 'R001', year: 2024 }); // deficit

    return { complianceRepo, poolRepo };
  }

  it('creates a valid pool with surplus + deficit members', async () => {
    const { complianceRepo, poolRepo } = await setupRepos();
    const uc = new CreatePoolUseCase(poolRepo, complianceRepo);

    const pool = await uc.execute({
      year: 2024,
      members: [{ shipId: 'R002' }, { shipId: 'R001' }],
    });

    expect(pool.id).toBeDefined();
    expect(pool.members.length).toBe(2);
  });

  it('throws when pool CB sum is negative', async () => {
    const routeRepo = new InMemoryRouteRepository();
    const complianceRepo = new InMemoryComplianceRepository();
    const poolRepo = new InMemoryPoolRepository();
    const computeUC = new ComputeCBUseCase(routeRepo, complianceRepo);

    // Two deficit ships
    await computeUC.execute({ shipId: 'R001', year: 2024 }); // deficit
    await computeUC.execute({ shipId: 'R003', year: 2024 }); // deficit

    const uc = new CreatePoolUseCase(poolRepo, complianceRepo);
    await expect(
      uc.execute({ year: 2024, members: [{ shipId: 'R001' }, { shipId: 'R003' }] })
    ).rejects.toThrow(/negative/i);
  });

  it('throws when fewer than 2 members', async () => {
    const complianceRepo = new InMemoryComplianceRepository();
    const poolRepo = new InMemoryPoolRepository();
    const uc = new CreatePoolUseCase(poolRepo, complianceRepo);

    await expect(
      uc.execute({ year: 2024, members: [{ shipId: 'R002' }] })
    ).rejects.toThrow(/2 members/i);
  });
});
