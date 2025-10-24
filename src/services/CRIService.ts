/**
 * CRI Service
 * Service for fetching and managing CRI (Cercetare, Dezvoltare și Inovare) data
 */

import criMappingData from '../data/criMapping.json';

export interface CRIData {
  cri: string;
  cri_denumire: string;
}

export class CRIService {
  private static instance: CRIService;
  private criCache: Map<string, CRIData[]> | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): CRIService {
    if (!CRIService.instance) {
      CRIService.instance = new CRIService();
    }
    return CRIService.instance;
  }

  /**
   * Fetch CRI data from local mapping file
   * This ensures all 17 CRI codes are available with proper descriptions
   */
  async fetchCRIData(): Promise<CRIData[]> {
    const now = Date.now();
    
    // Check cache validity
    if (this.criCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('🔄 Using cached CRI data');
      return Array.from(this.criCache.values()).flat();
    }

    try {
      console.log('📂 Loading CRI data from local mapping...');
      
      // Use local mapping data (imported from criMapping.json)
      const criData = criMappingData as CRIData[];
      
      // Sort alphabetically by CRI code
      const sortedCRIs = criData.sort((a, b) => a.cri.localeCompare(b.cri));
      
      console.log('✅ Loaded CRI data:', sortedCRIs.length, 'unique CRI entries');
      console.log('🔍 Sample CRI entries:', sortedCRIs.slice(0, 5));
      
      // Cache the data
      this.criCache = new Map();
      this.criCache.set('all', sortedCRIs);
      this.cacheTimestamp = now;

      return sortedCRIs;

    } catch (error) {
      console.error('❌ Error loading CRI data:', error);
      
      // Return minimal fallback data if local file fails
      const fallbackCRIs: CRIData[] = [
        { cri: 'MMFTSS', cri_denumire: 'Ministerul Muncii, Familiei, Tineretului și Solidarității Sociale' },
        { cri: 'MC', cri_denumire: 'Ministerul Culturii' },
        { cri: 'MIPE', cri_denumire: 'Ministerul Investițiilor și Proiectelor Europene' },
        { cri: 'MEDAT', cri_denumire: 'Ministerul Economiei, Digitalizării, Antreprenoriatului și Turismului' },
        { cri: 'MTI', cri_denumire: 'Ministerul Transporturilor și Infrastructurii' },
        { cri: 'MMAP', cri_denumire: 'Ministerul Mediului, Apelor și Pădurilor' },
        { cri: 'MEC', cri_denumire: 'Ministerul Educației' }
      ];

      console.log('🔄 Using fallback CRI data');
      return fallbackCRIs;
    }
  }

  /**
   * Get CRI data with caching
   */
  async getCRIData(): Promise<CRIData[]> {
    return this.fetchCRIData();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.criCache = null;
    this.cacheTimestamp = 0;
    console.log('🗑️ CRI cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { isCached: boolean; age: number; size: number } {
    const now = Date.now();
    return {
      isCached: this.criCache !== null,
      age: this.cacheTimestamp ? now - this.cacheTimestamp : 0,
      size: this.criCache ? Array.from(this.criCache.values()).flat().length : 0
    };
  }
}

export default CRIService.getInstance();
