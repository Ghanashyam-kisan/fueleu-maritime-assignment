import type { Pool, PoolMember } from '../../domain/entities';
import type { IPoolRepository, IComplianceRepository } from '../../ports/repositories';

export interface PoolMemberInput {
  shipId: string;
}

export interface CreatePoolInput {
  year: number;
  members: PoolMemberInput[];
}

export class CreatePoolUseCase {
  constructor(
    private readonly poolRepo: IPoolRepository,
    private readonly complianceRepo: IComplianceRepository
  ) {}

  async execute({ year, members }: CreatePoolInput): Promise<Pool> {
    if (members.length < 2) {
      throw new Error('A pool requires at least 2 members');
    }

    // Fetch CB for each member
    const memberCBs: Array<{ shipId: string; cb: number }> = [];
    for (const m of members) {
      const cb = await this.complianceRepo.findCB(m.shipId, year);
      if (!cb) throw new Error(`No CB record for shipId=${m.shipId}, year=${year}. Run /compliance/cb first.`);
      memberCBs.push({ shipId: m.shipId, cb: cb.cbGco2eq });
    }

    // Validate: sum of CBs >= 0
    const totalCB = memberCBs.reduce((s, m) => s + m.cb, 0);
    if (totalCB < 0) {
      throw new Error(
        `Pool CB sum is negative (${totalCB.toFixed(2)}). Pool is invalid under FuelEU Art. 21.`
      );
    }

    // Greedy allocation: sort desc by CB, transfer surplus to deficits
    const sorted = [...memberCBs].sort((a, b) => b.cb - a.cb);
    const allocated = sorted.map((m) => ({ ...m, cbAfter: m.cb }));

    let surplusIdx = 0;
    let deficitIdx = allocated.length - 1;

    while (surplusIdx < deficitIdx) {
      const surplus = allocated[surplusIdx];
      const deficit = allocated[deficitIdx];

      if (deficit.cbAfter >= 0) { deficitIdx--; continue; }
      if (surplus.cbAfter <= 0) { surplusIdx++; continue; }

      const transfer = Math.min(surplus.cbAfter, -deficit.cbAfter);
      surplus.cbAfter -= transfer;
      deficit.cbAfter += transfer;

      if (deficit.cbAfter >= 0) deficitIdx--;
      if (surplus.cbAfter <= 0) surplusIdx++;
    }

    // Validate post-allocation rules
    for (const m of allocated) {
      const original = memberCBs.find((x) => x.shipId === m.shipId)!;
      if (original.cb < 0 && m.cbAfter < original.cb) {
        throw new Error(`Deficit ship ${m.shipId} would exit worse than before`);
      }
      if (original.cb > 0 && m.cbAfter < 0) {
        throw new Error(`Surplus ship ${m.shipId} would exit negative`);
      }
    }

    const poolMembers: Omit<PoolMember, 'poolId'>[] = allocated.map((m) => ({
      shipId: m.shipId,
      cbBefore: m.cb,
      cbAfter: m.cbAfter,
    }));

    return this.poolRepo.createPool(year, poolMembers);
  }
}
