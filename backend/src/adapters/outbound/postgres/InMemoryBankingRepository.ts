import { v4 as uuidv4 } from 'uuid';
import type { BankEntry } from '../../../core/domain/entities';
import type { IBankingRepository } from '../../../core/ports/repositories';

export class InMemoryBankingRepository implements IBankingRepository {
  private entries: BankEntry[] = [];

  async createEntry(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry> {
    const newEntry: BankEntry = { ...entry, id: uuidv4(), createdAt: new Date() };
    this.entries.push(newEntry);
    return newEntry;
  }

  async findByShip(shipId: string, year: number): Promise<BankEntry[]> {
    return this.entries.filter((e) => e.shipId === shipId && e.year === year);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    return this.entries
      .filter((e) => e.shipId === shipId && e.year === year)
      .reduce((sum, e) => sum + e.amountGco2eq, 0);
  }

  async deductBanked(shipId: string, year: number, amount: number): Promise<void> {
    let remaining = amount;
    for (const entry of this.entries) {
      if (entry.shipId !== shipId || entry.year !== year) continue;
      if (remaining <= 0) break;
      const deduct = Math.min(entry.amountGco2eq, remaining);
      entry.amountGco2eq -= deduct;
      remaining -= deduct;
    }
    // Remove zero entries
    this.entries = this.entries.filter((e) => e.amountGco2eq > 0);
  }
}
