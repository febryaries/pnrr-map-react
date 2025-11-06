/**
 * useTimelineData Hook
 * 
 * React hook for managing timeline animation state and data loading
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { timelineDataService, TimelineDate, TimelineData } from '../services/TimelineDataService';

export interface UseTimelineDataOptions {
  autoPlay?: boolean;
  playbackSpeed?: number; // milliseconds between frames
  preloadAll?: boolean;
}

export interface UseTimelineDataReturn {
  // Data
  availableDates: TimelineDate[];
  currentDate: string | null;
  currentData: TimelineData | null;
  
  // State
  isLoading: boolean;
  isPlaying: boolean;
  currentIndex: number;
  progress: number; // 0-1 progres smooth între frame-uri
  
  // Controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentDate: (date: string) => void;
  setCurrentIndex: (index: number) => void;
  next: () => void;
  previous: () => void;
  
  // Settings
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  
  // Error
  error: string | null;
}

export function useTimelineData(options: UseTimelineDataOptions = {}): UseTimelineDataReturn {
  const {
    autoPlay = false,
    playbackSpeed: initialSpeed = 2000,
    preloadAll = true
  } = options;

  // State
  const [availableDates, setAvailableDates] = useState<TimelineDate[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentData, setCurrentData] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(initialSpeed);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0); // 0-1 progres smooth

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const isInitialized = useRef<boolean>(false);

  /**
   * Initialize: Fetch available dates
   */
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const init = async () => {
      try {
        setIsLoading(true);
        const dates = await timelineDataService.fetchAvailableDates();
        setAvailableDates(dates);

        if (dates.length > 0) {
          // Start with the latest date (index 0)
          await loadDataForIndex(0);

          // Preload all dates if requested
          if (preloadAll) {
            const datesToPreload = dates.map(d => d.date);
            timelineDataService.preloadTimeline(datesToPreload).catch(err => {
              console.warn('⚠️ Preload warning:', err);
            });
          }
        }
      } catch (err) {
        console.error('❌ Timeline initialization error:', err);
        setError('Failed to initialize timeline');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [preloadAll]);

  /**
   * Load data for a specific index
   */
  const loadDataForIndex = useCallback(async (index: number) => {
    if (index < 0 || index >= availableDates.length) return;

    const date = availableDates[index];
    if (!date) return;

    try {
      setIsLoading(true);
      const data = await timelineDataService.loadDataForDate(date.date);
      setCurrentData(data);
      setCurrentIndex(index);
      setError(null);
    } catch (err) {
      console.error(`❌ Error loading data for ${date.date}:`, err);
      setError(`Failed to load data for ${date.label}`);
    } finally {
      setIsLoading(false);
    }
  }, [availableDates]);

  /**
   * Set current date by date string
   */
  const setCurrentDate = useCallback(async (date: string) => {
    const index = availableDates.findIndex(d => d.date === date);
    if (index !== -1) {
      await loadDataForIndex(index);
    }
  }, [availableDates, loadDataForIndex]);

  /**
   * Set current index
   */
  const setCurrentIndexCallback = useCallback(async (index: number) => {
    await loadDataForIndex(index);
  }, [loadDataForIndex]);

  /**
   * Next frame
   */
  const next = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < availableDates.length) {
      await loadDataForIndex(nextIndex);
    } else if (isPlaying) {
      // Loop back to start
      await loadDataForIndex(0);
    }
  }, [currentIndex, availableDates.length, isPlaying, loadDataForIndex]);

  /**
   * Previous frame
   */
  const previous = useCallback(async () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      await loadDataForIndex(prevIndex);
    }
  }, [currentIndex, loadDataForIndex]);

  /**
   * Play animation - pornește animația
   */
  const play = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
  }, [isPlaying]);

  /**
   * Animație smooth cu requestAnimationFrame - FĂRĂ loading în timpul animației
   */
  useEffect(() => {
    if (!isPlaying) return;

    let startTime: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }
      
      const totalElapsed = timestamp - startTime;
      
      // Update progress smooth
      const progressValue = (totalElapsed % playbackSpeed) / playbackSpeed;
      setProgress(progressValue);
      
      // Când ajunge la playbackSpeed, trece la următorul index
      if (totalElapsed >= playbackSpeed) {
        startTime = timestamp;
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= availableDates.length) {
            return 0; // Loop back - NU încărca date!
          }
          return next;
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, availableDates.length]);

  /**
   * Încarcă datele când index-ul se schimbă - DOAR dacă NU e playing
   */
  useEffect(() => {
    // NU încărca date în timpul animației - prea lent!
    if (isPlaying) return;
    
    if (currentIndex >= 0 && currentIndex < availableDates.length) {
      const date = availableDates[currentIndex].date;
      
      // Încarcă din cache (instant) sau fetch (dacă nu e în cache)
      timelineDataService.loadDataForDate(date)
        .then(data => setCurrentData(data))
        .catch(err => console.error('Error loading data:', err));
    }
  }, [currentIndex, availableDates, isPlaying]);

  /**
   * Pause animation
   */
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
  }, []);

  /**
   * Stop animation (pause + reset to start)
   */
  const stop = useCallback(() => {
    pause();
    loadDataForIndex(0);
  }, [pause, loadDataForIndex]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  /**
   * Auto-play on mount if requested
   */
  useEffect(() => {
    if (autoPlay && availableDates.length > 0 && !isPlaying) {
      play();
    }
  }, [autoPlay, availableDates.length]); // Intentionally not including isPlaying and play

  /**
   * Update interval when playback speed changes
   */
  useEffect(() => {
    if (isPlaying) {
      pause();
      play();
    }
  }, [playbackSpeed]); // Intentionally not including pause and play

  return {
    // Data
    availableDates,
    currentDate: availableDates[currentIndex]?.date || null,
    currentData,
    
    // State
    isLoading,
    isPlaying,
    currentIndex,
    progress,
    
    // Controls
    play,
    pause,
    stop,
    setCurrentDate,
    setCurrentIndex: setCurrentIndexCallback,
    next,
    previous,
    
    // Settings
    playbackSpeed,
    setPlaybackSpeed,
    
    // Error
    error
  };
}
