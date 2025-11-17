/**
 * Timeline Data Service
 * 
 * Manages historical PNRR data for timeline animation
 * Fetches available dates from contains.json and loads data for each date
 */

import { CountyAggregation } from '../types/PNRRDataAggregation';
import { PaymentDataAggregation } from '../types/PaymentDataAggregation';
import { ProjectDataAggregation } from '../types/ProjectDataAggregation';

export interface TimelineDate {
  date: string; // YYYYMMDD format
  dateISO: string; // YYYY-MM-DD format
  label: string; // DD.MM.YYYY format
  endpoint: string;
  file: string;
}

export interface TimelineData {
  date: string;
  payments: CountyAggregation[];
  projects: CountyAggregation[];
  totalValue: number;
  totalProjects: number;
}

export class TimelineDataService {
  private cache: Map<string, TimelineData> = new Map();
  private availableDates: TimelineDate[] = [];
  private isLoading: boolean = false;

  /**
   * Fetch available dates from contains.json
   */
  async fetchAvailableDates(): Promise<TimelineDate[]> {
    try {
      const response = await fetch('https://mfe.gov.ro/pnrr-dashboard/generator/data/contains.json');
      const data = await response.json();
      
      // Extract unique dates for plati_pnrr endpoint
      const paymentsFiles = data.files.filter((f: any) => f.endpoint === 'plati_pnrr');
      
      // Sort by date ascending (oldest first) - pentru timeline de la trecut la prezent
      const dates = paymentsFiles
        .map((f: any) => ({
          date: f.date_yyyymmdd,
          dateISO: f.date_iso,
          label: f.dataset_date,
          endpoint: f.endpoint,
          file: f.file
        }))
        .sort((a: TimelineDate, b: TimelineDate) => a.date.localeCompare(b.date));
      
      this.availableDates = dates;
      console.log(`📅 Timeline: Found ${dates.length} available dates`);
      
      return dates;
    } catch (error) {
      console.error('❌ Error fetching available dates:', error);
      // Fallback to recent dates
      return this.getFallbackDates();
    }
  }

  /**
   * Fallback dates if API fails (oldest to newest)
   */
  private getFallbackDates(): TimelineDate[] {
    const dates = ['20251029', '20251030', '20251031', '20251101', '20251103', '20251104'];
    return dates.map(date => ({
      date,
      dateISO: `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`,
      label: `${date.substring(6, 8)}.${date.substring(4, 6)}.${date.substring(0, 4)}`,
      endpoint: 'plati_pnrr',
      file: `${date}-plati_pnrr.json.gz`
    }));
  }

  /**
   * Load data for a specific date
   */
  async loadDataForDate(date: string): Promise<TimelineData> {
    // Check cache first
    if (this.cache.has(date)) {
      console.log(`✅ Timeline: Using cached data for ${date}`);
      return this.cache.get(date)!;
    }

    console.log(`⏳ Timeline: Loading data for ${date}...`);
    this.isLoading = true;

    try {
      // Load payments and projects in parallel
      const [paymentsAgg, projectsAgg] = await Promise.all([
        this.loadPaymentsForDate(date),
        this.loadProjectsForDate(date)
      ]);

      // OPTIMIZARE: Extrage DOAR totalurile pe județe, fără detalii proiecte
      const paymentsData = paymentsAgg.getAllCounties().map(county => ({
        county: county.county,
        total: county.total,
        // NU includem programs, components, extras - prea multe date!
      }));
      
      const projectsData = projectsAgg.getAllCounties().map(county => ({
        county: county.county,
        total: county.total,
      }));

      // Calculate totals
      const totalValue = paymentsData.reduce((sum, county) => sum + (county.total?.value || 0), 0);
      const totalProjects = projectsData.reduce((sum, county) => sum + (county.total?.projects || 0), 0);

      const timelineData: TimelineData = {
        date,
        payments: paymentsData as any,
        projects: projectsData as any,
        totalValue,
        totalProjects
      };

      // Cache the data
      this.cache.set(date, timelineData);
      console.log(`✅ Timeline: Loaded data for ${date} - ${totalValue.toFixed(2)} EUR, ${totalProjects} projects`);

      return timelineData;
    } catch (error) {
      console.error(`❌ Error loading data for ${date}:`, error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load payments data for a specific date
   */
  private async loadPaymentsForDate(date: string): Promise<PaymentDataAggregation> {
    const aggregation = new PaymentDataAggregation();
    const url = `https://mfe.gov.ro/pnrr-dashboard/generator/data/${date}-plati_pnrr.json.gz`;
    
    // Override the default URL
    (aggregation as any).dataUrl = url;
    
    await aggregation.loadData();
    return aggregation;
  }

  /**
   * Load projects data for a specific date
   */
  private async loadProjectsForDate(date: string): Promise<ProjectDataAggregation> {
    const aggregation = new ProjectDataAggregation();
    const url = `https://mfe.gov.ro/pnrr-dashboard/generator/data/${date}-progres_tehnic_proiecte.json.gz`;
    
    // Override the default URL
    (aggregation as any).dataUrl = url;
    
    await aggregation.loadData();
    return aggregation;
  }

  /**
   * Preload data for multiple dates (for smooth animation)
   */
  async preloadTimeline(dates: string[]): Promise<void> {
    console.log(`⏳ Timeline: Preloading ${dates.length} dates...`);
    
    // Load dates sequentially to avoid overwhelming the server
    for (const date of dates) {
      try {
        await this.loadDataForDate(date);
      } catch (error) {
        console.error(`❌ Failed to preload ${date}:`, error);
      }
    }
    
    console.log(`✅ Timeline: Preloaded ${this.cache.size} dates`);
  }

  /**
   * Get available dates
   */
  getAvailableDates(): TimelineDate[] {
    return this.availableDates;
  }

  /**
   * Get cached data for a date
   */
  getCachedData(date: string): TimelineData | null {
    return this.cache.get(date) || null;
  }

  /**
   * Check if data is cached
   */
  isCached(date: string): boolean {
    return this.cache.has(date);
  }

  /**
   * Check if service is loading
   */
  isLoadingData(): boolean {
    return this.isLoading;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Timeline: Cache cleared');
  }
}

// Singleton instance
export const timelineDataService = new TimelineDataService();
