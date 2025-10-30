/**
 * Top Beneficiaries Service
 * Fetches and caches top beneficiaries data
 */

import { API_ENDPOINTS } from '../constants/PNRRConstants';

interface TopBeneficiary {
  beneficiar?: string;
  cui?: string | number;
  total_euro?: number;
  total?: number;
  [key: string]: any;
}

interface TopBeneficiariesData {
  items: TopBeneficiary[];
}

// Cache for top beneficiaries data
let topBeneficiariesCache: TopBeneficiariesData | null = null;
let isLoadingCache = false;
let loadPromise: Promise<TopBeneficiariesData> | null = null;

/**
 * Fetch top beneficiaries from API
 */
export async function fetchTopBeneficiaries(): Promise<TopBeneficiariesData> {
  // Return cached data if available
  if (topBeneficiariesCache) {
    return topBeneficiariesCache;
  }

  // If already loading, return the existing promise
  if (isLoadingCache && loadPromise) {
    return loadPromise;
  }

  // Start fetching
  isLoadingCache = true;
  loadPromise = (async () => {
    try {
      const url = API_ENDPOINTS.TOP_BENEFICIARIES;
      const response = await fetch(url, {
        headers: {
          'Accept-Encoding': 'gzip, deflate'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get arrayBuffer to handle both compressed and uncompressed data
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let data: any;

      // For .gz files, try gzip decompression first
      // Check if it starts with gzip magic number (0x1f 0x8b)
      const isGzip = uint8Array.length >= 2 && uint8Array[0] === 0x1f && uint8Array[1] === 0x8b;

      if (isGzip) {
        // File is gzipped, decompress it
        try {
          const pako = await import('pako');
          const decompressed = pako.ungzip(uint8Array);
          const jsonString = new TextDecoder().decode(decompressed);
          data = JSON.parse(jsonString);
          console.log('✅ Successfully decompressed top beneficiaries gzip and parsed JSON');
        } catch (gzipError) {
          console.error('❌ Gzip decompression failed:', gzipError);
          throw gzipError;
        }
      } else {
        // File is not gzipped, try to parse as JSON directly
        try {
          const text = new TextDecoder().decode(uint8Array);
          data = JSON.parse(text);
          console.log('✅ Successfully parsed top beneficiaries JSON (not compressed)');
        } catch (textError) {
          console.error('❌ JSON parsing failed:', textError);
          throw textError;
        }
      }

      // Handle different data structures
      let processedData: TopBeneficiariesData;
      if (data && Array.isArray(data)) {
        processedData = { items: data };
      } else if (data && data.items && Array.isArray(data.items)) {
        processedData = data;
      } else if (data && typeof data === 'object') {
        // Try to find any array property
        const arrayProp = Object.values(data).find(v => Array.isArray(v)) as TopBeneficiary[] | undefined;
        if (arrayProp) {
          processedData = { items: arrayProp };
        } else {
          console.warn('⚠️ Top beneficiaries data structure unexpected');
          processedData = { items: [] };
        }
      } else {
        console.warn('⚠️ Top beneficiaries data is not in expected format');
        processedData = { items: [] };
      }

      // Normalize and sort the data
      if (processedData.items.length > 0) {
        // Normalize field names (handle different case variations)
        const normalizedItems = processedData.items.map(item => {
          const normalized: TopBeneficiary = {};
          const keys = Object.keys(item);
          const lowerKeys = keys.map(k => k.toLowerCase());

          // Helper function to find key by lowercase match
          const findKey = (...lowerNames: string[]): string | null => {
            for (const lowerName of lowerNames) {
              const idx = lowerKeys.indexOf(lowerName);
              if (idx >= 0) return keys[idx];
            }
            return null;
          };

          // Map to our expected field names
          const beneficiarKey = findKey('beneficiar', 'nume_beneficiar', 'denumire_beneficiar', 'name', 'nume');
          const cuiKey = findKey('cui', 'cui_beneficiar', 'tax_id', 'cui_beneficiar_final');
          const totalEuroKey = findKey('total_euro', 'valoare_euro', 'amount_euro', 'valoare_plata_fe_euro');
          const totalRONKey = findKey('total', 'total_ron', 'valoare_ron', 'amount_ron', 'valoare_plata_fe');

          normalized.beneficiar = beneficiarKey ? item[beneficiarKey] : null;
          normalized.cui = cuiKey ? item[cuiKey] : null;
          normalized.total_euro = totalEuroKey ? (Number(item[totalEuroKey]) || 0) : 0;
          normalized.total = totalRONKey ? (Number(item[totalRONKey]) || 0) : 0;

          // If we couldn't find the expected fields, try to use all original fields (lowercase keys)
          if (!normalized.beneficiar && normalized.total_euro === 0 && normalized.total === 0) {
            const lowerCaseMap: Record<string, any> = {};
            Object.keys(item).forEach(key => {
              lowerCaseMap[key.toLowerCase()] = item[key];
            });
            normalized.beneficiar = lowerCaseMap.beneficiar || lowerCaseMap.nume_beneficiar || lowerCaseMap.denumire_beneficiar || lowerCaseMap.name || lowerCaseMap.nume || null;
            normalized.cui = lowerCaseMap.cui || lowerCaseMap.cui_beneficiar || lowerCaseMap.cui_beneficiar_final || lowerCaseMap.tax_id || null;
            normalized.total_euro = Number(lowerCaseMap.total_euro || lowerCaseMap.valoare_euro || lowerCaseMap.amount_euro || lowerCaseMap.valoare_plata_fe_euro || 0) || 0;
            normalized.total = Number(lowerCaseMap.total || lowerCaseMap.total_ron || lowerCaseMap.valoare_ron || lowerCaseMap.amount_ron || lowerCaseMap.valoare_plata_fe || 0) || 0;
          }

          return normalized;
        });

        // Filter out invalid entries (must have name and at least one amount > 0)
        const validItems = normalizedItems.filter(item => {
          const hasName = item.beneficiar && item.beneficiar !== 'N/A' && String(item.beneficiar).trim() !== '';
          const hasAmount = (item.total_euro && item.total_euro > 0) || (item.total && item.total > 0);
          return hasName && hasAmount;
        });

        // Sort by EUR amount (descending) for display
        validItems.sort((a, b) => {
          const amountA = a.total_euro || 0;
          const amountB = b.total_euro || 0;
          return amountB - amountA;
        });

        processedData.items = validItems;
      }

      // Cache the processed data
      topBeneficiariesCache = processedData;
      console.log(`✅ Top beneficiaries loaded: ${processedData.items.length} items`);
      return processedData;
    } catch (error) {
      console.error('❌ Error fetching top beneficiaries:', error);
      const emptyData: TopBeneficiariesData = { items: [] };
      topBeneficiariesCache = emptyData;
      return emptyData;
    } finally {
      isLoadingCache = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/**
 * Get cached top beneficiaries data (returns null if not loaded yet)
 */
export function getCachedTopBeneficiaries(): TopBeneficiariesData | null {
  return topBeneficiariesCache;
}

/**
 * Check if top beneficiaries are currently loading
 */
export function isTopBeneficiariesLoading(): boolean {
  return isLoadingCache;
}

/**
 * Check if top beneficiaries are cached
 */
export function hasTopBeneficiariesCache(): boolean {
  return topBeneficiariesCache !== null;
}

