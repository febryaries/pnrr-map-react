/**
 * Total Indicators Data Aggregation
 * 
 * This class handles total indicators data from the PNRR indicatori_total API.
 * It processes summary statistics that are always displayed in EUR.
 */

import { BaseDataAggregation } from './BaseDataAggregation';
import {
  DataProcessingConfig,
  DataValidationResult,
  Currency
} from './PNRRDataAggregation';

/**
 * Total Indicators Data Structure
 * Represents the summary statistics from the indicatori_total endpoint
 */
export interface TotalIndicatorsData {
  alocat_eur: number;           // Total allocated amount in EUR
  platit_eur: number;           // Total paid to beneficiaries in EUR
  incasat_eur: number;          // Total received from EU in EUR
  nr_beneficiari_plati: number; // Number of beneficiaries with payments
  nr_proiecte: number;          // Total number of projects
  data_actualizare?: string;    // Last update date
}

/**
 * Raw API response structure for total indicators
 */
export interface RawTotalIndicatorsData {
  alocat_eur?: number;
  platit_eur?: number;
  incasat_eur?: number;
  nr_beneficiari_plati?: number;
  nr_proiecte?: number;
  data_actualizare?: string;
}

/**
 * Total Indicators Data Aggregation Class
 * 
 * Handles total indicators data from the indicatori_total API endpoint.
 * This data represents summary statistics and is always displayed in EUR.
 */
export class TotalIndicatorsAggregation extends BaseDataAggregation {
  private totalIndicators: TotalIndicatorsData | null = null;
  private isLoading: boolean = false;
  private error: string | null = null;

  constructor(config: DataProcessingConfig) {
    super(config);
  }

  /**
   * Load total indicators data from the API
   */
  async loadData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      
      console.log('Loading total indicators from PNRR API...');
      
      const rawData = await this.fetchTotalIndicators();
      this.totalIndicators = this.processTotalIndicators(rawData);
      
      console.log('Successfully loaded total indicators data');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.error = errorMessage;
      console.error('Error loading total indicators:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Process raw total indicators data
   */
  processData(rawData: any[]): any[] {
    // This method is not used for total indicators
    // as we only have a single summary record
    return [];
  }

  /**
   * Validate total indicators data
   */
  validateData(): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!this.totalIndicators) {
      errors.push('No total indicators data available');
      return {
        isValid: false,
        errors,
        warnings,
        statistics: {
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          missingFields: {}
        }
      };
    }

    // Validate required fields
    if (this.totalIndicators.alocat_eur === undefined || this.totalIndicators.alocat_eur === null) {
      errors.push('Missing allocated amount (alocat_eur)');
    }
    if (this.totalIndicators.platit_eur === undefined || this.totalIndicators.platit_eur === null) {
      errors.push('Missing paid amount (platit_eur)');
    }
    if (this.totalIndicators.incasat_eur === undefined || this.totalIndicators.incasat_eur === null) {
      errors.push('Missing received amount (incasat_eur)');
    }
    if (this.totalIndicators.nr_beneficiari_plati === undefined || this.totalIndicators.nr_beneficiari_plati === null) {
      errors.push('Missing number of beneficiaries (nr_beneficiari_plati)');
    }
    if (this.totalIndicators.nr_proiecte === undefined || this.totalIndicators.nr_proiecte === null) {
      errors.push('Missing number of projects (nr_proiecte)');
    }

    // Validate data ranges
    if (this.totalIndicators.alocat_eur < 0) {
      warnings.push('Allocated amount is negative');
    }
    if (this.totalIndicators.platit_eur < 0) {
      warnings.push('Paid amount is negative');
    }
    if (this.totalIndicators.incasat_eur < 0) {
      warnings.push('Received amount is negative');
    }
    if (this.totalIndicators.nr_beneficiari_plati < 0) {
      warnings.push('Number of beneficiaries is negative');
    }
    if (this.totalIndicators.nr_proiecte < 0) {
      warnings.push('Number of projects is negative');
    }

