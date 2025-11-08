/**
 * TimelinePage Component
 * 
 * Main page for "Absorbție în Timp" - animated timeline visualization
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import TimelineControls from '../components/TimelineControls';
import TimelineStats from '../components/TimelineStats';
import SimpleMapNew from '../components/SimpleMapNew';
import { useTimelinePlati } from '../hooks/useTimelinePlati';
import { useTotalIndicators } from '../hooks/useTotalIndicators';
import './TimelinePage.css';

function TimelinePage({ onCountyClick }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1666); // ~1.67s per frame (3x speed - default)
  const animationRef = useRef(null);
  
  // Load pre-generated timeline data (Plăți 2023-2025)
  const { availableDates, currentData, isLoading, getDataForIndex } = useTimelinePlati();
  
  // Load total indicators from official API for correct beneficiaries count
  const { totalIndicators } = useTotalIndicators();
  
  // Start from last month (Noiembrie 2025) - will be set when data loads
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Set to last month when data loads
  useEffect(() => {
    if (availableDates.length > 0 && currentIndex === 0) {
      setCurrentIndex(availableDates.length - 1);
    }
  }, [availableDates.length]);
  
  // Dates are already formatted in the hook
  const formattedDates = availableDates;

  const handleIndexChange = (newIndex) => {
    setCurrentIndex(Math.floor(newIndex));
  };

  const play = () => {
    // If at the end (last month), restart from beginning
    if (currentIndex >= availableDates.length - 1) {
      setCurrentIndex(0);
    }
    setProgress(0);
    setIsPlaying(true);
  };
  const pause = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
  const stop = () => {
    pause();
    setCurrentIndex(0);
    setProgress(0);
  };

  // Actualizare date când index se schimbă
  useEffect(() => {
    getDataForIndex(currentIndex);
  }, [currentIndex, getDataForIndex]);

  // Animație smooth
  useEffect(() => {
    if (!isPlaying || availableDates.length === 0) return;

    let startTime = null;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      
      const progressValue = (elapsed % playbackSpeed) / playbackSpeed;
      setProgress(progressValue);
      
      // Advance to next month when enough time has passed
      if (elapsed >= playbackSpeed) {
        startTime = timestamp;
        setCurrentIndex(prev => {
          const nextIndex = prev + 1;
          // Stop at the end instead of looping
          if (nextIndex >= availableDates.length) {
            setIsPlaying(false);
            return availableDates.length - 1;
          }
          return nextIndex;
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

  return (
    <div className="timeline-page">
      {/* Header */}
      <div className="timeline-page-header">
        <div className="timeline-page-title">
          <h1>💰 Absorbție în Timp - Plăți PNRR</h1>
          <p>Evoluția plăților PNRR 2023 - 2025</p>
        </div>
        
        <Link to="/" className="timeline-back-link">
          ← Înapoi la hartă
        </Link>
      </div>

      {/* Stats */}
      <TimelineStats
        currentData={currentData ? {
          counties: currentData.counties || [],
          totalEUR: currentData.totalEUR || 0,
          totalRON: currentData.totalRON || 0,
          totalPayments: currentData.totalPayments || 0,
          uniqueBeneficiaries: currentData.uniqueBeneficiaries || 0
        } : null}
        currentDate={formattedDates[currentIndex]}
        isLoading={isLoading}
        isPlaying={isPlaying}
        totalIndicators={totalIndicators}
      />

      {/* Controls */}
      <TimelineControls
        availableDates={formattedDates}
        currentIndex={currentIndex}
        progress={progress}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        onIndexChange={handleIndexChange}
      />

      {/* Map */}
      <div className="timeline-map-container">
        <SimpleMapNew 
          currentData={currentData}
          isPlaying={isPlaying}
          onCountyClick={onCountyClick}
        />
      </div>

    </div>
  );
}

export default TimelinePage;
