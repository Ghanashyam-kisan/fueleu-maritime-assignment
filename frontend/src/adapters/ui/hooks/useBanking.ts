import { useState } from 'react';
import type { ComplianceBalance, ApplyBankedResult } from '../../../core/domain/types';
import { complianceService, bankingService } from '../../infrastructure/apiService';

export function useBanking() {
  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyBankedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const fetchCB = async (shipId: string, year: number) => {
    setLoading(true);
    clearMessages();
    try {
      const data = await complianceService.getCB(shipId, year);
      setCb(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch CB');
    } finally {
      setLoading(false);
    }
  };

  const bankSurplus = async (shipId: string, year: number) => {
    setLoading(true);
    clearMessages();
    try {
      await bankingService.bankSurplus(shipId, year);
      setSuccess(`Surplus banked successfully for ${shipId}`);
      await fetchCB(shipId, year);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to bank surplus');
    } finally {
      setLoading(false);
    }
  };

  const applyBanked = async (shipId: string, year: number, amount: number) => {
    setLoading(true);
    clearMessages();
    try {
      const result = await bankingService.applyBanked(shipId, year, amount);
      setApplyResult(result);
      setSuccess(`Applied ${amount.toLocaleString()} gCO₂e from bank`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to apply banked surplus');
    } finally {
      setLoading(false);
    }
  };

  return { cb, applyResult, loading, error, success, fetchCB, bankSurplus, applyBanked };
}
