import { useState, useEffect, useCallback } from 'react';
import type { Route, RouteFilters } from '../../../core/domain/types';
import { routeService } from '../../infrastructure/apiService';

export function useRoutes(filters?: Partial<RouteFilters>) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeService.getRoutes(filters);
      setRoutes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  }, [filters?.vesselType, filters?.fuelType, filters?.year]); // eslint-disable-line

  useEffect(() => { fetch(); }, [fetch]);

  const setBaseline = async (routeId: string) => {
    try {
      await routeService.setBaseline(routeId);
      await fetch();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to set baseline');
    }
  };

  return { routes, loading, error, refetch: fetch, setBaseline };
}
