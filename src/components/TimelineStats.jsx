/**
 * TimelineStats Component
 * 
 * Display statistics for current timeline frame (total value, projects, date)
 */

import { useState, useEffect, useRef } from 'react';
import { formatMoney, formatNumber } from '../constants/PNRRConstants';
import './TimelineStats.css';

function TimelineStats({
  currentData,
  currentDate,
  isLoading = false,
  isPlaying = false,
  totalIndicators = null,
  currentIndex = 0,
  totalMonths = 35
}) {
  const [currency, setCurrency] = useState('EUR');
  const [animatedValue, setAnimatedValue] = useState(0);
  const [animatedProjects, setAnimatedProjects] = useState(0);
  const [animatedBeneficiaries, setAnimatedBeneficiaries] = useState(0);

  const totalEUR = currentData?.totalEUR || 0;
  const totalRON = currentData?.totalRON || 0;
  const totalPayments = currentData?.totalPayments || 0;
  
  // Use LINEAR INTERPOLATION from ~141 to 4.937 based on timeline progress
  // Formula: (currentIndex + 1) / (totalMonths + 1) ensures proper distribution
  // Ianuarie 2023 (index 0): 1/36 × 4937 = 137 beneficiari
  // Noiembrie 2025 (index 34): 35/36 × 4937 = 4797, then we use exact API value
  const totalUniqueBeneficiaries = totalIndicators?.nr_beneficiari_plati || 4937;
  const uniqueBeneficiaries = currentIndex === totalMonths 
    ? totalUniqueBeneficiaries 
    : Math.round(((currentIndex + 1) / (totalMonths + 1)) * totalUniqueBeneficiaries);

  // Reset to 0 ONLY when going back to first month (Ianuarie 2023)
  useEffect(() => {
    if (currentIndex === 0) {
      setAnimatedValue(0);
      setAnimatedProjects(0);
      setAnimatedBeneficiaries(0);
    }
  }, [currentIndex]);

  // Animate value changes - smooth transition între valori (arată evoluția reală)
  useEffect(() => {
    if (!currentData) return;

    const duration = 800; // ms
    const steps = 30;
    const stepDuration = duration / steps;
    
    const targetValue = currency === 'EUR' ? totalEUR : totalRON;
    const valueIncrement = (targetValue - animatedValue) / steps;
    const paymentsIncrement = (totalPayments - animatedProjects) / steps;
    const beneficiariesIncrement = (uniqueBeneficiaries - animatedBeneficiaries) / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        setAnimatedValue(targetValue);
        setAnimatedProjects(totalPayments);
        setAnimatedBeneficiaries(uniqueBeneficiaries);
        clearInterval(interval);
      } else {
        setAnimatedValue(prev => prev + valueIncrement);
        setAnimatedProjects(prev => prev + paymentsIncrement);
        setAnimatedBeneficiaries(prev => prev + beneficiariesIncrement);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [totalEUR, totalRON, totalPayments, uniqueBeneficiaries, currency]);

  const displayValue = animatedValue;

  const dateLabel = currentDate?.label || '-';

  return (
    <div className="timeline-stats">
      <div className="timeline-stats-header">
        <h3>📊 Statistici</h3>
        
        {/* Currency toggle */}
        <div className="timeline-currency-toggle">
          <button
            className={`timeline-currency-btn ${currency === 'RON' ? 'active' : ''}`}
            onClick={() => setCurrency('RON')}
          >
            RON
          </button>
          <button
            className={`timeline-currency-btn ${currency === 'EUR' ? 'active' : ''}`}
            onClick={() => setCurrency('EUR')}
          >
            EUR
          </button>
        </div>
      </div>

      <div className="timeline-stats-body">
        {isLoading ? (
          <div className="timeline-stats-loading">
            <div className="timeline-spinner"></div>
            <p>Se încarcă datele...</p>
          </div>
        ) : (
          <>
            {/* Total value */}
            <div className="timeline-stat-card timeline-stat-value">
              <div className="timeline-stat-icon">💰</div>
              <div className="timeline-stat-content">
                <div className="timeline-stat-label">Valoare plăți</div>
                <div className="timeline-stat-number">
                  {formatMoney(displayValue, currency)}
                </div>
              </div>
            </div>

            {/* Total payments */}
            <div className="timeline-stat-card timeline-stat-projects">
              <div className="timeline-stat-icon">💳</div>
              <div className="timeline-stat-content">
                <div className="timeline-stat-label">Număr plăți</div>
                <div className="timeline-stat-number">
                  {formatNumber(Math.round(animatedProjects))}
                </div>
              </div>
            </div>

            {/* Unique beneficiaries with payments */}
            <div className="timeline-stat-card timeline-stat-beneficiaries">
              <div className="timeline-stat-icon">👥</div>
              <div className="timeline-stat-content">
                <div className="timeline-stat-label">Beneficiari cu plăți</div>
                <div className="timeline-stat-number">
                  {formatNumber(Math.round(animatedBeneficiaries))}
                </div>
              </div>
            </div>

            {/* Current date */}
            <div className="timeline-stat-card timeline-stat-date">
              <div className="timeline-stat-icon">📅</div>
              <div className="timeline-stat-content">
                <div className="timeline-stat-label">Data</div>
                <div className="timeline-stat-number timeline-stat-date-value">
                  {dateLabel}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TimelineStats;
