import { useState, useCallback, useEffect } from 'react'
import { TotalIndicatorsAggregation, TotalIndicatorsData, DataProcessingConfig, DataSource, Currency } from '../types'

// Default configuration for total indicators
const TOTAL_INDICATORS_CONFIG: DataProcessingConfig = {
  source: DataSource.PAYMENTS_API, // This doesn't matter for total indicators
  currency: Currency.EUR, // Always EUR for total indicators
  exchangeRates: {}, // Not used for total indicators
  componentMapping: {}, // Not used for total indicators
  countyMapping: {}, // Not used for total indicators
  fieldMappings: {} // Not used for total indicators
}

/**
 * Hook for managing total indicators data
 * 
 * This hook handles the total indicators data from the indicatori_total endpoint.
 * The data is always displayed in EUR and doesn't change based on currency selection.
 */
export const useTotalIndicators = () => {
  const [aggregation] = useState(() => new TotalIndicatorsAggregation(TOTAL_INDICATORS_CONFIG))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalIndicators, setTotalIndicators] = useState<TotalIndicatorsData | null>(null)

  // Load total indicators data on mount
  useEffect(() => {
    const loadTotalIndicators = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        await aggregation.loadData()
        const indicators = aggregation.getTotalIndicators()
        setTotalIndicators(indicators)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        console.error('Error loading total indicators:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadTotalIndicators()
  }, [aggregation])

  // Get formatted indicators for display
  const getFormattedIndicators = useCallback(() => {
    return aggregation.getFormattedIndicators()
  }, [aggregation])

  // Get validation results
  const validateData = useCallback(() => {
    return aggregation.validateData()
  }, [aggregation])

  // Get data source info
  const getDataSourceInfo = useCallback(() => {
    return aggregation.getDataSourceInfo()
  }, [aggregation])

  // Check if data is available
  const hasData = useCallback(() => {
    return aggregation.hasData()
  }, [aggregation])

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await aggregation.loadData()
      const indicators = aggregation.getTotalIndicators()
      setTotalIndicators(indicators)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error refreshing total indicators:', err)
    } finally {
      setIsLoading(false)
    }
  }, [aggregation])

  return {
    // State
    totalIndicators,
    isLoading,
    error,
    
    // Actions
    refreshData,
    
    // Data access methods
    getFormattedIndicators,
    validateData,
    getDataSourceInfo,
    hasData,
    
    // Direct access to aggregation instance (for advanced usage)
    aggregation
  }
}
