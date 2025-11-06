/**
 * useTimelineWorker - Hook pentru încărcare LAZY cu date REALE
 * Descarcă date de pe mfe.gov.ro în background, fără hardcodare
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectDataAggregation } from '../types/ProjectDataAggregation';

// CACHE VERSION - incrementează când schimbi logica de procesare!
const CACHE_VERSION = 4; // v4 = Include NAȚIONAL (RO-MULTI) in total

export function useTimelineWorker() {
  const [availableDates, setAvailableDates] = useState([]);
  // Force empty cache on mount - CACHE_VERSION 3
  const [cache, setCache] = useState({});
  const [currentData, setCurrentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const isMounted = useRef(true);
  const isFirstMount = useRef(true);

  // 1. Lazy load dates in background (REAL data from mfe.gov.ro)
  const lazyLoadDates = useCallback(async (dates) => {
    console.log('🔄 Starting lazy loading in background...');
    
    // Load ONLY first date immediately, rest in background
    for (let i = 0; i < dates.length; i++) {
      if (!isMounted.current) break;
      
      const date = dates[i];
      
      // Skip if already in cache
      if (cache[date]) {
        console.log(`⏭️ Skipping ${date} - already cached`);
        continue;
      }
      
      try {
        console.log(`📥 Loading ${date}... (${i + 1}/${dates.length})`);
        
        // Create aggregation with specific date (ProjectData = valoare contractată)
        const aggregation = new ProjectDataAggregation(date);
        await aggregation.loadData();
        
        // Get ALL counties (including RO-MULTI for NAȚIONAL projects)
        const allCounties = aggregation.getAllCounties();
        const counties = allCounties.filter(c => c.county.code !== 'RO-MULTI');
        const multiData = allCounties.find(c => c.county.code === 'RO-MULTI');
        
        // Calculate totals from extras.rows (like MapView) to include ALL projects
        let totalValue = 0;
        let totalProjects = 0;
        
        // Sum county values
        counties.forEach(county => {
          if (county.extras && county.extras.rows) {
            // Sum all project values from extras.rows
            const countyValue = county.extras.rows.reduce((sum, project) => {
              // Get EUR value from FinancialAmount object
              const financialAmount = project.totalValue;
              if (financialAmount && typeof financialAmount === 'object') {
                return sum + (financialAmount.eur || 0);
              }
              return sum;
            }, 0);
            totalValue += countyValue;
            totalProjects += county.extras.rows.length;
          } else {
            // Fallback to total if extras.rows not available
            totalValue += county.total.value;
            totalProjects += county.total.projects;
          }
        });
        
        // Include NAȚIONAL projects (like MapView does in total view)
        const countiesValue = totalValue; // Save counties-only value
        if (multiData && multiData.extras && multiData.extras.rows) {
          const nationalValue = multiData.extras.rows.reduce((sum, project) => {
            const financialAmount = project.totalValue;
            if (financialAmount && typeof financialAmount === 'object') {
              return sum + (financialAmount.eur || 0);
            }
            return sum;
          }, 0);
          totalValue += nationalValue;
          totalProjects += multiData.extras.rows.length;
          
          console.log(`📊 ${date}: Județe=${(countiesValue / 1000000).toFixed(2)} mil + NAȚIONAL=${(nationalValue / 1000000).toFixed(2)} mil = TOTAL=${(totalValue / 1000000).toFixed(2)} mil EUR`);
        } else {
          console.log(`⚠️ ${date}: NO MULTI-DATA FOUND! Total=${(totalValue / 1000000).toFixed(2)} mil EUR`);
        }
        
        if (isMounted.current) {
          setCache(prev => ({
            ...prev,
            [date]: { counties, totalValue, totalProjects }
          }));
          
          setLoadProgress(((i + 1) / dates.length) * 100);
          
          // First date loaded - show data immediately
          if (i === 0) {
            setCurrentData({ counties, totalValue, totalProjects });
            setIsLoading(false);
          }
          
          console.log(`✅ ${date}: ${(totalValue / 1000000).toFixed(2)} mil EUR, ${totalProjects} projects`);
        }
        
      } catch (error) {
        console.error(`❌ Error loading ${date}:`, error);
      }
    }
    
    console.log('✅ All timeline data loaded!');
  }, []);

  // 2. Fetch available dates from contains.json (REAL, not hardcoded)
  useEffect(() => {
    isMounted.current = true; // Reset la true când componenta se montează
    
    async function fetchAvailableDates() {
      try {
        // CRITICAL: Clear ALL cache FIRST (including localStorage)
        console.log('🗑️ Force clearing ALL cache before loading...');
        setCache({});
        setCurrentData(null);
        setIsLoading(true);
        
        // Clear localStorage cache if exists
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('timeline_cache_')) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.warn('Could not clear localStorage:', e);
        }
        
        console.log('📅 Fetching available dates from mfe.gov.ro...');
        
        const response = await fetch('https://mfe.gov.ro/generator/data/contains.json');
        const data = await response.json();
        
        // Extract dates for progres_tehnic_proiecte (valoare contractată)
        const dates = data.files
          .filter(f => f.endpoint === 'progres_tehnic_proiecte')
          .map(f => f.date_yyyymmdd)
          .filter(date => date !== '20251029' && date !== '20251030') // Exclude 29.10 și 30.10
          .sort(); // Oldest to newest
        
        console.log(`✅ Found ${dates.length} available dates:`, dates);
        setAvailableDates(dates);
        
        // Load ONLY first date immediately for fast initial render
        if (dates.length > 0) {
          // Load first date
          await lazyLoadDates([dates[0]]);
          
          // Load rest in background (non-blocking)
          setTimeout(() => {
            if (dates.length > 1) {
              lazyLoadDates(dates.slice(1));
            }
          }, 1000); // Wait 1 second before loading rest
        }
        
      } catch (error) {
        console.error('❌ Error fetching available dates:', error);
        setIsLoading(false);
      }
    }
    
    fetchAvailableDates();
    
    // NU setăm isMounted = false în cleanup - lasăm loading-ul să continue
  }, [lazyLoadDates]);

  // 3. Get data for specific index (with fallback to latest available)
  const getDataForIndex = useCallback((index) => {
    if (availableDates.length === 0) return null;
    
    const date = availableDates[index];
    console.log(`🔍 getDataForIndex(${index}) - date: ${date}`);
    console.log('Cache keys:', Object.keys(cache));
    
    if (cache[date]) {
      // Data available in cache
      console.log(`✅ Found in cache: ${(cache[date].totalValue / 1000000).toFixed(2)} mil EUR`);
      setCurrentData(cache[date]);
      return cache[date];
    }
    
    // Fallback: return latest available data from cache
    const latestCachedDate = Object.keys(cache).sort().reverse()[0];
    console.log(`⚠️ Not in cache, using fallback: ${latestCachedDate}`);
    if (latestCachedDate && cache[latestCachedDate]) {
      console.log(`Fallback value: ${(cache[latestCachedDate].totalValue / 1000000).toFixed(2)} mil EUR`);
      setCurrentData(cache[latestCachedDate]);
      return cache[latestCachedDate];
    }
    
    return null;
  }, [availableDates, cache]);

  return {
    availableDates,
    currentData,
    isLoading,
    loadProgress,
    cache,
    getDataForIndex
  };
}
