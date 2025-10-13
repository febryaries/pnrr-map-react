/**
 * Base Abstract Data Aggregation Class
 * 
 * This abstract class provides the foundation for all PNRR data aggregation
 * implementations. It defines the common interface and utility methods that
 * all concrete implementations must provide.
 */

import {
  County,
  Component,
  ProjectRecord,
  CountyAggregation,
  LocalityData,
  RawAPIData,
  DataProcessingConfig,
  DataValidationResult,
  ChartDataPoint,
  FilterConfig,
  StatisticsSummary,
  CountyRankingEntry,
  Currency,
  Metric
} from './PNRRDataAggregation';
import { convertRONToEUR, convertEURToRON, getExchangeRate } from '../services/ExchangeRateService';

/**
 * Abstract Base Class for PNRR Data Aggregation
 * 
 * This class defines the common interface and utility methods that all
 * concrete data aggregation implementations must provide. It handles
 * the core functionality needed to process, validate, and aggregate
 * PNRR data from various sources.
 */
export abstract class BaseDataAggregation {
  protected config: DataProcessingConfig;
  protected data: CountyAggregation[] = [];
  protected localities: LocalityData[] = [];
  
  constructor(config: DataProcessingConfig) {
    this.config = config;
  }
  
  // ========================================================================
  // ABSTRACT METHODS - Must be implemented by concrete classes
  // ========================================================================
  
  /**
   * Load data from the configured source
   * This method should fetch data from the appropriate source (API, file, etc.)
   */
  abstract loadData(): Promise<void>;
  
  /**
   * Process raw data into aggregated format
   * This method should transform raw API data into the standardized format
   */
  abstract processData(rawData: RawAPIData[]): CountyAggregation[];
  
  /**
   * Validate data integrity and completeness
   * This method should check the data for errors and inconsistencies
   */
  abstract validateData(): DataValidationResult;
  
  /**
   * Get aggregated data for all counties
   */
  abstract getAllCounties(): CountyAggregation[];
  
  /**
   * Get aggregated data for a specific county
   */
  abstract getCountyData(countyCode: string): CountyAggregation | null;
  
  /**
   * Get data filtered by specific criteria
   */
  abstract getFilteredData(filter: FilterConfig): CountyAggregation[];
  
  /**
   * Get project records for a specific county
   */
  abstract getCountyProjects(countyCode: string, filter?: FilterConfig): ProjectRecord[];
  
  /**
   * Get locality data with project information
   */
  abstract getLocalityData(countyCode?: string): LocalityData[];
  
  /**
   * Get chart data for visualizations
   */
  abstract getChartData(type: 'components' | 'programs' | 'counties', metric: Metric): ChartDataPoint[];
  
  /**
   * Get ranking data for counties
   */
  abstract getCountyRanking(metric: Metric, limit?: number): CountyRankingEntry[];
  
  /**
   * Get statistics and summary information
   */
  abstract getStatistics(): StatisticsSummary;
  
  // ========================================================================
  // UTILITY METHODS - Common functionality for all implementations
  // ========================================================================
  
  /**
   * Convert currency between EUR and RON
   */
  protected convertCurrency(
    amount: number, 
    fromCurrency: Currency, 
    toCurrency: Currency, 
    date?: string
  ): number {
    if (fromCurrency === toCurrency) return amount;
    
    const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
    const rate = this.config.exchangeRates[year] || this.config.exchangeRates[2024];
    
    if (fromCurrency === Currency.EUR && toCurrency === Currency.RON) {
      return amount * rate;
    } else if (fromCurrency === Currency.RON && toCurrency === Currency.EUR) {
      return amount / rate;
    }
    
    return amount;
  }
  
