/**
 * Hook for loading data from local sources instead of API calls
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CountyAggregation } from '../types/PNRRDataAggregation'
import { DATA_ENDPOINTS } from '../constants/PNRRConstants'
import { localDataService } from '../services/LocalDataService'

export type DataEndpoint = string

// Hook to manage local data loading
export const useLocalData = () => {
  const [endpoint, setEndpoint] = useState<DataEndpoint>(DATA_ENDPOINTS.PROJECTS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null)

  // Load critical data on mount for faster initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true)
      setInitialLoadError(null)
      
      try {
        // Preload critical data first (projects and payments)
        await localDataService.preloadCriticalData()
      } catch (err) {
        console.error('Failed to load initial local data:', err)
        setInitialLoadError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsInitialLoading(false)
      }
    }
    
    loadInitialData()
  }, [])

  // Get data from current endpoint
  const fetchData = useCallback(async (): Promise<CountyAggregation[]> => {
    setIsLoading(true)
    setError(null)
    
    try {
      return await localDataService.loadData(endpoint)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [endpoint])

  // Switch to a different endpoint
  const switchEndpoint = useCallback((newEndpoint: DataEndpoint) => {
    if (!Object.values(DATA_ENDPOINTS).includes(newEndpoint)) {
      console.error(`Invalid endpoint: ${newEndpoint}`)
      return
    }
    
    setEndpoint(newEndpoint)
    setError(null)
  }, [])

  // Get endpoint info
  const endpointInfo = useMemo(() => {
    const endpointNames = {
      [DATA_ENDPOINTS.PROJECTS]: 'Proiecte',
      [DATA_ENDPOINTS.PAYMENTS]: 'Plăți'
    }
    
    return {
      name: endpointNames[endpoint] || endpoint,
      isProjects: endpoint === DATA_ENDPOINTS.PROJECTS,
      isPayments: endpoint === DATA_ENDPOINTS.PAYMENTS
    }
  }, [endpoint])

  // Get cache statistics
  const cacheStats = useMemo(() => {
    return localDataService.getCacheStats()
  }, [endpoint])

  return {
    endpoint,
    isLoading,
    error,
    fetchData,
    switchEndpoint,
    endpointInfo,
    isInitialLoading,
    initialLoadError,
    cacheStats,
    isDataCached: localDataService.isDataCached(endpoint),
    isLoadingData: localDataService.isLoading(endpoint),
    clearCache: localDataService.clearCache.bind(localDataService)
  }
}
