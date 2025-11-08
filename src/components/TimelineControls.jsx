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
  onIndexChange,
  onSpeedChange
}) {
  // Calculează poziția smooth a slider-ului: index + progress
  const smoothPosition = currentIndex + progress;
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const markersContainerRef = useRef(null);
  const activeMarkerRef = useRef(null);

  const currentDate = availableDates[currentIndex];
  
  // Show only months from Ianuarie 2022 onwards (index 13+)
  const allMonths = availableDates.slice(13);
  
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
  
  
  const speedOptions = [
    { label: '0.5x', value: 10000 },
    { label: '1x', value: 5000 },
    { label: '2x', value: 2500 },
    { label: '3x', value: 1666 },
    { label: '4x', value: 1250 }
  ];

  const currentSpeedLabel = speedOptions.find(opt => opt.value === playbackSpeed)?.label || '3x';

  const handleSliderChange = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    onIndexChange(newIndex);
  };

  const handleSpeedSelect = (speed) => {
    onSpeedChange(speed);
    setShowSpeedMenu(false);
  };

  return (
    <div className="timeline-controls">
      <div className="timeline-controls-header">
        <h3>⏯️ Controale Timeline</h3>
      </div>

      <div className="timeline-controls-body">
        {/* Date markers - ALL months (60 months: 2020-2025) - DEASUPRA butoanelor */}
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

        {/* Play/Pause/Stop buttons */}
        <div className="timeline-buttons">
          {!isPlaying ? (
            <button 
              className="timeline-btn timeline-btn-play"
              onClick={onPlay}
              title="Pornește animația"
            >
              ▶️ Pornește
            </button>
          ) : (
            <button 
              className="timeline-btn timeline-btn-pause"
              onClick={onPause}
              title="Pauză animație"
            >
              ⏸️ Pauză
            </button>
          )}

          <button 
            className="timeline-btn timeline-btn-stop"
            onClick={onStop}
            title="Oprește și resetează"
            disabled={currentIndex === 0 && !isPlaying}
          >
            ⏹️ Oprește
          </button>

          {/* Speed control */}
          <div className="timeline-speed-control">
            <button 
              className="timeline-btn timeline-btn-speed"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              title="Viteza de redare"
            >
              ⚡ Viteză: {currentSpeedLabel}
            </button>
            
            {showSpeedMenu && (
              <div className="timeline-speed-menu">
                {speedOptions.map(option => (
                  <button
                    key={option.value}
                    className={`timeline-speed-option ${playbackSpeed === option.value ? 'active' : ''}`}
                    onClick={() => handleSpeedSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current date display */}
        {currentDate && (
          <div className="timeline-current-date">
            <span className="timeline-date-label">Lună:</span>
            <span className="timeline-date-value">{currentDate.label}</span>
            <span className="timeline-date-index">
              ({currentIndex + 1} / {availableDates.length})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineControls;
