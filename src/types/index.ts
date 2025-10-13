/**
 * PNRR Data Aggregation Types and Classes
 * 
 * This file exports all the types, interfaces, and classes needed for
 * PNRR data aggregation and visualization.
 */

// Export all types and interfaces
export * from './PNRRDataAggregation';

// Export base abstract class
export { BaseDataAggregation } from './BaseDataAggregation';

// Export concrete implementations
export { PaymentDataAggregation } from './PaymentDataAggregation';
export { ProjectDataAggregation } from './ProjectDataAggregation';
export { TotalIndicatorsAggregation } from './TotalIndicatorsAggregation';

// Re-export commonly used types for convenience
export type {
  County,
  Component,
  ProjectRecord,
  CountyAggregation,
  LocalityData,
  RawAPIData,
  DataProcessingConfig,
  DataValidationResult,
  ChartDataPoint,
  TableColumn,
  FilterConfig,
  PaginationConfig,
  StatisticsSummary,
  CountyRankingEntry,
  FinancialAmount
} from './PNRRDataAggregation';

// Export total indicators types
export type {
  TotalIndicatorsData,
  RawTotalIndicatorsData
} from './TotalIndicatorsAggregation';

export {
  FieldType,
  Currency,
  DataSource,
  ViewMode,
  Metric
} from './PNRRDataAggregation';
