/**
 * Hook for managing available PNRR data dates
 * 
 * Provides automatic fetching and polling of available dates from contains.json
 * Updates every 6 hours to detect new data
 */

import { useState, useEffect, useCallback } from 'react';
import { getDataAvailabilityService, AvailableDate } from '../services/DataAvailabilityService';

export interface UseAvailableDatesResult {
  availableDates: AvailableDate[];
  isLoading: boolean;
  error: string | null;
  latestDate: string | null;
  refresh: () => Promise<void>;
  cacheInfo: { cached: boolean; age: number; count: number };
}

export const useAvailableDates = (autoStart: boolean = true): UseAvailableDatesResult => {
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string | null>(null);

  const dataService = getDataAvailabilityService();

  // Fetch available dates
  const fetchDates = useCallback(async (force: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const dates = await dataService.fetchAvailableDates(force);
      setAvailableDates(dates);
      
      // Set latest date
      if (dates.length > 0) {
        setLatestDate(dates[0].value);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch available dates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // Refresh (force fetch)
  const refresh = useCallback(async () => {
    await fetchDates(true);
  }, [fetchDates]);

  // Get cache info
  const cacheInfo = dataService.getCacheInfo();

  // Initialize and start polling
  useEffect(() => {
    if (!autoStart) return;

    // Initial fetch
    fetchDates();

    // Start automatic polling
    dataService.startPolling();

    // Subscribe to updates
    const unsubscribe = dataService.subscribe((dates) => {
      console.log('📅 Received date update:', dates.length, 'dates');
      setAvailableDates(dates);
      if (dates.length > 0) {
        setLatestDate(dates[0].value);
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
      dataService.stopPolling();
    };
  }, [autoStart, dataService, fetchDates]);

  return {
    availableDates,
    isLoading,
    error,
    latestDate,
    refresh,
    cacheInfo
  };
};
