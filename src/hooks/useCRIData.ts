import { useState, useEffect } from 'react';
import CRIService, { CRIData } from '../services/CRIService';

export interface UseCRIDataResult {
  criData: CRIData[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for fetching and managing CRI data
 */
export const useCRIData = (): UseCRIDataResult => {
  const [criData, setCriData] = useState<CRIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCRIData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await CRIService.getCRIData();
      console.log('🔍 useCRIData: Received CRI data:', data.length, 'entries');
      console.log('🔍 useCRIData: Sample data:', data.slice(0, 3));
      setCriData(data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CRI data';
      setError(errorMessage);
      console.error('Error fetching CRI data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRIData();
  }, []);

  const refresh = () => {
    CRIService.clearCache();
    fetchCRIData();
  };

  return {
    criData,
    loading,
    error,
    refresh
  };
};

export default useCRIData;
