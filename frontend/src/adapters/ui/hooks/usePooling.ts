import { useState } from 'react';
import type { Pool, ComplianceBalance } from '../../../core/domain/types';
import { complianceService, poolService } from '../../infrastructure/apiService';

export interface PoolMemberState {
  shipId: string;
  cb: ComplianceBalance | null;
  loading: boolean;
}

export function usePooling() {
  const [members, setMembers] = useState<PoolMemberState[]>([]);
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMemberCB = async (shipId: string, year: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.shipId === shipId ? { ...m, loading: true } : m))
    );
    try {
      const cb = await complianceService.getAdjustedCB(shipId, year);
      setMembers((prev) =>
        prev.map((m) => (m.shipId === shipId ? { ...m, cb, loading: false } : m))
      );
    } catch {
      setMembers((prev) =>
        prev.map((m) => (m.shipId === shipId ? { ...m, loading: false } : m))
      );
    }
  };

  const addMember = (shipId: string) => {
    if (members.find((m) => m.shipId === shipId)) return;
    setMembers((prev) => [...prev, { shipId, cb: null, loading: false }]);
  };

  const removeMember = (shipId: string) => {
    setMembers((prev) => prev.filter((m) => m.shipId !== shipId));
  };

  const poolSum = members.reduce((s, m) => s + (m.cb?.cbGco2eq ?? 0), 0);
  const isValid = members.length >= 2 && poolSum >= 0;

  const createPool = async (year: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await poolService.createPool(
        year,
        members.map((m) => ({ shipId: m.shipId }))
      );
      setPool(result);
      setSuccess(`Pool ${result.id.slice(0, 8)} created successfully`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create pool');
    } finally {
      setLoading(false);
    }
  };

  return {
    members,
    pool,
    loading,
    error,
    success,
    poolSum,
    isValid,
    addMember,
    removeMember,
    loadMemberCB,
    createPool,
  };
}