    // Check logical consistency
    if (this.totalIndicators.platit_eur > this.totalIndicators.alocat_eur) {
      warnings.push('Paid amount exceeds allocated amount');
    }
    if (this.totalIndicators.incasat_eur > this.totalIndicators.platit_eur) {
      warnings.push('Received amount exceeds paid amount');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics: {
        totalRecords: 1,
        validRecords: errors.length === 0 ? 1 : 0,
        invalidRecords: errors.length > 0 ? 1 : 0,
        missingFields: {}
      }
    };
  }

  /**
   * Get total indicators data
   */
  getTotalIndicators(): TotalIndicatorsData | null {
    return this.totalIndicators;
  }

  /**
   * Get formatted total indicators for display
   */
  getFormattedIndicators(): {
    alocat: string;
    platit: string;
    incasat: string;
    beneficiari: string;
    proiecte: string;
  } | null {
    if (!this.totalIndicators) return null;

    return {
      alocat: this.formatMoney(this.totalIndicators.alocat_eur, Currency.EUR),
      platit: this.formatMoney(this.totalIndicators.platit_eur, Currency.EUR),
      incasat: this.formatMoney(this.totalIndicators.incasat_eur, Currency.EUR),
      beneficiari: this.formatNumber(this.totalIndicators.nr_beneficiari_plati),
      proiecte: this.formatNumber(this.totalIndicators.nr_proiecte)
    };
  }

  /**
   * Get loading state
   */
  getLoadingState(): boolean {
    return this.isLoading;
  }

  /**
   * Get error state
   */
  getError(): string | null {
    return this.error;
  }

  /**
   * Check if data is available
   */
  hasData(): boolean {
    return this.totalIndicators !== null;
  }

  /**
   * Get data source info
   */
  getDataSourceInfo(): { source: string; recordCount: number; lastUpdated?: Date } {
    return {
      source: 'indicatori_total',
      recordCount: this.totalIndicators ? 1 : 0,
      lastUpdated: this.totalIndicators?.data_actualizare ? new Date(this.totalIndicators.data_actualizare) : undefined
    };
  }

  // ========================================================================
  // ABSTRACT METHODS IMPLEMENTATION (required by base class)
  // ========================================================================

  getAllCounties(): any[] {
    // Not applicable for total indicators
    return [];
  }

  getCountyData(countyCode: string): any {
    // Not applicable for total indicators
    return null;
  }

  getFilteredData(filter: any): any[] {
    // Not applicable for total indicators
    return [];
  }

  getCountyProjects(countyCode: string, filter?: any): any[] {
    // Not applicable for total indicators
    return [];
  }

  getLocalityData(countyCode?: string): any[] {
    // Not applicable for total indicators
    return [];
  }

  getChartData(type: 'components' | 'programs' | 'counties', metric: any): any[] {
    // Not applicable for total indicators
    return [];
  }

  getCountyRanking(metric: any, limit?: number): any[] {
    // Not applicable for total indicators
    return [];
  }

  getStatistics(): any {
    // Return total indicators as statistics
    if (!this.totalIndicators) {
      return {
        totalValue: 0,
        totalProjects: 0,
        countyCount: 0,
        componentCount: 0,
        averageProjectValue: 0,
        topCounty: null,
        topComponent: null
      };
    }

    return {
      totalValue: this.totalIndicators.alocat_eur,
      totalProjects: this.totalIndicators.nr_proiecte,
      countyCount: 0,
      componentCount: 0,
      averageProjectValue: this.totalIndicators.nr_proiecte > 0 ? this.totalIndicators.alocat_eur / this.totalIndicators.nr_proiecte : 0,
      topCounty: null,
      topComponent: null,
      // Additional indicators-specific statistics
      totalPaid: this.totalIndicators.platit_eur,
      totalReceived: this.totalIndicators.incasat_eur,
      beneficiariesCount: this.totalIndicators.nr_beneficiari_plati,
      paymentRate: this.totalIndicators.alocat_eur > 0 ? (this.totalIndicators.platit_eur / this.totalIndicators.alocat_eur) * 100 : 0,
      collectionRate: this.totalIndicators.platit_eur > 0 ? (this.totalIndicators.incasat_eur / this.totalIndicators.platit_eur) * 100 : 0
    };
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  /**
   * Fetch total indicators from the API
   */
  private async fetchTotalIndicators(): Promise<RawTotalIndicatorsData> {
    const url = 'https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/indicatori_total';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('No total indicators data received from API');
    }
    
    return data.items[0];
  }

  /**
   * Process raw total indicators data into our format
   */
  private processTotalIndicators(rawData: RawTotalIndicatorsData): TotalIndicatorsData {
    return {
      alocat_eur: rawData.alocat_eur || 0,
      platit_eur: rawData.platit_eur || 0,
      incasat_eur: rawData.incasat_eur || 0,
      nr_beneficiari_plati: rawData.nr_beneficiari_plati || 0,
      nr_proiecte: rawData.nr_proiecte || 0,
      data_actualizare: rawData.data_actualizare
    };
  }
}
