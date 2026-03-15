import { useState, useEffect } from 'react';
import type { ComparisonResult } from '../../../core/domain/types';
import { routeService } from '../../infrastructure/apiService';

export function useComparison() {
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeService.getComparison();
      setResults(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  return { results, loading, error, refetch: fetch };
}
