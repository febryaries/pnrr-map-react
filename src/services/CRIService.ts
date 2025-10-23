/**
 * CRI Service
 * Service for fetching and managing CRI (Cercetare, Dezvoltare și Inovare) data
 */

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
   * Fetch CRI data from the API endpoint
   */
  async fetchCRIData(): Promise<CRIData[]> {
    const now = Date.now();
    
    // Check cache validity
    if (this.criCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('🔄 Using cached CRI data');
      return Array.from(this.criCache.values()).flat();
    }

    try {
      console.log('🌐 Fetching CRI data from API...');
      
      const response = await fetch('https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/progres_tehnic_proiecte', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(30000) // 30 seconds timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Fetched CRI data:', data.length, 'records');

      // Extract unique CRI codes and descriptions
      const criMap = new Map<string, CRIData>();
      
      data.forEach((item: any) => {
        if (item.cri) {
          // Use cri_denumire if available, otherwise use a default description
          const criDescription = item.cri_denumire || `CRI ${item.cri}`;
          criMap.set(item.cri, {
            cri: item.cri,
            cri_denumire: criDescription
          });
        }
      });

      const uniqueCRIs = Array.from(criMap.values()).sort((a, b) => a.cri.localeCompare(b.cri));
      
      console.log('📊 Extracted CRI data:', uniqueCRIs.length, 'unique CRI entries');
      console.log('🔍 Sample CRI entries:', uniqueCRIs.slice(0, 5));
      
      // Cache the data
      this.criCache = new Map();
      this.criCache.set('all', uniqueCRIs);
      this.cacheTimestamp = now;

      console.log('✅ CRI data processed:', uniqueCRIs.length, 'unique CRI entries');
      return uniqueCRIs;

    } catch (error) {
      console.error('❌ Error fetching CRI data:', error);
      
      // Return fallback data if API fails
      const fallbackCRIs: CRIData[] = [
        { cri: 'MMFTSS', cri_denumire: 'Ministerul Muncii, Familiei, Tineretului și Sportului' },
        { cri: 'MECS', cri_denumire: 'Ministerul Educației, Cercetării și Sportului' },
        { cri: 'MT', cri_denumire: 'Ministerul Transporturilor' },
        { cri: 'MEEMA', cri_denumire: 'Ministerul Energiei, Mediului și Acțiunii pentru Clima' },
        { cri: 'MF', cri_denumire: 'Ministerul Finanțelor' },
        { cri: 'MAI', cri_denumire: 'Ministerul Afacerilor Interne' },
        { cri: 'MS', cri_denumire: 'Ministerul Sănătății' },
        { cri: 'MDRAP', cri_denumire: 'Ministerul Dezvoltării Regionale și Administrației Publice' },
        { cri: 'MCID', cri_denumire: 'Ministerul Culturii și Identității Naționale' },
        { cri: 'MFP', cri_denumire: 'Ministerul Familiei și Protecției Sociale' },
        { cri: 'MJD', cri_denumire: 'Ministerul Justiției' },
        { cri: 'MFA', cri_denumire: 'Ministerul Afacerilor Externe' },
        { cri: 'MAA', cri_denumire: 'Ministerul Agriculturii și Dezvoltării Rurale' },
        { cri: 'MECTS', cri_denumire: 'Ministerul Economiei, Cercetării și Inovării' }
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
