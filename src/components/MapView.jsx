import { useState, useEffect, useMemo, useRef } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMap from 'highcharts/modules/map'
import { PROGRAMS, PROGRAM_COLORS, fmtMoney, fmtNum, fmtMoneyShort, COMPONENT_MAPPING_PAYMENTS, COMPONENT_MAPPING_PROJECTS } from '../data/data'
import ComponentsOverview from './ComponentsOverview'
import { useTotalIndicators } from '../hooks/useTotalIndicators'
import { convertRONToEUR } from '../services/ExchangeRateService'
import * as XLSX from 'xlsx'

// Enhanced Table Component (copied from CountyDetails.jsx)
const EnhancedTable = ({ 
  data, 
  columns, 
  title, 
  subtitle, 
  itemsPerPage = 10,
  searchable = false,
  searchPlaceholder = "Caută...",
  defaultSortColumn = null,
  defaultSortDirection = 'desc',
  endpoint = null, // Add endpoint prop for mobile card rendering
  enableExport = false, // Enable export to XLSX
  exportFileName = 'export', // File name for export
  activeProgram = null, // Active program from parent
  setActiveProgram = null, // Function to set active program
}) => {
  const [sortColumn, setSortColumn] = useState(defaultSortColumn)
  const [sortDirection, setSortDirection] = useState(defaultSortDirection)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredData, setFilteredData] = useState(data)
  const [filterStadiu, setFilterStadiu] = useState('')
  const [filterLocality, setFilterLocality] = useState('')
  const [filterFundingSource, setFilterFundingSource] = useState('')
  const [filterCounty, setFilterCounty] = useState('')
  const [filterComponent, setFilterComponent] = useState(activeProgram || '')
  
  // Ref for sticky filters to scroll to
  const filtersRef = useRef(null)
  
  // Get COMPONENT_MAPPING based on endpoint
  const COMPONENT_MAPPING = endpoint === 'payments' ? COMPONENT_MAPPING_PAYMENTS : COMPONENT_MAPPING_PROJECTS
  
  // Scroll to filters when any filter changes
  const scrollToFilters = () => {
    if (filtersRef.current) {
      filtersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Get unique counties (always available)
  const uniqueCounties = useMemo(() => {
    const values = new Set()
    data.forEach(item => {
      if (item.county) values.add(item.county)
    })
    return Array.from(values).sort()
  }, [data])

  // Get unique localities (filtered by selected county)
  const uniqueLocalities = useMemo(() => {
    const values = new Set()
    data.forEach(item => {
      let shouldInclude = true
      
      // Apply county filter if selected
      if (filterCounty && item.county !== filterCounty) {
        shouldInclude = false
      }
      
      if (shouldInclude && item.locality) {
        values.add(item.locality)
      }
    })
    return Array.from(values).sort()
  }, [data, filterCounty])

  // Get unique components (filtered by active filters)
  const uniqueComponents = useMemo(() => {
    const values = new Set()
    data.forEach(item => {
      let shouldInclude = true
      
      // Apply county filter if selected
      if (filterCounty && item.county !== filterCounty) {
        shouldInclude = false
      }
      
      // Apply locality filter if selected
      if (filterLocality && item.locality !== filterLocality) {
        shouldInclude = false
      }
      
      if (shouldInclude && item.componentCode) {
        values.add(item.componentCode)
      }
    })
    return Array.from(values).sort()
  }, [data, filterCounty, filterLocality])

  // Get unique stadiu (filtered by active filters)
  const uniqueStadiu = useMemo(() => {
    const values = new Set()
    data.forEach(item => {
      let shouldInclude = true
      
      // Apply county filter if selected
      if (filterCounty && item.county !== filterCounty) {
        shouldInclude = false
      }
      
      // Apply locality filter if selected
      if (filterLocality && item.locality !== filterLocality) {
        shouldInclude = false
      }
      
      // Apply component filter if selected
      if (filterComponent && item.componentCode !== filterComponent) {
        shouldInclude = false
      }
      
      if (shouldInclude && item.progress) {
        values.add(item.progress)
      }
    })
    return Array.from(values).sort()
  }, [data, filterCounty, filterLocality, filterComponent])

  // Get unique funding sources (filtered by active filters)
  const uniqueFundingSources = useMemo(() => {
    const values = new Set()
    data.forEach(item => {
      let shouldInclude = true
      
      // Apply county filter if selected
      if (filterCounty && item.county !== filterCounty) {
        shouldInclude = false
      }
      
      // Apply locality filter if selected
      if (filterLocality && item.locality !== filterLocality) {
        shouldInclude = false
      }
      
      // Apply component filter if selected
      if (filterComponent && item.componentCode !== filterComponent) {
        shouldInclude = false
      }
      
      if (shouldInclude && item.fundingSource) {
        values.add(item.fundingSource)
      }
    })
    return Array.from(values).sort()
  }, [data, filterCounty, filterLocality, filterComponent])

  // Filter data based on search term, filters, and remove zero values
  useEffect(() => {
    let filtered = data
    
    // Filter out zero values for numeric columns
    filtered = filtered.filter(item => {
      // Check if any numeric column has a value greater than 0
      const hasNonZeroValue = columns.some(column => {
        if (column.numeric && column.key) {
          const value = item[column.key]
          return typeof value === 'number' && value > 0
        }
        return false
      })
      return hasNonZeroValue
    })
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        // Get searchable columns (if searchable property is defined) or all columns
        const searchableColumns = columns.filter(col => col.searchable !== false)
        const searchableKeys = searchableColumns.length > 0 ? 
          searchableColumns.map(col => col.key).filter(Boolean) : 
          Object.keys(item)
        
        return searchableKeys.some(key => {
          const value = item[key]
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      })
    }
    
    // Apply County filter
    if (filterCounty) {
      filtered = filtered.filter(item => item.county === filterCounty)
    }
    
    // Apply Locality filter
    if (filterLocality) {
      filtered = filtered.filter(item => item.locality === filterLocality)
    }
    
    // Apply Component filter
    if (filterComponent) {
      filtered = filtered.filter(item => item.componentCode === filterComponent)
    }
    
    // Apply Stadiu filter
    if (filterStadiu) {
      filtered = filtered.filter(item => item.progress === filterStadiu)
    }
    
    // Apply Funding Source filter
    if (filterFundingSource) {
      filtered = filtered.filter(item => item.fundingSource === filterFundingSource)
    }
    
    setFilteredData(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [data, searchTerm, filterStadiu, filterLocality, filterFundingSource, filterCounty, filterComponent, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      
      // Handle numeric values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      // Handle string values
      const aStr = String(aVal || '').toLowerCase()
      const bStr = String(bVal || '').toLowerCase()
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  }, [filteredData, sortColumn, sortDirection])

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
  }

  // Handle county change - no reset, just update
  const handleCountyChange = (value) => {
    setFilterCounty(value)
    // No scroll - user is already at the filters
  }

  // Handle locality change - no reset, just update
  const handleLocalityChange = (value) => {
    setFilterLocality(value)
    // No scroll - user is already at the filters
  }

  // Sync filterComponent with activeProgram from parent
  useEffect(() => {
    setFilterComponent(activeProgram || '')
  }, [activeProgram])

  // Handle component change - no reset, just update
  const handleComponentChange = (value) => {
    setFilterComponent(value)
    // Sync with parent activeProgram
    if (setActiveProgram) {
      setActiveProgram(value || null)
    }
    // No scroll - user is already at the filters
  }

  // Export to XLSX function
  const handleExportToXLSX = () => {
    // Prepare data for export - use all filtered data, not just paginated
    const exportData = sortedData.map(item => {
      const row = {}
      columns.forEach(column => {
        const value = item[column.key]
        // Format the value for export (remove HTML, use plain text)
        if (column.render && typeof value === 'number' && column.numeric) {
          // For numeric values, keep the raw number
          row[column.label] = value
        } else {
          row[column.label] = value
        }
      })
      return row
    })

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proiecte PNRR')

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `${exportFileName}_${timestamp}.xlsx`

    // Save file
    XLSX.writeFile(workbook, fileName)
  }

  const renderPagination = () => {
    // If only one page or less, show simple count
    if (totalPages <= 1) {
      return (
        <div className="pagination" role="navigation" aria-label="Paginare">
          <div className="pagination-info">
            Afișez: {sortedData.length} {sortedData.length === 1 ? 'proiect' : 'proiecte'}
          </div>
        </div>
      )
    }
  
    const pages = []
    const maxVisiblePages = 3
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
  
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
          aria-current={currentPage === i ? 'page' : undefined}
          aria-label={`Pagina ${i}`}
        >
          {i}
        </button>
      )
    }
  
    return (
      <div className="pagination" role="navigation" aria-label="Paginare">
        <div className="pagination-info">
          Afișez {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} din {sortedData.length}
        </div>
  
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            aria-label="Prima pagină"
          >
            «
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Pagina anterioară"
          >
            ‹
          </button>
  
          {/* Desktop / tablet numbers */}
          <div className="pagination-numbers">
            {pages}
          </div>
  
          {/* Mobile compact label */}
          <div className="pagination-current" aria-hidden="true">
            Pagina {currentPage} / {totalPages}
          </div>
  
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Pagina următoare"
          >
            ›
          </button>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Ultima pagină"
          >
            »
          </button>
        </div>
      </div>
    )
  }
  
  // Mobile card renderer
  const renderMobileCard = (item, index) => {
    const titleColumn = columns[0] // First column is usually the title
    const valueColumn = columns.find(col => col.numeric) // Find numeric column for value
    
    return (
      <div key={index} className="mobile-table-card">
        {/* Title and Value together at top */}
        <div className="mobile-table-card-header">
          <div className="mobile-table-card-title">
            {titleColumn.render ? titleColumn.render(item[titleColumn.key], item) : item[titleColumn.key]}
          </div>
          {valueColumn && (
            <div className="mobile-table-card-value">
              {valueColumn.render ? valueColumn.render(item[valueColumn.key], item) : item[valueColumn.key]}
            </div>
          )}
        </div>
        
        {/* Beneficiary Name - prominent section */}
        <div className="mobile-table-card-beneficiary">
          <div className="mobile-table-card-beneficiary-label">Beneficiar</div>
          <div className="mobile-table-card-beneficiary-name">{item.beneficiary}</div>
        </div>
        
        {/* Other details in grid */}
        <div className="mobile-table-card-grid">
          {/* Row 1: Județ & Sursă Finanțare */}
          <div className="mobile-table-card-row">
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Județ</div>
              <div className="mobile-table-card-detail-value">{item.county}</div>
            </div>
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Sursă Finanțare</div>
              <div className="mobile-table-card-detail-value">{item.fundingSource ? item.fundingSource.charAt(0).toUpperCase() + item.fundingSource.slice(1).toLowerCase() : '-'}</div>
            </div>
          </div>
          
          {/* Row 2: Stadiu/Progres Fizic & Localitate */}
          <div className="mobile-table-card-row">
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">{endpoint === 'payments' ? 'Progres Fizic (%)' : 'Stadiu'}</div>
              <div className="mobile-table-card-detail-value" style={endpoint === 'projects' ? { color: '#059669', fontWeight: '500', fontSize: '10px' } : {}}>
                {endpoint === 'payments' ? `${item.progress}%` : (item.progress || '-')}
              </div>
            </div>
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Localitate</div>
              <div className="mobile-table-card-detail-value">{item.locality || '-'}</div>
            </div>
          </div>
          
          {/* Row 3: Cod Componentă & Cod Măsură */}
          <div className="mobile-table-card-row">
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Cod Componentă</div>
              <div className="mobile-table-card-detail-value">{item.componentCode}</div>
            </div>
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Cod Măsură</div>
              <div className="mobile-table-card-detail-value">{item.measureCode}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0' }}>{title}</h3>
          {subtitle && (
            <div className="muted" style={{ marginBottom: '0' }}>
              {subtitle}
            </div>
          )}
        </div>
        {enableExport && (
          <button
            onClick={handleExportToXLSX}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            title="Exportă toate proiectele în format Excel"
          >
            📊 Exportă XLSX
          </button>
        )}
      </div>
      
      {searchable && (
        <div style={{ marginBottom: '12px' }}>
          {/* Search bar */}
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      )}

      {/* Sticky Filters - ALL VISIBLE - Independent filtering */}
      {searchable && (
        <div className="table-filters-sticky" ref={filtersRef}>
          <div className="table-filters-sticky-content">
              {/* County Filter - ALWAYS VISIBLE */}
              <div className="filter-item">
                <label>📍 Alege Județul</label>
                <select value={filterCounty} onChange={(e) => handleCountyChange(e.target.value)}>
                  <option value="">Toate județele</option>
                  {uniqueCounties.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              
              {/* Locality Filter - ALWAYS VISIBLE */}
              <div className="filter-item">
                <label>🏘️ Alege Localitatea</label>
                <select value={filterLocality} onChange={(e) => handleLocalityChange(e.target.value)}>
                  <option value="">{filterCounty ? `Toate localitățile din ${filterCounty}` : 'Toate localitățile'}</option>
                  {uniqueLocalities.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              
              {/* Component Filter - ALWAYS VISIBLE */}
              <div className="filter-item">
                <label>🎯 Alege Componenta</label>
                <select value={filterComponent} onChange={(e) => handleComponentChange(e.target.value)}>
                  <option value="">Toate componentele</option>
                  {uniqueComponents.map(code => {
                    const component = COMPONENT_MAPPING[code]
                    return (
                      <option key={code} value={code}>
                        {code} - {component?.label || code}
                      </option>
                    )
                  })}
                </select>
              </div>
              
              {/* Stadiu Filter - ALWAYS VISIBLE */}
              <div className="filter-item">
                <label>📊 Stadiu</label>
                <select value={filterStadiu} onChange={(e) => setFilterStadiu(e.target.value)}>
                  <option value="">Toate stadiile</option>
                  {uniqueStadiu.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              
              {/* Funding Source Filter - ALWAYS VISIBLE */}
              <div className="filter-item">
                <label>💰 Sursă Finanțare</label>
                <select value={filterFundingSource} onChange={(e) => setFilterFundingSource(e.target.value)}>
                  <option value="">Toate sursele</option>
                  {uniqueFundingSources.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              
              {/* Clear Filters Button - VISIBLE IF ANY FILTER ACTIVE */}
              {(filterStadiu || filterLocality || filterFundingSource || filterCounty || filterComponent) && (
                <button
                  onClick={() => {
                    setFilterStadiu('')
                    setFilterLocality('')
                    setFilterFundingSource('')
                    setFilterCounty('')
                    setFilterComponent('')
                    // Sync with parent activeProgram
                    if (setActiveProgram) {
                      setActiveProgram(null)
                    }
                    // No scroll - user is already at the filters
                  }}
                  className="clear-filters-btn"
                >
                  ✕ Resetează
                </button>
              )}
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={column.numeric ? 'num' : ''}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                  {sortColumn === column.key && (
                    <span style={{ marginLeft: '4px' }}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr key={index}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className={column.numeric ? 'num' : ''}>
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-table-cards">
        {paginatedData.map((item, index) => renderMobileCard(item, index))}
      </div>

      {renderPagination()}
    </div>
  )
}

// Initialize Highcharts Map module
HighchartsMap(Highcharts)

const MapView = ({
    data,
    viewMode,
    setViewMode,
    metric,
    setMetric,
    activeProgram,
    setActiveProgram,
    onCountyClick,
    isLoadingRealData,
    useRealData,
    endpoint,
    switchEndpoint,
    endpointInfo,
    dataError,
    currency,
    setCurrency,
    useMockData,
    setUseMockData,
    isCountyLoading
}) => {
    const [showAllRanking, setShowAllRanking] = useState(false)
    const [mapData, setMapData] = useState(null)
    const [topBeneficiaries, setTopBeneficiaries] = useState(null)
    const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false)

    // Get the correct component mapping based on endpoint
    const COMPONENT_MAPPING = endpoint === 'projects' ? COMPONENT_MAPPING_PROJECTS : COMPONENT_MAPPING_PAYMENTS

    // Get field mappings based on endpoint
    const getFieldMappings = () => {
        if (endpoint === 'projects') {
            return {
                beneficiary: 'beneficiaryName', // From aggregated data
                value: 'totalValue', // FinancialAmount object
                valueRON: 'totalValue', // FinancialAmount object - will extract RON
                progress: 'STADIU', // Full stage text (e.g., "ÎN IMPLEMENTARE (sub 30%)")
                componentCode: 'componentCode', // From aggregated data
                componentLabel: 'componentLabel', // From aggregated data
                measureCode: 'measureCode', // From aggregated data
                locality: 'beneficiaryLocality', // From aggregated data
                title: 'title', // From aggregated data
                contractNumber: 'contractNumber', // From aggregated data
                fundingSource: 'fundingSource', // From aggregated data
                startDate: 'data_inceput' // Original field for currency conversion
            }
        } else {
            return {
                beneficiary: 'NUME_BENEFICIAR',
                value: 'VALOARE_PLATA_EURO', // EUR amount
                valueRON: 'VALOARE_PLATA_RON', // RON amount
                progress: 'PROGRES_FIZIC',
                componentCode: 'COD_COMPONENTA',
                componentLabel: 'COMPONENTA_LABEL',
                measureCode: 'COD_MASURA',
                locality: 'LOCALITATE_BENEFICIAR',
                title: 'TITLU_PROIECT',
                contractNumber: 'NR_CONTRACT',
                fundingSource: 'SURSA_FINANTARE'
            }
        }
    }

    const fieldMappings = getFieldMappings()

    // Currency conversion using actual RON values from API
    const convertCurrency = (amountInEUR, originalRON = null, startDate = null) => {
        if (currency === 'RON' && originalRON !== null) {
            return originalRON
        }
        // For projects endpoint, convert RON to EUR using conversion service
        if (endpoint === 'projects' && originalRON !== null) {
            return convertRONToEUR(originalRON, startDate)
        }
        return amountInEUR
    }

    // Get the correct value field based on currency selection
    const getValueField = (project) => {
        if (endpoint === 'projects') {
            // For projects, handle FinancialAmount object
            const financialAmount = project[fieldMappings.value]
            if (financialAmount && typeof financialAmount === 'object') {
                return currency === 'RON' ? financialAmount.ron : financialAmount.eur
            }
            return 0
        } else {
            // For payments, use direct field access
            if (currency === 'RON') {
                return project[fieldMappings.valueRON] || 0
            } else {
                return project[fieldMappings.value] || 0
            }
        }
    }

    const getCurrencySymbol = () => {
        return currency === 'RON' ? 'RON' : 'EUR'
    }

    const formatMoneyWithCurrency = (amountEUR, amountRON = null, startDate = null) => {
        // For top beneficiaries, API provides both EUR and RON values
        // Just select the correct one based on currency
        const amount = currency === 'RON' && amountRON !== null ? amountRON : amountEUR
        return fmtMoney(amount, getCurrencySymbol())
    }

    // Load Romania map data (topology + geojson)
    useEffect(() => {
        const loadMapData = async () => {
            try {
                const response = await fetch('https://code.highcharts.com/mapdata/countries/ro/ro-all.topo.json')
                if (!response.ok) {
                    console.warn('Could not load Romania map data:', response.statusText)
                    return
                }
                const topology = await response.json()
                setMapData({ topology })
            } catch (error) {
                console.warn('Error loading Romania map data:', error)
            }
        }
        loadMapData()
    }, [])

    // Use the total indicators hook
    const {
        totalIndicators,
        isLoading: loadingIndicators,
        error: indicatorsError
    } = useTotalIndicators()

    // Format money for total indicators with currency conversion
    const formatMoneyEUR = (amountEUR) => {
        // Convert to RON if needed (indicators are in EUR)
        const amount = currency === 'RON' ? amountEUR * 5 : amountEUR
        const value = amount || 0
        const millions = value / 1e6
        const rounded = Math.ceil(millions * 100) / 100
        return `${rounded.toLocaleString('ro-RO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} mil ${getCurrencySymbol()}`
    }

    // Fetch top beneficiaries on component mount
    useEffect(() => {
        const fetchTopBeneficiaries = async () => {
            setLoadingBeneficiaries(true)
            try {
                const response = await fetch('https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/top_beneficiari')
                if (response.ok) {
                    const data = await response.json()
                    setTopBeneficiaries(data)
                }
            } catch (error) {
                console.error('Error fetching top beneficiaries:', error)
            } finally {
                setLoadingBeneficiaries(false)
            }
        }

        fetchTopBeneficiaries()
    }, [])

    // Helper function to get county info from either format
    const getCountyInfo = (county) => {
        if (!county) return { code: null, name: null }
        const result = {
            code: county.county?.code || county.code,
            name: county.county?.name || county.name
        }
        if (!result.code) {
            console.warn('getCountyInfo: No code found for county:', county)
        }
        return result
    }

    // Process data based on current view mode and metric
    const processedData = useMemo(() => {
        if (!data || data.length === 0) {
            return []
        }

        // Handle both old format (d.code) and new format (d.county.code)
        const baseCounties = data.filter(d => {
            if (!d) return false
            const { code } = getCountyInfo(d)
            if (!code) {
                console.warn('Filtering out item with no code:', d)
            }
            return code && code !== 'RO-MULTI'
        })
        const multiData = data.find(d => {
            if (!d) return false
            const { code } = getCountyInfo(d)
            return code === 'RO-MULTI'
        })
        let result = []

        if (viewMode === 'general') {
            result = baseCounties.map(county => {
                let countyValue = county.total.value
                let countyProjects = county.total.projects

                // If a specific component is selected, filter county data by component
                if (activeProgram && county.extras && county.extras.rows) {
                    const filteredCountyProjects = county.extras.rows.filter(project =>
                        project[fieldMappings.componentCode] === activeProgram
                    )
                    countyValue = filteredCountyProjects.reduce((sum, project) =>
                        sum + getValueField(project), 0
                    )
                    countyProjects = filteredCountyProjects.length
                }

                const { code, name } = getCountyInfo(county)
                return {
                    'hc-key': code.toLowerCase().replace('ro-', 'ro-'),
                    code: code,
                    name: name,
                    value: metric === 'value' ? countyValue : countyProjects,
                    money: countyValue,
                    projects: countyProjects
                }
            })
        } else if (viewMode === 'program' && activeProgram) {
            result = baseCounties.map(county => {
                // Filter projects by component and aggregate
                let componentValue = 0
                let componentProjects = 0

                if (county.extras && county.extras.rows) {
                    county.extras.rows.forEach(project => {
                        if (project[fieldMappings.componentCode] === activeProgram) {
                            const projectValue = getValueField(project)
                            componentValue += projectValue
                            componentProjects += 1
                        }
                    })
                }

                const { code, name } = getCountyInfo(county)
                return {
                    'hc-key': code.toLowerCase().replace('ro-', 'ro-'),
                    code: code,
                    name: name,
                    value: metric === 'value' ? componentValue : componentProjects,
                    money: componentValue,
                    projects: componentProjects
                }
            })
        } else if (viewMode === 'multi') {
            const multiAgg = multiData?.extras?.multi_agg_by_county || {}
            result = baseCounties.map(county => {
                const { code, name } = getCountyInfo(county)
                const countyCode = code.replace('RO-', '')
                let multiShare = multiAgg[countyCode] || { value: 0, projects: 0 }

                // If a specific component is selected, filter multi-county data by component
                if (activeProgram && multiData?.extras?.rows) {
                    const filteredMultiProjects = multiData.extras.rows.filter(project =>
                        project.COD_COMPONENTA === activeProgram
                    )
                    multiShare = {
                        value: filteredMultiProjects.reduce((sum, project) =>
                            sum + (project.VALOARE_PLATA_EURO || project.VALOARE_PLATA_FE_EURO || 0), 0
                        ),
                        projects: filteredMultiProjects.length
                    }
                }

                return {
                    'hc-key': code.toLowerCase().replace('ro-', 'ro-'),
                    code: code,
                    name: name,
                    value: metric === 'value' ? multiShare.value : multiShare.projects,
                    money: multiShare.value,
                    projects: multiShare.projects
                }
            })
        } else if (viewMode === 'total') {
            const multiAgg = multiData?.extras?.multi_agg_by_county || {}
            result = baseCounties.map(county => {
                const { code, name } = getCountyInfo(county)
                const countyCode = code.replace('RO-', '')
                let multiShare = multiAgg[countyCode] || { value: 0, projects: 0 }

                // If a specific component is selected, filter multi-county data by component
                if (activeProgram && multiData?.extras?.rows) {
                    const filteredMultiProjects = multiData.extras.rows.filter(project =>
                        project.COD_COMPONENTA === activeProgram
                    )
                    multiShare = {
                        value: filteredMultiProjects.reduce((sum, project) =>
                            sum + (project.VALOARE_PLATA_EURO || project.VALOARE_PLATA_FE_EURO || 0), 0
                        ),
                        projects: filteredMultiProjects.length
                    }
                }

                // Calculate county totals - if component is selected, filter county data too
                let countyValue = county.total.value
                let countyProjects = county.total.projects

                if (activeProgram && county.extras && county.extras.rows) {
                    const filteredCountyProjects = county.extras.rows.filter(project =>
                        project.COD_COMPONENTA === activeProgram
                    )
                    countyValue = filteredCountyProjects.reduce((sum, project) =>
                        sum + (project.VALOARE_PLATA_EURO || project.VALOARE_PLATA_FE_EURO || 0), 0
                    )
                    countyProjects = filteredCountyProjects.length
                }

                const totalValue = countyValue + multiShare.value
                const totalProjects = countyProjects + multiShare.projects
                return {
                    'hc-key': code.toLowerCase().replace('ro-', 'ro-'),
                    code: code,
                    name: name,
                    value: metric === 'value' ? totalValue : totalProjects,
                    money: totalValue,
                    projects: totalProjects
                }
            })
        }

        const sortedResult = result.sort((a, b) => (b.value || 0) - (a.value || 0))
        return sortedResult
    }, [data, viewMode, metric, activeProgram])

    // Map chart configuration
    const mapOptions = useMemo(() => {
        if (!mapData) return null
        
        // Capture currency in closure for tooltip formatter
        const currentCurrency = currency

        const seriesData = processedData
        const values = seriesData.map(d => d.value || 0).filter(v => v > 0)

        // Use percentile-based scaling to handle outliers better
        const sortedValues = [...values].sort((a, b) => a - b)
        const p95Index = Math.floor(sortedValues.length * 0.95) // 95th percentile
        const maxValue = sortedValues.length > 0 ? sortedValues[p95Index] || sortedValues[sortedValues.length - 1] : 1
        const minValue = sortedValues.length > 0 ? sortedValues[0] : 0

        return {
            chart: {
                map: mapData.topology,
                height: 500
            },
            title: {
                text: getMapTitle(),
                align: 'left',
                margin: 0,
                useHTML: true,
                style: {
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#0f172a',
                    maxWidth: '60%',
                    lineHeight: '1.3'
                }
            },
            subtitle: {
                text: '',
                align: 'left',
                style: {
                    color: '#64748b',
                    fontSize: '13px'
                },
                y: 28
            },
            mapNavigation: {
                enabled: true,
                buttonOptions: {
                    verticalAlign: 'bottom'
                }
            },
            colorAxis: {
                min: 0,
                max: maxValue,
                stops: [
                    [0, '#f0f9ff'],      // Very light blue for zero values
                    [0.05, '#e0f2fe'],   // Light blue for very low values
                    [0.15, '#bae6fd'],   // Light medium blue
                    [0.3, '#7dd3fc'],    // Medium light blue
                    [0.5, '#38bdf8'],    // Medium blue
                    [0.7, '#0ea5e9'],    // Strong blue
                    [0.85, '#0284c7'],   // Dark blue
                    [1, '#0c4a6e']       // Darkest blue for highest values
                ],
                labels: {
                    formatter: function () {
                        return metric === 'value' ? fmtMoneyShort(this.value) : fmtNum(this.value)
                    }
                }
            },
            tooltip: {
                useHTML: true,
                outside: true,
                followPointer: true,
                stickOnContact: true,
                hideDelay: 2000,
                formatter: function () {
                    const point = this.point
                    const currencySymbol = currentCurrency === 'RON' ? 'RON' : 'EUR'
                    
                    // Convert value if RON is selected (point.money is in EUR)
                    const valueToDisplay = currentCurrency === 'RON' ? point.money * 5 : point.money
                    
                    const displayValue = metric === 'value' ? fmtMoney(valueToDisplay, currencySymbol) : fmtNum(point.projects)
                    const otherValue = metric === 'value' ? `Proiecte: ${fmtNum(point.projects)}` : `Valoare: ${fmtMoney(valueToDisplay, currencySymbol)}`

                    return `
          <strong>${point.name}</strong><br/>
          ${metric === 'value' ? 'Valoare' : 'Proiecte'}: <strong>${displayValue}</strong><br/>
          ${otherValue}<br/>
          <div style="margin-top: 8px;">
            <button onclick="window.handleCountyClick('${point.code}', '${point.name}')" 
                    style="padding: 6px 10px; background: #0ea5e9; color: #fff; border: 0; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Click pe județ pentru detalii
            </button>
          </div>
        `
                }
            },
            series: [{
                data: seriesData,
                name: 'Counties',
                states: {
                    hover: {
                        color: '#a4edba'
                    }
                },
                borderColor: '#ffffff',
                borderWidth: 0.6,
                dataLabels: {
                    enabled: false
                },
                point: {
                    events: {
                        click: function () {
                            onCountyClick(this.code, this.name)
                        }
                    }
                }
            }],
            credits: {
                enabled: false
            }
        }
    }, [mapData, processedData, metric, onCountyClick, currency, endpoint, viewMode, activeProgram, COMPONENT_MAPPING])

    // Expose county click handler globally for tooltip
    useEffect(() => {
        window.handleCountyClick = onCountyClick
        return () => {
            delete window.handleCountyClick
        }
    }, [onCountyClick])

    function getMapTitle() {
        const componentLabel = activeProgram ? COMPONENT_MAPPING[activeProgram]?.label : null
        const filterSuffix = activeProgram ? ` (filtrat: ${componentLabel})` : ''

        // Get source name based on endpoint
        const sourceName = endpoint === 'projects' ? 'Proiecte PNRR' : 'Plăți PNRR'

        // Get currency symbol based on selected currency
        const currencySymbol = currency === 'RON' ? 'RON' : 'EUR'

        let title = ''
        if (viewMode === 'general') {
            title = `Sursa datelor: ${sourceName} - General ${metric === 'value' ? `Valoare (${currencySymbol})` : 'Proiecte'}${filterSuffix}`
        } else if (viewMode === 'program') {
            title = `Sursa datelor: ${sourceName} - ${componentLabel || activeProgram} - ${metric === 'value' ? `Valoare (${currencySymbol})` : 'Proiecte'}`
        } else if (viewMode === 'total') {
            title = `Sursa datelor: ${sourceName} - Total (General + Multi județe) - ${metric === 'value' ? `Valoare (${currencySymbol})` : 'Proiecte'}${filterSuffix}`
        } else {
            title = `Sursa datelor: ${sourceName} - Multi județe - ${metric === 'value' ? `Valoare (${currencySymbol}, împărțită egal între județe)` : 'Proiecte (plin în fiecare județ)'}${filterSuffix}`
        }

        // If title is too long (more than 100 chars), add line break after "filtrat:"
        if (title.length > 100 && title.includes('(filtrat:')) {
            title = title.replace('(filtrat:', '<br/>(filtrat:')
        }

        return title
    }

    // Extract available components from data dynamically
    const availableComponents = useMemo(() => {
        const baseCounties = data.filter(d => {
            if (!d) return false
            const { code } = getCountyInfo(d)
            return code && code !== 'RO-MULTI'
        })
        const componentSet = new Set()

        // Collect all components from county data
        baseCounties.forEach(county => {
            if (county.extras && county.extras.rows) {
                county.extras.rows.forEach(project => {
                    const componentKey = project.COD_COMPONENTA
                    if (componentKey && COMPONENT_MAPPING[componentKey]) {
                        componentSet.add(componentKey)
                    }
                })
            }
        })

        // Add components from multi-county data
        const multiData = data.find(d => {
            if (!d) return false
            const { code } = getCountyInfo(d)
            return code === 'RO-MULTI'
        })
        if (multiData && multiData.extras && multiData.extras.rows) {
            multiData.extras.rows.forEach(project => {
                const componentKey = project.COD_COMPONENTA
                if (componentKey && COMPONENT_MAPPING[componentKey]) {
                    componentSet.add(componentKey)
                }
            })
        }

        // Convert to array and sort by component code
        const components = Array.from(componentSet).map(componentKey => ({
            key: componentKey,
            label: COMPONENT_MAPPING[componentKey].label,
            program: COMPONENT_MAPPING[componentKey].program
        })).sort((a, b) => a.key.localeCompare(b.key))

        return components
    }, [data])

    // Calculate totals for the current filtered data
    const calculatedTotals = useMemo(() => {
        const baseCounties = data.filter(d => {
            if (!d) return false
            const { code } = getCountyInfo(d)
            return code && code !== 'RO-MULTI'
        })
        const multiData = data.find(d => {
            if (!d) return false
            const { code } = getCountyInfo(d)
            return code === 'RO-MULTI'
        })

        let totalValue = 0
        let totalProjects = 0

        // Calculate county totals
        baseCounties.forEach(county => {
            if (activeProgram && county.extras && county.extras.rows) {
                // Filter by component if one is selected
                const filteredProjects = county.extras.rows.filter(project =>
                    project[fieldMappings.componentCode] === activeProgram
                )
                totalValue += filteredProjects.reduce((sum, project) =>
                    sum + getValueField(project), 0
                )
                totalProjects += filteredProjects.length
            } else {
                // Calculate from individual projects to respect currency selection
                if (county.extras && county.extras.rows) {
                    const countyValue = county.extras.rows.reduce((sum, project) =>
                        sum + getValueField(project), 0
                    )
                    totalValue += countyValue
                    totalProjects += county.extras.rows.length
                } else {
                    // Fallback to stored totals if no individual project data
                    totalValue += county.total.value
                    totalProjects += county.total.projects
                }
            }
        })

        // NOTE: Multi-county data (RO-MULTI) is NOT added here because
        // NAȚIONAL projects are already included in București via useBucurestiNationalProjects hook
        // Adding them here would create duplicates

        return { totalValue, totalProjects }
    }, [data, activeProgram, fieldMappings, currency, getValueField])

    // Component totals for pie chart
    const componentTotals = useMemo(() => {
        const baseCounties = data.filter(d => {
            if (!d) return false
            const { code } = getCountyInfo(d)
            return code && code !== 'RO-MULTI'
        })
        const totals = {}

        // Initialize component totals
        Object.entries(COMPONENT_MAPPING).forEach(([componentKey, componentInfo]) => {
            totals[componentKey] = {
                value: 0,
                projects: 0,
                label: componentInfo.label
            }
        })

        // Aggregate data from all counties
        baseCounties.forEach(county => {
            if (county.extras && county.extras.rows) {
                county.extras.rows.forEach(project => {
                    const componentKey = project[fieldMappings.componentCode]
                    if (totals[componentKey]) {
                        const projectValue = getValueField(project)
                        totals[componentKey].value += projectValue
                        totals[componentKey].projects += 1
                    }
                })
            }
        })

        // Add multi-county data if exists
        const multiData = data.find(d => {
            if (!d) return false
            const { code } = getCountyInfo(d)
            return code === 'RO-MULTI'
        })
        if (multiData && multiData.extras && multiData.extras.rows) {
            multiData.extras.rows.forEach(project => {
                const componentKey = project[fieldMappings.componentCode]
                if (totals[componentKey]) {
                    const projectValue = getValueField(project)
                    totals[componentKey].value += projectValue
                    totals[componentKey].projects += 1
                }
            })
        }

        // Generate colors for components (using component colors directly)
        const componentColors = {}
        Object.entries(COMPONENT_MAPPING).forEach(([componentKey, componentInfo]) => {
            componentColors[componentKey] = PROGRAM_COLORS[componentKey] || '#94a3b8'
        })

        return Object.entries(totals)
            .filter(([_, data]) => (metric === 'value' ? data.value : data.projects) > 0)
            .map(([key, data]) => ({
                name: data.label,
                y: metric === 'value' ? data.value : data.projects,
                color: componentColors[key],
                key
            }))
            .sort((a, b) => b.y - a.y)
    }, [data, metric, fieldMappings, COMPONENT_MAPPING, currency, getValueField])

    // Pie chart configuration - Reverted to working state
    const pieOptions = {
        chart: {
            type: 'pie',
            height: 400
        },
        title: {
            text: `Distribuție pe componente – ${metric === 'value' ? 'Valoare (EUR)' : 'Proiecte'}`
        },
        tooltip: {
            pointFormatter: function () {
                const val = metric === 'value' ? fmtMoney(this.y) : fmtNum(this.y)
                return `${this.name}: <b>${val}</b>`
            }
        },
        plotOptions: {
            pie: {
                innerSize: '55%',
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        return this.percentage ? Highcharts.numberFormat(this.percentage, 1) + '%' : null
                    },
                    style: {
                        fontSize: '12px',
                        fontWeight: '500'
                    },
                    distance: 15,
                    connectorWidth: 1,
                    connectorColor: '#666'
                },
                cursor: 'pointer',
                point: {
                    events: {
                        click: function () {
                            setViewMode('program')
                            setActiveProgram(this.options.key)
                        }
                    }
                }
            }
        },
        series: [{
            name: 'Componente',
            data: componentTotals
        }],
        credits: {
            enabled: false
        }
    }

    const rankingData = processedData.slice(0, showAllRanking ? processedData.length : 10)
    const maxValue = processedData.length > 0 ? processedData[0].value : 1

    const pageTitle = 'Tablou de bord PNRR'

    // Show loading state while map data or real data is loading
    if (!mapData || isLoadingRealData) {
        return (
            <main className="page page--map">
                {/* Transparency Banner */}
                <div className="transparency-banner">
                    <div className="transparency-banner-content">
                        <p>Acest tablou de bord reprezintă angajamentul României față de transparența publică privind fondurile NextGenerationEU și reflectă cifrele preliminare prezentate în PNRR, după depunerea oficială a amendamentului la 12 septembrie 2025, în conformitate cu procedura prevăzută la articolul 21 din Regulamentul (UE) 2021/241 de instituire a Mecanismului de Redresare și Reziliență.</p>
                    </div>
                </div>
                
                <header className="page-header">
                    <h1>{pageTitle}</h1>
                </header>
                <div className="map-container map-container--loading">
                    <div className="loading-indicator">
                        <div className="loading-spinner"></div>
                        <div className="loading-text">
                            {isLoadingRealData ? (
                                <>
                                    <strong>Se descarcă datele PNRR...</strong><br />
                                    <span className="loading-subtext">Acest proces poate dura câteva secunde</span>
                                </>
                            ) : (
                                <>
                                    <strong>Se încarcă harta României...</strong><br />
                                    <span className="loading-subtext">Se descarcă geometria județelor</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="page page--map">
            {/* Transparency Banner */}
            <div className="transparency-banner">
                <div className="transparency-banner-content">
                    <p>Acest tablou de bord reprezintă angajamentul României față de transparența publică privind fondurile NextGenerationEU și reflectă cifrele preliminare prezentate în PNRR, după depunerea oficială a amendamentului la 12 septembrie 2025, în conformitate cu procedura prevăzută la articolul 21 din Regulamentul (UE) 2021/241 de instituire a Mecanismului de Redresare și Reziliență.</p>
                </div>
            </div>
            
            <header className="page-header">
                <h1>{pageTitle}</h1>

                {/* Header Info Section */}
                <div className="header-info">
                    <div className="header-info-left">
                        <div className="data-timestamp">
                            <div className="timestamp-content">
                                <span className="timestamp-label">Data vizualizării:</span>
                                <span className="timestamp-value">{new Date().toLocaleDateString('ro-RO', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="header-info-right">
                        <div className="external-links">
                            <a
                                href="https://mfe.gov.ro/pnrr/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="external-link"
                                title="Ministerul Investițiilor și Proiectelor Europene, pagina dedicată Planului Național de Redresare și Reziliență al României"
                            >
                                <span className="link-icon">🏛️</span>
                                <div className="link-content">
                                    <div className="link-title">MIPE</div>
                                    <div className="link-subtitle">PNRR România</div>
                                </div>
                            </a>
                            <a
                                href="https://commission.europa.eu/business-economy-euro/economic-recovery/recovery-and-resilience-facility/country-pages_ro"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="external-link"
                                title="Comisia Europeană, pagina referitoare la modalitatea în care statele membre ale Uniunii Europene, inclusiv România, au aplicat Mecanismul de redresare și reziliență"
                            >
                                <span className="link-icon">🇪🇺</span>
                                <div className="link-content">
                                    <div className="link-title">Comisia Europeană</div>
                                    <div className="link-subtitle">Mecanismul de redresare</div>
                                </div>
                            </a>
                            <a
                                href="https://ec.europa.eu/economy_finance/recovery-and-resilience-scoreboard/index.html?lang=ro"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="external-link"
                                title="Comisia Europeană, Tabloul de bord privind implementarea Facilității de Redresare și Reziliență la nivelul fiecărui stat membru al Uniunii Europene, inclusiv România"
                            >
                                <span className="link-icon">🇪🇺</span>
                                <div className="link-content">
                                    <div className="link-title">Comisia Europeană</div>
                                    <div className="link-subtitle">Facilitatea de redresare</div>
                                </div>
                            </a>

                            <a
                                href="mailto:contact.minister@mfe.gov.ro"
                                className="external-link"
                            >
                                <span className="link-icon">📧</span>
                                <div className="link-content">
                                    <div className="link-title">Contact:</div>
                                    <div className="link-subtitle">contact.minister@mfe.gov.ro</div>
                                </div>
                            </a>

                        </div>


                    </div>
                </div>
            </header>


            {/* Total Indicators Cards */}
            <section className="indicators-section">
                {loadingIndicators ? (
                    <div className="indicators-loading">
                        <div className="loading-spinner-small"></div>
                        <span>Se încarcă indicatorii totali...</span>
                    </div>
                ) : indicatorsError ? (
                    <div className="indicators-error">
                        <span>Eroare la încărcarea indicatorilor: {indicatorsError}</span>
                    </div>
                ) : totalIndicators ? (
                    <div className="indicators-grid">
                        <div className="indicator-card" onClick={() => {
                            const element = document.getElementById('componente-pnrr')
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                        }}
                            style={{ cursor: 'pointer' }}>
                            <div className="indicator-value">{formatMoneyEUR(totalIndicators.alocat_eur)}</div>
                            <div className="indicator-label">Alocat Total</div>
                        </div>
                        <div className="indicator-card">
                            <div className="indicator-value">{formatMoneyEUR(totalIndicators.platit_eur)}</div>
                            <div className="indicator-label">Plătit către beneficiari</div>
                        </div>
                        <div className="indicator-card">
                            <div className="indicator-value">{formatMoneyEUR(totalIndicators.incasat_eur)}</div>
                            <div className="indicator-label">Încasat de la U.E.</div>
                        </div>
                        <div className="indicator-card">
                            <div className="indicator-value">{fmtNum(totalIndicators.nr_beneficiari_plati)}</div>
                            <div className="indicator-label">Număr Beneficiari Către care s-au făcut plăți</div>
                            <div className="indicator-sublabel">Beneficiari cu plăți</div>
                        </div>
                        <div className="indicator-card">
                            <div className="indicator-value">{fmtNum(totalIndicators.nr_proiecte)}</div>
                            <div className="indicator-label">Număr Proiecte</div>
                            <div className="indicator-sublabel">{fmtNum(totalIndicators.nr_beneficiari_plati)} beneficiari</div>
                        </div>
                    </div>
                ) : null}
            </section>


            <div className="controls controls--map">


                {/* Total segment */}
                <p className="control-label">Sursa datelor</p>

                <div className="segment">    
                    <button
                        className={endpoint === 'payments' ? 'active' : ''}
                        onClick={() => {
                            switchEndpoint('payments');
                            // Don't reset view state - preserve current viewMode, metric, and activeProgram
                        }}
                    >
                        Plăți PNRR
                    </button>
                    <button
                        className={endpoint === 'projects' ? 'active' : ''}
                        onClick={() => {
                            switchEndpoint('projects');
                            // Don't reset view state - preserve current viewMode, metric, and activeProgram
                        }}
                    >
                        Proiecte PNRR în execuție
                    </button>
                </div>
            </div>
            <div className="controls controls--map">

            <p className="control-label">Filtre secundare</p>

                {/* General segment */}
                <div className="segment">
                    <button
                        className={metric === 'value' ? 'active' : ''}
                        onClick={() => {
                            setViewMode('general');
                            setMetric('value');
                            // Only reset activeProgram if we're switching from a different view mode
                            if (viewMode !== 'general') {
                                setActiveProgram(null);
                            }
                        }}
                    >
                        General · Valoare
                    </button>
                    <button
                        className={metric === 'projects' ? 'active' : ''}
                        onClick={() => {
                            setViewMode('general');
                            setMetric('projects');
                            // Only reset activeProgram if we're switching from a different view mode
                            if (viewMode !== 'general') {
                                setActiveProgram(null);
                            }
                        }}
                    >
                        General · Proiecte
                    </button>
                </div>

                {/* Multi segment */}
                {/* <div className="segment">
                    <button
                        className={viewMode === 'multi' && metric === 'value' ? 'active' : ''}
                        onClick={() => { 
                            setViewMode('multi'); 
                            setMetric('value'); 
                            if (viewMode !== 'multi') {
                                setActiveProgram(null);
                            }
                        }}
                    >
                        Multi județe · Valoare
                    </button>
                    <button
                        className={viewMode === 'multi' && metric === 'projects' ? 'active' : ''}
                        onClick={() => { 
                            setViewMode('multi'); 
                            setMetric('projects'); 
                            if (viewMode !== 'multi') {
                                setActiveProgram(null);
                            }
                        }}
                    >
                        Multi județe · Proiecte
                    </button>
                </div> */}




                {/* Total segment */}
                <div className="segment">
                    <button
                        className={currency === 'EUR' ? 'active' : ''}
                        onClick={() => setCurrency('EUR')}
                    >
                        EUR
                    </button>
                    <button
                        className={currency === 'RON' ? 'active' : ''}
                        onClick={() => setCurrency('RON')}
                    >
                        RON
                    </button>
                </div>


                {/* Key Areas Section */}
                <div className="key-areas-section">
                    <div className="key-areas-header">
                        <h3 className="control-label">Filtrează  în funcție de Componente din PNRR</h3>
                        <a
                            href="https://pnrr.fonduri-ue.ro/ords/pnrr/r/dashboard-status-pnrr/home?T=tb"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="details-button"
                        >
                            Află mai multe detalii
                        </a>
                    </div>
                    <div className="programs">
                        {PROGRAMS.map(program => (
                            <button
                                key={program.key}
                                className={activeProgram === program.key ? 'active' : ''}
                                onClick={(e) => {
                                    // If clicking the same active program, deselect it
                                    if (activeProgram === program.key) {
                                        setActiveProgram(null)
                                    } else {
                                        // Otherwise, select the program
                                        setActiveProgram(program.key)
                                        // Don't change metric - let General buttons control that
                                    }
                                }}
                                title={`Click: ${program.label} · Valoare | Shift+Click: ${program.label} · Proiecte | Click again to deselect`}
                            >
                                {program.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>


            {/* Mobile Totals - Above Map */}
            <section className="mobile-totals-section">
                <div className="mobile-totals-grid">
                    <div
                        className="mobile-total-card mobile-total-card-clickable"
                        onClick={() => {
                            const element = document.getElementById('componente-pnrr')
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Click pentru a vedea componentele PNRR"
                    >
                        <div className="mobile-total-value">{formatMoneyWithCurrency(calculatedTotals.totalValue)}</div>
                        <div className="mobile-total-label">{endpoint === 'payments' ?  "TOTAL ALOCAT" : "TOTAL PLĂTIT" }</div>
                        {activeProgram && (
                            <div className="mobile-total-sublabel">{COMPONENT_MAPPING[activeProgram]?.label}</div>
                        )}
                    </div>
                    <div className="mobile-total-card">
                        <div className="mobile-total-value">{fmtNum(calculatedTotals.totalProjects)}</div>
                        <div className="mobile-total-label">{endpoint === 'payments' ? 'NUMĂR TRANZACȚII' : 'NUMĂR PROIECTE'}</div>
                        {activeProgram && (
                            <div className="mobile-total-sublabel">{COMPONENT_MAPPING[activeProgram]?.label}</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Map */}
            <section className="map-container">
                <div className="map-chart">
                    {mapOptions && (
                        <HighchartsReact
                            highcharts={Highcharts}
                            constructorType={'mapChart'}
                            options={mapOptions}
                        />
                    )}
                </div>

                {/* Desktop Map Totals Overlay */}
                <div className="map-totals-overlay">
                    <div
                        className="map-total-card map-total-card-clickable"
                        onClick={() => {
                            const element = document.getElementById('componente-pnrr')
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Click pentru a vedea componentele PNRR"
                    >
                        <div className="map-total-value">{formatMoneyWithCurrency(calculatedTotals.totalValue)}</div>
                        <div className="map-total-label">{endpoint === 'payments' ? "TOTAL PLĂTIT" : "TOTAL ALOCAT" }</div>
                        {activeProgram && (
                            <div className="map-total-sublabel">{COMPONENT_MAPPING[activeProgram]?.label}</div>
                        )}
                    </div>
                    <div className="map-total-card">
                        <div className="map-total-value">{fmtNum(calculatedTotals.totalProjects)}</div>
                        <div className="map-total-label">{endpoint === 'payments' ? 'NUMĂR PLĂȚI' : 'NUMĂR PROIECTE'}</div>
                        {activeProgram && (
                            <div className="map-total-sublabel">{COMPONENT_MAPPING[activeProgram]?.label}</div>
                        )}
                    </div>
                </div>
            </section>



            {/* Top Beneficiaries Section - Only show when no component is selected */}
            {!activeProgram && (
                <section className="beneficiaries-section">
                    <h2>Topul beneficiarilor PNRR raportat la plăți</h2>
                    {loadingBeneficiaries ? (
                        <div className="beneficiaries-loading">
                            <div className="loading-spinner-small"></div>
                            <span>Se încarcă topul beneficiarilor...</span>
                        </div>
                    ) : topBeneficiaries && topBeneficiaries.items ? (
                        <div className="beneficiaries-content">
                            <div className="beneficiaries-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Beneficiar</th>
                                            <th>CUI</th>
                                            {/* <th className="num">Nerambursabil</th>
                                        <th className="num">Rambursabil</th> */}
                                            <th className="num">Total ({getCurrencySymbol()})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topBeneficiaries.items.map((beneficiary, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <a
                                                        href={`https://pnrr.fonduri-ue.ro/ords/pnrr/r/dashboard-status-pnrr/detalii-beneficiar?p2_cui=${beneficiary.cui}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="beneficiary-link"
                                                    >
                                                        {`#${index + 1} ` + beneficiary.beneficiar}
                                                    </a>
                                                </td>
                                                <td>{beneficiary.cui}</td>
                                                {/* <td className="num">
                                                {beneficiary.nerambursabil ? fmtMoney(beneficiary.nerambursabil / 4.95) : '-'}
                                            </td>
                                            <td className="num">
                                                {beneficiary.rambursabil ? fmtMoney(beneficiary.rambursabil / 4.95) : '-'}
                                            </td> */}
                                                <td className="num">
                                                    <strong>{formatMoneyWithCurrency(beneficiary.total_euro, beneficiary.total)}</strong>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="beneficiaries-actions">
                                <a
                                    href="https://pnrr.fonduri-ue.ro/public/beneficiari"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                >
                                    Vezi toți beneficiarii
                                </a>
                            </div>
                        </div>
                    ) : null}
                </section>
            )}

            {/* Pie Chart - Full Row (hide when component is selected) */}
            {!activeProgram && (
                <section className="pie-chart-section">
                    <div className="card pie-card">
                        <div className="chart-container">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={pieOptions}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* County Ranking - Full Row */}
            <section className="ranking-section">
                <div className="card rank-card">
                    <h3>Clasament județe – {getSelectionLabel()}</h3>
                    <ol className="rank-list">
                        {rankingData.map((county, index) => {
                            const percentage = maxValue ? Math.max(2, (county.value / maxValue) * 100) : 0
                            // Convert to RON if needed (county.money is in EUR)
                            const valueToDisplay = currency === 'RON' ? county.money * 5 : county.money
                            const displayValue = metric === 'value' ? fmtMoney(valueToDisplay, getCurrencySymbol()) : fmtNum(county.projects)
                            // Special display name for București
                            const displayName = county.code === 'RO-BI' ? 'București și proiecte naționale' : county.name

                            return (
                                <li
                                    key={county.code}
                                    className="rank-item"
                                    onClick={() => onCountyClick(county.code, county.name)}
                                >
                                    <div className="rank-pos">{index + 1}</div>
                                    <div className="rank-name">{displayName}</div>
                                    <div className="rank-bar-wrap">
                                        <div className="rank-bar" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <div className="rank-value">{displayValue}</div>
                                </li>
                            )
                        })}
                    </ol>
                    <div className="rank-actions">
                        <button
                            className="btn ghost"
                            onClick={() => setShowAllRanking(!showAllRanking)}
                        >
                            {showAllRanking ? 'Restrânge' : 'Afișează tot'}
                        </button>
                    </div>
                    <div className="rank-note">
                        Click pe un județ pentru a deschide pagina lui. (Ctrl/⌘-clic pentru un nou tab.)
                    </div>
                </div>
            </section>

            {/* Projects/Payments Table */}
            <section className="projects-payments-section">
                <EnhancedTable
                    data={(() => {
                        // Get all projects/payments from all counties
                        // EXCLUDE RO-MULTI because NAȚIONAL projects are already included in București
                        const allData = []
                        data.forEach(county => {
                            // Skip Multi Județe (RO-MULTI) - NAȚIONAL projects are in București
                            if (county.county?.code === 'RO-MULTI' || county.code === 'RO-MULTI') {
                                return;
                            }
                            
                            if (county.extras?.rows) {
                                county.extras.rows.forEach(item => {
                                    // Create concatenated title from contract number and title
                                    const contractNumber = item[fieldMappings.contractNumber] || ''
                                    const contractTitle = item[fieldMappings.title] || ''
                                    const fullTitle = contractNumber && contractTitle 
                                        ? `${contractNumber} - ${contractTitle}`
                                        : contractNumber || contractTitle || 'N/A'
                                    
                                    // Handle FinancialAmount object for projects
                                    const financialAmount = item[fieldMappings.value]
                                    const valueRON = endpoint === 'projects' && financialAmount && typeof financialAmount === 'object' 
                                        ? financialAmount.ron 
                                        : item[fieldMappings.valueRON] || 0
                                    
                                    const progressValue = item[fieldMappings.progress] !== undefined && item[fieldMappings.progress] !== null && item[fieldMappings.progress] !== '' ? item[fieldMappings.progress] : '-';
                                    
                                    allData.push({
                                        // Add original data for semantic search first
                                        ...item,
                                        // Then override with display values
                                        title: fullTitle,
                                        beneficiary: item[fieldMappings.beneficiary],
                                        fundingSource: item[fieldMappings.fundingSource],
                                        value: getValueField(item),
                                        value_ron: valueRON,
                                        progress: progressValue,
                                        componentCode: item[fieldMappings.componentCode],
                                        measureCode: item[fieldMappings.measureCode],
                                        componentLabel: item[fieldMappings.componentLabel] || '',
                                        locality: item[fieldMappings.locality] || '',
                                        county: county.county?.name || county.name || 'N/A',
                                        startDate: item[fieldMappings.startDate] || ''
                                    })
                                })
                            }
                        })
                        
                        // Filter by active program if selected
                        const filteredData = activeProgram 
                            ? allData.filter(item => item.componentCode === activeProgram)
                            : allData
                        
                        // Filter out zero values
                        return filteredData.filter(item => item.value > 0)
                    })()}
                    columns={[
                        {
                            key: 'title',
                            label: endpoint === 'payments' ? 'Titlu Plată' : 'Titlu Proiect',
                            searchable: true,
                            render: (value) => <div style={{ maxWidth: '350px', wordWrap: 'break-word', fontSize: '12px', lineHeight: '1.3' }}>{value}</div>
                        },
                        {
                            key: 'beneficiary',
                            label: 'Nume Beneficiar',
                            searchable: true,
                            render: (value) => <div style={{ maxWidth: '250px', wordWrap: 'break-word', fontSize: '12px', lineHeight: '1.3' }}>{value}</div>
                        },
                        {
                            key: 'county',
                            label: 'Județ',
                            searchable: true,
                            render: (value) => <div style={{ fontSize: '12px', minWidth: '80px' }}>{value}</div>
                        },
                        {
                            key: 'fundingSource',
                            label: 'Sursă Finanțare',
                            searchable: true,
                            render: (value) => <div style={{ fontSize: '12px', minWidth: '70px' }}>{value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '-'}</div>
                        },
                        {
                            key: 'value',
                            label: `Valoare (${getCurrencySymbol()})`,
                            numeric: true,
                            searchable: false,
                            render: (value, item) => {
                                if (endpoint === 'projects') {
                                    // For projects, use the FinancialAmount object directly
                                    const financialAmount = item[fieldMappings.value]
                                    if (financialAmount && typeof financialAmount === 'object') {
                                        return <div style={{ fontSize: '12px', minWidth: '100px' }}>
                                            {currency === 'RON' 
                                                ? formatMoneyWithCurrency(financialAmount.ron, financialAmount.ron, item.startDate)
                                                : formatMoneyWithCurrency(financialAmount.eur, financialAmount.ron, item.startDate)
                                            }
                                        </div>
                                    }
                                }
                                return <div style={{ fontSize: '12px', minWidth: '100px' }}>
                                    {formatMoneyWithCurrency(value, item.value_ron, item.startDate)}
                                </div>
                            }
                        },
                        {
                            key: 'progress',
                            label: endpoint === 'payments' ? 'Progres Fizic (%)' : 'Stadiu',
                            numeric: false,
                            searchable: false,
                            render: (value) => {
                                if (endpoint === 'payments') {
                                    const displayValue = value !== undefined && value !== null ? `${value}%` : '-'
                                    return <div style={{ 
                                        fontSize: '10px', 
                                        minWidth: '80px', 
                                        textAlign: 'center',
                                        textTransform: 'uppercase',
                                        fontWeight: '500',
                                        whiteSpace: 'nowrap'
                                    }}>{displayValue}</div>
                                }
                                
                                // For projects, handle line break for "(sub X%)" or "(peste X%)"
                                const displayValue = value || '-'
                                const parts = displayValue.match(/^(.*?)(\s*\([^)]+\))$/)
                                
                                if (parts) {
                                    // Has parentheses - split into two lines
                                    return <div style={{ 
                                        fontSize: '10px',
                                        minWidth: '100px', 
                                        textAlign: 'center',
                                        fontWeight: '600',
                                        lineHeight: '1.4',
                                        padding: '2px 4px',
                                        color: '#000'
                                    }}>
                                        <div style={{ 
                                            whiteSpace: 'nowrap',
                                            textTransform: 'uppercase'
                                        }}>{parts[1].trim()}</div>
                                        <div style={{ 
                                            fontSize: '9px',
                                            opacity: 0.7,
                                            textTransform: 'lowercase'
                                        }}>{parts[2].trim()}</div>
                                    </div>
                                } else {
                                    // No parentheses - single line
                                    return <div style={{ 
                                        fontSize: '10px', 
                                        minWidth: '100px', 
                                        textAlign: 'center',
                                        textTransform: 'uppercase',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap',
                                        padding: '2px 4px',
                                        color: '#000'
                                    }}>{displayValue}</div>
                                }
                            }
                        },
                        {
                            key: 'componentCode',
                            label: 'Cod Componentă',
                            searchable: true,
                            render: (value) => <div style={{ fontSize: '12px', minWidth: '50px', textAlign: 'center' }}>{value}</div>
                        },
                        {
                            key: 'measureCode',
                            label: 'Cod Măsură',
                            searchable: true,
                            render: (value) => <div style={{ fontSize: '12px', minWidth: '50px', textAlign: 'center' }}>{value}</div>
                        },
                        {
                            key: 'locality',
                            label: 'Localitate',
                            searchable: true,
                            render: (value) => value ? <div style={{ maxWidth: '100px', wordWrap: 'break-word', fontSize: '12px', lineHeight: '1.3' }}>{value}</div> : <div style={{ fontSize: '12px' }}>-</div>
                        }
                    ].filter(col => {
                        // Ascundem coloanele 'title' și 'progress' doar pentru tabelul de plăți
                        if (endpoint === 'payments') {
                            return col.key !== 'title' && col.key !== 'progress'
                        }
                        return true
                    })}
                    title={endpoint === 'payments' ? 'Plăți PNRR' : 'Proiecte PNRR'}
                    subtitle={
                        (() => {
                            // EXCLUDE RO-MULTI from calculations (NAȚIONAL projects are in București)
                            const dataWithoutMulti = data.filter(county => 
                                county.county?.code !== 'RO-MULTI' && county.code !== 'RO-MULTI'
                            )
                            
                            const totalData = dataWithoutMulti.reduce((sum, county) => sum + (county.extras?.rows?.length || 0), 0)
                            const filteredData = activeProgram 
                                ? dataWithoutMulti.reduce((sum, county) => {
                                    if (county.extras?.rows) {
                                        return sum + county.extras.rows.filter(item => item[fieldMappings.componentCode] === activeProgram).length
                                    }
                                    return sum
                                }, 0)
                                : totalData
                            
                            const totalValue = dataWithoutMulti.reduce((sum, county) => {
                                if (county.extras?.rows) {
                                    return sum + county.extras.rows.reduce((countySum, item) => {
                                        const value = getValueField(item)
                                        return countySum + value
                                    }, 0)
                                }
                                return sum
                            }, 0)
                            
                            // Debug: Log data info
                            console.log('Data summary:', {
                                totalCounties: data.length,
                                totalData,
                                filteredData,
                                totalValue,
                                endpoint,
                                activeProgram
                            })
                            
                            return `${filteredData} ${endpoint === 'payments' ? 'plăți' : 'proiecte'} găsite${activeProgram ? ` (${COMPONENT_MAPPING[activeProgram]?.label})` : ''} • ${formatMoneyWithCurrency(totalValue)} valoare totală`
                        })()
                    }
                    itemsPerPage={20}
                    searchable={true}
                    searchPlaceholder={`Caută ${endpoint === 'payments' ? 'plată' : 'proiect'}, beneficiar, componentă, localitate...`}
                    defaultSortColumn="value"
                    defaultSortDirection="desc"
                    endpoint={endpoint}
                    enableExport={true}
                    exportFileName={`${endpoint === 'payments' ? 'plati' : 'proiecte'}_pnrr_toate`}
                    activeProgram={activeProgram}
                    setActiveProgram={setActiveProgram}
                />
            </section>

            {/* Components Overview */}
            <ComponentsOverview currency={currency} />

            {/* Show loading overlay while county details are being prepared */}
            {isCountyLoading && (
                <div className="loading-overlay">
                    <div className="loading-content">
                        <div className="loading-spinner"></div>
                        <h2>Se încarcă detaliile județului...</h2>
                        <p>Pregătim harta și datele pentru județul selectat</p>
                    </div>
                </div>
            )}

        </main>
    )

    function getSelectionLabel() {
        const componentLabel = activeProgram ? COMPONENT_MAPPING[activeProgram]?.label : null
        const filterSuffix = activeProgram ? ` (filtrat: ${componentLabel})` : ''

        if (viewMode === 'general') return `General${filterSuffix} · ${metric === 'value' ? 'Valoare' : 'Proiecte'}`
        if (viewMode === 'program') {
            const program = PROGRAMS.find(p => p.key === activeProgram)
            return `${program?.label || activeProgram} · ${metric === 'value' ? 'Valoare' : 'Proiecte'}`
        }
        if (viewMode === 'total') return `Total${filterSuffix} · ${metric === 'value' ? 'Valoare' : 'Proiecte'}`
        return `Multi județe${filterSuffix} · ${metric === 'value' ? 'Valoare' : 'Proiecte'}`
    }
}

export default MapView
