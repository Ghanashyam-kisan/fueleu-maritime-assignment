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
// Actual CB values (TARGET=89.3368, ENERGY=41000 MJ/t):
//   R001 2024: -340,956,000  (deficit)
//   R002 2024: +263,082,240  (surplus)
//   R003 2024: -870,525,120  (deficit)
//   R004 2025:  +27,483,120  (surplus)
//   R005 2025: -236,071,440  (deficit)
//
// No two same-year routes sum to >= 0 in the seed data,
// so we seed complianceRepo directly — correct unit-test isolation:
// CreatePool depends on IComplianceRepository, not on routes.

describe('CreatePoolUseCase', () => {
  function makeRepos() {
    return {
      complianceRepo: new InMemoryComplianceRepository(),
      poolRepo: new InMemoryPoolRepository(),
    };
  }

  async function seedCB(
    complianceRepo: InMemoryComplianceRepository,
    entries: Array<{ shipId: string; year: number; cbGco2eq: number }>
  ) {
    for (const e of entries) {
      await complianceRepo.saveCB(e);
    }
  }

  it('creates a valid pool where surplus covers deficit', async () => {
    const { complianceRepo, poolRepo } = makeRepos();
    // Fabricate: shipA has large surplus, shipB has small deficit — sum > 0
    await seedCB(complianceRepo, [
      { shipId: 'SHIP_A', year: 2024, cbGco2eq: +500_000 },
      { shipId: 'SHIP_B', year: 2024, cbGco2eq: -200_000 },
    ]);
    const uc = new CreatePoolUseCase(poolRepo, complianceRepo);
    const pool = await uc.execute({
      year: 2024,
      members: [{ shipId: 'SHIP_A' }, { shipId: 'SHIP_B' }],
    });
    expect(pool.id).toBeDefined();
    expect(pool.members.length).toBe(2);
    // Deficit member should be fully covered
    const deficitMember = pool.members.find((m) => m.shipId === 'SHIP_B')!;
    expect(deficitMember.cbAfter).toBeGreaterThanOrEqual(0);
    // Surplus member gives away 200k
    const surplusMember = pool.members.find((m) => m.shipId === 'SHIP_A')!;
    expect(surplusMember.cbAfter).toBeCloseTo(300_000, -3);
  });

  it('creates a valid pool with all-surplus members', async () => {
    const { complianceRepo, poolRepo } = makeRepos();
    await seedCB(complianceRepo, [
      { shipId: 'SHIP_A', year: 2024, cbGco2eq: +263_082_240 },
      { shipId: 'SHIP_B', year: 2024, cbGco2eq: +27_483_120 },
    ]);
    const uc = new CreatePoolUseCase(poolRepo, complianceRepo);
    const pool = await uc.execute({
      year: 2024,
      members: [{ shipId: 'SHIP_A' }, { shipId: 'SHIP_B' }],
    });
    expect(pool.id).toBeDefined();
    // No transfers needed — cbAfter should equal cbBefore for each member
    pool.members.forEach((m) => expect(m.cbAfter).toBe(m.cbBefore));
  });

  it('throws when pool CB sum is negative', async () => {
    const { complianceRepo, poolRepo } = makeRepos();
    await seedCB(complianceRepo, [
      { shipId: 'SHIP_A', year: 2024, cbGco2eq: +100_000 },
      { shipId: 'SHIP_B', year: 2024, cbGco2eq: -500_000 }, // deficit exceeds surplus
    ]);
    const uc = new CreatePoolUseCase(poolRepo, complianceRepo);
    await expect(
      uc.execute({ year: 2024, members: [{ shipId: 'SHIP_A' }, { shipId: 'SHIP_B' }] })
    ).rejects.toThrow(/negative/i);
  });

  it('throws when pool CB sum is negative (both deficit)', async () => {
    const { complianceRepo, poolRepo } = makeRepos();
    await seedCB(complianceRepo, [
      { shipId: 'SHIP_A', year: 2024, cbGco2eq: -340_956_000 },
      { shipId: 'SHIP_B', year: 2024, cbGco2eq: -870_525_120 },
    ]);
    const uc = new CreatePoolUseCase(poolRepo, complianceRepo);
    await expect(
      uc.execute({ year: 2024, members: [{ shipId: 'SHIP_A' }, { shipId: 'SHIP_B' }] })
    ).rejects.toThrow(/negative/i);
  });

  it('throws when fewer than 2 members', async () => {
    const { complianceRepo, poolRepo } = makeRepos();
    const uc = new CreatePoolUseCase(poolRepo, complianceRepo);
    await expect(
      uc.execute({ year: 2024, members: [{ shipId: 'SHIP_A' }] })
    ).rejects.toThrow(/2 members/i);
  });

  it('throws when CB record missing for a member', async () => {
    const { complianceRepo, poolRepo } = makeRepos();
    // Only seed one member, leave the other without a CB record
    await seedCB(complianceRepo, [
      { shipId: 'SHIP_A', year: 2024, cbGco2eq: +500_000 },
    ]);
    const uc = new CreatePoolUseCase(poolRepo, complianceRepo);
    await expect(
      uc.execute({ year: 2024, members: [{ shipId: 'SHIP_A' }, { shipId: 'SHIP_MISSING' }] })
    ).rejects.toThrow(/No CB record/i);
  });
});
