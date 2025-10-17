import { useState, useMemo, useEffect } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMap from 'highcharts/modules/map'
import { PROGRAMS, PROGRAM_COLORS, COUNTY_MAP, fmtMoney, fmtNum, COMPONENT_MAPPING_PAYMENTS, COMPONENT_MAPPING_PROJECTS, ro_localities } from '../data/data'
import * as XLSX from 'xlsx'
import { useBucurestiProjects } from '../hooks/useBucurestiProjects'
import { useNationalProjects } from '../hooks/useNationalProjects'

// Enhanced Table Component with sorting, filtering, and pagination
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
  mobileCardType = 'default', // 'default' or 'components'
  formatMoneyWithCurrency = null, // Function for formatting money
  fmtNum = null, // Function for formatting numbers
  enableExport = false, // Enable export to XLSX
  exportFileName = 'export', // File name for export
}) => {
  const [sortColumn, setSortColumn] = useState(defaultSortColumn)
  const [sortDirection, setSortDirection] = useState(defaultSortDirection)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredData, setFilteredData] = useState(data)
  const [filterStadiu, setFilterStadiu] = useState('')
  const [filterLocality, setFilterLocality] = useState('')
  const [filterFundingSource, setFilterFundingSource] = useState('')


  // Get unique values for filters
  const uniqueStadiu = useMemo(() => {
    const values = new Set()
    data.forEach(item => {
      if (item.progress) values.add(item.progress)
    })
    return Array.from(values).sort()
  }, [data])

  const uniqueLocalities = useMemo(() => {
    const values = new Set()
    data.forEach(item => {
      if (item.locality) values.add(item.locality)
    })
    return Array.from(values).sort()
  }, [data])

  const uniqueFundingSources = useMemo(() => {
    const values = new Set()
    data.forEach(item => {
      if (item.fundingSource) values.add(item.fundingSource)
    })
    return Array.from(values).sort()
  }, [data])

  // Filter data based on search term and filters (keep zero values and duplicates)
  useEffect(() => {
    let filtered = data
    
    // NOTE: Removed zero value filtering to show all projects including NATIONAL duplicates
    // and projects with zero values
    
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
    
    // Apply Stadiu filter
    if (filterStadiu) {
      filtered = filtered.filter(item => item.progress === filterStadiu)
    }
    
    // Apply Locality filter
    if (filterLocality) {
      filtered = filtered.filter(item => item.locality === filterLocality)
    }
    
    // Apply Funding Source filter
    if (filterFundingSource) {
      filtered = filtered.filter(item => item.fundingSource === filterFundingSource)
    }
    
    setFilteredData(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [data, searchTerm, filterStadiu, filterLocality, filterFundingSource, columns])

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
    if (mobileCardType === 'components') {
      // Special layout for components table
      return (
        <div key={index} className="mobile-table-card">
          <div className="mobile-table-card-header">
            <div className="mobile-table-card-title">
              {item.component}
            </div>
            <div className="mobile-table-card-value">
              {item.isMultiCounty ? 'National' : item.componentCode}
            </div>
          </div>
          
          <div className="mobile-table-card-grid">
            {/* Row 1: Valoare - Full width */}
            <div className="mobile-table-card-row full-width">
              <div className="mobile-table-card-detail-label">Valoare (EUR)</div>
              <div className="mobile-table-card-detail-value numeric">
                {formatMoneyWithCurrency ? formatMoneyWithCurrency(item.value) : fmtMoney(item.value)}
              </div>
            </div>
            
            {/* Row 2: Proiecte - Full width */}
            <div className="mobile-table-card-row full-width">
              <div className="mobile-table-card-detail-label">Proiecte</div>
              <div className="mobile-table-card-detail-value numeric">
                {fmtNum ? fmtNum(item.projects) : item.projects}
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    // Default layout for other tables
    const titleColumn = columns[0] // First column is usually the title
    const valueColumn = columns.find(col => col.numeric) // Find numeric column for value
    
    return (
      <div key={index} className="mobile-table-card">
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
        
        <div className="mobile-table-card-grid">
          {/* Row 1: Nume Beneficiar - Full width */}
          <div className="mobile-table-card-row full-width">
            <div className="mobile-table-card-detail-label">Nume Beneficiar</div>
            <div className="mobile-table-card-detail-value long-text">
              {item.beneficiary}
            </div>
          </div>
          
          {/* Row 2: Sursă Finanțare & Stadiu */}
          <div className="mobile-table-card-row">
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Sursă Finanțare</div>
              <div className="mobile-table-card-detail-value">
                {item.fundingSource ? item.fundingSource.charAt(0).toUpperCase() + item.fundingSource.slice(1).toLowerCase() : '-'}
              </div>
            </div>
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Stadiu</div>
              <div className="mobile-table-card-detail-value">{item.stage || '-'}</div>
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
          
          {/* Row 4: Localitate - Full width */}
          <div className="mobile-table-card-row full-width">
            <div className="mobile-table-card-detail-label">Localitate</div>
            <div className="mobile-table-card-detail-value long-text">
              {item.locality || '-'}
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
        <div style={{ marginBottom: '16px' }}>
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
              fontSize: '14px',
              marginBottom: '12px'
            }}
          />
          
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Stadiu Filter */}
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#64748b' }}>
                Stadiu
              </label>
              <select
                value={filterStadiu}
                onChange={(e) => setFilterStadiu(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">Toate stadiile</option>
                {uniqueStadiu.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            
            {/* Locality Filter */}
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#64748b' }}>
                Localitate
              </label>
              <select
                value={filterLocality}
                onChange={(e) => setFilterLocality(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">Toate localitățile</option>
                {uniqueLocalities.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            
            {/* Funding Source Filter */}
            <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#64748b' }}>
                Sursă Finanțare
              </label>
              <select
                value={filterFundingSource}
                onChange={(e) => setFilterFundingSource(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">Toate sursele</option>
                {uniqueFundingSources.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            
            {/* Clear Filters Button */}
            {(filterStadiu || filterLocality || filterFundingSource) && (
              <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => {
                    setFilterStadiu('')
                    setFilterLocality('')
                    setFilterFundingSource('')
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ✕ Șterge filtre
                </button>
              </div>
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

const CountyDetails = ({ county, data, onBackToMap, onLoadingComplete, isParentLoading, useRealData, activeProgram, setActiveProgram, endpoint, currency, setCurrency }) => {
  const [metric, setMetric] = useState('value')
  const [countyMapData, setCountyMapData] = useState(null)
  const [romaniaMapData, setRomaniaMapData] = useState(null)
  const [localityData, setLocalityData] = useState([])
  const [selectedLocality, setSelectedLocality] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingLocality, setIsProcessingLocality] = useState(false)
  const [isLoadingLocalityData, setIsLoadingLocalityData] = useState(true)

  // Detect if this is București or National
  const isBucuresti = county.county?.code === 'RO-BI' || county.code === 'RO-BI';
  const isNational = county.county?.code === 'NATIONAL' || county.code === 'NATIONAL';
  
  // Use custom hook for București to get București projects (exclude NAȚIONAL)
  const { projects: bucurestiProjects, loading: bucLoading, error: bucError } = isBucuresti && endpoint === 'projects' 
    ? useBucurestiProjects() 
    : { projects: [], loading: false, error: null };
  
  // Use custom hook for National to get NAȚIONAL projects
  const { projects: nationalProjects, loading: natLoading, error: natError } = isNational && endpoint === 'projects' 
    ? useNationalProjects() 
    : { projects: [], loading: false, error: null };
  
  // Select the correct projects based on county type
  const apiProjects = isNational ? nationalProjects : bucurestiProjects;
  const apiLoading = isNational ? natLoading : bucLoading;
  const apiError = isNational ? natError : bucError;
  
  // Debug: Log National projects info
  if (isNational && apiProjects.length > 0) {
    const totalValue = apiProjects.reduce((sum, p) => sum + (parseFloat(p.VALOARE_FE) || 0), 0);
    console.log(`🔍 NATIONAL DEBUG: ${apiProjects.length} proiecte, Valoare totală: ${totalValue.toFixed(2)} EUR`);
  }

  // Get the correct component mapping based on endpoint
  const COMPONENT_MAPPING = endpoint === 'projects' ? COMPONENT_MAPPING_PROJECTS : COMPONENT_MAPPING_PAYMENTS
  
  // Get field mappings based on endpoint
  const getFieldMappings = () => {
    if (endpoint === 'projects') {
      return {
        beneficiary: 'DENUMIRE_BENEFICIAR',
        value: 'VALOARE_FE', // EUR amount
        valueRON: 'VALOARE_TOTAL', // RON amount
        progress: 'STADIU',
        componentCode: 'COD_COMPONENTA',
        componentLabel: 'COMPONENTA_LABEL',
        measureCode: 'COD_MASURA',
        locality: 'LOCALITATE_IMPLEMENTARE',
        title: 'TITLU_CONTRACT',
        contractNumber: 'NR_CONTRACT',
        fundingSource: 'SURSA_FINANTARE'
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
  const convertCurrency = (amountInEUR, originalRON = null) => {
    if (currency === 'RON' && originalRON !== null) {
      return originalRON
    }
    return amountInEUR
  }
  
  // Get the correct value field based on currency selection
  const getValueField = (project) => {
    if (currency === 'RON') {
      return project[fieldMappings.valueRON] || 0
    } else {
      return project[fieldMappings.value] || 0
    }
  }
  
  const getCurrencySymbol = () => {
    return currency === 'RON' ? 'RON' : 'EUR'
  }
  
  const formatMoneyWithCurrency = (amount, originalRON = null) => {
    const convertedAmount = convertCurrency(amount, originalRON)
    return fmtMoney(convertedAmount).replace('EUR', getCurrencySymbol())
  }

  if (!county) return null

  const countyCode = county.county.code.replace('RO-', '')
  const countyData = county

  // Load Romania map for NATIONAL
  useEffect(() => {
    if (!isNational) return
    
    const loadRomaniaMap = async () => {
      try {
        const response = await fetch('https://code.highcharts.com/mapdata/countries/ro/ro-all.topo.json')
        if (response.ok) {
          const topology = await response.json()
          setRomaniaMapData(topology)
        }
      } catch (error) {
        console.warn('Error loading Romania map:', error)
      }
    }
    
    loadRomaniaMap()
  }, [isNational])

  // Load county map data by filtering Romania topology
  useEffect(() => {
    // Skip map loading for NATIONAL (no county geometry)
    if (isNational) {
      setCountyMapData(null)
      setIsLoading(false)
      if (onLoadingComplete && isParentLoading) {
        onLoadingComplete()
      }
      return
    }
    
    const loadCountyMap = async () => {
      try {
        // Load full Romania topology and filter for the specific county
        const response = await fetch('https://code.highcharts.com/mapdata/countries/ro/ro-all.topo.json')
        if (!response.ok) {
          console.warn('Could not load Romania map data')
          setCountyMapData(null)
          return
        }
        
        const topology = await response.json()
        const allFeatures = Highcharts.geojson(topology)
        
        // Filter for the specific county
        const isBucharest = (countyCode === 'BI')
        const isoTarget = `RO-${countyCode}`
        const postalSet = new Set(isBucharest ? ['B', 'BU', 'BI'] : [countyCode])
        const hcKeySet = new Set([`ro-${countyCode.toLowerCase()}`])
        if (isBucharest) hcKeySet.add('ro-b')
        
        const norm = (s) => (s || '')
          .toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/ș|ş/g, 's').replace(/ț|ţ/g, 't')
          .toLowerCase().trim()
        
        const nameSet = new Set([
          norm(county.county.name),
          norm(`Judetul ${county.county.name}`),
          norm(`Județul ${county.county.name}`),
          ...(isBucharest ? [norm('Bucuresti'), norm('Municipiul Bucuresti'), norm('Municipiul București')] : [])
        ])
        
        const countyFeatures = allFeatures.filter(f => {
          const p = f.properties || {}
          const name = norm(p.name || p.NAME || '')
          const hcKey = (p['hc-key'] || p.hcKey || '').toLowerCase()
          const postal = (p['postal-code'] || p.postal || p['postal_code'] || '').toUpperCase()
          const iso = (p['iso_3166_2'] || p['iso-3166-2'] || p.iso3166_2 || '').toUpperCase()
          const id = (p.id || '').toUpperCase()
          const hasc = (p.hasc || '').toUpperCase()
          
          if (iso === isoTarget) return true
          if (id === isoTarget || id === isoTarget.replace('-', '.')) return true
          if (postal && postalSet.has(postal)) return true
          if (hcKey && hcKeySet.has(hcKey)) return true
          if (hasc && (hasc === `RO.${countyCode}` || (isBucharest && (hasc === 'RO.B' || hasc === 'RO.BU')))) return true
          if (name && nameSet.has(name)) return true
          return false
        })
        
        if (countyFeatures.length > 0) {
          const countyGeometry = { type: 'FeatureCollection', features: countyFeatures }
          setCountyMapData({ topology: countyGeometry, geojson: countyFeatures })
        } else {
          console.warn(`No geometry found for county ${countyCode}`)
          setCountyMapData(null)
        }
      } catch (error) {
        console.warn('Error loading county map:', error)
        setCountyMapData(null)
      }
    }
    loadCountyMap()
  }, [countyCode, county.county.name])

  // Reset loading state when county changes
  useEffect(() => {
    setIsLoading(true)
    setIsLoadingLocalityData(true)
  }, [countyCode])

  // Manage loading state - set to false when map data is ready (don't wait for locality data)
  useEffect(() => {
    // For NATIONAL, skip map loading and set loading to false immediately
    if (isNational) {
      setIsLoading(false)
      if (onLoadingComplete && isParentLoading) {
        onLoadingComplete()
      }
      return
    }
    
    // Set loading to false when map data is loaded
    if (countyMapData !== null) {
      setIsLoading(false)
      // Notify parent component that loading is complete (only if parent is handling loading)
      if (onLoadingComplete && isParentLoading) {
        onLoadingComplete()
      }
    }
  }, [countyMapData, isParentLoading, onLoadingComplete, isNational])

  // Load and process locality data - only after main loading is complete
  useEffect(() => {
    // Only start locality processing after main loading is complete
    if (isLoading) return
    
    const loadLocalityData = async () => {
      try {
        // Filter localities for this county
        const countyCities = ro_localities.filter(city => 
          (city.county || '').toUpperCase() === countyCode
        )
        
        // Build city index with aliases for matching
        const cityIndex = countyCities.map(city => {
          const base = city.name || ''
          const aliasSet = new Set([
            base, 
            ...(city.aliases || []),
            `Municipiul ${base}`, 
            `Orașul ${base}`, 
            `Orasul ${base}`,
            `Comuna ${base}`, 
            `Satul ${base}`,
            base.replace(/-/g, ' '), 
            base.replace(/ /g, '-')
          ].map(alias => norm(alias)))
          
          return {
            name: city.name,
            lat: +city.lat,
            lon: +city.lon,
            aliases: Array.from(aliasSet)
          }
        })
        
        // Count localities from project scopes
        const localityCounts = countLocalitiesFromScope(cityIndex)
        setLocalityData(localityCounts)
        
        // Mark locality data loading as complete
        setIsLoadingLocalityData(false)
        
      } catch (error) {
        console.warn('Error loading locality data:', error)
        setLocalityData([])
        setIsLoadingLocalityData(false)
      }
    }
    
    loadLocalityData()
  }, [countyCode, countyData, activeProgram, isLoading])

  // Helper function to normalize text (same as old project)
  const norm = (s) => (s || '')
    .toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ș|ş/g, 's').replace(/ț|ţ/g, 't')
    .toLowerCase().trim()

  // Helper function to escape regex
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Count projects & sum values per locality (restored with real coordinates)
  const countLocalitiesFromScope = (cityIndex) => {
    const counts = new Map()
    const projectRows = activeProgram 
      ? (countyData.extras?.rows || []).filter(project => project[fieldMappings.componentCode] === activeProgram)
      : (countyData.extras?.rows || [])
    for (const row of projectRows) {
      // Use the getProjectLocality function to get the locality
      const locality = getProjectLocality(row)
      if (!locality) {
        continue
      }

      // Find which cities match this locality
      const matched = []
      for (const city of cityIndex) {
        let hit = false
        for (const alias of city.aliases) {
          if (!alias) continue
          const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias)}([^a-z0-9]|$)`, 'i')
          if (re.test(norm(locality))) {
            hit = true
            break
          }
        }
        if (hit) matched.push(city)
      }
      
      if (!matched.length) continue

      const rowShareValue = Number(row?.__share_value || 0) || 0
      const perCityValue = matched.length ? (rowShareValue / matched.length) : 0

      for (const city of matched) {
        const prev = counts.get(city.name) || { city, count: 0, money: 0 }
        prev.count += 1
        prev.money += perCityValue
        counts.set(city.name, prev)
      }
    }
    
    // Sort by count desc, then money desc, then name
    return Array.from(counts.values()).sort((a, b) =>
      (b.count - a.count) || (b.money - a.money) || a.city.name.localeCompare(b.city.name)
    )
  }

  // Calculate multi-county data for this county
  const multiData = data.find(d => d.code === 'RO-MULTI')
  const multiAgg = multiData?.extras?.multi_agg_by_county || {}
  const multiShare = useMemo(() => {
    const baseShare = multiAgg[countyCode] || { value: 0, projects: 0 }
    
    // If we have individual project data, calculate with correct currency
    if (multiData?.extras?.rows) {
      const countyMultiProjects = multiData.extras.rows.filter(project => 
        project.JUDET_IMPLEMENTARE === countyData.name || 
        project.LOCALITATE_IMPLEMENTARE?.includes(countyData.name)
      )
      
      const multiValue = countyMultiProjects.reduce((sum, project) => 
        sum + getValueField(project), 0
      )
      
      return {
        value: multiValue,
        projects: countyMultiProjects.length
      }
    }
    
    return baseShare
  }, [multiAgg, countyCode, multiData, countyData.name, getValueField])

  // Calculate rankings
  const allCounties = data.filter(d => (d.county?.code || d.code) !== 'RO-MULTI')
  const valueRanking = allCounties
    .map(c => ({ 
      code: c.county?.code || c.code, 
      name: c.county?.name || c.name, 
      value: c.total.value 
    }))
    .sort((a, b) => b.value - a.value)
  const projectsRanking = allCounties
    .map(c => ({ 
      code: c.county?.code || c.code, 
      name: c.county?.name || c.name, 
      projects: c.total.projects 
    }))
    .sort((a, b) => b.projects - a.projects)

  const valueRank = valueRanking.findIndex(c => c.code === county.county.code) + 1
  const projectsRank = projectsRanking.findIndex(c => c.code === county.county.code) + 1

  // Projects table data with component filtering
  // For București or National, use API data directly
  const allProjectsData = ((isBucuresti || isNational) && endpoint === 'projects' && apiProjects.length > 0) 
    ? apiProjects 
    : (countyData.extras?.rows || []);
  
  // DEBUG: Count NATIONAL projects
  const nationalCount = allProjectsData.filter(p => {
    const judet = (p.judet_implementare || p[fieldMappings.locality] || '').toUpperCase();
    const locality = (p.localitate_implementare || p[fieldMappings.locality] || '').toUpperCase();
    return judet === 'NAȚIONAL' || locality === 'NATIONAL';
  }).length;
  console.log(`🔍 DEBUG CountyDetails v3: Total projects: ${allProjectsData.length}`);
  console.log(`🔍 DEBUG CountyDetails v3: NATIONAL projects: ${nationalCount}`);
  console.log(`🔍 DEBUG CountyDetails v3: Using API data: ${isBucuresti && endpoint === 'projects' && apiProjects.length > 0}`);
  
  const projectsData = activeProgram 
    ? allProjectsData.filter(project => {
        const componentCode = project.cod_componenta || project[fieldMappings.componentCode];
        return componentCode === activeProgram;
      })
    : allProjectsData

  // Calculate PNRR value (sum of all programs)
  // For NAȚIONAL and București, calculate from projectsData to respect currency selection
  const pnrrValue = (isNational || isBucuresti)
    ? projectsData.reduce((sum, project) => sum + getValueField(project), 0)
    : Object.values(countyData.programs).reduce((sum, prog) => sum + (prog.value || 0), 0)

  // Component chart data
  const programChartData = useMemo(() => {
    if (activeProgram) {
      // When filtering by component, show only that component's data
      const componentProjects = projectsData
      const componentValue = componentProjects.reduce((sum, project) => 
        sum + getValueField(project), 0
      )
      
      return [{
        name: COMPONENT_MAPPING[activeProgram]?.label || activeProgram,
        y: metric === 'value' ? componentValue : componentProjects.length,
        color: COMPONENT_MAPPING[activeProgram]?.color || '#0ea5e9'
      }]
    }
    
    return Object.entries(COMPONENT_MAPPING)
      .map(([componentCode, componentInfo]) => {
        // Find all projects for this component
        const componentProjects = projectsData.filter(project => 
          project[fieldMappings.componentCode] === componentCode
        )
        
        const componentValue = componentProjects.reduce((sum, project) => 
          sum + getValueField(project), 0
        )
        
        return {
          name: componentInfo.label,
          y: metric === 'value' ? componentValue : componentProjects.length,
          color: PROGRAM_COLORS[componentCode]
        }
      })
      .filter(item => item.y > 0)
      .sort((a, b) => b.y - a.y)
  }, [projectsData, metric, activeProgram, fieldMappings, COMPONENT_MAPPING, currency, getValueField])

  // Ranking chart data (top 10 counties with current county highlighted)
  const rankingChartData = useMemo(() => {
    const ranking = metric === 'value' ? valueRanking : projectsRanking
    let top10 = ranking.slice(0, 10)
    
    // If current county is not in top 10, replace the 10th with current county
    if (!top10.some(c => c.code === county.county.code)) {
      const currentCounty = ranking.find(c => c.code === county.county.code)
      if (currentCounty) {
        top10[9] = currentCounty
      }
    }

    return top10.map(c => {
      // Simple display name - no special case for București
      return {
        name: `${c.code.replace('RO-', '')} · ${c.name}`,
        y: metric === 'value' ? c.value : c.projects,
        color: c.code === county.county.code ? '#0ea5e9' : '#cbd5e1'
      }
    })
  }, [county.county.code, valueRanking, projectsRanking, metric])

  // Component pie chart options
  const componentPieOptions = {
    chart: { type: 'pie' },
    title: { 
      text: activeProgram 
        ? `${COMPONENT_MAPPING[activeProgram]?.label} – ${metric === 'value' ? 'Valoare (EUR)' : 'Proiecte'}`
        : `Distribuție pe componente – ${metric === 'value' ? 'Valoare (EUR)' : 'Proiecte'}`
    },
    tooltip: {
      useHTML: true,
      pointFormatter: function() {
        const val = metric === 'value' ? formatMoneyWithCurrency(this.y) : fmtNum(this.y)
        return `<span style="color:${this.color}">●</span> ${this.name}: <b>${val}</b>`
      }
    },
    plotOptions: {
      pie: {
        innerSize: '55%',
        dataLabels: {
          enabled: true,
          formatter: function() {
            return this.percentage ? Highcharts.numberFormat(this.percentage, 1) + '%' : null
          }
        }
      }
    },
    series: [{ name: 'Componente', data: programChartData }],
    credits: { enabled: false }
  }

  // Ranking bar chart options
  const rankingBarOptions = {
    chart: { type: 'bar' },
    title: { text: `Clasament județe – ${metric === 'value' ? 'Valoare (EUR)' : 'Proiecte'}` },
    xAxis: { 
      categories: rankingChartData.map(item => item.name),
      title: { text: null }
    },
    yAxis: { 
      title: { text: null },
      labels: {
        formatter: function() {
          return metric === 'value' ? formatMoneyWithCurrency(this.value) : fmtNum(this.value)
        }
      }
    },
    tooltip: {
      useHTML: true,
      formatter: function() {
        return metric === 'value' ? `<b>${formatMoneyWithCurrency(this.point.y)}</b>` : `<b>${fmtNum(this.point.y)}</b>`
      }
    },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: true,
          formatter: function() {
            return metric === 'value' ? formatMoneyWithCurrency(this.y) : fmtNum(this.y)
          }
        }
      }
    },
    series: [{ 
      name: metric === 'value' ? 'Valoare' : 'Proiecte',
      data: rankingChartData 
    }],
    legend: { enabled: false },
    credits: { enabled: false }
  }

  // County map configuration
  const countyMapOptions = useMemo(() => {
    if (!countyMapData) return null

    // Use real locality data with actual coordinates and investment counts
    const localityPins = localityData.filter(hit => hit.count > 0)

    return {
      chart: {
        map: countyMapData.topology,
        height: 460,
        spacing: [0, 0, 0, 0],
        backgroundColor: 'transparent'
      },
      title: {
        text: `Harta județului ${county.county.name}`,
        style: {
          fontSize: '16px',
          fontWeight: 600
        }
      },
      subtitle: {
        text: localityPins.length > 0 
          ? `${localityPins.length} localități cu investiții identificate din proiectele din acest județ${activeProgram ? ` (${COMPONENT_MAPPING[activeProgram]?.label})` : ''}`
          : `Nu au fost identificate localități cu investiții în proiectele din acest județ${activeProgram ? ` (${COMPONENT_MAPPING[activeProgram]?.label})` : ''}`
      },
      mapNavigation: {
        enabled: true,
        enableDoubleClickZoomTo: true,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
      },
      tooltip: {
        enabled: true
      },
      legend: {
        enabled: false
      },
      series: [
        {
          name: county.county.name,
          data: countyMapData.geojson,
          color: '#0ea5e9',
          borderColor: '#334155',
          borderWidth: 1.1,
          enableMouseTracking: false
        },
        {
          type: 'mappoint',
          name: 'Localități',
          data: localityPins.map(hit => ({
            name: hit.city.name,
            lat: hit.city.lat || 0,
            lon: hit.city.lon || 0,
            count: hit.count,
            money: hit.money
          })),
          marker: {
            radius: 5,
            fillColor: '#ef4444',
            lineColor: '#fff',
            lineWidth: 1,
            states: {
              select: {
                fillColor: '#dc2626',
                lineColor: '#fff',
                lineWidth: 2,
                radius: 7
              }
            }
          },
          dataLabels: {
            enabled: true,
            formatter: function() {
              return this.point.name.split(' - ')[1] || this.point.name
            },
            allowOverlap: false,
            crop: true,
            style: {
              fontSize: '10px',
              textOutline: 'none'
            }
          },
          tooltip: {
            useHTML: true,
            pointFormatter: function() {
              return `
                <b>${this.name}</b><br/>
                Proiecte: <b>${fmtNum(this.count)}</b><br/>
                Valoare: <b>${formatMoneyWithCurrency(this.money)}</b><br/>
                <div style="margin-top: 8px;">
                  <button onclick="window.handleLocalityClick('${this.name}')" 
                          style="padding: 4px 8px; background: #ef4444; color: #fff; border: 0; border-radius: 6px; font-size: 12px; cursor: pointer;">
                    Filtrează proiecte
                  </button>
                </div>
              `
            }
          },
          point: {
            events: {
              click: function() {
                window.handleLocalityClick(this.name)
                // Select this point to show visual feedback
                this.select()
              }
            }
          },
          states: {
            hover: {
              halo: {
                size: 8
              }
            }
          }
        }
      ],
      credits: {
        enabled: false
      }
    }
  }, [countyMapData, county.county.name, countyCode, metric, localityData, activeProgram])

  // Handle locality click to filter projects
  const handleLocalityClick = (localityName) => {
    if (selectedLocality === localityName) {
      // Clear selection
      setSelectedLocality(null)
      // Clear all point selections on the map
      if (window.Highcharts && window.Highcharts.charts) {
        window.Highcharts.charts.forEach(chart => {
          if (chart && chart.series) {
            chart.series.forEach(series => {
              if (series.type === 'mappoint') {
                series.points.forEach(point => point.select(false))
              }
            })
          }
        })
      }
    } else {
      // Show loading state while processing
      setIsProcessingLocality(true)
      
      // Use setTimeout to allow the UI to update before processing
      setTimeout(() => {
        setSelectedLocality(localityName)
        // Hide loading state after a short delay to ensure processing is complete
        setTimeout(() => {
          setIsProcessingLocality(false)
        }, 100)
      }, 50)
    }
  }

  // Expose function to global scope for Highcharts callbacks
  useEffect(() => {
    window.handleLocalityClick = handleLocalityClick
    return () => {
      delete window.handleLocalityClick
    }
  }, [handleLocalityClick])

  // Get locality from project data
  const getProjectLocality = (project) => {
    // Use the correct field mapping based on endpoint
    const localityField = fieldMappings.locality
    
    // First try the locality field (from real data)
    if (project[localityField]) {
      return project[localityField]
    }
    
    // Fallback: try to extract from scope for mock data
    if (project.SCOP_PROIECT) {
      const patterns = [
        /în\s+([A-Za-zăâîșțĂÂÎȘȚ\s-]+?)(?:\s|$|,|\.|și|pentru|din)/i,
        /pentru\s+([A-Za-zăâîșțĂÂÎȘȚ\s-]+?)(?:\s|$|,|\.|și|în|din)/i,
        /din\s+([A-Za-zăâîșțĂÂÎȘȚ\s-]+?)(?:\s|$|,|\.|și|pentru|în)/i,
        /municipiul\s+([A-Za-zăâîșțĂÂÎȘȚ\s-]+?)(?:\s|$|,|\.|și|pentru|în|din)/i,
        /orașul\s+([A-Za-zăâîșțĂÂÎȘȚ\s-]+?)(?:\s|$|,|\.|și|pentru|în|din)/i,
        /comuna\s+([A-Za-zăâîșțĂÂÎȘȚ\s-]+?)(?:\s|$|,|\.|și|pentru|în|din)/i
      ]
      
      for (const pattern of patterns) {
        const match = project.SCOP_PROIECT.match(pattern)
        if (match && match[1]) {
          return match[1].trim()
        }
      }
      
      // If no pattern matches, return the first few words as a fallback
      const words = project.SCOP_PROIECT.split(/\s+/).slice(0, 3)
      return words.join(' ')
    }
    
    return ''
  }

  // Filter projects by selected locality
  const filteredProjectsData = useMemo(() => {
    if (!selectedLocality) return projectsData
    
    return projectsData.filter(project => {
      const projectLocality = getProjectLocality(project).toLowerCase()
      const selectedLocalityLower = selectedLocality.toLowerCase()
      
      // Direct match
      if (projectLocality.includes(selectedLocalityLower)) {
        return true
      }
      
      // Match with diacritics removed
      const normalizedProjectLocality = projectLocality.replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i').replace(/ș/g, 's').replace(/ț/g, 't')
      const normalizedSelectedLocality = selectedLocalityLower.replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i').replace(/ș/g, 's').replace(/ț/g, 't')
      
      return normalizedProjectLocality.includes(normalizedSelectedLocality)
    })
  }, [projectsData, selectedLocality])

  // Show loading screen while data is being prepared (only if parent is not handling loading)
  if (isLoading && !isParentLoading) {
    return (
      <main className="page page--county">
        <header className="page-header">
          <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); onBackToMap() }}>
            ← Înapoi la hartă națională
          </a>
          <h1>{county.county.name} ({countyCode})</h1>
          <div className="sub">
            Tablou de bord PNRR • distribuție pe programe • Set date: <strong>{useRealData ? 'Date reale PNRR (baza completă)' : 'Date demonstrative'}</strong>
          </div>
        </header>

        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h3>Se încarcă detaliile județului...</h3>
            <p>Pregătim harta și datele pentru {county.county.name}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page page--county">
      <header className="page-header">
        <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); onBackToMap() }}>
          ← Înapoi la hartă națională
        </a>
        <h1>{county.county.name} ({countyCode})</h1>
        <div className="sub">
          Tablou de bord PNRR • distribuție pe programe <strong></strong>
        </div>
      </header>

      {/* <div className="controls controls--county">
        <div className="segment">
          <button 
            className={metric === 'value' ? 'active' : ''}
            onClick={() => setMetric('value')}
          >
            Valoare
          </button>
          <button 
            className={metric === 'projects' ? 'active' : ''}
            onClick={() => setMetric('projects')}
          >
            Proiecte
          </button>
        </div>
      </div> */}

      <div className="county-content">
        {/* Locality Data Loading Overlay */}
        {isLoadingLocalityData && (
          <div className="locality-loading-overlay">
            <div className="locality-loading-content">
              <div className="loading-spinner-small"></div>
              <span>Se procesează datele pentru localități...</span>
            </div>
          </div>
        )}

        {/* KPIs with Currency Selector */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '20px', marginBottom: '30px', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Currency Selector - for NAȚIONAL and București */}
          {(isNational || isBucuresti) && (
            <div style={{ 
              flex: '0 0 auto',
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Monedă</div>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0f172a',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#0ea5e9'}
                onMouseOut={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="EUR">EUR</option>
                <option value="RON">RON</option>
              </select>
            </div>
          )}

          {/* KPIs */}
          <div style={{ flex: '1', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div className="kpi">
            <div className="label">
              Total proiecte {activeProgram ? `(${COMPONENT_MAPPING[activeProgram]?.label})` : '(toate programele)'}
            </div>
            <div className="value">{fmtNum(projectsData.length)}</div>
            {!isNational && <div className="subline">National: {fmtNum(multiShare.projects)} proiecte</div>}
          </div>
          <div className="kpi">
            <div className="label">Total PNRR</div>
            <div className="value">
              {formatMoneyWithCurrency(pnrrValue)}
            </div>
            {!isNational && (
              <div className="subline">
                Clasament valoare: #{valueRank} • Clasament proiecte: #{projectsRank}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* County Map */}
        <section className="county-map-section">
          <div className="card county-map-card">
          {countyMapData && countyMapOptions ? (
            isLoadingLocalityData ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div className="loading-spinner-small" style={{ margin: '0 auto 16px auto' }}></div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Se încarcă harta județului {county.county.name}</h3>
                <p style={{ margin: 0 }}>Se procesează datele pentru localități...</p>
              </div>
            ) : (
              <HighchartsReact
                highcharts={Highcharts}
                constructorType={'mapChart'}
                options={countyMapOptions}
              />
            )
          ) : isNational && romaniaMapData ? (
            <HighchartsReact
              highcharts={Highcharts}
              constructorType={'mapChart'}
              options={{
                chart: {
                  map: romaniaMapData,
                  height: 400
                },
                title: {
                  text: 'Proiecte Naționale',
                  style: { fontSize: '16px', fontWeight: 600 }
                },
                subtitle: {
                  text: 'Proiecte cu impact la nivel național'
                },
                mapNavigation: { enabled: false },
                colorAxis: {
                  min: 0,
                  max: 1,
                  stops: [[0, '#e0e7ff'], [1, '#e0e7ff']]
                },
                series: [{
                  name: 'România',
                  borderColor: '#94a3b8',
                  borderWidth: 1,
                  nullColor: '#e0e7ff',
                  showInLegend: false
                }],
                credits: { enabled: false }
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Harta județului {county.county.name}</h3>
              <p style={{ margin: 0 }}>Harta detaliată nu este disponibilă pentru acest județ</p>
            </div>
          )}
          </div>
        </section>

        {/* Projects in this County */}
        <EnhancedTable
          data={filteredProjectsData
            .map(project => {
              // Create concatenated title from contract number and title
              const contractNumber = project[fieldMappings.contractNumber] || ''
              const contractTitle = project[fieldMappings.title] || ''
              const fullTitle = contractNumber && contractTitle 
                ? `${contractNumber} - ${contractTitle}`
                : contractNumber || contractTitle || 'N/A'
              
              return {
                title: fullTitle,
                beneficiary: project[fieldMappings.beneficiary],
                fundingSource: project[fieldMappings.fundingSource],
                value: getValueField(project),
                value_ron: project[fieldMappings.valueRON] || 0,
                progress: project[fieldMappings.progress] || 0,
                componentCode: project[fieldMappings.componentCode],
                measureCode: project[fieldMappings.measureCode],
                componentLabel: project[fieldMappings.componentLabel] || '',
                scope: project.SCOP_PROIECT || '',
                locality: getProjectLocality(project),
                // Add original project data for semantic search
                ...project
              }
            })
            // NOTE: Removed filter to show all projects including zero values and duplicates
          }
          columns={[
            {
              key: 'title',
              label: 'Titlu Proiect',
              searchable: true,
              render: (value) => <div style={{ maxWidth: '200px', wordWrap: 'break-word' }}>{value}</div>
            },
            {
              key: 'beneficiary',
              label: 'Nume Beneficiar',
              searchable: true,
              render: (value) => <div style={{ maxWidth: '150px', wordWrap: 'break-word' }}>{value}</div>
            },
            {
              key: 'fundingSource',
              label: 'Sursă Finanțare',
              searchable: true,
              render: (value) => {
                if (!value) return '-';
                // Capitalize first letter: loan -> Loan, grant -> Grant
                return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
              }
            },
            {
              key: 'value',
              label: 'Valoare Plată (EUR)',
              numeric: true,
              searchable: false,
              render: (value, item) => formatMoneyWithCurrency(value, item.value_ron)
            },
            {
              key: 'stage',
              label: 'Stadiu',
              searchable: true,
              render: (value) => value || '-'
            },
            {
              key: 'componentCode',
              label: 'Cod Componentă',
              searchable: true
            },
            {
              key: 'measureCode',
              label: 'Cod Măsură',
              searchable: true
            },
            {
              key: 'locality',
              label: 'Localitate',
              searchable: true,
              render: (value) => value ? <div style={{ maxWidth: '120px', wordWrap: 'break-word' }}>{value}</div> : '-'
            }
          ]}
          title={(isNational || isBucuresti) ? "Investiții" : "Investiții în acest județ"}
          subtitle={
            selectedLocality 
              ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>
                    Filtrat pentru localitatea: <strong>{selectedLocality}</strong>{activeProgram ? ` • Componenta: ${COMPONENT_MAPPING[activeProgram]?.label}` : ''} • {filteredProjectsData.length} proiecte găsite • {formatMoneyWithCurrency(filteredProjectsData.reduce((sum, p) => sum + (p.VALOARE_PLATA_EURO || p.VALOARE_PLATA_FE_EURO || 0), 0))} valoare totală
                  </span>
                  {filteredProjectsData.length > 0 && (
                    <button 
                      onClick={() => handleLocalityClick(selectedLocality)}
                      style={{
                        padding: '4px 8px',
                        background: '#6b7280',
                        color: '#fff',
                        border: '0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Șterge filtru
                    </button>
                  )}
                </div>
              )
              : projectsData.length > 0 ? 
                `${projectsData.length} proiecte găsite${activeProgram ? ` (${COMPONENT_MAPPING[activeProgram]?.label})` : ''} • ${formatMoneyWithCurrency(projectsData.reduce((sum, p) => sum + getValueField(p), 0))} valoare totală` :
                `Nu au fost găsite proiecte pentru acest județ${activeProgram ? ` (${COMPONENT_MAPPING[activeProgram]?.label})` : ''}.`
          }
          itemsPerPage={20}
          searchable={true}
          searchPlaceholder="Caută proiect, beneficiar, componentă, localitate..."
          defaultSortColumn="value"
          defaultSortDirection="desc"
          formatMoneyWithCurrency={formatMoneyWithCurrency}
          fmtNum={fmtNum}
          enableExport={true}
          exportFileName={`proiecte_pnrr_${county.county.name.toLowerCase().replace(/\s+/g, '_')}`}
        />

        {/* Localities Table */}
        {!isLoadingLocalityData && localityData.length > 0 && (
          <section className="localities-section">
            <EnhancedTable
              data={localityData.map(hit => ({
                locality: hit.city.name,
                projects: hit.count,
                value: hit.money
              }))}
              columns={[
                {
                  key: 'locality',
                  label: 'Localitate',
                  render: (value) => <strong style={{ color: '#0ea5e9' }}>{value}</strong>
                },
                {
                  key: 'projects',
                  label: 'Numărul de proiecte în care această localitate este menționată',
                  numeric: true,
                  render: (value) => fmtNum(value)
                },
                {
                  key: 'value',
                  label: 'Valoare estimată (EUR)',
                  numeric: true,
                  render: (value) => formatMoneyWithCurrency(value)
                }
              ]}
              title="Localități sprijinite"
              subtitle={`${localityData.length} localități identificate • ${fmtNum(localityData.reduce((sum, hit) => sum + hit.count, 0))} proiecte (sumă pe localități)`}
              itemsPerPage={15}
              searchable={true}
              searchPlaceholder="Caută localitate..."
              defaultSortColumn="value"
              defaultSortDirection="desc"
              formatMoneyWithCurrency={formatMoneyWithCurrency}
              fmtNum={fmtNum}
            />
          </section>
        )}

        {/* Charts Grid */}
        <div className="grid">
          <div className="card">
            <HighchartsReact
              highcharts={Highcharts}
              options={componentPieOptions}
            />
          </div>
          <div className="card">
            <HighchartsReact
              highcharts={Highcharts}
              options={rankingBarOptions}
            />
          </div>
        </div>

        {/* Components Table */}
        <EnhancedTable
          data={[
            // Aggregate components from project data
            ...Object.entries(COMPONENT_MAPPING)
              .map(([componentCode, componentInfo]) => {
                // Find all projects for this component
                const componentProjects = projectsData.filter(project => 
                  project[fieldMappings.componentCode] === componentCode
                )
                
        const componentValue = componentProjects.reduce((sum, project) => 
          sum + getValueField(project), 0
        )
                
                return {
                  component: componentInfo.label,
                  componentCode: componentCode,
                  value: componentValue,
                  projects: componentProjects.length,
                  isMultiCounty: false
                }
              })
              // NOTE: Keep all rows including zero values
              ,
            // Add National row (only for non-National counties)
            ...(!isNational ? [{
              component: 'National',
              componentCode: 'NATIONAL',
              value: multiShare.value,
              projects: multiShare.projects,
              isMultiCounty: true
            }] : [])
          ]}
          columns={[
            {
              key: 'component',
              label: 'Componentă',
              render: (value, item) => (
                <strong style={{ color: item.isMultiCounty ? '#ef4444' : 'inherit' }}>
                  {value}
                </strong>
              )
            },
            {
              key: 'value',
              label: 'Valoare (EUR)',
              numeric: true,
              render: (value, item) => (
                <strong style={{ color: item.isMultiCounty ? '#ef4444' : 'inherit' }}>
                  {formatMoneyWithCurrency(value)}
                </strong>
              )
            },
            {
              key: 'projects',
              label: 'Proiecte',
              numeric: true,
              render: (value, item) => (
                <strong style={{ color: item.isMultiCounty ? '#ef4444' : 'inherit' }}>
                  {fmtNum(value)}
                </strong>
              )
            }
          ]}
          title="Detaliu pe componente"
          subtitle={`Valorile sunt filtrate pentru județul ${county.county.name} (${countyCode})`}
          itemsPerPage={20}
          searchable={false}
          defaultSortColumn="value"
          defaultSortDirection="desc"
          mobileCardType="components"
          formatMoneyWithCurrency={formatMoneyWithCurrency}
          fmtNum={fmtNum}
        />

        <div className="grid"></div>

      </div>

      {/* Locality Processing Loading Overlay */}
      {isProcessingLocality && (
        <div className="locality-loading-overlay">
          <div className="locality-loading-content">
            <div className="loading-spinner-small"></div>
            <span>Se procesează datele pentru localitate...</span>
          </div>
        </div>
      )}
    </main>
  )
}

export default CountyDetails
