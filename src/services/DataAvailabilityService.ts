/**
 * Data Availability Service
 * 
 * Manages fetching and caching of available PNRR data dates from contains.json
 * Provides automatic polling every 6 hours to detect new data
 */

export interface DataFile {
  file: string;
  endpoint: string;
  dataset_date: string;
  date_yyyymmdd: string;
  date_iso: string;
  is_legacy: boolean;
  size_bytes: number;
  size: string;
  mtime: number;
  modified_iso: string;
}

export interface ContainsResponse {
  generated_at: string;
  count: number;
  files: DataFile[];
}

export interface AvailableDate {
  value: string; // YYYYMMDD format
  label: string; // Display format (DD Month YYYY)
  isoDate: string; // ISO format for sorting
  hasAllEndpoints: boolean; // Whether all 4 required endpoints exist
}

// Use proxy in development to avoid CORS, direct request in production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const CONTAINS_URL = isDevelopment
  ? '/api/mfe/generator/data/contains.json'
  : 'https://mfe.gov.ro/generator/data/contains.json';
const CACHE_KEY = 'pnrr_available_dates_v2'; // v2: invalidate old cache when FALLBACK_DATA_DATE changes
const CACHE_TIMESTAMP_KEY = 'pnrr_available_dates_timestamp_v2';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Required endpoints for a complete dataset
const REQUIRED_ENDPOINTS = [
  'plati_pnrr',
  'progres_tehnic_proiecte',
  'persons',
  'indicatori_total'
];

// Romanian month names
const ROMANIAN_MONTHS = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'
];

export class DataAvailabilityService {
  private static instance: DataAvailabilityService;
  private cachedDates: AvailableDate[] | null = null;
  private lastFetchTime: number = 0;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(dates: AvailableDate[]) => void> = new Set();

  private constructor() {
    // Load from localStorage on initialization
    this.loadFromCache();
  }

  static getInstance(): DataAvailabilityService {
    if (!DataAvailabilityService.instance) {
      DataAvailabilityService.instance = new DataAvailabilityService();
    }
    return DataAvailabilityService.instance;
  }

  /**
   * Subscribe to date updates
   */
  subscribe(callback: (dates: AvailableDate[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of date changes
   */
  private notifyListeners(dates: AvailableDate[]): void {
    this.listeners.forEach(callback => callback(dates));
  }

  /**
   * Load cached dates from localStorage
   */
  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cached && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp, 10);
        
        if (cacheAge < CACHE_DURATION) {
          this.cachedDates = JSON.parse(cached);
          this.lastFetchTime = parseInt(timestamp, 10);
          console.log('📅 Loaded available dates from cache:', this.cachedDates?.length, 'dates');
        } else {
          console.log('📅 Cache expired, will fetch fresh data');
        }
      }
    } catch (error) {
      console.warn('Failed to load dates from cache:', error);
    }
  }

  /**
   * Save dates to localStorage
   */
  private saveToCache(dates: AvailableDate[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(dates));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to save dates to cache:', error);
    }
  }

  /**
   * Format date from YYYYMMDD to Romanian display format
   */
  private formatDate(dateYYYYMMDD: string): string {
    const year = dateYYYYMMDD.substring(0, 4);
    const month = parseInt(dateYYYYMMDD.substring(4, 6), 10) - 1;
    const day = parseInt(dateYYYYMMDD.substring(6, 8), 10);
    
    return `${day} ${ROMANIAN_MONTHS[month]} ${year}`;
  }

  /**
   * Fetch available dates from contains.json
   */
  async fetchAvailableDates(force: boolean = false): Promise<AvailableDate[]> {
    // Return cached data if available and not forcing refresh
    if (!force && this.cachedDates && (Date.now() - this.lastFetchTime < CACHE_DURATION)) {
      console.log('📅 Using cached available dates');
      return this.cachedDates;
    }

    console.log('📅 Fetching available dates from:', CONTAINS_URL);

    try {
      const response = await fetch(CONTAINS_URL, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ContainsResponse = await response.json();
      console.log('📅 Received contains.json:', data.count, 'files, generated at:', data.generated_at);

      // Group files by date
      const dateMap = new Map<string, Set<string>>();
      
      data.files.forEach(file => {
        if (!file.is_legacy) {
          const dateKey = file.date_yyyymmdd;
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, new Set());
          }
          dateMap.get(dateKey)!.add(file.endpoint);
        }
      });

      // Convert to AvailableDate array
      const availableDates: AvailableDate[] = [];
      
      dateMap.forEach((endpoints, dateYYYYMMDD) => {
        // Check if all required endpoints are present
        const hasAllEndpoints = REQUIRED_ENDPOINTS.every(ep => endpoints.has(ep));
        
        // Find the corresponding file to get ISO date
        const sampleFile = data.files.find(f => f.date_yyyymmdd === dateYYYYMMDD);
        
        if (sampleFile) {
          availableDates.push({
            value: dateYYYYMMDD,
            label: this.formatDate(dateYYYYMMDD),
            isoDate: sampleFile.date_iso,
            hasAllEndpoints
          });
        }
      });

      // Sort by date descending (newest first)
      availableDates.sort((a, b) => b.value.localeCompare(a.value));

      console.log('📅 Processed available dates:', availableDates.length, 'unique dates');
      console.log('📅 Latest date:', availableDates[0]?.label);

      // Cache the results
      this.cachedDates = availableDates;
      this.lastFetchTime = Date.now();
      this.saveToCache(availableDates);

      // Notify listeners
      this.notifyListeners(availableDates);

      return availableDates;
    } catch (error) {
      console.error('❌ Failed to fetch available dates:', error);
      
      // Return cached data if available, even if expired
      if (this.cachedDates) {
        console.log('📅 Using stale cache due to fetch error');
        return this.cachedDates;
      }
      
      throw error;
    }
  }

  /**
   * Get the most recent available date
   */
  async getLatestDate(): Promise<string | null> {
    const dates = await this.fetchAvailableDates();
    return dates.length > 0 ? dates[0].value : null;
  }

  /**
   * Start automatic polling every 6 hours
   */
  startPolling(): void {
    if (this.pollingInterval) {
      console.log('📅 Polling already active');
      return;
    }

    console.log('📅 Starting automatic polling every 6 hours');
    
    // Initial fetch
    this.fetchAvailableDates().catch(err => {
      console.error('Failed initial fetch:', err);
    });

    // Poll every 6 hours
    this.pollingInterval = setInterval(() => {
      console.log('📅 Polling for new data...');
      this.fetchAvailableDates(true).catch(err => {
        console.error('Failed to poll for new data:', err);
      });
    }, CACHE_DURATION);
  }

  /**
   * Stop automatic polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('📅 Stopped automatic polling');
    }
  }

  /**
   * Clear cache and force refresh
   */
  async refresh(): Promise<AvailableDate[]> {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    this.cachedDates = null;
    this.lastFetchTime = 0;
    return this.fetchAvailableDates(true);
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): { cached: boolean; age: number; count: number } {
    return {
      cached: this.cachedDates !== null,
      age: Date.now() - this.lastFetchTime,
      count: this.cachedDates?.length || 0
    };
  }
}

// Export singleton instance getter
export const getDataAvailabilityService = () => DataAvailabilityService.getInstance();
