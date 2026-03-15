import type { IBankingRepository } from '../../ports/repositories';

export interface ApplyBankedInput {
  shipId: string;
  year: number;
  amount: number;
}

export interface ApplyBankedResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

export class ApplyBankedUseCase {
  constructor(private readonly bankingRepo: IBankingRepository) {}

  async execute({ shipId, year, amount }: ApplyBankedInput): Promise<ApplyBankedResult> {
    if (amount <= 0) throw new Error('Amount must be positive');

    const totalBanked = await this.bankingRepo.getTotalBanked(shipId, year);
    if (totalBanked <= 0) throw new Error(`No banked surplus available for shipId=${shipId}`);
    if (amount > totalBanked) {
      throw new Error(
        `Cannot apply ${amount.toFixed(2)} — only ${totalBanked.toFixed(2)} banked`
      );
    }

    await this.bankingRepo.deductBanked(shipId, year, amount);

    return {
      cbBefore: totalBanked,
      applied: amount,
      cbAfter: totalBanked - amount,
    };
  }
}
