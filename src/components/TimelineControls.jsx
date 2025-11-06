/**
 * TimelineControls Component
 * 
 * Play/Pause controls, slider, and date selector for timeline animation
 */

import { useState } from 'react';
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

  const currentDate = availableDates[currentIndex];
  
  const speedOptions = [
    { label: '0.5x', value: 4000 },
    { label: '1x', value: 2000 },
    { label: '2x', value: 1000 },
    { label: '4x', value: 500 }
  ];

  const currentSpeedLabel = speedOptions.find(opt => opt.value === playbackSpeed)?.label || '1x';

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

        {/* Slider */}
        <div className="timeline-slider-container">
          <input
            type="range"
            min="0"
            max={Math.max(0, availableDates.length - 1)}
            value={smoothPosition}
            onChange={handleSliderChange}
            className="timeline-slider"
            disabled={availableDates.length === 0}
            step="0.01"
          />
          
          {/* Date markers */}
          <div className="timeline-markers">
            {availableDates.map((date, index) => (
              <div
                key={date.date}
                className={`timeline-marker ${index === currentIndex ? 'active' : ''}`}
                style={{ left: `${(index / (availableDates.length - 1)) * 100}%` }}
                title={date.label}
              >
                <span className="timeline-marker-label">{date.label}</span>
              </div>
            ))}
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
