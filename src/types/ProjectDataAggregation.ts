/**
 * Project Data Aggregation Implementation v2
 * 
 * This class handles project data from the PNRR progres_tehnic_proiecte API.
 * It processes project progress records and aggregates them by county and component.
 * Modified to include ALL NATIONAL projects without filtering.
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
 * Project Data Aggregation Class
 * 
 * Handles project data from the progres_tehnic_proiecte API endpoint.
 * This data represents project progress and technical details.
 */
export class ProjectDataAggregation extends BaseDataAggregation {
  
  constructor() {
    super({
      source: 'projects' as any,
      currency: 'EUR' as any,
      exchangeRates: {}, // Not used anymore, ExchangeRateService handles this
      componentMapping: COMPONENT_MAPPING,
      countyMapping: COUNTY_MAP,
      fieldMappings: {}
    });
  }
  
  /**
   * Load project data from the PNRR API
   */
  async loadData(): Promise<void> {
    try {
      // Fetch data from the API with pagination
      const allData = await this.fetchAllProjectData();
      
      if (allData.length === 0) {
        console.warn('No project data received from API');
        return;
      }
      
      // Process the raw data
      this.data = this.processData(allData);
    } catch (error) {
      console.error('Error loading project data:', error);
      throw error;
    }
  }
  