  /**
   * Normalize county name to county code
   */
  protected normalizeCountyName(countyName: string): string | null {
    if (!countyName) return null;
    
    const normalized = countyName.toUpperCase().trim();
    
    // Handle special cases
    if (normalized.includes('BUCUREŞTI') || normalized.includes('BUCUREȘTI') || normalized.includes('BUCURESTI')) {
      return 'BI';
    }
    
    // Find county code by matching county names
    for (const [code, name] of Object.entries(this.config.countyMapping)) {
      if (normalized.includes(name.toUpperCase())) {
        return code;
      }
    }
    
    // Handle common variations (with and without diacritics)
    const countyMappings: Record<string, string> = {
      'ALBA': 'AB',
      'ARGEŞ': 'AG', 'ARGES': 'AG', 'ARGEȘ': 'AG',
      'ARAD': 'AR',
      'BACĂU': 'BC', 'BACAU': 'BC',
      'BIHOR': 'BH',
      'BISTRIŢA': 'BN', 'BISTRITA': 'BN', 'BISTRIȚA': 'BN',
      'BRĂILA': 'BR', 'BRAILA': 'BR',
      'BOTOŞANI': 'BT', 'BOTOSANI': 'BT', 'BOTOȘANI': 'BT',
      'BRAŞOV': 'BV', 'BRASOV': 'BV', 'BRAȘOV': 'BV',
      'BUZĂU': 'BZ', 'BUZAU': 'BZ',
      'CLUJ': 'CJ',
      'CĂLĂRAŞI': 'CL', 'CALARASI': 'CL', 'CĂLĂRAȘI': 'CL',
      'CARAŞ': 'CS', 'CARAS': 'CS', 'CARAȘ': 'CS',
      'CONSTANŢA': 'CT', 'CONSTANTA': 'CT', 'CONSTANȚA': 'CT',
      'COVASNA': 'CV',
      'DÂMBOVIŢA': 'DB', 'DAMBOVITA': 'DB', 'DÂMBOVIȚA': 'DB',
      'DOLJ': 'DJ',
      'GALAŢI': 'GL', 'GALATI': 'GL', 'GALAȚI': 'GL',
      'GIURGIU': 'GR',
      'GORJ': 'GJ',
      'HUNEDOARA': 'HD',
      'HARGHITA': 'HR',
      'ILFOV': 'IF',
      'IALOMIŢA': 'IL', 'IALOMITA': 'IL', 'IALOMIȚA': 'IL',
      'IAŞI': 'IS', 'IASI': 'IS', 'IAȘI': 'IS',
      'MEHEDINŢI': 'MH', 'MEHEDINTI': 'MH', 'MEHEDINȚI': 'MH',
      'MARAMUREŞ': 'MM', 'MARAMURES': 'MM', 'MARAMUREȘ': 'MM',
      'MUREŞ': 'MS', 'MURES': 'MS', 'MUREȘ': 'MS',
      'NEAMŢ': 'NT', 'NEAMT': 'NT', 'NEAMȚ': 'NT',
      'OLT': 'OT',
      'PRAHOVA': 'PH',
      'SIBIU': 'SB',
      'SĂLAJ': 'SJ', 'SALAJ': 'SJ',
      'SATU MARE': 'SM',
      'SUCEAVA': 'SV',
      'TULCEA': 'TL',
      'TIMIŞ': 'TM', 'TIMIS': 'TM', 'TIMIȘ': 'TM',
      'TELEORMAN': 'TR',
      'VÂLCEA': 'VL', 'VALCEA': 'VL',
      'VRANCEA': 'VN',
      'VASLUI': 'VS'
    };
    
    for (const [key, code] of Object.entries(countyMappings)) {
      if (normalized.includes(key)) {
        return code;
      }
    }
    
    return null;
  }
  
  /**
   * Format monetary values for display
   */
  protected formatMoney(amount: number, currency: Currency = this.config.currency): string {
    const value = amount || 0;
    const millions = value / 1e6;
    const rounded = Math.ceil(millions * 100) / 100;
    return `${rounded.toLocaleString('ro-RO', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} mil ${currency}`;
  }
  
  /**
   * Format numbers for display
   */
  protected formatNumber(num: number): string {
    return new Intl.NumberFormat('ro-RO').format(num || 0);
  }
  
  /**
   * Convert Romanian diacritics to UTF-8
   */
  protected convertRomanianDiacritics(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .replace(/ã/g, 'ă')
      .replace(/â/g, 'â')
      .replace(/î/g, 'î')
      .replace(/ş/g, 'ș')
      .replace(/ţ/g, 'ț')
      .replace(/Ã/g, 'Ă')
      .replace(/Â/g, 'Â')
      .replace(/Î/g, 'Î')
      .replace(/Ş/g, 'Ș')
      .replace(/Ţ/g, 'Ț');
  }
  
  /**
   * Get exchange rate for a given date
   */
  protected getExchangeRate(dateString?: string): number {
    return getExchangeRate(dateString);
  }
  
  /**
   * Create a financial amount object with proper currency conversion
   */
  protected createFinancialAmount(
    eurAmount: number,
    ronAmount: number,
    date?: string,
    currency: Currency = this.config.currency
  ): { eur: number; ron: number; currency: Currency; exchangeRate?: number; date?: string } {
    const exchangeRate = this.getExchangeRate(date);
    
    // If we have both amounts, use them directly
    if (eurAmount > 0 && ronAmount > 0) {
      return {
        eur: eurAmount,
        ron: ronAmount,
        currency,
        exchangeRate,
        date
      };
    }
    
    // If only EUR amount available, convert to RON
    if (eurAmount > 0 && ronAmount === 0) {
      return {
        eur: eurAmount,
        ron: convertEURToRON(eurAmount, date),
        currency,
        exchangeRate,
        date
      };
    }
    
    // If only RON amount available, convert to EUR
    if (ronAmount > 0 && eurAmount === 0) {
      return {
        eur: convertRONToEUR(ronAmount, date),
        ron: ronAmount,
        currency,
        exchangeRate,
        date
      };
    }
    
    // Default to zero amounts
    return {
      eur: 0,
      ron: 0,
      currency,
      exchangeRate,
      date
    };
  }
  
