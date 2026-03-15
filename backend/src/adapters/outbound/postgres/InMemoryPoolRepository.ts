import { v4 as uuidv4 } from 'uuid';
import type { Pool, PoolMember } from '../../../core/domain/entities';
import type { IPoolRepository } from '../../../core/ports/repositories';

export class InMemoryPoolRepository implements IPoolRepository {
  private pools: Map<string, Pool> = new Map();

  async createPool(year: number, members: Omit<PoolMember, 'poolId'>[]): Promise<Pool> {
    const id = uuidv4();
    const pool: Pool = {
      id,
      year,
      createdAt: new Date(),
      members: members.map((m) => ({ ...m, poolId: id })),
    };
    this.pools.set(id, pool);
    return pool;
  }

  async findPool(id: string): Promise<Pool | null> {
    return this.pools.get(id) ?? null;
  }
}
