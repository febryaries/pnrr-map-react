/**
 * Payment Data Aggregation Implementation
 * 
 * This class handles payment data from the PNRR plati_pnrr API.
 * It processes actual payment records and aggregates them by county and component.
 */

import { BaseDataAggregation } from './BaseDataAggregation';
import {
  County,
  Component,
  ProjectRecord,
  CountyAggregation,
  LocalityData,
  RawAPIData,
  DataValidationResult,
  ChartDataPoint,
  FilterConfig,
  StatisticsSummary,
  CountyRankingEntry,
  Currency,
  Metric,
  FinancialAmount
} from './PNRRDataAggregation';
import { 
  COMPONENT_MAPPING, 
  COUNTY_MAP, 
  API_ENDPOINTS, 
  convertRomanianDiacritics,
  normalizeCountyName
} from '../constants/PNRRConstants';
import { convertRONToEUR, convertEURToRON } from '../services/ExchangeRateService';

/**
 * Payment Data Aggregation Class
 * 
 * Handles payment data from the plati_pnrr API endpoint.
 * This data represents actual payments made to beneficiaries.
 */
export class PaymentDataAggregation extends BaseDataAggregation {
  
  constructor() {
    super({
      source: 'payments' as any,
      currency: 'EUR' as any,
      exchangeRates: {}, // Not used anymore, ExchangeRateService handles this
      componentMapping: COMPONENT_MAPPING,
      countyMapping: COUNTY_MAP,
      fieldMappings: {}
    });
  }
  
  /**
   * Load payment data from the PNRR API
   */
  async loadData(): Promise<void> {
    try {
      // Fetch data from the API with pagination
      const allData = await this.fetchAllPaymentData();
      
      if (allData.length === 0) {
        console.warn('No payment data received from API');
        return;
      }
      
      // Process the raw data
      this.data = this.processData(allData);
    } catch (error) {
      console.error('Error loading payment data:', error);
      throw error;
    }
  }
  
