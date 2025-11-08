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
import './TimelinePage.css';

function TimelinePage({ onCountyClick }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(59); // Start from Noiembrie 2025 (last month - index 59)
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1666); // ~1.67s per frame (3x speed - default)
  const [isJanuaryAnimating, setIsJanuaryAnimating] = useState(false);
  const animationRef = useRef(null);
  
  // Load pre-generated timeline data (Plăți 2025)
  const { availableDates, currentData, isLoading, getDataForIndex } = useTimelinePlati();
  
  // Dates are already formatted in the hook
  const formattedDates = availableDates;

  // Timeline starts from first month (Decembrie 2020 - index 0)
  // No need to set to last frame

  const handleIndexChange = (newIndex) => {
    setCurrentIndex(Math.floor(newIndex));
  };

  const play = () => {
    // Reset to Ianuarie 2022 when playing
    setCurrentIndex(13);
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
      
      if (elapsed >= playbackSpeed && !isJanuaryAnimating) {
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
  }, [isPlaying, playbackSpeed, availableDates.length, isJanuaryAnimating]);

  return (
    <div className="timeline-page">
      {/* Header */}
      <div className="timeline-page-header">
        <div className="timeline-page-title">
          <h1>💰 Absorbție în Timp - Plăți PNRR</h1>
          <p>Evoluția plăților PNRR 2025 pe județe</p>
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
        onSpeedChange={setPlaybackSpeed}
      />

      {/* Map */}
      <div className="timeline-map-container">
        <SimpleMapNew 
          currentData={currentData}
          isPlaying={isPlaying}
          onCountyClick={onCountyClick}
          onAnimationStateChange={setIsJanuaryAnimating}
        />
      </div>

    </div>
  );
}

export default TimelinePage;
