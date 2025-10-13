import React from 'react'
import { useTotalIndicators } from '../hooks/useTotalIndicators'

/**
 * Example component showing how to use the TotalIndicators hook
 * This replaces the manual fetch logic in your existing component
 */
export const TotalIndicatorsExample: React.FC = () => {
  const {
    totalIndicators,
    isLoading,
    error,
    getFormattedIndicators,
    hasData
  } = useTotalIndicators()

  // Get formatted values for display
  const formatted = getFormattedIndicators()

  // Format money helper (always in EUR)
  const formatMoneyWithCurrency = (amount: number) => {
    const value = amount || 0
    const millions = value / 1e6
    const rounded = Math.ceil(millions * 100) / 100
    return `${rounded.toLocaleString('ro-RO', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} mil EUR`
  }

  // Format number helper
  const fmtNum = (num: number) => new Intl.NumberFormat('ro-RO').format(num || 0)

  if (error) {
    return (
      <section className="indicators-section">
        <div className="indicators-error">
          <span>Eroare la încărcarea indicatorilor: {error}</span>
        </div>
      </section>
    )
  }

  if (!hasData()) {
    return null
  }

  return (
    <section className="indicators-section">
      {isLoading ? (
        <div className="indicators-loading">
          <div className="loading-spinner-small"></div>
          <span>Se încarcă indicatorii totali...</span>
        </div>
      ) : totalIndicators ? (
        <div className="indicators-grid">
          <div className="indicator-card">
            <div className="indicator-value">
              {formatted?.alocat || formatMoneyWithCurrency(totalIndicators.alocat_eur)}
            </div>
            <div className="indicator-label">Alocat Total</div>
            <div className="indicator-sublabel">
              {formatMoneyWithCurrency(totalIndicators.alocat_eur * 4.95)}
            </div>
          </div>
          
          <div className="indicator-card">
            <div className="indicator-value">
              {formatted?.platit || formatMoneyWithCurrency(totalIndicators.platit_eur)}
            </div>
            <div className="indicator-label">Plătit catre beneficiari</div>
            <div className="indicator-sublabel">
              {formatMoneyWithCurrency(totalIndicators.platit_eur * 4.95)}
            </div>
          </div>
          
          <div className="indicator-card">
            <div className="indicator-value">
              {formatted?.incasat || formatMoneyWithCurrency(totalIndicators.incasat_eur)}
            </div>
            <div className="indicator-label">Încasat de la U.E.</div>
            <div className="indicator-sublabel">
              {formatMoneyWithCurrency(totalIndicators.incasat_eur * 4.95)}
            </div>
          </div>
          
          <div className="indicator-card">
            <div className="indicator-value">
              {formatted?.beneficiari || fmtNum(totalIndicators.nr_beneficiari_plati)}
            </div>
            <div className="indicator-label">Număr Beneficiari Catre care s-au facut plati</div>
            <div className="indicator-sublabel">Beneficiari cu plăți</div>
          </div>
          
          <div className="indicator-card">
            <div className="indicator-value">
              {formatted?.proiecte || fmtNum(totalIndicators.nr_proiecte)}
            </div>
            <div className="indicator-label">Număr Proiecte</div>
            <div className="indicator-sublabel">
              {fmtNum(totalIndicators.nr_beneficiari_plati)} beneficiari
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default TotalIndicatorsExample
