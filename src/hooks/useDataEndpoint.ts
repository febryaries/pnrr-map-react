import { useState, useCallback, useMemo, useEffect } from 'react'
import { getPNRRDataService } from '../services/PNRRDataService'
import { DATA_ENDPOINTS, DataEndpointType } from '../constants/PNRRConstants'
import {
  CountyAggregation,
  StatisticsSummary,
  CountyRankingEntry,
  ChartDataPoint,
  FilterConfig,
  Metric
} from '../types/PNRRDataAggregation'

export type DataEndpoint = DataEndpointType

// Hook to manage data endpoint switching with new aggregation classes
export const useDataEndpoint = () => {
  const [endpoint, setEndpoint] = useState<DataEndpoint>(DATA_ENDPOINTS.PROJECTS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null)

  // Load only the active endpoint on mount (lazy loading for better performance)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true)
      setInitialLoadError(null)
      
      try {
        const dataService = getPNRRDataService()
        // Only load the current endpoint instead of all data sources
        await dataService.loadData(endpoint)
      } catch (err) {
        console.error('Failed to load initial data:', err)
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
      const dataService = getPNRRDataService()
      return await dataService.loadData(endpoint)
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
    switch (endpoint) {
      case DATA_ENDPOINTS.PAYMENTS:
        return {
          name: 'Payments',
          description: 'PNRR payment transactions data',
          source: 'plati_pnrr endpoint',
          focus: 'Actual payments made to beneficiaries'
        }
      case DATA_ENDPOINTS.PROJECTS:
        return {
          name: 'Projects',
          description: 'PNRR project progress and technical data',
          source: 'progres_tehnic_proiecte endpoint',
          focus: 'Project implementation status and details'
        }
      default:
        return {
          name: 'Unknown',
          description: 'Unknown data source',
          source: 'Unknown',
          focus: 'Unknown'
        }
    }
  }, [endpoint])

  // Get statistics for current endpoint
  const getStatistics = useCallback((): StatisticsSummary | null => {
    const dataService = getPNRRDataService()
    return dataService.getStatistics(endpoint)
  }, [endpoint])

  // Get county ranking for current endpoint
  const getCountyRanking = useCallback((metric: Metric, limit?: number): CountyRankingEntry[] => {
    const dataService = getPNRRDataService()
    return dataService.getCountyRanking(endpoint, metric, limit)
  }, [endpoint])

  // Get chart data for current endpoint
  const getChartData = useCallback((type: 'components' | 'programs' | 'counties', metric: Metric): ChartDataPoint[] => {
    const dataService = getPNRRDataService()
    return dataService.getChartData(endpoint, type, metric)
  }, [endpoint])

  // Get county data for current endpoint
  const getCountyData = useCallback((countyCode: string): CountyAggregation | null => {
    const dataService = getPNRRDataService()
    return dataService.getCountyData(endpoint, countyCode)
  }, [endpoint])

  // Check if data is cached for a specific endpoint
  const isDataCached = useCallback((endpointKey: DataEndpoint): boolean => {
    const dataService = getPNRRDataService()
    return dataService.isDataLoaded(endpointKey)
  }, [])

  // Get cache info
  const getCacheInfo = useCallback(() => {
    const dataService = getPNRRDataService()
    return dataService.getCacheInfo()
  }, [])

  return {
    // State
    endpoint,
    isLoading,
    error,
    isInitialLoading,
    initialLoadError,
    
    // Actions
    switchEndpoint,
    fetchData,
    
    // Data access methods
    getStatistics,
    getCountyRanking,
    getChartData,
    getCountyData,
    
    // Info
    endpointInfo,
    availableEndpoints: DATA_ENDPOINTS,
    
    // Cache info
    isDataCached,
    getCacheInfo
  }
}