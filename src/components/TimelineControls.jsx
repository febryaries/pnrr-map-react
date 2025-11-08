/**
 * TimelineControls Component
 * 
 * Play/Pause controls, slider, and date selector for timeline animation
 */

import { useState, useEffect, useRef } from 'react';
import './TimelineControls.css';

function TimelineControls({
  availableDates = [],
  currentIndex = 0,
  progress = 0,
  isPlaying = false,
  playbackSpeed = 2000,
  onPlay,
  onPause,
  onStop,
  onIndexChange
}) {
  const markersContainerRef = useRef(null);
  const activeMarkerRef = useRef(null);

  const currentDate = availableDates[currentIndex];
  
  // Show all available months (already filtered in hook to start from 2023)
  const allMonths = availableDates;
  
  // Auto-scroll synchronized with slider - keep active month centered
  useEffect(() => {
    if (!activeMarkerRef.current || !markersContainerRef.current) {
      return;
    }
    
    // Scroll active month into view, centered
    activeMarkerRef.current.scrollIntoView({
      behavior: isPlaying ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }, [currentIndex, currentDate, isPlaying]);

  return (
    <div className="timeline-controls">
      <div className="timeline-controls-body">
        {/* Container with button and markers side by side */}
        <div className="timeline-row">
          {/* Start/Pause button - separate container */}
          <button 
            className={`timeline-btn ${!isPlaying ? 'timeline-btn-play' : 'timeline-btn-pause'}`}
            onClick={!isPlaying ? onPlay : onPause}
            title={!isPlaying ? "Pornește animația" : "Pauză animație"}
          >
            {!isPlaying ? '▶️ Start' : '⏸️ Pauză'}
          </button>
          
          {/* Date markers - separate container */}
          <div className="timeline-markers" ref={markersContainerRef}>
            {allMonths.map((date) => {
            const isActive = date.date === currentDate?.date;
            
            return (
              <div
                key={date.date}
                ref={isActive ? activeMarkerRef : null}
                className={`timeline-marker ${isActive ? 'active' : ''}`}
                title={date.label}
                onClick={() => {
                  const index = availableDates.findIndex(d => d.date === date.date);
                  if (index !== -1) onIndexChange(index);
                }}
                style={{ cursor: 'pointer' }}
              >
                <span className="timeline-marker-label">{date.label}</span>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimelineControls;