  /**
   * Process raw payment data into aggregated format
   */
  processData(rawData: RawAPIData[]): CountyAggregation[] {
    
    const countyData: Record<string, CountyAggregation> = {};
    const multiCountyProjects: RawAPIData[] = [];
    
    // Initialize county data structure
    Object.keys(this.config.countyMapping).forEach(code => {
      countyData[code] = this.createEmptyCountyData(code);
    });
    
    // Process each payment record
    let processedCount = 0;
    let skippedCount = 0;
    
    rawData.forEach((item, index) => {
      const countyCode = this.normalizeCountyName(this.convertRomanianDiacritics(item.judet_beneficiar || item.localitate_beneficiar || ''));
      const componentMapping = this.config.componentMapping[item.cod_componenta || ''];
      
      if (!countyCode || !componentMapping) {
        // Handle as multi-county or unknown
        multiCountyProjects.push(item);
        skippedCount++;
        return;
      }
      
      processedCount++;
      
      const county = countyData[countyCode];
      if (!county) return;

      const programKey = componentMapping.program;
      
      // Get both EUR and RON amounts from the data
      const eurAmount = parseFloat(String(item.valoare_plata_fe_euro || 0));
      const ronAmount = parseFloat(String(item.valoare_plata_fe || 0));
      const paymentDate = item.data_plata || '';
      
      // Create financial amount with proper conversion
      const financialAmount = this.createFinancialAmount(eurAmount, ronAmount, paymentDate);
      
      // Use raw EUR amount for calculations (matching Excel processing)
      const value = eurAmount;
      
      // Add to county totals
      county.total.value += value;
      county.total.projects += 1;
      
      // Update county programs
      if (county.programs[programKey]) {
        county.programs[programKey].value += value;
        county.programs[programKey].projects += 1;
      }
      
      // Update county components
      if (county.components[item.cod_componenta || '']) {
        county.components[item.cod_componenta || ''].value += value;
        county.components[item.cod_componenta || ''].projects += 1;
      }
      
      // Create project row for extras (using old field names for compatibility)
      const projectRow: any = {
        // New structure fields
        title: this.convertRomanianDiacritics(`${item.masura || ''} - ${item.localitate_beneficiar || ''}`.trim()),
        beneficiaryName: this.convertRomanianDiacritics(item.nume_beneficiar || ''),
        beneficiaryCUI: item.cui_beneficiar_final,
        beneficiaryLocality: this.convertRomanianDiacritics(item.localitate_beneficiar || ''),
        totalValue: financialAmount,
        componentCode: item.cod_componenta || '',
        componentLabel: this.convertRomanianDiacritics(componentMapping.label),
        measureCode: item.cod_masura || '',
        fundingSource: this.convertRomanianDiacritics(item.sursa_finantare || ''),
        countyCode: `RO-${countyCode}`,
        countyName: this.convertRomanianDiacritics(this.config.countyMapping[countyCode]),
        locality: this.convertRomanianDiacritics(item.localitate_beneficiar || ''),
        paymentDate: paymentDate,
        cri: item.cri,
        caenCode: item.cod_diviziune_caen,
        caenDescription: this.convertRomanianDiacritics(item.descriere_diviziune_caen || ''),
        scope: this.convertRomanianDiacritics(`${item.masura || ''} - ${item.localitate_beneficiar || ''}`.trim()),
        __programKey: programKey,
        __shareValue: value,
        __shareProjects: 1,
        
        // Old structure fields for compatibility with MapView
        NUME_BENEFICIAR: this.convertRomanianDiacritics(item.nume_beneficiar || ''),
        VALOARE_PLATA_EURO: eurAmount,
        VALOARE_PLATA_RON: ronAmount,
        DATA_PLATA: paymentDate,
        MASURA: this.convertRomanianDiacritics(item.masura || ''),
        SURSA_FINANTARE: this.convertRomanianDiacritics(item.sursa_finantare || ''),
        LOCALITATE_BENEFICIAR: this.convertRomanianDiacritics(item.localitate_beneficiar || ''),
        COD_COMPONENTA: item.cod_componenta || '',
        COMPONENTA_LABEL: this.convertRomanianDiacritics(componentMapping.label),
        COD_MASURA: item.cod_masura || '',
        CRI: item.cri || '',
        CUI_BENEFICIAR_FINAL: item.cui_beneficiar_final || '',
        COD_DIVIZIUNE_CAEN: item.cod_diviziune_caen || '',
        DESCRIERE_DIVIZIUNE_CAEN: this.convertRomanianDiacritics(item.descriere_diviziune_caen || ''),
        SCOP_PROIECT: this.convertRomanianDiacritics(`${item.masura || ''} - ${item.localitate_beneficiar || ''}`.trim()),
        __program_key: programKey,
        __share_value: value,
        __share_projects: 1
      };
      
      county.extras.rows.push(projectRow);
    });
    
    // Convert to array format
    const result = Object.values(countyData);
    
    // Add multi-county data if exists
    if (multiCountyProjects.length > 0) {
      const multiData = this.createMultiCountyData(multiCountyProjects);
      result.push(multiData);
    }
    
    return result;
  }
  
  /**
   * Validate payment data integrity and completeness
   */
  validateData(): DataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const statistics = {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      missingFields: {} as Record<string, number>
    };
    
    // Validate each county's data
    this.data.forEach(county => {
      statistics.totalRecords += county.total.projects;
      
      county.extras.rows.forEach(project => {
        const validation = this.validateProjectRecord(project);
        
        if (validation.isValid) {
          statistics.validRecords++;
        } else {
          statistics.invalidRecords++;
          errors.push(...validation.errors.map(err => 
            `${county.county.name}: ${err}`
          ));
        }
        
        // Track missing fields
        if (!project.beneficiaryName) {
          statistics.missingFields.beneficiaryName = (statistics.missingFields.beneficiaryName || 0) + 1;
        }
        if (!project.componentCode) {
          statistics.missingFields.componentCode = (statistics.missingFields.componentCode || 0) + 1;
        }
        if (project.totalValue.eur === 0 && project.totalValue.ron === 0) {
          statistics.missingFields.financialAmount = (statistics.missingFields.financialAmount || 0) + 1;
        }
      });
    });
    
    // Add warnings for data quality issues
    if (statistics.missingFields.beneficiaryName > 0) {
      warnings.push(`${statistics.missingFields.beneficiaryName} records missing beneficiary name`);
    }
    if (statistics.missingFields.componentCode > 0) {
      warnings.push(`${statistics.missingFields.componentCode} records missing component code`);
    }
    if (statistics.missingFields.financialAmount > 0) {
      warnings.push(`${statistics.missingFields.financialAmount} records missing financial amounts`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics
    };
  }
  
