import { useState, useEffect, useRef } from 'react'
import { fmtMoney, COMPONENT_MAPPING_PAYMENTS } from '../data/data'
import getProcessedComponentsData from '../data/processComponentsData'
import alocariComponenteData from '../data/alocariComponente.json'

// Mapping of component codes and descriptions to PNRR dashboard IDs
const PNRR_IDS = {
  'C1': { 'I1': 2, 'I2': 3, 'I4': 5, 'I5': 7, 'I6': 8, 'R2': 1 },
  'C2': { 'I1': 11, 'I2': 12, 'I3': 13, 'I4': 16, 'I5': 20, 'R1': 10 },
  'C3': { 'I1': 21, 'I1.1': 21, 'I1.2': 149, 'I2': 25, 'I3': 26 },
  'C4': { 'I1': 29, 'I2': 30, 'I3.1': 32, 'I3.2': 174, 'R1': 28, 'R2': 31 },
  'C5': { 'I1.1': 175, 'I1.2': 35, 'I2': 36, 'I4': 38, 'R1': 34 },
  'C6': { 'I2': 41, 'I3': 42, 'I4.2': 43, 'I4.3': 176, 'I5': 44, 'R4': 40 },
  'C7': { 'I1': 46, 'I2': 47, 'I3.1': 48, 'I3.2': 177, 'I3.3': 178, 'I4': 49, 'I5': 50, 'I6': 51, 'I7': 52, 'I8': 53, 'I9': 54, 'I10': 55, 'I11': 56, 'I12': 57, 'I13': 58, 'I14': 59, 'I15': 60, 'I16': 61, 'I17': 62, 'I18': 63, 'I19': 64, 'R1': 45 },
  'C8': { 'I1': 65, 'I2': 66, 'I3': 67, 'I4': 68, 'I5': 69, 'I6': 70, 'I7': 71, 'I8': 72, 'I9': 74, 'I10': 75, 'I11': 179, 'R6': 73 },
  'C9': { 'I1': 77, 'I2.1': 153, 'I2.2': 154, 'I3.1': 158, 'I3.2': 159, 'I4': 85, 'I5': 87, 'I8': 90, 'I9': 91, 'I10': 92, 'R2': 86 },
  'C10': { 'I1': 93, 'I2': 94, 'I3.1': 95, 'I3.2': 180, 'I4': 96 },
  'C11': { 'I1': 98, 'I2': 99, 'I3': 100, 'I4': 101, 'I5': 103, 'I6': 104, 'I7': 105, 'R1': 97, 'R3': 102 },
  'C12': { 'I1.1': 109, 'I1.3': 181, 'I1.4': 182, 'I1.5': 183, 'I2.a': 110, 'I2.b': 184, 'I2.3': 185, 'I2.4': 186, 'I4': 187, 'R1': 106, 'R2': 107, 'R3': 108 },
  'C13': { 'I1': 113, 'I2': 114, 'I3': 115, 'I4': 118, 'R2': 111, 'R3': 112, 'R6': 116, 'R7': 117 },
  'C14': { 'I5': 129, 'R1': 119, 'R2': 120, 'R3': 121, 'R4': 122, 'R8': 123, 'R9': 124 },
  'C15': { 'I1.1': 130, 'I1.2': 188, 'I2': 131, 'I3': 132, 'I4': 133, 'I5': 134, 'I6': 135, 'I8': 137, 'I9': 138, 'I10.1': 139, 'I10.2': 189, 'I11': 140, 'I13': 142, 'I14': 143, 'I16': 145, 'I17': 146, 'I18': 147 },
  'C16': { 'I2': 161, 'I4.1': 163, 'I4.2': 190, 'I5.a': 164, 'I5.b': 191, 'I5.c': 192, 'I7': 166, 'I8': 193, 'R1': 167, 'R2': 168 }
}


