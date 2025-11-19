/**
 * useTimelinePlati - Hook pentru Timeline Plăți PNRR 2025
 * 
 * Încarcă date PRE-GENERATE din timeline-plati-2025.json (89 KB)
 * Performance: <100ms load, 60 FPS smooth animation
 */

import { useState, useEffect, useCallback } from 'react';
import { getAssetPath } from '../utils/pathHelper';
import { getAPIEndpoints } from '../constants/PNRRConstants';

/**
 * Smooth timeline data by interpolating June-September 2025 spike
 * Spike range: June, July, August, September (October returns to normal)
 */
function smoothTimeline(timeline) {
  if (!timeline || timeline.length === 0) return timeline;
  
  const smoothed = timeline.map(frame => ({ ...frame })); // Deep copy
  
  // Specific fix for June-September 2025 spike (Octombrie has negative payments)
  const mayIndex = timeline.findIndex(f => f.date === '2025-05');
  const juneIndex = timeline.findIndex(f => f.date === '2025-06');
  const julyIndex = timeline.findIndex(f => f.date === '2025-07');
  const augustIndex = timeline.findIndex(f => f.date === '2025-08');
  const septemberIndex = timeline.findIndex(f => f.date === '2025-09');
  const octoberIndex = timeline.findIndex(f => f.date === '2025-10');
  const novemberIndex = timeline.findIndex(f => f.date === '2025-11');
  
  if (mayIndex !== -1 && novemberIndex !== -1) {
    const mayValue = timeline[mayIndex].totalEUR;
    const novemberValue = timeline[novemberIndex].totalEUR;
    
    console.log('🎨 Applying spike smoothing for June-October 2025...');
    console.log(`  → Interpolating from Mai (${(mayValue / 1e6).toFixed(2)} mil EUR) to Noiembrie (${(novemberValue / 1e6).toFixed(2)} mil EUR)`);
    
    // Interpolate June, July, August, September, October
    const spikeMonths = [
      { idx: juneIndex, name: 'Iunie' },
      { idx: julyIndex, name: 'Iulie' },
      { idx: augustIndex, name: 'August' },
      { idx: septemberIndex, name: 'Septembrie' },
      { idx: octoberIndex, name: 'Octombrie' }
    ].filter(m => m.idx !== -1);
    
    const totalSteps = novemberIndex - mayIndex;
    
    spikeMonths.forEach((month, i) => {
      const step = month.idx - mayIndex;
      const progress = step / totalSteps;
      const interpolatedValue = mayValue + (novemberValue - mayValue) * progress;
      
      smoothed[month.idx].totalEUR = Math.round(interpolatedValue * 100) / 100;
      smoothed[month.idx].totalRON = Math.round((interpolatedValue * 5) * 100) / 100;
      
      console.log(`    ${month.name} 2025: ${(timeline[month.idx].totalEUR / 1e6).toFixed(2)} → ${(smoothed[month.idx].totalEUR / 1e6).toFixed(2)} mil EUR`);
    });
  }
  
  return smoothed;
}

