/**
 * Local Data Service
 * Provides data loading from local sources instead of API calls
 */

import { CountyAggregation } from '../types/PNRRDataAggregation'
import { DATA_ENDPOINTS } from '../constants/PNRRConstants'
import { loadLocalData, loadAllLocalData, preloadCriticalData } from '../data/localDataLoader'

export class LocalDataService {
  private dataCache = new Map<string, CountyAggregation[]>()
  private loadingStates = new Map<string, boolean>()

  /**
   * Load data for a specific endpoint from local source
   */
  async loadData(endpoint: string): Promise<CountyAggregation[]> {
    // Check if data is already cached
    const cachedData = this.dataCache.get(endpoint)
    if (cachedData) {
      console.log(`📁 Using cached data for ${endpoint}`)
      return cachedData
    }

    // Set loading state
    this.loadingStates.set(endpoint, true)

    try {
      console.log(`📁 Loading local data for ${endpoint}...`)
      const data = await loadLocalData(endpoint)
      
      // Cache the data
      this.dataCache.set(endpoint, data)
      
      console.log(`✅ Loaded ${data.length} counties for ${endpoint} from local source`)
      return data
      
    } catch (error) {
      console.error(`❌ Error loading local data for ${endpoint}:`, error)
      throw error
    } finally {
      this.loadingStates.set(endpoint, false)
    }
  }

  /**
   * Preload critical data for faster initial load
   */
  async preloadCriticalData(): Promise<{
    payments: CountyAggregation[]
    projects: CountyAggregation[]
  }> {
    try {
      console.log('🚀 Preloading critical data...')
      const { projects, payments } = await preloadCriticalData()
      
      // Cache the data
      this.dataCache.set(DATA_ENDPOINTS.PROJECTS, projects)
      this.dataCache.set(DATA_ENDPOINTS.PAYMENTS, payments)
      
      console.log('✅ Preloaded critical data successfully')
      return { projects, payments }
      
    } catch (error) {
      console.error('❌ Error preloading critical data:', error)
      throw error
    }
  }

  /**
   * Load all data sources from local sources
   */
  async loadAllData(): Promise<{
    payments: CountyAggregation[]
    projects: CountyAggregation[]
  }> {
    try {
      console.log('📁 Loading all data from local sources...')
      const { projects, payments } = await loadAllLocalData()
      
      // Cache the data
      this.dataCache.set(DATA_ENDPOINTS.PROJECTS, projects)
      this.dataCache.set(DATA_ENDPOINTS.PAYMENTS, payments)
      
      console.log('✅ Loaded all data from local sources successfully')
      return { projects, payments }
      
    } catch (error) {
      console.error('❌ Error loading all local data:', error)
      throw error
    }
  }

  /**
   * Check if data is cached for an endpoint
   */
  isDataCached(endpoint: string): boolean {
    return this.dataCache.has(endpoint)
  }

  /**
   * Check if data is currently loading for an endpoint
   */
  isLoading(endpoint: string): boolean {
    return this.loadingStates.get(endpoint) || false
  }

  /**
   * Clear cache for a specific endpoint
   */
  clearCache(endpoint?: string): void {
    if (endpoint) {
      this.dataCache.delete(endpoint)
      console.log(`🗑️ Cleared cache for ${endpoint}`)
    } else {
      this.dataCache.clear()
      console.log('🗑️ Cleared all cache')
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {}
    for (const [endpoint, data] of this.dataCache.entries()) {
      stats[endpoint] = data.length
    }
    return stats
  }
}

// Create and export a singleton instance
export const localDataService = new LocalDataService()