// Helper function to extract measure code from description
const extractMeasureCode = (description) => {
  const match = description.match(/^(I\d+(?:\.\d+)?(?:[a-z])?|R\d+(?:\.\d+)?(?:[a-z])?)/)
  return match ? match[1] : null
}

const ComponentsOverview = ({ 
  currency = 'EUR',
  setActiveProgram = null,
  setFilterMasura = null,
  switchEndpoint = null
}) => {
  const [expandedComponents, setExpandedComponents] = useState(new Set())
  const [isSticky, setIsSticky] = useState(false)
  const sectionRef = useRef(null)
  const headerRef = useRef(null)

  // Helper function to handle measure click - navigate to table and filter
  const handleMeasureClick = (componentCode, measureCode) => {
    if (!setActiveProgram || !setFilterMasura || !switchEndpoint) return
    
    // Switch to projects endpoint
    if (switchEndpoint) {
      switchEndpoint('projects')
    }
    
    // Set the component filter
    if (setActiveProgram) {
      setActiveProgram(componentCode)
    }
    
    // Set the measure filter
    if (setFilterMasura) {
      setFilterMasura(measureCode)
    }
    
    // Scroll to the table
    setTimeout(() => {
      const element = document.getElementById('projects-table')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 500)
  }
  
  // Helper function to convert EUR to RON if needed
  const convertValue = (eurValue) => {
    return currency === 'RON' ? eurValue * 5 : eurValue
  }
  
  // Helper function to format money with correct currency
  const formatMoney = (eurValue) => {
    const value = convertValue(eurValue)
    return fmtMoney(value, currency)
  }

  // Load component data from new JSON
  const componentsData = alocariComponenteData.components

  const componentsSummary = componentsData.map(component => {
    const investmentCount = component.masuri.filter(m => m.masura.startsWith('I')).length
    const reformCount = component.masuri.filter(m => m.masura.startsWith('R')).length
    
    return {
      code: component.componenta,
      name: component.numeComponenta || component.componenta,
      totalValue: component.totalAlocare,
      totalExecuted: component.totalExecutat,
      executedPercentage: component.totalExecutatProcent,
      investmentCount,
      reformCount
    }
  })

  const detailedComponents = Object.fromEntries(
    componentsData.map(component => [component.componenta, component])
  )

  const totalValue = alocariComponenteData.totalAlocare
  const totalExecuted = alocariComponenteData.totalExecutat

  // Intersection Observer pentru sticky navigation
  useEffect(() => {
    const headerElement = headerRef.current
    const sectionElement = sectionRef.current
    
    if (!headerElement || !sectionElement) return

    // Observer pentru header - când iese din viewport, activează sticky
    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        // Sticky când header-ul a ieșit din viewport (scroll down)
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setIsSticky(true)
        } else if (entry.isIntersecting) {
          setIsSticky(false)
        }
      },
      { 
        rootMargin: '-80px 0px 0px 0px', // Offset pentru a activa puțin mai târziu
        threshold: 0 
      }
    )

    // Observer pentru secțiune - când ieși complet din secțiune, dezactivează sticky
    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        // Dacă secțiunea iese complet din viewport (scroll down past section)
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setIsSticky(false)
        }
      },
      { 
        rootMargin: '0px 0px -100% 0px', // Trigger când secțiunea iese complet
        threshold: 0 
      }
    )

    headerObserver.observe(headerElement)
    sectionObserver.observe(sectionElement)

    return () => {
      headerObserver.disconnect()
      sectionObserver.disconnect()
    }
  }, [])

  const toggleComponent = (componentCode) => {
    const newExpanded = new Set(expandedComponents)
    if (newExpanded.has(componentCode)) {
      newExpanded.delete(componentCode)
    } else {
      newExpanded.add(componentCode)
    }
    setExpandedComponents(newExpanded)
  }

  // Funcție pentru scroll smooth cu ancora către componentă
  const scrollToComponent = (componentCode) => {
    const element = document.querySelector(`[data-component="${componentCode}"]`)
    
    if (element) {
      const stickyHeight = 60 // înălțimea sticky nav
      const offset = element.getBoundingClientRect().top + window.pageYOffset - stickyHeight - 20
      
      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      })
      
      // Expandează componenta după scroll
      setTimeout(() => {
        setExpandedComponents(new Set([componentCode]))
      }, 600)
    }
  }

  const getComponentColor = (code) => {
    const colors = {
      'C1': '#3b82f6', 'C2': '#10b981', 'C3': '#f59e0b', 'C4': '#ef4444',
      'C5': '#8b5cf6', 'C6': '#06b6d4', 'C7': '#84cc16', 'C8': '#f97316',
      'C9': '#ec4899', 'C10': '#6366f1', 'C11': '#14b8a6', 'C12': '#f43f5e',
      'C13': '#8b5cf6', 'C14': '#64748b', 'C15': '#0ea5e9', 'C16': '#22c55e'
    }
    return colors[code] || '#6b7280'
  }

  const getComponentDetails = (componentCode) => {
    return detailedComponents[componentCode]
  }

  return (
    <>
      <section ref={sectionRef} className="map-container" id="componente-pnrr">
        <div className="components-overview">
          {/* Sticky Navigation - apare doar când scroll în secțiune */}
          {isSticky && (
            <div className="components-sticky-nav">
              <div className="sticky-nav-content">
                {componentsSummary.map(comp => (
                  <button
                    key={comp.code}
                    onClick={() => scrollToComponent(comp.code)}
                    className={expandedComponents.has(comp.code) ? 'active' : ''}
                    style={{ borderBottomColor: getComponentColor(comp.code) }}
                    title={comp.name}
                  >
                    {comp.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={headerRef} className="components-header">
            <h2>Componente PNRR</h2>
            <p className="components-description">
              Planul Național de Redresare și Reziliență cuprinde <strong>16 componente</strong> strategice, cu o valoare totală de <strong>{formatMoney(totalValue)}</strong>, menite să transforme economia și societatea românească.
            </p>
            <div className="components-stats-boxes">
              <div className="stat-box">
                <div className="stat-label">Total componente</div>
                <div className="stat-value">16</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Valoare totală</div>
                <div className="stat-value">{formatMoney(totalValue)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Valoare executată</div>
                <div className="stat-value">{formatMoney(totalExecuted)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Procent executat</div>
                <div className="stat-value">{((totalExecuted / totalValue) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

        <div className="components-accordion">
          {componentsSummary.map(component => {
            const isExpanded = expandedComponents.has(component.code)
            const details = getComponentDetails(component.code)
            const percentage = ((component.totalValue / totalValue) * 100).toFixed(1)
            
            // Count investments vs reforms and sort them
            const investments = details?.masuri?.filter(m => m.masura.startsWith('I')).sort((a, b) => {
              // Extract number from measure code (e.g., "I1" -> 1, "I2.1" -> 2.1)
              const getMeasureNumber = (code) => {
                const match = code.match(/I(\d+(?:\.\d+)?(?:[a-z])?)/)
                return match ? parseFloat(match[1]) : 0
              }
              return getMeasureNumber(a.masura) - getMeasureNumber(b.masura)
            }) || []
            const reforms = details?.masuri?.filter(m => m.masura.startsWith('R')).sort((a, b) => {
              // Extract number from measure code (e.g., "R1" -> 1, "R2.1" -> 2.1)
              const getMeasureNumber = (code) => {
                const match = code.match(/R(\d+(?:\.\d+)?(?:[a-z])?)/)
                return match ? parseFloat(match[1]) : 0
              }
              return getMeasureNumber(a.masura) - getMeasureNumber(b.masura)
            }) || []
            
            return (
              <div 
                key={component.code}
                data-component={component.code}
                className={`component-accordion-item ${isExpanded ? 'expanded' : ''}`}
                style={{ borderLeftColor: getComponentColor(component.code) }}
              >
                <div 
                  className="component-accordion-header"
                  onClick={() => toggleComponent(component.code)}
                >
                  <div className="component-main-info">
                    <div className="component-code">{component.code}</div>
                    <div className="component-info">
                      <div className="component-name">{component.name}</div>
                      <div className="component-meta">
                        {investments.length} investiții • {reforms.length} reforme • {percentage}% din total
                      </div>
                    </div>
                  </div>
                  <div className="component-summary">
                    <div className="component-value">{formatMoney(component.totalValue)}</div>
                    {component.totalExecuted > 0 && (
                      <div className="component-executed">
                        Executat: {formatMoney(component.totalExecuted)} • {component.executedPercentage.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="expand-icon">
                    {isExpanded ? '−' : '+'}
                  </div>
                </div>
                  
                  {isExpanded && details && (
                    <div className="component-accordion-content">
                      <div className="investments-header">
                        <h4>Investiții & reforme detaliate</h4>
                        <div className="counters">
                          <span className="investment-count">{investments.length} investiții</span>
                          <span className="reform-count">{reforms.length} reforme</span>
                        </div>
                      </div>
                      
                      {investments.length > 0 && (
                        <div className="section">
                          <h5 className="section-title">Investiții</h5>
                          <div className="investments-list">
                            {investments.map((investment, index) => {
                              const measureCode = investment.masura
                              const isZeroCost = !investment.alocare_financiara_euro || investment.alocare_financiara_euro === 0
                              
                              return (
                                <div key={index} className={`investment-item ${isZeroCost ? 'zero-cost' : ''}`}>
                                  <div className="investment-description">
                                    <div className="investment-description-text">
                                      {investment.titlul_masurii}
                                    </div>
                                    <button 
                                      onClick={() => handleMeasureClick(component.code, measureCode)}
                                      className="pnrr-link"
                                      title="Filtrează tabelul după această măsură"
                                    >
                                      🔗
                                    </button>
                                  </div>
                                  <div className="investment-value">
                                    {isZeroCost ? (
                                      <div className="zero-cost-label">Fără cheltuieli asociate</div>
                                    ) : (
                                      <>
                                        <div className="value-main">{formatMoney(investment.alocare_financiara_euro)}</div>
                                        <div className="financing-type">
                                          {investment.finantare === 'loan' ? 'Loan' : 'Grant'}
                                        </div>
                                        <div className="value-executed">
                                          <span className="executed-label">Executat:</span> {formatMoney(investment.executat_euro)}
                                          <span className="execution-percent"> • {investment.executat_procent.toFixed(1)}%</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {reforms.length > 0 && (
                        <div className="section">
                          <h5 className="section-title">Reforme</h5>
                          <div className="investments-list">
                            {reforms.map((reform, index) => {
                              const measureCode = reform.masura
                              const isZeroCost = !reform.alocare_financiara_euro || reform.alocare_financiara_euro === 0
                              
                              return (
                                <div key={index} className={`investment-item ${isZeroCost ? 'zero-cost' : ''}`}>
                                  <div className="investment-description">
                                    <div className="investment-description-text">
                                      {reform.titlul_masurii}
                                    </div>
                                    <button 
                                      onClick={() => handleMeasureClick(component.code, measureCode)}
                                      className="pnrr-link"
                                      title="Filtrează tabelul după această măsură"
                                    >
                                      🔗
                                    </button>
                                  </div>
                                  <div className="investment-value">
                                    {isZeroCost ? (
                                      <div className="zero-cost-label">Fără cheltuieli asociate</div>
                                    ) : (
                                      <>
                                        <div className="value-main">{formatMoney(reform.alocare_financiara_euro)}</div>
                                        <div className="financing-type">
                                          {reform.finantare === 'loan' ? 'Loan' : 'Grant'}
                                        </div>
                                        <div className="value-executed">
                                          <span className="executed-label">Executat:</span> {formatMoney(reform.executat_euro)}
                                          <span className="execution-percent"> • {reform.executat_procent.toFixed(1)}%</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

    </>
  )
}

export default ComponentsOverview
