import type { ComplianceBalance } from '../../../core/domain/entities';
import type { IComplianceRepository } from '../../../core/ports/repositories';

export class InMemoryComplianceRepository implements IComplianceRepository {
  private records: Map<string, ComplianceBalance> = new Map();

  private key(shipId: string, year: number) {
    return `${shipId}:${year}`;
  }

  async saveCB(cb: Omit<ComplianceBalance, 'computedAt'>): Promise<ComplianceBalance> {
    const record: ComplianceBalance = { ...cb, computedAt: new Date() };
    this.records.set(this.key(cb.shipId, cb.year), record);
    return record;
  }

  async findCB(shipId: string, year: number): Promise<ComplianceBalance | null> {
    return this.records.get(this.key(shipId, year)) ?? null;
  }
}