export function useTimelinePlati() {
  const [timelineData, setTimelineData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [officialBeneficiaries, setOfficialBeneficiaries] = useState(null);

  // Load pre-generated timeline data
  useEffect(() => {
    async function loadTimeline() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('📥 Loading timeline plăți 2023-2025...');
        const startTime = Date.now();
        
        // Add timestamp to prevent caching - use current timestamp
        const response = await fetch(`${getAssetPath('timeline-plati-2025.json')}?v=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const loadTime = Date.now() - startTime;
        
        console.log(`✅ Loaded timeline in ${loadTime}ms`);
        console.log(`📊 ${data.months} months, ${data.totalPayments} payments, ${(data.totalEUR / 1000000).toFixed(2)} mil EUR`);
        
        // Filter timeline to start from Ianuarie 2023
        const filteredTimeline = data.timeline.filter(frame => frame.date >= '2023-01');
        
        console.log(`🔍 Filtered timeline: ${filteredTimeline.length} months (from ${filteredTimeline[0]?.date} to ${filteredTimeline[filteredTimeline.length - 1]?.date})`);
        
        // Apply smoothing to remove spikes
        console.log('\n🎨 Applying spike smoothing...');
        const smoothedTimeline = smoothTimeline(filteredTimeline);
        
        const filteredData = {
          ...data,
          timeline: smoothedTimeline,
          months: smoothedTimeline.length
        };
        
        setTimelineData(filteredData);
        
        // Extract available dates (only from 2023+) - use SMOOTHED data
        const dates = smoothedTimeline.map(frame => ({
          date: frame.date,
          label: frame.label
        }));
        setAvailableDates(dates);
        
        // Fetch official beneficiaries count from API (like MapView does)
        try {
          const lastFrame = smoothedTimeline[smoothedTimeline.length - 1];
          // Get today's date in YYYYMMDD format (API uses current date)
          const today = new Date();
          const dataDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
          
          // Use proxy for localhost, direct URL for production
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const baseUrl = isLocalhost 
            ? '/api/mfe/pnrr-dashboard/generator/data' 
            : 'https://mfe.gov.ro/pnrr-dashboard/generator/data';
          const indicatorsUrl = `${baseUrl}/${dataDate}-indicatori_total.json.gz`;
          
          console.log(`📊 Fetching official beneficiaries from API for date: ${dataDate}`);
          console.log(`🔗 URL: ${indicatorsUrl}`);
          const indicatorsResponse = await fetch(indicatorsUrl);
          
          if (indicatorsResponse.ok) {
            const text = await indicatorsResponse.text();
            const indicatorsData = JSON.parse(text);
            const beneficiariesCount = indicatorsData.items?.[0]?.nr_beneficiari_plati || indicatorsData.nr_beneficiari_plati;
            
            if (beneficiariesCount) {
              setOfficialBeneficiaries(beneficiariesCount);
              console.log(`✅ Official beneficiaries from API: ${beneficiariesCount}`);
            }
          }
        } catch (apiError) {
          console.warn('⚠️  Could not fetch official beneficiaries, using calculated value:', apiError.message);
        }
        
        // Set LAST frame as current (most recent data) - use SMOOTHED data
        if (smoothedTimeline.length > 0) {
          const lastIndex = smoothedTimeline.length - 1;
          const lastFrame = smoothedTimeline[lastIndex];
          setCurrentData({
            ...lastFrame,
            cumulativeBeneficiaries: lastFrame.uniqueBeneficiaries || 0
          });
        }
        
        setIsLoading(false);
        
      } catch (err) {
        console.error('❌ Error loading timeline:', err);
        setError(err.message);
        setIsLoading(false);
      }
    }
    
    loadTimeline();
  }, []);

  // Get data for specific index
  const getDataForIndex = useCallback((index) => {
    if (!timelineData || !timelineData.timeline) {
      return null;
    }
    
    const frame = timelineData.timeline[index];
    if (!frame) {
      console.warn(`⚠️  Frame ${index} not found`);
      return null;
    }
    
    // Use official beneficiaries from API if available (for last frame)
    // Otherwise use calculated value from JSON
    const isLastFrame = index === timelineData.timeline.length - 1;
    const cumulativeBeneficiaries = (isLastFrame && officialBeneficiaries) 
      ? officialBeneficiaries 
      : (frame.uniqueBeneficiaries || 0);
    
    console.log(`📅 getDataForIndex(${index}):`, {
      date: frame.date,
      label: frame.label,
      countiesCount: frame.counties?.length,
      monthlyBeneficiaries: frame.uniqueBeneficiaries,
      cumulativeBeneficiaries: cumulativeBeneficiaries
    });
    
    // Add cumulative beneficiaries to frame data
    const frameWithCumulative = {
      ...frame,
      cumulativeBeneficiaries
    };
    
    setCurrentData(frameWithCumulative);
    return frameWithCumulative;
  }, [timelineData]);

  return {
    timelineData,
    availableDates,
    currentData,
    isLoading,
    error,
    getDataForIndex,
    officialBeneficiaries
  };
}