  /**
   * Get aggregated data for all counties
   */
  getAllCounties(): CountyAggregation[] {
    return this.data;
  }
  
  /**
   * Get aggregated data for a specific county
   */
  getCountyData(countyCode: string): CountyAggregation | null {
    return this.data.find(d => d.county.code === countyCode) || null;
  }
  
  /**
   * Get data filtered by specific criteria
   */
  getFilteredData(filter: FilterConfig): CountyAggregation[] {
    if (!filter || Object.keys(filter).length === 0) {
      return this.data;
    }
    
    return this.data.map(county => ({
      ...county,
      extras: {
        ...county.extras,
        rows: this.filterProjects(county.extras.rows, filter)
      }
    })).filter(county => county.extras.rows.length > 0);
  }
  
  /**
   * Get project records for a specific county
   */
  getCountyProjects(countyCode: string, filter?: FilterConfig): ProjectRecord[] {
    const county = this.getCountyData(countyCode);
    if (!county) return [];
    
    const projects = county.extras.rows;
    return filter ? this.filterProjects(projects, filter) : projects;
  }
  
  /**
   * Get locality data with project information
   */
  getLocalityData(countyCode?: string): LocalityData[] {
    const localities = countyCode 
      ? this.localities.filter(l => l.county === countyCode)
      : this.localities;
    
    return localities;
  }
  
  /**
   * Get chart data for visualizations
   */
  getChartData(type: 'components' | 'programs' | 'counties', metric: Metric): ChartDataPoint[] {
    switch (type) {
      case 'components':
        return this.getComponentChartData(metric);
      case 'programs':
        return this.getProgramChartData(metric);
      case 'counties':
        return this.getCountyChartData(metric);
      default:
        return [];
    }
  }
  
  /**
   * Get ranking data for counties
   */
  getCountyRanking(metric: Metric, limit?: number): CountyRankingEntry[] {
    const ranking = this.data
      .map(county => ({
        county: county.county,
        value: metric === Metric.VALUE ? county.total.value : county.total.projects
      }))
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
    
    return limit ? ranking.slice(0, limit) : ranking;
  }
  
  /**
   * Get statistics and summary information
   */
  getStatistics(): StatisticsSummary {
    return this.calculateStatistics(this.data);
  }
  
  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================
  
  /**
   * Fetch all payment data from the API with pagination
   */
  private async fetchAllPaymentData(): Promise<RawAPIData[]> {
    const allData: RawAPIData[] = [];
    let offset = 0;
    const limit = 5000;
    let hasMoreData = true;
    
    while (hasMoreData) {
      try {
        const batchData = await this.fetchPaymentBatch(offset, limit);
        
        if (batchData.length === 0) {
          hasMoreData = false;
        } else {
          allData.push(...batchData);
          offset += limit;
          
          // No delay needed - API can handle sequential requests
        }
      } catch (error) {
        console.error(`Error fetching batch at offset ${offset}:`, error);
        hasMoreData = false;
      }
    }
    
    return allData;
  }
  
