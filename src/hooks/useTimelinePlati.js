/**
 * useTimelinePlati - Hook pentru Timeline Plăți PNRR 2025
 * 
 * Încarcă date PRE-GENERATE din timeline-plati-2025.json (89 KB)
 * Performance: <100ms load, 60 FPS smooth animation
 */

import { useState, useEffect, useCallback } from 'react';

export function useTimelinePlati() {
  const [timelineData, setTimelineData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load pre-generated timeline data
  useEffect(() => {
    async function loadTimeline() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('📥 Loading timeline plăți 2023-2025...');
        const startTime = Date.now();
        
        // Add timestamp to prevent caching - use current timestamp
        const response = await fetch(`${import.meta.env.BASE_URL}timeline-plati-2025.json?v=${Date.now()}`);
        
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
        
        const filteredData = {
          ...data,
          timeline: filteredTimeline,
          months: filteredTimeline.length
        };
        
        setTimelineData(filteredData);
        
        // Extract available dates (only from 2023+)
        const dates = filteredTimeline.map(frame => ({
          date: frame.date,
          label: frame.label
        }));
        setAvailableDates(dates);
        
        // Set LAST frame as current (most recent data) with cumulative beneficiaries
        if (filteredTimeline.length > 0) {
          const lastIndex = filteredTimeline.length - 1;
          let cumulativeBeneficiaries = 0;
          for (let i = 0; i <= lastIndex; i++) {
            cumulativeBeneficiaries += filteredTimeline[i]?.uniqueBeneficiaries || 0;
          }
          setCurrentData({
            ...filteredTimeline[lastIndex],
            cumulativeBeneficiaries
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
    
    // Calculate cumulative beneficiaries from start to current index
    let cumulativeBeneficiaries = 0;
    for (let i = 0; i <= index; i++) {
      cumulativeBeneficiaries += timelineData.timeline[i]?.uniqueBeneficiaries || 0;
    }
    
    // Add cumulative beneficiaries to frame data
    const frameWithCumulative = {
      ...frame,
      cumulativeBeneficiaries
    };
    
    console.log(`📅 getDataForIndex(${index}):`, {
      date: frame.date,
      label: frame.label,
      countiesCount: frame.counties?.length,
      monthlyBeneficiaries: frame.uniqueBeneficiaries,
      cumulativeBeneficiaries
    });
    
    setCurrentData(frameWithCumulative);
    return frameWithCumulative;
  }, [timelineData]);

  return {
    timelineData,
    availableDates,
    currentData,
    isLoading,
    error,
    getDataForIndex
  };
}
