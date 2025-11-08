/**
 * TimelineCountiesList Component
 * 
 * Displays a list of all counties with payments in the current month
 * Sorted by payment value (descending)
 */

import { useMemo } from 'react';
import './TimelineCountiesList.css';

function TimelineCountiesList({ currentData, onCountyClick, position = 'left' }) {
  // Sort counties by payment value (descending) and split by position
  const displayCounties = useMemo(() => {
    if (!currentData || !currentData.counties) return [];
    
    const sorted = [...currentData.counties].sort((a, b) => {
      const valueA = a.totalEUR || 0;
      const valueB = b.totalEUR || 0;
      return valueB - valueA;
    });
    
    // Split counties: left gets first half, right gets second half
    const midPoint = Math.ceil(sorted.length / 2);
    
    if (position === 'left') {
      return sorted.slice(0, midPoint);
    } else {
      return sorted.slice(midPoint);
    }
  }, [currentData, position]);

  if (!currentData || !currentData.counties || currentData.counties.length === 0) {
    return (
      <div className="timeline-counties-list">
        <div className="counties-list-header">
          <h3>📊 Județe cu plăți</h3>
          <span className="counties-count">0 județe</span>
        </div>
        <div className="counties-list-empty">
          <p>Nu există plăți în această lună</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)} mil EUR`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} mii EUR`;
    }
    return `${value.toFixed(2)} EUR`;
  };

  const totalCounties = currentData?.counties?.length || 0;
  const startIndex = position === 'left' ? 0 : Math.ceil(totalCounties / 2);

  return (
    <div className="timeline-counties-list">
      <div className="counties-list-header">
        <h3>📊 {position === 'left' ? 'Top' : 'Continuare'}</h3>
        <span className="counties-count">{displayCounties.length} județe</span>
      </div>
      
      <div className="counties-list-items">
        {displayCounties.map((county, index) => (
          <div 
            key={county.name}
            className="county-list-item"
            onClick={() => onCountyClick && onCountyClick(county.name)}
          >
            <div className="county-rank">#{startIndex + index + 1}</div>
            <div className="county-info">
              <div className="county-name">{county.name}</div>
              <div className="county-stats">
                <span className="county-value">💰 {formatCurrency(county.totalEUR)}</span>
                <span className="county-payments">💳 {county.paymentsCount} plăți</span>
                <span className="county-beneficiaries">👥 {county.beneficiariesCount} benef.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimelineCountiesList;