  /**
   * Process raw project data into aggregated format
   */
  processData(rawData: RawAPIData[]): CountyAggregation[] {
    const countyData: Record<string, CountyAggregation> = {};
    const multiCountyProjects: RawAPIData[] = [];
    
    // Use all data from API without deduplication
    const deduplicatedData = rawData;
    console.log(`📊 Data Processing:`);
    console.log(`  - Total records from API: ${rawData.length}`);
    
    // Initialize county data structure
    Object.keys(this.config.countyMapping).forEach(code => {
      countyData[code] = this.createEmptyCountyData(code);
    });
    
    // Debug: Track Argeș projects
    let argesProjectCount = 0;
    let argesTotalValue = 0;
    
    // Process each project record
    deduplicatedData.forEach(item => {
      const countyCode = this.normalizeCountyName(this.convertRomanianDiacritics(item.judet_implementare || ''));
      const componentMapping = this.config.componentMapping[item.cod_componenta || ''];
      
      // NOTE: Projects without countyCode go to multiCountyProjects (NATIONAL projects)
      if (!countyCode) {
        // Handle as multi-county or unknown
        multiCountyProjects.push(item);
        return;
      }
      
      // NOTE: REMOVED componentMapping check to include ALL projects
      // Projects without componentMapping will still be processed
      
      const county = countyData[countyCode];
      if (!county) return;
      
      // Skip if no componentMapping (can't process component-specific data)
      if (!componentMapping) {
        return;
      }
      
      // Debug: Track Argeș
      if (countyCode === 'AG') {
        argesProjectCount++;
        argesTotalValue += parseFloat(String(item.valoare_fe || 0));
      }

      const programKey = componentMapping.program;
      
      // Get RON amount from the data (projects endpoint returns data in RON)
      const ronAmount = parseFloat(String(item.valoare_fe || 0));
      const startDate = item.data_inceput || '';
      
      // Convert RON to EUR using the conversion service
      const eurAmount = convertRONToEUR(ronAmount, startDate);
      
      // Create financial amount with proper conversion
      const financialAmount = this.createFinancialAmount(eurAmount, ronAmount, startDate);
      
      // Use converted EUR amount for calculations
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
        contractNumber: item.nr_contract,
        title: this.convertRomanianDiacritics(item.titlu_contract || ''),
        beneficiaryName: this.convertRomanianDiacritics(item.denumire_beneficiar || ''),
        beneficiaryCUI: item.cui,
        beneficiaryType: this.convertRomanianDiacritics(item.tip_beneficiar || ''),
        beneficiaryLocality: this.convertRomanianDiacritics(item.localitate_implementare || ''),
        totalValue: financialAmount,
        feValue: this.createFinancialAmount(eurAmount, 0, startDate),
        fpnValue: this.createFinancialAmount(0, parseFloat(String(item.valoare_fpn || 0)), startDate),
        tvaValue: this.createFinancialAmount(0, parseFloat(String(item.valoare_tva || 0)), startDate),
        ineligibleValue: this.createFinancialAmount(0, parseFloat(String(item.valoare_neeligibil || 0)), startDate),
        componentCode: item.cod_componenta || '',
        componentLabel: this.convertRomanianDiacritics(componentMapping.label),
        measureCode: item.cod_masura || '',
        subMeasureCode: item.cod_submasura,
        fundingSource: this.convertRomanianDiacritics(item.sursa_finantare || ''),
        countyCode: `RO-${countyCode}`,
        countyName: this.convertRomanianDiacritics(this.config.countyMapping[countyCode]),
        locality: this.convertRomanianDiacritics(item.localitate_implementare || ''),
        progress: this.parseProgress(item.stadiu),
        stage: this.convertRomanianDiacritics(item.stadiu || ''),
        impact: this.convertRomanianDiacritics(item.impact || ''),
        engagementDate: item.data_angajament ? new Date(item.data_angajament).toLocaleDateString('ro-RO') : '',
        startDate: item.data_inceput ? new Date(item.data_inceput).toLocaleDateString('ro-RO') : '',
        completionDate: item.data_finalizare ? new Date(item.data_finalizare).toLocaleDateString('ro-RO') : '',
        cri: item.cri,
        scope: this.convertRomanianDiacritics(`${item.titlu_contract || ''} - ${item.localitate_implementare || ''}`.trim()),
        __programKey: programKey,
        __shareValue: value,
        __shareProjects: 1,
        
        // Old structure fields for compatibility with MapView
        DENUMIRE_BENEFICIAR: this.convertRomanianDiacritics(item.denumire_beneficiar || ''),
        VALOARE_FE: eurAmount,
        VALOARE_TOTAL: ronAmount,
        DATA_ANGAJAMENT: item.data_angajament || '',
        TITLU_CONTRACT: this.convertRomanianDiacritics(item.titlu_contract || ''),
        SURSA_FINANTARE: this.convertRomanianDiacritics(item.sursa_finantare || ''),
        JUDET_IMPLEMENTARE: this.convertRomanianDiacritics(item.judet_implementare || ''),
        LOCALITATE_IMPLEMENTARE: this.convertRomanianDiacritics(item.localitate_implementare || ''),
        COD_COMPONENTA: item.cod_componenta || '',
        COMPONENTA_LABEL: this.convertRomanianDiacritics(componentMapping.label),
        COD_MASURA: item.cod_masura || '',
        COD_SUBMASURA: item.cod_submasura || '',
        STADIU: this.convertRomanianDiacritics(item.stadiu || ''),
        IMPACT: this.convertRomanianDiacritics(item.impact || ''),
        NR_CONTRACT: item.nr_contract || '',
        CUI: item.cui || '',
        TIP_BENEFICIAR: this.convertRomanianDiacritics(item.tip_beneficiar || ''),
        CRI: item.cri || '',
        SCOP_PROIECT: this.convertRomanianDiacritics(`${item.titlu_contract || ''} - ${item.localitate_implementare || ''}`.trim()),
        __program_key: programKey,
        __share_value: value,
        __share_projects: 1
      };
      
      county.extras.rows.push(projectRow);
    });
    
    // Debug: Log Argeș totals
    console.log(`🏛️ Argeș Debug:`);
    console.log(`  - Projects processed: ${argesProjectCount}`);
    console.log(`  - Total value (RON): ${argesTotalValue.toFixed(2)}`);
    console.log(`  - Total value (EUR approx): ${(argesTotalValue / 5).toFixed(2)}`);
    console.log(`  - County data total: ${countyData['AG']?.total.value.toFixed(2)} EUR`);
    console.log(`  - County data projects: ${countyData['AG']?.total.projects}`);
    
    // Convert to array format
    const result = Object.values(countyData);
    