  /**
   * Fetch a single batch of payment data
   */
  private async fetchPaymentBatch(offset: number, limit: number): Promise<RawAPIData[]> {
    const url = `https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/plati_pnrr?offset=${offset}&limit=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  }
  
  /**
   * Convert old Romanian diacritics to UTF-8
   */
  public convertRomanianDiacritics(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .replace(/ă/g, 'ă')  // Keep UTF-8 ă
      .replace(/â/g, 'â')  // Keep UTF-8 â
      .replace(/î/g, 'î')  // Keep UTF-8 î
      .replace(/ș/g, 'ș')  // Keep UTF-8 ș
      .replace(/ț/g, 'ț')  // Keep UTF-8 ț
      .replace(/Ă/g, 'Ă')  // Keep UTF-8 Ă
      .replace(/Â/g, 'Â')  // Keep UTF-8 Â
      .replace(/Î/g, 'Î')  // Keep UTF-8 Î
      .replace(/Ș/g, 'Ș')  // Keep UTF-8 Ș
      .replace(/Ț/g, 'Ț')  // Keep UTF-8 Ț
      // Convert old encoding to UTF-8
      .replace(/ã/g, 'ă')  // Old encoding ã -> UTF-8 ă
      .replace(/â/g, 'â')  // Old encoding â -> UTF-8 â (already correct)
      .replace(/î/g, 'î')  // Old encoding î -> UTF-8 î (already correct)
      .replace(/ş/g, 'ș')  // Old encoding ş -> UTF-8 ș
      .replace(/ţ/g, 'ț')  // Old encoding ţ -> UTF-8 ț
      .replace(/Ã/g, 'Ă')  // Old encoding Ã -> UTF-8 Ă
      .replace(/Â/g, 'Â')  // Old encoding Â -> UTF-8 Â (already correct)
      .replace(/Î/g, 'Î')  // Old encoding Î -> UTF-8 Î (already correct)
      .replace(/Ş/g, 'Ș')  // Old encoding Ş -> UTF-8 Ș
      .replace(/Ţ/g, 'Ț');  // Old encoding Ţ -> UTF-8 Ț
  }

  /**
   * Create empty county data structure
   */
  private createEmptyCountyData(countyCode: string): CountyAggregation {
    const programs = Object.values(this.config.componentMapping)
      .reduce((acc, component) => {
        acc[component.program] = { value: 0, projects: 0 };
        return acc;
      }, {} as Record<string, { value: number; projects: number }>);
    
    const components = Object.keys(this.config.componentMapping)
      .reduce((acc, code) => {
        acc[code] = { value: 0, projects: 0 };
        return acc;
      }, {} as Record<string, { value: number; projects: number }>);
    
    return {
      county: {
        code: `RO-${countyCode}`,
        name: this.config.countyMapping[countyCode]
      },
      total: { value: 0, projects: 0 },
      programs,
      components,
      extras: {
        rows: [],
        colLabels: {
          'NUME_BENEFICIAR': 'Nume Beneficiar',
          'VALOARE_PLATA_EURO': 'Valoare Plată (EUR)',
          'VALOARE_PLATA_RON': 'Valoare Plată (RON)',
          'DATA_PLATA': 'Data Plată',
          'MASURA': 'Măsura',
          'SURSA_FINANTARE': 'Sursa Finanțare',
          'LOCALITATE_BENEFICIAR': 'Localitate Beneficiar',
          'COD_COMPONENTA': 'Cod Componentă',
          'COMPONENTA_LABEL': 'Componentă',
          'SCOP_PROIECT': 'Scop Proiect'
        }
      }
    };
  }
  
  /**
   * Create multi-county data structure
   */
  private createMultiCountyData(multiCountyProjects: RawAPIData[]): CountyAggregation {
    const multiTotalValue = multiCountyProjects.reduce((sum, item) => {
      const eurAmount = parseFloat(String(item.valoare_plata_fe_euro || 0));
      return sum + eurAmount;
    }, 0);
    
    const programs = Object.values(this.config.componentMapping)
      .reduce((acc, component) => {
        acc[component.program] = { value: 0, projects: 0 };
        return acc;
      }, {} as Record<string, { value: number; projects: number }>);
    
    return {
      county: { code: 'RO-MULTI', name: 'Multi Județe' },
      total: { value: multiTotalValue, projects: multiCountyProjects.length },
      programs,
      components: {},
      extras: {
        rows: multiCountyProjects.map(item => {
          const componentMapping = this.config.componentMapping[item.cod_componenta || ''];
          const eurAmount = parseFloat(String(item.valoare_plata_fe_euro || 0));
          const ronAmount = parseFloat(String(item.valoare_plata_fe || 0));
          
          return {
            // New structure fields
            title: this.convertRomanianDiacritics(`${item.masura || ''} - ${item.localitate_beneficiar || ''}`.trim()),
            beneficiaryName: this.convertRomanianDiacritics(item.nume_beneficiar || ''),
            beneficiaryCUI: item.cui_beneficiar_final,
            beneficiaryLocality: this.convertRomanianDiacritics(item.localitate_beneficiar || ''),
            totalValue: this.createFinancialAmount(eurAmount, ronAmount, item.data_plata),
            componentCode: item.cod_componenta || '',
            componentLabel: this.convertRomanianDiacritics(componentMapping?.label || ''),
            measureCode: item.cod_masura || '',
            fundingSource: this.convertRomanianDiacritics(item.sursa_finantare || ''),
            countyCode: 'RO-MULTI',
            countyName: 'Multi Județe',
            locality: this.convertRomanianDiacritics(item.localitate_beneficiar || ''),
            paymentDate: item.data_plata,
            cri: item.cri,
            caenCode: item.cod_diviziune_caen,
            caenDescription: this.convertRomanianDiacritics(item.descriere_diviziune_caen || ''),
            scope: this.convertRomanianDiacritics(`${item.masura || ''} - ${item.localitate_beneficiar || ''}`.trim()),
            __programKey: componentMapping?.program || 'Unknown',
            __shareValue: eurAmount,
            __shareProjects: 1,
            
            // Old structure fields for compatibility with MapView
            NUME_BENEFICIAR: this.convertRomanianDiacritics(item.nume_beneficiar || ''),
            VALOARE_PLATA_EURO: eurAmount,
            VALOARE_PLATA_RON: ronAmount,
            DATA_PLATA: item.data_plata || '',
            MASURA: this.convertRomanianDiacritics(item.masura || ''),
            SURSA_FINANTARE: this.convertRomanianDiacritics(item.sursa_finantare || ''),
            LOCALITATE_BENEFICIAR: this.convertRomanianDiacritics(item.localitate_beneficiar || ''),
            COD_COMPONENTA: item.cod_componenta || '',
            COMPONENTA_LABEL: this.convertRomanianDiacritics(componentMapping?.label || ''),
            COD_MASURA: item.cod_masura || '',
            CRI: item.cri || '',
            CUI_BENEFICIAR_FINAL: item.cui_beneficiar_final || '',
            COD_DIVIZIUNE_CAEN: item.cod_diviziune_caen || '',
            DESCRIERE_DIVIZIUNE_CAEN: this.convertRomanianDiacritics(item.descriere_diviziune_caen || ''),
            SCOP_PROIECT: this.convertRomanianDiacritics(`${item.masura || ''} - ${item.localitate_beneficiar || ''}`.trim()),
            __program_key: componentMapping?.program || 'Unknown',
            __share_value: eurAmount,
            __share_projects: 1
          };
        }),
        colLabels: {},
        multiAggByCounty: {}
      }
    };
  }
  
  /**
   * Get component chart data
   */
  private getComponentChartData(metric: Metric): ChartDataPoint[] {
    const componentTotals = new Map<string, { value: number; projects: number }>();
    
    this.data.forEach(county => {
      Object.entries(county.components).forEach(([code, data]) => {
        const current = componentTotals.get(code) || { value: 0, projects: 0 };
        componentTotals.set(code, {
          value: current.value + data.value,
          projects: current.projects + data.projects
        });
      });
    });
    
    return Array.from(componentTotals.entries())
      .map(([code, data]) => ({
        name: this.config.componentMapping[code]?.label || code,
        value: metric === Metric.VALUE ? data.value : data.projects,
        color: this.config.componentMapping[code]?.color
      }))
      .sort((a, b) => b.value - a.value);
  }
  
  /**
   * Get program chart data
   */
  private getProgramChartData(metric: Metric): ChartDataPoint[] {
    const programTotals = new Map<string, { value: number; projects: number }>();
    
    this.data.forEach(county => {
      Object.entries(county.programs).forEach(([program, data]) => {
        const current = programTotals.get(program) || { value: 0, projects: 0 };
        programTotals.set(program, {
          value: current.value + data.value,
          projects: current.projects + data.projects
        });
      });
    });
    
    return Array.from(programTotals.entries())
      .map(([program, data]) => ({
        name: program,
        value: metric === Metric.VALUE ? data.value : data.projects
      }))
      .sort((a, b) => b.value - a.value);
  }
  
  /**
   * Get county chart data
   */
  private getCountyChartData(metric: Metric): ChartDataPoint[] {
    return this.data
      .map(county => ({
        name: county.county.name,
        value: metric === Metric.VALUE ? county.total.value : county.total.projects
      }))
      .sort((a, b) => b.value - a.value);
  }
}
