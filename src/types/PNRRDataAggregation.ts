/**
 * PNRR Data Types and Interfaces
 * 
 * This file contains all the core data structures, interfaces, and enums
 * needed for the PNRR (Plan Național de Redresare și Reziliență) data
 * aggregation and visualization application.
 * 
 * The application processes Romanian EU funding data from multiple sources
 * and presents it through interactive maps, charts, and tables.
 */

// ============================================================================
// CORE ENUMS AND CONSTANTS
// ============================================================================

export enum FieldType {
  FILTERABLE = "filterable",
  SEARCHABLE = "searchable", 
  BOTH = "both"
}

export enum Currency {
  EUR = "EUR",
  RON = "RON"
}

export enum DataSource {
  PAYMENTS_API = "payments",
  PROJECTS_API = "projects", 
  MOCK_DATA = "mock",
  EXCEL_IMPORT = "excel"
}

export enum ViewMode {
  GENERAL = "general",
  MULTI_COUNTY = "multi",
  TOTAL = "total",
  PROGRAM = "program"
}

export enum Metric {
  VALUE = "value",
  PROJECTS = "projects"
}

// ============================================================================
// CORE ENTITY INTERFACES
// ============================================================================

/**
 * County/Region Information
 * Represents a Romanian county with its basic identification
 */
export interface County {
  code: string;           // e.g., "RO-AB", "RO-MULTI"
  name: string;           // e.g., "Alba", "Multi Județe"
}

/**
 * Component/Program Information
 * Represents a PNRR component with its classification
 */
export interface Component {
  key: string;            // e.g., "C1", "C2"
  label: string;          // e.g., "Managementul apei"
  program: string;        // e.g., "Tranziția spre o economie verde"
  color?: string;         // Hex color for UI display
}

/**
 * Financial Amount with Currency Support
 * Handles both EUR and RON amounts with conversion
 */
export interface FinancialAmount {
  eur: number;            // Amount in EUR
  ron: number;            // Amount in RON
  currency: Currency;     // Primary currency for display
  exchangeRate?: number;  // Rate used for conversion
  date?: string;          // Date for historical exchange rates
}

/**
 * Project/Investment Record
 * Core entity representing a PNRR project or investment
 */
export interface ProjectRecord {
  // Basic Identification
  id?: string;                    // Unique identifier
  contractNumber?: string;        // Contract number
  title: string;                  // Project title
  
  // Beneficiary Information
  beneficiaryName: string;        // Beneficiary organization name
  beneficiaryCUI?: string;        // CUI (Romanian tax ID)
  beneficiaryType?: string;       // Type of beneficiary
  beneficiaryLocality?: string;   // Beneficiary's locality
  
  // Financial Information
  totalValue: FinancialAmount;    // Total project value
  feValue?: FinancialAmount;      // FE (EU) funding value
  fpnValue?: FinancialAmount;     // FPN (national) funding value
  tvaValue?: FinancialAmount;     // VAT value
  ineligibleValue?: FinancialAmount; // Ineligible costs
  
  // Project Details
  componentCode: string;          // e.g., "C1", "C2"
  componentLabel: string;         // Component description
  measureCode: string;            // Measure code
  subMeasureCode?: string;        // Sub-measure code
  fundingSource: string;          // Source of funding (FEDR, FSE+, etc.)
  
  // Location Information
  countyCode: string;             // County where implemented
  countyName: string;             // County name
  locality: string;               // Implementation locality
  
  // Progress and Status
  progress?: number;              // Physical progress percentage
  stage?: string;                 // Current project stage
  impact?: string;                // Project impact description
  
  // Dates
  engagementDate?: string;        // Date of engagement
  startDate?: string;             // Project start date
  completionDate?: string;        // Expected completion date
  paymentDate?: string;           // Payment date (for payment records)
  
  // Additional Fields
  cri?: string;                   // CRI identifier
  caenCode?: string;              // CAEN economic activity code
  caenDescription?: string;       // CAEN description
  scope?: string;                 // Project scope description
  
  // Internal Processing Fields
  __programKey?: string;          // Program key for aggregation
  __shareValue?: number;          // Value share for multi-county projects
  __shareProjects?: number;       // Project count share
}

/**
 * County Aggregation Data
 * Aggregated data for a specific county
 */
