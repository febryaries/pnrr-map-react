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
        
        console.log('📥 Loading timeline plăți 2025...');
        const startTime = Date.now();
        
        const response = await fetch('/timeline-plati-2025.json');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const loadTime = Date.now() - startTime;
        
        console.log(`✅ Loaded timeline in ${loadTime}ms`);
        console.log(`📊 ${data.months} months, ${data.totalPayments} payments, ${(data.totalEUR / 1000000).toFixed(2)} mil EUR`);
        
        setTimelineData(data);
        
        // Extract available dates
        const dates = data.timeline.map(frame => ({
          date: frame.date,
          label: frame.label
        }));
        setAvailableDates(dates);
        
        // Set LAST frame as current (most recent data)
        if (data.timeline.length > 0) {
          setCurrentData(data.timeline[data.timeline.length - 1]);
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
    
    console.log(`📅 getDataForIndex(${index}):`, {
      date: frame.date,
      label: frame.label,
      countiesCount: frame.counties?.length,
      counties: frame.counties?.map(c => c.name)
    });
    
    setCurrentData(frame);
    return frame;
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