  /**
   * Validate a project record
   */
  protected validateProjectRecord(record: ProjectRecord): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!record.beneficiaryName) {
      errors.push('Missing beneficiary name');
    }
    if (!record.componentCode) {
      errors.push('Missing component code');
    }
    if (!record.countyCode) {
      errors.push('Missing county code');
    }
    if (!record.title) {
      errors.push('Missing project title');
    }
    
    // Check financial data
    if (record.totalValue.eur < 0 || record.totalValue.ron < 0) {
      errors.push('Invalid financial amounts (negative values)');
    }
    
    // Check county code format
    if (record.countyCode && !record.countyCode.match(/^RO-[A-Z]{2}$/)) {
      errors.push('Invalid county code format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Filter projects based on search criteria
   */
  protected filterProjects(projects: ProjectRecord[], filter: FilterConfig): ProjectRecord[] {
    return projects.filter(project => {
      // Search term filter
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const searchableFields = [
          project.title,
          project.beneficiaryName,
          project.componentLabel,
          project.locality,
          project.contractNumber || ''
        ];
        
        const matchesSearch = searchableFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
        
        if (!matchesSearch) return false;
      }
      
      // County filter
      if (filter.countyFilter && filter.countyFilter.length > 0) {
        if (!filter.countyFilter.includes(project.countyCode)) {
          return false;
        }
      }
      
      // Component filter
      if (filter.componentFilter && filter.componentFilter.length > 0) {
        if (!filter.componentFilter.includes(project.componentCode)) {
          return false;
        }
      }
      
      // Program filter
      if (filter.programFilter && filter.programFilter.length > 0) {
        const programKey = project.__programKey;
        if (!programKey || !filter.programFilter.includes(programKey)) {
          return false;
        }
      }
      
      // Date range filter
      if (filter.dateRange) {
        const projectDate = project.paymentDate || project.engagementDate || project.startDate;
        if (projectDate) {
          const date = new Date(projectDate);
          const startDate = new Date(filter.dateRange.start);
          const endDate = new Date(filter.dateRange.end);
          
          if (date < startDate || date > endDate) {
            return false;
          }
        }
      }
      
      // Value range filter
      if (filter.valueRange) {
        const value = project.totalValue.eur;
        if (value < filter.valueRange.min || value > filter.valueRange.max) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Calculate statistics for a dataset
   */
  protected calculateStatistics(data: CountyAggregation[]): StatisticsSummary {
    const allProjects = data.flatMap(county => county.extras.rows);
    const totalValue = data.reduce((sum, county) => sum + county.total.value, 0);
    const totalProjects = data.reduce((sum, county) => sum + county.total.projects, 0);
    
    // Find top county by value
    const topCounty = data.reduce((max, county) => 
      county.total.value > max.total.value ? county : max
    ).county;
    
    // Find top component
    const componentTotals = new Map<string, number>();
    allProjects.forEach(project => {
      const current = componentTotals.get(project.componentCode) || 0;
      componentTotals.set(project.componentCode, current + project.totalValue.eur);
    });
    
    const topComponentCode = Array.from(componentTotals.entries())
      .reduce((max, [code, value]) => value > max.value ? { code, value } : max, { code: '', value: 0 })
      .code;
    
    const topComponent: Component = {
      key: topComponentCode,
      label: this.config.componentMapping[topComponentCode]?.label || 'Unknown',
      program: this.config.componentMapping[topComponentCode]?.program || 'Unknown'
    };
    
    return {
      totalValue,
      totalProjects,
      countyCount: data.length,
      componentCount: componentTotals.size,
      averageProjectValue: totalProjects > 0 ? totalValue / totalProjects : 0,
      topCounty,
      topComponent
    };
  }
  
  /**
   * Get the current configuration
   */
  public getConfig(): DataProcessingConfig {
    return { ...this.config };
  }
  
  /**
   * Update the configuration
   */
  public updateConfig(newConfig: Partial<DataProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Clear all loaded data
   */
  public clearData(): void {
    this.data = [];
    this.localities = [];
  }
  
  /**
   * Check if data is loaded
   */
  public hasData(): boolean {
    return this.data.length > 0;
  }
  
  /**
   * Get data source information
   */
  public getDataSourceInfo(): { source: string; recordCount: number; lastUpdated?: Date } {
    return {
      source: this.config.source,
      recordCount: this.data.reduce((sum, county) => sum + county.total.projects, 0),
      lastUpdated: new Date() // This could be tracked in a real implementation
    };
  }
}