    // Add multi-county data if exists (keep RO-MULTI for compatibility)
    // BUT also add these projects to București
    if (multiCountyProjects.length > 0) {
      // Create RO-MULTI entry (for MapView and other components)
      const multiData = this.createMultiCountyData(multiCountyProjects);
      result.push(multiData);
      
      // ALSO add national projects to București
      const bucuresti = countyData['BI'];
      if (bucuresti) {
        multiCountyProjects.forEach(item => {
          const componentMapping = this.config.componentMapping[item.cod_componenta || ''];
          // NOTE: Removed filter to include ALL NATIONAL projects, even without valid componentMapping
          // if (!componentMapping) return;
          
          const programKey = componentMapping?.program || 'Unknown';
          const ronAmount = parseFloat(String(item.valoare_fe || 0));
          const startDate = item.data_inceput || '';
          const eurAmount = convertRONToEUR(ronAmount, startDate);
          const financialAmount = this.createFinancialAmount(eurAmount, ronAmount, startDate);
          const value = eurAmount;
          
          // Add to București totals
          bucuresti.total.value += value;
          bucuresti.total.projects += 1;
          
          // Update București programs (only if programKey is valid)
          if (programKey && programKey !== 'Unknown' && bucuresti.programs[programKey]) {
            bucuresti.programs[programKey].value += value;
            bucuresti.programs[programKey].projects += 1;
          }
          
          // Update București components (only if component code exists)
          if (item.cod_componenta && bucuresti.components[item.cod_componenta]) {
            bucuresti.components[item.cod_componenta].value += value;
            bucuresti.components[item.cod_componenta].projects += 1;
          }
          
          // Create project row for extras (add to București's rows)
          const projectRow: any = {
            contractNumber: item.nr_contract,
            title: this.convertRomanianDiacritics(item.titlu_contract || ''),
            beneficiaryName: this.convertRomanianDiacritics(item.denumire_beneficiar || ''),
            beneficiaryCUI: item.cui,
            beneficiaryType: this.convertRomanianDiacritics(item.tip_beneficiar || ''),
            beneficiaryLocality: this.convertRomanianDiacritics(item.localitate_implementare || ''),
            totalValue: financialAmount,
            feValue: this.createFinancialAmount(parseFloat(String(item.valoare_fe || 0)), 0, startDate),
            fpnValue: this.createFinancialAmount(0, parseFloat(String(item.valoare_fpn || 0)), item.data_angajament),
            tvaValue: this.createFinancialAmount(0, parseFloat(String(item.valoare_tva || 0)), item.data_angajament),
            ineligibleValue: this.createFinancialAmount(0, parseFloat(String(item.valoare_neeligibil || 0)), item.data_angajament),
            componentCode: item.cod_componenta || '',
            componentLabel: this.convertRomanianDiacritics(componentMapping?.label || item.cod_componenta || 'N/A'),
            measureCode: item.cod_masura || '',
            subMeasureCode: item.cod_submasura,
            fundingSource: this.convertRomanianDiacritics(item.sursa_finantare || ''),
            countyCode: 'RO-BI',
            countyName: 'București',
            locality: this.convertRomanianDiacritics(item.localitate_implementare || ''),
            progress: this.parseProgress(item.stadiu),
            stage: this.convertRomanianDiacritics(item.stadiu || ''),
            impact: this.convertRomanianDiacritics(item.impact || ''),
            engagementDate: item.data_angajament ? new Date(item.data_angajament).toLocaleDateString('ro-RO') : '',
            startDate: item.data_inceput ? new Date(item.data_inceput).toLocaleDateString('ro-RO') : '',
            completionDate: item.data_finalizare ? new Date(item.data_finalizare).toLocaleDateString('ro-RO') : '',
            cri: item.cri,
            scope: this.convertRomanianDiacritics(`${item.titlu_contract || ''} - ${item.localitate_implementare || ''}`.trim()),
            __programKey: programKey,
            __shareValue: value,
            __shareProjects: 1,
            
            // Old structure fields for compatibility with MapView
            DENUMIRE_BENEFICIAR: this.convertRomanianDiacritics(item.denumire_beneficiar || ''),
            VALOARE_FE: eurAmount,
            VALOARE_TOTAL: ronAmount,
            DATA_ANGAJAMENT: item.data_angajament || '',
            TITLU_CONTRACT: this.convertRomanianDiacritics(item.titlu_contract || ''),
            SURSA_FINANTARE: this.convertRomanianDiacritics(item.sursa_finantare || ''),
            JUDET_IMPLEMENTARE: this.convertRomanianDiacritics(item.judet_implementare || ''),
            LOCALITATE_IMPLEMENTARE: this.convertRomanianDiacritics(item.localitate_implementare || ''),
            COD_COMPONENTA: item.cod_componenta || '',
            COMPONENTA_LABEL: this.convertRomanianDiacritics(componentMapping?.label || item.cod_componenta || 'N/A'),
            COD_MASURA: item.cod_masura || '',
            COD_SUBMASURA: item.cod_submasura || '',
            STADIU: this.convertRomanianDiacritics(item.stadiu || ''),
            IMPACT: this.convertRomanianDiacritics(item.impact || ''),
            NR_CONTRACT: item.nr_contract || '',
            CUI: item.cui || '',
            TIP_BENEFICIAR: this.convertRomanianDiacritics(item.tip_beneficiar || ''),
            CRI: item.cri || '',
            SCOP_PROIECT: this.convertRomanianDiacritics(`${item.titlu_contract || ''} - ${item.localitate_implementare || ''}`.trim()),
            __program_key: programKey,
            __share_value: value,
            __share_projects: 1
          };
          
          bucuresti.extras.rows.push(projectRow);
        });
      }
    }
    
