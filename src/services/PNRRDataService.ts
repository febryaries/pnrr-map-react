/**
 * PNRR Data Service
 * 
 * This service provides a unified interface for accessing PNRR data
 * using the PaymentDataAggregation and ProjectDataAggregation classes.
 * It replaces the old realData.js and realDataProjects.js files.
 */

import { PaymentDataAggregation } from '../types/PaymentDataAggregation';
import { ProjectDataAggregation } from '../types/ProjectDataAggregation';
import { CountyAggregation } from '../types/PNRRDataAggregation';
import { DATA_ENDPOINTS, DataEndpointType } from '../constants/PNRRConstants';

export class PNRRDataService {
  private paymentAggregation: PaymentDataAggregation;
  private projectAggregation: ProjectDataAggregation;
  private dataCache: Map<DataEndpointType, CountyAggregation[]> = new Map();
  private loadingStates: Map<DataEndpointType, boolean> = new Map();

  constructor() {
    this.paymentAggregation = new PaymentDataAggregation();
    this.projectAggregation = new ProjectDataAggregation();
    
    // Initialize loading states
    this.loadingStates.set(DATA_ENDPOINTS.PAYMENTS, false);
    this.loadingStates.set(DATA_ENDPOINTS.PROJECTS, false);
  }

  /**
   * Load data for a specific endpoint
   */
  async loadData(endpoint: DataEndpointType): Promise<CountyAggregation[]> {
    // Check if data is already cached
    const cachedData = this.dataCache.get(endpoint);
    if (cachedData) {
      return cachedData;
    }

    // Set loading state
    this.loadingStates.set(endpoint, true);

    try {
      let aggregation: PaymentDataAggregation | ProjectDataAggregation;
      
      switch (endpoint) {
        case DATA_ENDPOINTS.PAYMENTS:
          aggregation = this.paymentAggregation;
          break;
        case DATA_ENDPOINTS.PROJECTS:
          aggregation = this.projectAggregation;
          break;
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`);
      }

      // Load the data
      await aggregation.loadData();
      const data = aggregation.getAllCounties();
      
      // Cache the data
      this.dataCache.set(endpoint, data);
      
      return data;
      
    } catch (error) {
      console.error(`❌ Error loading data for ${endpoint}:`, error);
      throw error;
    } finally {
      this.loadingStates.set(endpoint, false);
    }
  }

  /**
   * Load all data sources
   */
  async loadAllData(): Promise<{
    payments: CountyAggregation[];
    projects: CountyAggregation[];
  }> {
    try {
      const [paymentsData, projectsData] = await Promise.all([
        this.loadData(DATA_ENDPOINTS.PAYMENTS),
        this.loadData(DATA_ENDPOINTS.PROJECTS)
      ]);

      return {
        payments: paymentsData,
        projects: projectsData
      };
    } catch (error) {
      console.error('❌ Error loading all data sources:', error);
      throw error;
    }
  }

  /**
   * Get data for a specific endpoint
   */
  getData(endpoint: DataEndpointType): CountyAggregation[] | null {
    return this.dataCache.get(endpoint) || null;
  }

  /**
   * Get county data for a specific endpoint
   */
  getCountyData(endpoint: DataEndpointType, countyCode: string): CountyAggregation | null {
    const data = this.getData(endpoint);
    if (!data) return null;
    
    return data.find(county => county.county.code === countyCode) || null;
  }

  /**
   * Check if data is loaded for an endpoint
   */
  isDataLoaded(endpoint: DataEndpointType): boolean {
    return this.dataCache.has(endpoint);
  }

  /**
   * Check if data is currently loading for an endpoint
   */
  isLoading(endpoint: DataEndpointType): boolean {
    return this.loadingStates.get(endpoint) || false;
  }

  /**
   * Clear cached data for an endpoint
   */
  clearCache(endpoint?: DataEndpointType): void {
    if (endpoint) {
      this.dataCache.delete(endpoint);
    } else {
      this.dataCache.clear();
    }
  }

  /**
   * Get validation results for an endpoint
   */
  validateData(endpoint: DataEndpointType): any {
    let aggregation: PaymentDataAggregation | ProjectDataAggregation;
    
    switch (endpoint) {
      case DATA_ENDPOINTS.PAYMENTS:
        aggregation = this.paymentAggregation;
        break;
      case DATA_ENDPOINTS.PROJECTS:
        aggregation = this.projectAggregation;
        break;
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return aggregation.validateData();
  }

  /**
   * Get statistics for an endpoint
   */
  getStatistics(endpoint: DataEndpointType): any {
    let aggregation: PaymentDataAggregation | ProjectDataAggregation;
    
    switch (endpoint) {
      case DATA_ENDPOINTS.PAYMENTS:
        aggregation = this.paymentAggregation;
        break;
      case DATA_ENDPOINTS.PROJECTS:
        aggregation = this.projectAggregation;
        break;
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return aggregation.getStatistics();
  }

  /**
   * Get chart data for an endpoint
   */
  getChartData(endpoint: DataEndpointType, type: 'components' | 'programs' | 'counties', metric: 'value' | 'projects'): any[] {
    let aggregation: PaymentDataAggregation | ProjectDataAggregation;
    
    switch (endpoint) {
      case DATA_ENDPOINTS.PAYMENTS:
        aggregation = this.paymentAggregation;
        break;
      case DATA_ENDPOINTS.PROJECTS:
        aggregation = this.projectAggregation;
        break;
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return aggregation.getChartData(type, metric as any);
  }

  /**
   * Get county ranking for an endpoint
   */
  getCountyRanking(endpoint: DataEndpointType, metric: 'value' | 'projects', limit?: number): any[] {
    let aggregation: PaymentDataAggregation | ProjectDataAggregation;
    
    switch (endpoint) {
      case DATA_ENDPOINTS.PAYMENTS:
        aggregation = this.paymentAggregation;
        break;
      case DATA_ENDPOINTS.PROJECTS:
        aggregation = this.projectAggregation;
        break;
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    return aggregation.getCountyRanking(metric as any, limit);
  }

  /**
   * Get cache info
   */
  getCacheInfo(): {
    [key in DataEndpointType]: {
      isLoaded: boolean;
      isLoading: boolean;
      recordCount: number;
    }
  } {
    return {
      [DATA_ENDPOINTS.PAYMENTS]: {
        isLoaded: this.isDataLoaded(DATA_ENDPOINTS.PAYMENTS),
        isLoading: this.isLoading(DATA_ENDPOINTS.PAYMENTS),
        recordCount: this.getData(DATA_ENDPOINTS.PAYMENTS)?.length || 0
      },
      [DATA_ENDPOINTS.PROJECTS]: {
        isLoaded: this.isDataLoaded(DATA_ENDPOINTS.PROJECTS),
        isLoading: this.isLoading(DATA_ENDPOINTS.PROJECTS),
        recordCount: this.getData(DATA_ENDPOINTS.PROJECTS)?.length || 0
      }
    };
  }
}

// Singleton instance
let dataServiceInstance: PNRRDataService | null = null;

/**
 * Get the singleton instance of PNRRDataService
 */
export const getPNRRDataService = (): PNRRDataService => {
  if (!dataServiceInstance) {
    dataServiceInstance = new PNRRDataService();
  }
  return dataServiceInstance;
};

/**
 * Convenience functions for backward compatibility
 */
export const getRealPNRRData = async (): Promise<CountyAggregation[]> => {
  const service = getPNRRDataService();
  return await service.loadData(DATA_ENDPOINTS.PAYMENTS);
};

export const getRealPNRRProjectsData = async (): Promise<CountyAggregation[]> => {
  const service = getPNRRDataService();
  return await service.loadData(DATA_ENDPOINTS.PROJECTS);
};