export interface CountyAggregation {
  county: County;                 // County information
  total: {
    value: number;                // Total value in primary currency
    projects: number;             // Total number of projects
  };
  programs: Record<string, {      // Aggregation by program
    value: number;
    projects: number;
  }>;
  components: Record<string, {    // Aggregation by component
    value: number;
    projects: number;
  }>;
  extras: {
    rows: ProjectRecord[];        // Individual project records
    colLabels: Record<string, string>; // Column labels for display
    multiAggByCounty?: Record<string, { // Multi-county aggregation
      value: number;
      projects: number;
    }>;
  };
}

/**
 * Locality Data
 * Geographic data for localities with project information
 */
export interface LocalityData {
  name: string;                   // Locality name
  county: string;                 // County code
  latitude: number;               // Geographic latitude
  longitude: number;              // Geographic longitude
  aliases?: string[];             // Alternative names for matching
  projectCount: number;           // Number of projects in this locality
  totalValue: number;             // Total project value
}

// ============================================================================
// DATA PROCESSING INTERFACES
// ============================================================================

/**
 * Raw API Data Structure
 * Structure of data as received from PNRR APIs
 */
export interface RawAPIData {
  // Payment API fields
  cod_componenta?: string;
  cod_masura?: string;
  nume_beneficiar?: string;
  valoare_plata_fe?: number;      // RON amount
  valoare_plata_fe_euro?: number; // EUR amount
  data_plata?: string;
  masura?: string;
  sursa_finantare?: string;
  judet_beneficiar?: string;      // County name
  localitate_beneficiar?: string; // Locality name
  cui_beneficiar_final?: string;
  cod_diviziune_caen?: string;
  descriere_diviziune_caen?: string;
  cri?: string;
  
  // Project API fields
  denumire_beneficiar?: string;
  valoare_total?: number;         // RON amount
  valoare_fe?: number;            // EUR amount
  valoare_fpn?: number;
  valoare_tva?: number;
  valoare_neeligibil?: number;
  data_angajament?: string;
  data_inceput?: string;
  data_finalizare?: string;
  stadiu?: string;
  impact?: string;
  judet_implementare?: string;
  localitate_implementare?: string;
  nr_contract?: string;
  titlu_contract?: string;
  cui?: string;
  tip_beneficiar?: string;
  cod_submasura?: string;
}

/**
 * Data Processing Configuration
 * Configuration for processing raw data into aggregated format
 */
export interface DataProcessingConfig {
  source: DataSource;             // Data source type
  currency: Currency;             // Primary display currency
  exchangeRates: Record<number, number>; // Exchange rates by year
  componentMapping: Record<string, Component>; // Component definitions
  countyMapping: Record<string, string>; // County code to name mapping
  fieldMappings: Record<string, string>; // Field name mappings
}

/**
 * Data Validation Result
 * Result of data validation process
 */
export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  statistics: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    missingFields: Record<string, number>;
  };
}

// ============================================================================
// UI DATA INTERFACES
// ============================================================================

/**
 * Chart Data Point
 * Data point for visualization charts
 */
export interface ChartDataPoint {
  name: string;                   // Display name
  value: number;                  // Numeric value
  color?: string;                 // Color for display
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Table Column Definition
 * Definition for table columns in UI
 */
export interface TableColumn {
  key: string;                    // Data field key
  label: string;                  // Display label
  numeric?: boolean;              // Whether column contains numeric data
  searchable?: boolean;           // Whether column is searchable
  render?: (value: any, item: any) => React.ReactNode; // Custom render function
}

/**
 * Filter Configuration
 * Configuration for data filtering
 */
export interface FilterConfig {
  searchTerm?: string;            // Text search term
  countyFilter?: string[];        // County codes to include
  componentFilter?: string[];     // Component codes to include
  programFilter?: string[];       // Program names to include
  dateRange?: {
    start: string;
    end: string;
  };
  valueRange?: {
    min: number;
    max: number;
  };
}

/**
 * Pagination Configuration
 * Configuration for data pagination
 */
export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Statistics Summary
 * Summary statistics for the dataset
 */
export interface StatisticsSummary {
  totalValue: number;
  totalProjects: number;
  countyCount: number;
  componentCount: number;
  averageProjectValue: number;
  topCounty: County;
  topComponent: Component;
}

/**
 * County Ranking Entry
 * Single entry in county ranking
 */
export interface CountyRankingEntry {
  county: County;
  value: number;
  rank: number;
}