    return result;
  }
  
  /**
   * Validate project data integrity and completeness
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
        if (!project.title) {
          statistics.missingFields.title = (statistics.missingFields.title || 0) + 1;
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
    if (statistics.missingFields.title > 0) {
      warnings.push(`${statistics.missingFields.title} records missing project title`);
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
   * Fetch all project data from the API with pagination
   */
  private async fetchAllProjectData(): Promise<RawAPIData[]> {
    const allData: RawAPIData[] = [];
    let offset = 0;
    const limit = 5000;
    let hasMoreData = true;
    
    while (hasMoreData) {
      try {
        const batchData = await this.fetchProjectBatch(offset, limit);
        
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
   * Fetch a single batch of project data
   */
  private async fetchProjectBatch(offset: number, limit: number): Promise<RawAPIData[]> {
    const url = `https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/progres_tehnic_proiecte?offset=${offset}&limit=${limit}`;
    
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
          'DENUMIRE_BENEFICIAR': 'Denumire Beneficiar',
          'VALOARE_TOTAL': 'Valoare Total (EUR)',
          'VALOARE_FE': 'Valoare FE (EUR)',
          'VALOARE_FPN': 'Valoare FPN (EUR)',
          'VALOARE_TVA': 'Valoare TVA (EUR)',
          'DATA_ANGAJAMENT': 'Data Angajament',
          'DATA_INCEPUT': 'Data Început',
          'DATA_FINALIZARE': 'Data Finalizare',
          'STADIU': 'Stadiu',
          'IMPACT': 'Impact',
          'JUDET_IMPLEMENTARE': 'Județ Implementare',
          'LOCALITATE_IMPLEMENTARE': 'Localitate Implementare',
          'COD_COMPONENTA': 'Cod Componentă',
          'COMPONENTA_LABEL': 'Componentă',
          'COD_MASURA': 'Cod Măsură',
          'NR_CONTRACT': 'Număr Contract',
          'TITLU_CONTRACT': 'Titlu Contract',
          'CUI': 'CUI',
          'TIP_BENEFICIAR': 'Tip Beneficiar',
          'SURSA_FINANTARE': 'Sursa Finanțare',
          'CRI': 'CRI'
        }
      }
    };
  }
  
  /**
   * Create multi-county data structure
   */
  private createMultiCountyData(multiCountyProjects: RawAPIData[]): CountyAggregation {
    const multiTotalValue = multiCountyProjects.reduce((sum, item) => {
      const ronAmount = parseFloat(String(item.valoare_fe || 0));
      const startDate = item.data_inceput || '';
      const eurAmount = convertRONToEUR(ronAmount, startDate);
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
          const ronAmount = parseFloat(String(item.valoare_fe || 0));
          const startDate = item.data_inceput || '';
          const eurAmount = convertRONToEUR(ronAmount, startDate);
          const financialAmount = this.createFinancialAmount(eurAmount, ronAmount, startDate);
          
          return {
            contractNumber: item.nr_contract,
            title: this.convertRomanianDiacritics(item.titlu_contract || ''),
            beneficiaryName: this.convertRomanianDiacritics(item.denumire_beneficiar || ''),
            beneficiaryCUI: item.cui,
            beneficiaryType: this.convertRomanianDiacritics(item.tip_beneficiar || ''),
            beneficiaryLocality: this.convertRomanianDiacritics(item.localitate_implementare || ''),
            totalValue: financialAmount,
            feValue: this.createFinancialAmount(parseFloat(String(item.valoare_fe || 0)), 0, startDate),
            fpnValue: this.createFinancialAmount(0, parseFloat(String(item.valoare_fpn || 0)), item.data_angajament),
            tvaValue: this.createFinancialAmount(0, parseFloat(String(item.valoare_tva || 0)), item.data_angajament),
            ineligibleValue: this.createFinancialAmount(0, parseFloat(String(item.valoare_neeligibil || 0)), item.data_angajament),
            componentCode: item.cod_componenta || '',
            componentLabel: this.convertRomanianDiacritics(componentMapping?.label || ''),
            measureCode: item.cod_masura || '',
            subMeasureCode: item.cod_submasura,
            fundingSource: this.convertRomanianDiacritics(item.sursa_finantare || ''),
            countyCode: 'RO-MULTI',
            countyName: 'Multi Județe',
            locality: this.convertRomanianDiacritics(item.localitate_implementare || ''),
            progress: this.parseProgress(item.stadiu),
            stage: this.convertRomanianDiacritics(item.stadiu || ''),
            impact: this.convertRomanianDiacritics(item.impact || ''),
            engagementDate: item.data_angajament ? new Date(item.data_angajament).toLocaleDateString('ro-RO') : '',
            startDate: item.data_inceput ? new Date(item.data_inceput).toLocaleDateString('ro-RO') : '',
            completionDate: item.data_finalizare ? new Date(item.data_finalizare).toLocaleDateString('ro-RO') : '',
            cri: item.cri,
            scope: this.convertRomanianDiacritics(`${item.titlu_contract || ''} - ${item.localitate_implementare || ''}`.trim()),
            __programKey: componentMapping?.program || 'Unknown',
            __shareValue: eurAmount,
            __shareProjects: 1,
            
            // Old structure fields for compatibility with MapView
            DENUMIRE_BENEFICIAR: this.convertRomanianDiacritics(item.denumire_beneficiar || ''),
            VALOARE_FE: eurAmount,
            VALOARE_TOTAL: ronAmount,
            DATA_ANGAJAMENT: item.data_angajament || '',
            TITLU_CONTRACT: this.convertRomanianDiacritics(item.titlu_contract || ''),
            SURSA_FINANTARE: this.convertRomanianDiacritics(item.sursa_finantare || ''),
            JUDET_IMPLEMENTARE: this.convertRomanianDiacritics(item.judet_implementare || ''),
            LOCALITATE_IMPLEMENTARE: this.convertRomanianDiacritics(item.localitate_implementare || ''),
            COD_COMPONENTA: item.cod_componenta || '',
            COMPONENTA_LABEL: this.convertRomanianDiacritics(componentMapping?.label || ''),
            COD_MASURA: item.cod_masura || '',
            COD_SUBMASURA: item.cod_submasura || '',
            STADIU: this.convertRomanianDiacritics(item.stadiu || ''),
            IMPACT: this.convertRomanianDiacritics(item.impact || ''),
            NR_CONTRACT: item.nr_contract || '',
            CUI: item.cui || '',
            TIP_BENEFICIAR: this.convertRomanianDiacritics(item.tip_beneficiar || ''),
            CRI: item.cri || '',
            SCOP_PROIECT: this.convertRomanianDiacritics(`${item.titlu_contract || ''} - ${item.localitate_implementare || ''}`.trim()),
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
   * Parse progress percentage from stage string
   */
  private parseProgress(stage?: string): number | undefined {
    if (!stage) return undefined;
    
    // Try to extract percentage from stage string
    const match = stage.match(/(\d+)%/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    // Map common stage names to percentages
    const stageMap: Record<string, number> = {
      'Început': 10,
      'În desfășurare': 50,
      'Finalizat': 100,
      'Suspens': 0,
      'Anulat': 0
    };
    
    return stageMap[stage] || undefined;
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
