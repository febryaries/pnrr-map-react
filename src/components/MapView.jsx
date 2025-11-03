import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMap from 'highcharts/modules/map'
import HighchartsAccessibility from 'highcharts/modules/accessibility'

// Initialize Highcharts modules
HighchartsMap(Highcharts)
HighchartsAccessibility(Highcharts)

// Suppress Highcharts warning #33 for onclick in tooltip HTML (valid use case)
Highcharts.setOptions({
  lang: {
    // Suppress warning by setting it to empty
  }
})
// Disable warning #33 specifically
if (Highcharts.error) {
  const originalError = Highcharts.error
  Highcharts.error = function(code) {
    if (code !== 33) {
      originalError.apply(this, arguments)
    }
  }
}
import { PROGRAMS, PROGRAM_COLORS, fmtMoney, fmtNum, fmtMoneyShort, COMPONENT_MAPPING_PAYMENTS, COMPONENT_MAPPING_PROJECTS } from '../data/data'
// AVAILABLE_DATA_DATES removed - now passed as prop from App.jsx
import ComponentsOverview from './ComponentsOverview'
import { useTotalIndicators } from '../hooks/useTotalIndicators'
import { convertRONToEUR } from '../services/ExchangeRateService'
import { useCRIData } from '../hooks/useCRIData'
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
  searchTerm = '', // Search term from parent
  setSearchTerm = null, // Function to set search term
  // Filter props
  filterStadiu = '',
  setFilterStadiu = null,
  filterLocality = '',
  setFilterLocality = null,
  filterFundingSource = '',
  setFilterFundingSource = null,
  filterCounty = '',
  setFilterCounty = null,
  filterComponent = '',
  setFilterComponent = null,
  filterMasura = '',
  setFilterMasura = null,
  filterCRI = '',
  setFilterCRI = null,
  filtersRef = null,
  fieldMappings = null,
  getValueField = null,
  formatMoneyWithCurrency = null,
  getCurrencySymbol = null,
  currency = 'EUR',
  onFilteredDataChange = null, // Callback to pass filtered data totals to parent
  // View mode props
  viewMode = 'total',
  setViewMode = null,
  setMetric = null,
  // CRI data props
  criData = [],
  criLoading = false,
  criError = null,
}) => {
  const [sortColumn, setSortColumn] = useState(defaultSortColumn)
  const [sortDirection, setSortDirection] = useState(defaultSortDirection)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)
  const [jumpToPage, setJumpToPage] = useState('')
  const [filteredData, setFilteredData] = useState(data)
  
  // Mobile filters sidebar state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [showMobileButton, setShowMobileButton] = useState(false)
  const [renderMobileButton, setRenderMobileButton] = useState(false)
  
  // Ref for table container to detect scroll position
  const tableContainerRef = useRef(null)
  
  // Scroll detection for mobile button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const rect = tableContainerRef.current.getBoundingClientRect()
        const tableTop = rect.top
        const tableBottom = rect.bottom
        
        // Show button when user is in table area
        // Button appears when table is visible on screen
        const isInTableArea = tableTop < window.innerHeight - 100 && tableBottom > 100
        
        if (isInTableArea && !renderMobileButton) {
          // Start rendering button
          setRenderMobileButton(true)
          // Trigger fade in after a tiny delay to ensure DOM is ready
          setTimeout(() => setShowMobileButton(true), 10)
        } else if (!isInTableArea && renderMobileButton) {
          // Trigger fade out
          setShowMobileButton(false)
          // Remove from DOM after animation completes (400ms)
          setTimeout(() => setRenderMobileButton(false), 400)
        }
        
        console.log('Scroll debug:', { tableTop, tableBottom, isInTableArea, windowHeight: window.innerHeight })
      }
    }
    
    // Add listener for both desktop and mobile (will be hidden on desktop via CSS)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    handleScroll() // Check initial position
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [renderMobileButton])
  
  // Get COMPONENT_MAPPING based on endpoint
  // Memoized to prevent recreation on every render
  const COMPONENT_MAPPING = useMemo(() => {
    return endpoint === 'payments' ? COMPONENT_MAPPING_PAYMENTS : COMPONENT_MAPPING_PROJECTS
  }, [endpoint])
  
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

  // Get unique measure codes (filtered by active filters)
  const uniqueMasuraCodes = useMemo(() => {
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
      
      if (shouldInclude && item.measureCode) {
        values.add(item.measureCode)
      }
    })
    return Array.from(values).sort()
  }, [data, filterCounty, filterLocality, filterComponent])

  // Get unique CRI values from API data (with descriptions)
  const uniqueCRIValues = useMemo(() => {
    if (!criData || criData.length === 0) {
      // Fallback to local data if API data not available
      // Don't filter by other filters to show all available CRIs
      const values = new Set()
      data.forEach(item => {
        if (item[fieldMappings.cri]) {
          values.add(item[fieldMappings.cri])
        }
      })
      // console.log('🔍 MapView: Fallback CRI data:', Array.from(values).sort());
      return Array.from(values).sort()
    }

    // Use ALL API CRI data with descriptions (not filtered by current data)
    // This ensures all available CRI values are shown in the dropdown
    const sortedCRIs = criData
      .sort((a, b) => a.cri.localeCompare(b.cri));
    
    // console.log('🔍 MapView: Processing CRI data:', sortedCRIs.length, 'entries');
    // console.log('🔍 MapView: Sample CRI entries:', sortedCRIs.slice(0, 5));
    // console.log('🔍 MapView: All CRI codes:', sortedCRIs.map(cri => cri.cri));
    // console.log('🔍 MapView: Looking for MEC vs MECTS:', sortedCRIs.filter(cri => cri.cri.includes('MEC')));
    
    return sortedCRIs;
  }, [criData])

  // Filter data based on search term, filters, and remove zero values
  useEffect(() => {
    let filtered = data
    
    // Don't filter out zero values to maintain correct count
    
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
          return String(value).toLowerCase().includes(String(searchTerm || '').toLowerCase())
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
    
    // Apply Masura filter
    if (filterMasura) {
      filtered = filtered.filter(item => item.measureCode === filterMasura)
    }
    
    // Apply CRI filter
    if (filterCRI) {
      filtered = filtered.filter(item => item[fieldMappings.cri] === filterCRI)
    }
    
    setFilteredData(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [data, searchTerm, filterStadiu, filterLocality, filterFundingSource, filterCounty, filterComponent, filterMasura, filterCRI])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    // Find column config to check for sortValue function
    const columnConfig = columns.find(col => col.key === sortColumn)

    return [...filteredData].sort((a, b) => {
      let aVal, bVal
      
      // Use sortValue function if available, otherwise use direct property
      if (columnConfig && columnConfig.sortValue) {
        aVal = columnConfig.sortValue(a)
        bVal = columnConfig.sortValue(b)
      } else {
        aVal = a[sortColumn]
        bVal = b[sortColumn]
      }
      
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
  }, [filteredData, sortColumn, sortDirection, columns])

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize)

  // Debug pagination
  // console.log('🔍 Pagination Debug:', {
  //   sortedDataLength: sortedData.length,
  //   pageSize,
  //   totalPages,
  //   currentPage,
  //   startIndex,
  //   paginatedDataLength: paginatedData.length
  // });

  // Ensure current page is valid when total pages change
  useEffect(() => {
    // Only check when totalPages changes, not when currentPage changes
    // This prevents infinite loop
    setCurrentPage(prev => {
      if (prev > totalPages && totalPages > 0) {
        return totalPages
      }
      return prev
    })
  }, [totalPages])

  // Calculate filtered totals and notify parent
  // Store callbacks in refs to avoid infinite loop
  const onFilteredDataChangeRef = useRef(onFilteredDataChange)
  const getValueFieldRef = useRef(getValueField)
  
  useEffect(() => {
    onFilteredDataChangeRef.current = onFilteredDataChange
    getValueFieldRef.current = getValueField
  }, [onFilteredDataChange, getValueField])
  
  useEffect(() => {
    if (onFilteredDataChangeRef.current && getValueFieldRef.current) {
      const totalValue = filteredData.reduce((sum, item) => {
        const value = getValueFieldRef.current(item)
        return sum + value
      }, 0)
      
      onFilteredDataChangeRef.current({
        count: filteredData.length,
        totalValue: totalValue
      })
    }
  }, [filteredData])

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handlePageChange = (page) => {
    console.log('🔍 Pagination: Changing page from', currentPage, 'to', page, 'of', totalPages);
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newSize) => {
    const newPageSize = parseInt(newSize)
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage)
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setJumpToPage('')
    }
  }

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value
    if (setSearchTerm) {
    setSearchTerm(value)
    }
  }

  // Handle county change - no reset, just update
  const handleCountyChange = (value) => {
    setFilterCounty(value)
    closeMobileSidebar()
    // No scroll - user is already at the filters
  }

  // Handle locality change - no reset, just update
  const handleLocalityChange = (value) => {
    setFilterLocality(value)
    closeMobileSidebar()
    // No scroll - user is already at the filters
  }

  // Sync filterComponent with activeProgram from parent
  useEffect(() => {
    // Only update if different to prevent infinite loop
    setFilterComponent(prev => {
      const newValue = activeProgram || ''
      return prev !== newValue ? newValue : prev
    })
  }, [activeProgram])

  // Helper to close mobile sidebar after filter selection
  const closeMobileSidebar = () => {
    setIsMobileFiltersOpen(false)
  }

  // Handle component change - no reset, just update
  const handleComponentChange = (value) => {
    setFilterComponent(value)
    // DO NOT sync back to parent to prevent infinite loop
    // Parent will sync down to us via useEffect when needed
    // if (setActiveProgram) {
    //   const newValue = value || null
    //   if (activeProgram !== newValue) {
    //     setActiveProgram(newValue)
    //   }
    // }
    // Close mobile sidebar after selection
    closeMobileSidebar()
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

  // Export to JSON function
  const handleExportToJSON = () => {
    // Prepare data for export - use all filtered data, not just paginated
    const exportData = sortedData.map(item => {
      const row = {}
      columns.forEach(column => {
        const value = item[column.key]
        row[column.label] = value
      })
      return row
    })

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(exportData, null, 2)

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    link.download = `${exportFileName}_${timestamp}.json`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export to CSV function
  const handleExportToCSV = () => {
    // Prepare data for export - use all filtered data, not just paginated
    const exportData = sortedData.map(item => {
      const row = {}
      columns.forEach(column => {
        const value = item[column.key]
        row[column.label] = value
      })
      return row
    })

    // Create CSV header
    const headers = columns.map(col => col.label).join(',')

    // Create CSV rows
    const rows = exportData.map(item => {
      return columns.map(col => {
        const value = item[col.label]
        // Escape values that contain commas, quotes, or newlines
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    }).join('\n')

    // Combine header and rows
    const csvContent = `${headers}\n${rows}`

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    link.download = `${exportFileName}_${timestamp}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
          Afișez {startIndex + 1}-{Math.min(startIndex + pageSize, sortedData.length)} din {sortedData.length}
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

        {/* Page size selector and jump to page */}
        <div className="pagination-advanced">
          <div className="pagination-page-size">
            <label htmlFor="page-size-select">Afișează:</label>
            <select 
              id="page-size-select"
              value={pageSize} 
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="pagination-select"
            >
              <option value={5}>5 pe pagină</option>
              <option value={10}>10 pe pagină</option>
              <option value={25}>25 pe pagină</option>
              <option value={50}>50 pe pagină</option>
              <option value={100}>100 pe pagină</option>
            </select>
          </div>
          
          <div className="pagination-jump">
            <label htmlFor="jump-to-page">Sari la pagina:</label>
            <input
              id="jump-to-page"
              type="number"
              min="1"
              max={totalPages}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJumpToPage()}
              className="pagination-input"
              placeholder="Nr. pagină"
            />
            <button 
              onClick={handleJumpToPage}
              className="pagination-jump-btn"
              disabled={!jumpToPage || jumpToPage < 1 || jumpToPage > totalPages}
            >
              Du-te
            </button>
          </div>
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
          
          {/* Row 2: Progres Tehnic/Progres Fizic & Progres Financiar */}
          <div className="mobile-table-card-row">
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">{endpoint === 'payments' ? 'Progres Fizic (%)' : 'Progres Tehnic'}</div>
              <div className="mobile-table-card-detail-value" style={endpoint === 'projects' ? { color: '#059669', fontWeight: '500', fontSize: '10px' } : {}}>
                {endpoint === 'payments' 
                  ? `${item.progress}%` 
                  : (item.PROGRES_FIZIC && item.PROGRES_FIZIC !== '' 
                      ? `${Math.round(parseFloat(String(item.PROGRES_FIZIC).replace(',', '.')) * 100)}%` 
                      : (item.progress || '-')
                    )
                }
              </div>
            </div>
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Progres Financiar</div>
              <div className="mobile-table-card-detail-value" style={{ 
                color: item.PROGRES_FINANCIAR !== null && item.PROGRES_FINANCIAR !== undefined ? '#000' : '#94a3b8', 
                fontStyle: item.PROGRES_FINANCIAR !== null && item.PROGRES_FINANCIAR !== undefined ? 'normal' : 'italic',
                fontWeight: item.PROGRES_FINANCIAR !== null && item.PROGRES_FINANCIAR !== undefined ? '500' : 'normal'
              }}>
                {item.PROGRES_FINANCIAR !== null && item.PROGRES_FINANCIAR !== undefined 
                  ? `${Math.round(item.PROGRES_FINANCIAR * 100)}%` 
                  : '-'}
              </div>
            </div>
          </div>
          
          {/* Row 3: Localitate & Cod Componentă */}
          <div className="mobile-table-card-row">
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Localitate</div>
              <div className="mobile-table-card-detail-value">{item.locality || '-'}</div>
            </div>
            <div className="mobile-table-card-detail">
              <div className="mobile-table-card-detail-label">Cod Componentă</div>
              <div className="mobile-table-card-detail-value">{item.componentCode}</div>
            </div>
          </div>
          
          {/* Row 4: Cod Măsură */}
          <div className="mobile-table-card-row">
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
    <div className="card" ref={tableContainerRef}>
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportToXLSX}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              title="Exportă toate proiectele în format Excel"
            >
              <div style={{
                width: '16px',
                height: '16px',
                background: '#ffffff',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#10b981'
              }}>
                X
              </div>
              XLSX
            </button>
            <button
              onClick={handleExportToJSON}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              title="Exportă toate proiectele în format JSON"
            >
              <div style={{
                width: '16px',
                height: '16px',
                background: '#ffffff',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '4px',
                  height: '4px',
                  background: '#d1d5db',
                  borderRadius: '0 2px 0 0'
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: '3px',
                  top: '6px',
                  width: '8px',
                  height: '1px',
                  background: '#9ca3af'
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: '3px',
                  top: '8px',
                  width: '6px',
                  height: '1px',
                  background: '#9ca3af'
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: '3px',
                  top: '10px',
                  width: '7px',
                  height: '1px',
                  background: '#9ca3af'
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: '3px',
                  top: '12px',
                  width: '5px',
                  height: '1px',
                  background: '#9ca3af'
                }}></div>
              </div>
              JSON
            </button>
            <button
              onClick={handleExportToCSV}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)'
              }}
              title="Exportă toate proiectele în format CSV"
            >
              <div style={{
                width: '16px',
                height: '16px',
                background: '#ffffff',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Document with folded corner */}
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '4px',
                  height: '4px',
                  background: '#d1d5db',
                  borderRadius: '0 2px 0 0'
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: '3px',
                  top: '6px',
                  width: '8px',
                  height: '1px',
                  background: '#9ca3af'
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: '3px',
                  top: '8px',
                  width: '6px',
                  height: '1px',
                  background: '#9ca3af'
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: '3px',
                  top: '10px',
                  width: '7px',
                  height: '1px',
                  background: '#9ca3af'
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: '3px',
                  top: '12px',
                  width: '5px',
                  height: '1px',
                  background: '#9ca3af'
                }}></div>
                {/* Green X overlay in bottom-left */}
                <div style={{
                  position: 'absolute',
                  bottom: '1px',
                  left: '1px',
                  width: '6px',
                  height: '6px',
                  background: '#10b981',
                  borderRadius: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4px',
                  fontWeight: 'bold',
                  color: '#ffffff'
                }}>
                  X
                </div>
              </div>
              CSV
            </button>
          </div>
        )}
      </div>
      
      {searchable && (
        <div style={{ marginBottom: '20px' }}>
          {/* Search bar */}
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              background: '#ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6'
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb'
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)'
            }}
          />
        </div>
      )}

      {/* Mobile Hamburger Button - Only visible on mobile when in table area */}
      {searchable && renderMobileButton && (
        <button
          className="mobile-filters-toggle"
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          style={{
            display: 'none', // Hidden by default, shown via CSS media query
            position: 'fixed',
            top: '50%',
            left: '20px',
            transform: 'translateY(-50%)',
            zIndex: 999,
            padding: '12px 20px',
            background: '#0ea5e9',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            cursor: 'pointer',
            animation: showMobileButton ? 'buttonFadeIn 0.4s ease forwards' : 'buttonFadeOut 0.4s ease forwards',
            pointerEvents: showMobileButton ? 'auto' : 'none'
          }}
        >
          ☰ FILTRE
          {(filterStadiu || filterLocality || filterFundingSource || filterCounty || filterComponent || filterMasura || filterCRI) && (
            <span style={{
              marginLeft: '8px',
              background: '#fff',
              color: '#0ea5e9',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {[filterStadiu, filterLocality, filterFundingSource, filterCounty, filterComponent, filterMasura, filterCRI].filter(Boolean).length}
            </span>
          )}
        </button>
      )}

      {/* Sticky Filters - Hidden on mobile by default, shown when button clicked */}
      {searchable && (
        <div className="table-filters-sticky" ref={filtersRef} data-mobile-visible={isMobileFiltersOpen}>
          <div className="table-filters-sticky-content">
              {/* Visualization Mode Dropdown - Only for projects endpoint */}
              {endpoint !== 'payments' && (
                <div className="filter-item">
                  <label>📊 Vizualizare</label>
                  <select 
                    value={viewMode} 
                    onChange={(e) => {
                      setViewMode(e.target.value);
                      setMetric('value');
                      setActiveProgram(null);
                    }}
                  >
                    <option value="total">Toate Proiectele</option>
                    <option value="national">Proiecte Naționale</option>
                    <option value="local">Proiecte Locale</option>
                  </select>
                </div>
              )}
              
              {/* CRI Filter - Visible in filters but not in table */}
              <div className="filter-item">
                <label>🔬 CRI</label>
                <select value={filterCRI} onChange={(e) => { setFilterCRI(e.target.value); closeMobileSidebar(); }}>
                  <option value="">Toate CRI-urile</option>
                  {uniqueCRIValues.map(cri => {
                    const criCode = typeof cri === 'string' ? cri : cri.cri
                    const criDescription = typeof cri === 'string' ? cri : cri.cri_denumire
                    const displayText = typeof cri === 'string' ? cri : (criDescription || criCode)
                    
                    return (
                      <option key={criCode} value={criCode} title={criCode}>
                        {criCode} {criDescription ? `- ${criDescription}` : ''}
                      </option>
                    )
                  })}
                </select>
                {criLoading && (
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                    Se încarcă CRI-urile...
                  </div>
                )}
                {criError && (
                  <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>
                    Eroare la încărcarea CRI-urilor
                  </div>
                )}
              </div>
              
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
              
              {/* Masura Filter - ALWAYS VISIBLE */}
              <div className="filter-item">
                <label>📋 Cod Măsură</label>
                <select value={filterMasura} onChange={(e) => { setFilterMasura(e.target.value); closeMobileSidebar(); }}>
                  <option value="">Toate măsurile</option>
                  {uniqueMasuraCodes.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              
              {/* Progres Tehnic Filter - ALWAYS VISIBLE */}
              <div className="filter-item">
                <label>📊 Progres Tehnic</label>
                <select value={filterStadiu} onChange={(e) => { setFilterStadiu(e.target.value); closeMobileSidebar(); }}>
                  <option value="">Toate valorile</option>
                  {uniqueStadiu.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              
              {/* Funding Source Filter - ALWAYS VISIBLE */}
              <div className="filter-item">
                <label>💰 Sursă Finanțare</label>
                <select value={filterFundingSource} onChange={(e) => { setFilterFundingSource(e.target.value); closeMobileSidebar(); }}>
                  <option value="">Toate sursele</option>
                  {uniqueFundingSources.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
              
              {/* Clear Filters Button - VISIBLE IF ANY FILTER ACTIVE */}
              {(filterStadiu || filterLocality || filterFundingSource || filterCounty || filterComponent || filterMasura || filterCRI) && (
                <button
                  onClick={() => {
                    setFilterStadiu('')
                    setFilterLocality('')
                    setFilterFundingSource('')
                    setFilterCounty('')
                    setFilterComponent('')
                    setFilterMasura('')
                    setFilterCRI('')
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
    isCountyLoading,
    dataDate,
    setDataDate,
    availableDates,
    isLoadingDates
}) => {
    const [showAllRanking, setShowAllRanking] = useState(false)
    const [mapData, setMapData] = useState(null)
    const [topBeneficiaries, setTopBeneficiaries] = useState(null)
    const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false)
    const [showAllBeneficiaries, setShowAllBeneficiaries] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    
    // CRI data hook
    const { criData, loading: criLoading, error: criError } = useCRIData()
    
    // Filter states
    const [filterStadiu, setFilterStadiu] = useState('')
    const [filterLocality, setFilterLocality] = useState('')
    const [filterFundingSource, setFilterFundingSource] = useState('')
    const [filterCounty, setFilterCounty] = useState('')
    const [filterComponent, setFilterComponent] = useState(activeProgram || '')
    const [filterMasura, setFilterMasura] = useState('')
    const [filterCRI, setFilterCRI] = useState('')
    const [filteredTotals, setFilteredTotals] = useState({ count: 0, totalValue: 0 })
    
    // Ref for sticky filters to scroll to
    const filtersRef = useRef(null)

    // Get the correct component mapping based on endpoint
    // Memoized to prevent recreation on every render
    const COMPONENT_MAPPING = useMemo(() => {
      return endpoint === 'projects' ? COMPONENT_MAPPING_PROJECTS : COMPONENT_MAPPING_PAYMENTS
    }, [endpoint])

    // Get field mappings based on endpoint
    // Memoized to prevent object recreation on every render
    const fieldMappings = useMemo(() => {
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
                cri: 'cri', // CRI identifier
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
                fundingSource: 'SURSA_FINANTARE',
                cri: 'cri' // CRI identifier
            }
        }
    }, [endpoint])

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
    // Memoized to prevent infinite re-renders in useMemo dependencies
    const getValueField = useCallback((project) => {
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
    }, [endpoint, currency, fieldMappings])

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
    } = useTotalIndicators(dataDate)

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

    // Fetch top 100 beneficiaries on component mount
    useEffect(() => {
        const fetchTopBeneficiaries = async () => {
            setLoadingBeneficiaries(true)
            try {
                const url = `https://mfe.gov.ro/generator/data/${dataDate}-persons.json.gz`
                console.log('🔥 FETCHING BENEFICIARIES FROM:', url)
                const response = await fetch(url, {
                    headers: {
                        'Accept-Encoding': 'gzip, deflate'
                    }
                })
                
                console.log('✅ Response received, status:', response.status)
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                
                // Get arrayBuffer to handle both compressed and uncompressed data
                console.log('📦 Getting arrayBuffer...')
                const arrayBuffer = await response.arrayBuffer()
                console.log('📦 ArrayBuffer size:', arrayBuffer.byteLength, 'bytes')
                const uint8Array = new Uint8Array(arrayBuffer)
                let data
                
                // For .gz files, try gzip decompression first
                // Check if it starts with gzip magic number (0x1f 0x8b)
                const isGzip = uint8Array.length >= 2 && uint8Array[0] === 0x1f && uint8Array[1] === 0x8b
                console.log('🔍 Is GZIP?', isGzip, '(first 2 bytes:', uint8Array[0]?.toString(16), uint8Array[1]?.toString(16) + ')')
                
                if (isGzip) {
                    // File is gzipped, decompress it
                    try {
                        // @ts-ignore - dynamic import
                        const pako = await import('pako')
                        const decompressed = pako.ungzip(uint8Array)
                        const jsonString = new TextDecoder().decode(decompressed)
                        data = JSON.parse(jsonString)
                        console.log('Successfully decompressed gzip and parsed JSON')
                    } catch (gzipError) {
                        console.error('Gzip decompression failed:', gzipError)
                        throw gzipError
                    }
                } else {
                    // File is not gzipped, try to parse as JSON directly
                    try {
                        const text = new TextDecoder().decode(uint8Array)
                        data = JSON.parse(text)
                        console.log('Successfully parsed JSON (not compressed)')
                    } catch (textError) {
                        console.error('JSON parsing failed:', textError)
                        throw textError
                    }
                }
                
                // Handle different data structures
                // API might return { items: [...] } or directly [...]
                console.log('Top beneficiaries raw data:', data)
                console.log('Top beneficiaries data type:', typeof data, 'Is array:', Array.isArray(data))
                
                let processedData = null
                if (data && Array.isArray(data)) {
                    console.log('Data is direct array, length:', data.length)
                    processedData = { items: data }
                } else if (data && data.items && Array.isArray(data.items)) {
                    console.log('Data has items property, length:', data.items.length)
                    processedData = data
                } else if (data && typeof data === 'object') {
                    // Try to find any array property
                    const arrayProp = Object.values(data).find(v => Array.isArray(v))
                    if (arrayProp) {
                        console.log('Found array property in object, length:', arrayProp.length)
                        processedData = { items: arrayProp }
                    } else {
                        console.warn('Top beneficiaries data structure unexpected:', data)
                        console.warn('Data keys:', Object.keys(data))
                        processedData = { items: [] }
                    }
                } else {
                    console.warn('Top beneficiaries data is not in expected format:', data)
                    processedData = { items: [] }
                }
                
                console.log('Setting top beneficiaries:', processedData)
                console.log('Number of items:', processedData?.items?.length)
                if (processedData?.items?.[0]) {
                    console.log('Sample beneficiary item:', processedData.items[0])
                    console.log('Sample beneficiary keys:', Object.keys(processedData.items[0]))
                }
                
                // Normalize and sort the data
                if (processedData && processedData.items && processedData.items.length > 0) {
                    // Normalize field names (handle different case variations)
                    const normalizedItems = processedData.items.map(item => {
                        const normalized = {}
                        // Find field names (case-insensitive)
                        const keys = Object.keys(item)
                        const lowerKeys = keys.map(k => k.toLowerCase())
                        
                        // Helper function to find key by lowercase match
                        const findKey = (...lowerNames) => {
                            for (const lowerName of lowerNames) {
                                const idx = lowerKeys.indexOf(lowerName)
                                if (idx >= 0) return keys[idx]
                            }
                            return null
                        }
                        
                        // Map to our expected field names
                        const beneficiarKey = findKey('beneficiar', 'nume_beneficiar', 'denumire_beneficiar', 'name', 'nume', 'full legal name')
                        const cuiKey = findKey('cui', 'cui_beneficiar', 'tax_id', 'cui_beneficiar_final', 'tax identification number')
                        const totalEuroKey = findKey('total_euro', 'valoare_euro', 'amount_euro', 'valoare_plata_fe_euro')
                        const totalRONKey = findKey('total', 'total_ron', 'valoare_ron', 'amount_ron', 'valoare_plata_fe', 'received amount in lei')
                        
                        normalized.beneficiar = beneficiarKey ? item[beneficiarKey] : null
                        normalized.cui = cuiKey ? item[cuiKey] : null
                        normalized.total_euro = totalEuroKey ? (Number(item[totalEuroKey]) || 0) : 0
                        normalized.total = totalRONKey ? (Number(item[totalRONKey]) || 0) : 0
                        
                        // Debug logging for first item
                        if (processedData.items.indexOf(item) === 0) {
                            console.log('🔍 First item keys:', Object.keys(item))
                            console.log('🔍 totalRONKey found:', totalRONKey)
                            console.log('🔍 totalRONKey value:', totalRONKey ? item[totalRONKey] : 'NOT FOUND')
                            console.log('🔍 normalized.total:', normalized.total)
                        }
                        
                        // If we couldn't find the expected fields, try to use all original fields (lowercase keys)
                        if (!normalized.beneficiar && normalized.total_euro === 0 && normalized.total === 0) {
                            // Keep original item but normalize key case for lookup
                            const lowerCaseMap = {}
                            Object.keys(item).forEach(key => {
                                lowerCaseMap[key.toLowerCase()] = item[key]
                            })
                            // Try common field variations
                            normalized.beneficiar = lowerCaseMap.beneficiar || lowerCaseMap.nume_beneficiar || lowerCaseMap.denumire_beneficiar || lowerCaseMap.name || lowerCaseMap.nume || null
                            normalized.cui = lowerCaseMap.cui || lowerCaseMap.cui_beneficiar || lowerCaseMap.cui_beneficiar_final || lowerCaseMap.tax_id || null
                            normalized.total_euro = Number(lowerCaseMap.total_euro || lowerCaseMap.valoare_euro || lowerCaseMap.amount_euro || lowerCaseMap.valoare_plata_fe_euro || 0) || 0
                            normalized.total = Number(lowerCaseMap.total || lowerCaseMap.total_ron || lowerCaseMap.valoare_ron || lowerCaseMap.amount_ron || lowerCaseMap.valoare_plata_fe || lowerCaseMap['received amount in lei'] || 0) || 0
                            
                            // Calculate EUR from RON if needed
                            if (normalized.total_euro === 0 && normalized.total > 0) {
                                normalized.total_euro = normalized.total / 4.95
                            }
                        }
                        
                        // Calculate EUR from RON if not already set (outside fallback too)
                        if (normalized.total_euro === 0 && normalized.total > 0) {
                            normalized.total_euro = normalized.total / 4.95
                        }
                        
                        return normalized
                    })
                    
                    // Filter out invalid entries (must have name and at least one amount > 0)
                    const validItems = normalizedItems.filter(item => {
                        const hasName = item.beneficiar && item.beneficiar !== 'N/A' && String(item.beneficiar).trim() !== ''
                        const hasAmount = (item.total_euro && item.total_euro > 0) || (item.total && item.total > 0)
                        return hasName && hasAmount
                    })
                    
                    // Sort by EUR amount (descending) for display
                    validItems.sort((a, b) => {
                        const amountA = a.total_euro || 0
                        const amountB = b.total_euro || 0
                        return amountB - amountA
                    })
                    
                    console.log('Normalized and filtered items:', validItems.length, 'out of', normalizedItems.length)
                    console.log('Sample normalized item:', validItems[0])
                    
                    processedData.items = validItems
                }
                
                setTopBeneficiaries(processedData)
            } catch (error) {
                console.error('Error fetching top beneficiaries:', error)
                console.error('Error details:', error.message, error.stack)
                setTopBeneficiaries({ items: [] })
            } finally {
                setLoadingBeneficiaries(false)
            }
        }

        fetchTopBeneficiaries()
    }, [dataDate])

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

        // Handle different view modes
        if (viewMode === 'national') {
            // For national view, only include RO-MULTI data (national projects)
            if (multiData && multiData.extras && multiData.extras.rows) {
                const nationalProjects = activeProgram 
                    ? multiData.extras.rows.filter(project => project[fieldMappings.componentCode] === activeProgram)
                    : multiData.extras.rows
                
                totalValue = nationalProjects.reduce((sum, project) => sum + getValueField(project), 0)
                totalProjects = nationalProjects.length
            }
        } else if (viewMode === 'local') {
            // For local view, only include county data (exclude RO-MULTI and Național)
            baseCounties.forEach(county => {
                // Skip counties with name "Național"
                if (county.county?.name === 'Național' || county.name === 'Național') {
                    return
                }
                
                if (activeProgram && county.extras && county.extras.rows) {
                    const filteredProjects = county.extras.rows.filter(project =>
                        project[fieldMappings.componentCode] === activeProgram
                    )
                    totalValue += filteredProjects.reduce((sum, project) =>
                        sum + getValueField(project), 0
                    )
                    totalProjects += filteredProjects.length
                } else {
                    if (county.extras && county.extras.rows) {
                        const countyValue = county.extras.rows.reduce((sum, project) =>
                            sum + getValueField(project), 0
                        )
                        totalValue += countyValue
                        totalProjects += county.extras.rows.length
                    } else {
                        totalValue += county.total.value
                        totalProjects += county.total.projects
                    }
                }
            })
        } else {
            // For total view and others, include all data
            baseCounties.forEach(county => {
                if (activeProgram && county.extras && county.extras.rows) {
                    const filteredProjects = county.extras.rows.filter(project =>
                        project[fieldMappings.componentCode] === activeProgram
                    )
                    totalValue += filteredProjects.reduce((sum, project) =>
                        sum + getValueField(project), 0
                    )
                    totalProjects += filteredProjects.length
                } else {
                    if (county.extras && county.extras.rows) {
                        const countyValue = county.extras.rows.reduce((sum, project) =>
                            sum + getValueField(project), 0
                        )
                        totalValue += countyValue
                        totalProjects += county.extras.rows.length
                    } else {
                        totalValue += county.total.value
                        totalProjects += county.total.projects
                    }
                }
            })
            
            // For total view, also include national projects
            if (viewMode === 'total' && multiData && multiData.extras && multiData.extras.rows) {
                const nationalProjects = activeProgram 
                    ? multiData.extras.rows.filter(project => project[fieldMappings.componentCode] === activeProgram)
                    : multiData.extras.rows
                
                totalValue += nationalProjects.reduce((sum, project) => sum + getValueField(project), 0)
                totalProjects += nationalProjects.length
            }
        }

        // Calculate NAȚIONAL projects count (always show total, not filtered by component)
        const nationalProjects = multiData?.extras?.rows?.length || 0

        return { totalValue, totalProjects, nationalProjects }
    }, [data, activeProgram, fieldMappings, currency, getValueField, viewMode])

    // Process data based on current view mode and metric
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return []

        // Debug: Log București data
        const bucuresti = data.find(d => (d.county?.code || d.code) === 'RO-BI')
        if (bucuresti) {
            console.log(`🔍 BUCUREȘTI in processedData: ${bucuresti.total.projects} proiecte, ${bucuresti.total.value.toFixed(2)} EUR`)
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

        if (viewMode === 'general' || viewMode === 'total' || viewMode === 'local') {
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
        } else if (viewMode === 'national') {
            // For national view, use the actual calculated totals from the summary boxes
            const nationalValue = calculatedTotals.totalValue
            const nationalProjects = calculatedTotals.totalProjects
            
            result = baseCounties.map(county => {
                const { code, name } = getCountyInfo(county)
                return {
                    'hc-key': code.toLowerCase().replace('ro-', 'ro-'),
                    code: code,
                    name: name,
                    value: metric === 'value' ? nationalValue : nationalProjects,
                    money: nationalValue,
                    projects: nationalProjects
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

        // Add National entry to the result
        if (multiData && multiData.total) {
            let nationalValue = multiData.total.value
            let nationalProjects = multiData.total.projects

            // If a specific component is selected, filter national data by component
            if (activeProgram && multiData.extras && multiData.extras.rows) {
                const filteredNationalProjects = multiData.extras.rows.filter(project =>
                    project[fieldMappings.componentCode] === activeProgram
                )
                nationalValue = filteredNationalProjects.reduce((sum, project) =>
                    sum + getValueField(project), 0
                )
                nationalProjects = filteredNationalProjects.length
            }

            result.push({
                'hc-key': 'ro-national',
                code: 'NATIONAL',
                name: 'National',
                value: metric === 'value' ? nationalValue : nationalProjects,
                money: nationalValue,
                projects: nationalProjects
            })
        }

        const sortedResult = result.sort((a, b) => (b.value || 0) - (a.value || 0))
        return sortedResult
    }, [data, viewMode, metric, activeProgram, calculatedTotals])

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
                    
                    // Debug: Log tooltip data
                    if (point.code === 'RO-BI') {
                        console.log(`🔍 TOOLTIP București: point.money = ${point.money}, point.projects = ${point.projects}`)
                    }
                    
                    // Convert value if RON is selected (point.money is in EUR)
                    const valueToDisplay = currentCurrency === 'RON' ? point.money * 5 : point.money
                    
                    const displayValue = metric === 'value' ? fmtMoney(valueToDisplay, currencySymbol) : fmtNum(point.projects)
                    const otherValue = metric === 'value' ? `Proiecte: ${fmtNum(point.projects)}` : `Valoare: ${fmtMoney(valueToDisplay, currencySymbol)}`

                    // For national view mode, always redirect to national projects page
                    const clickHandler = viewMode === 'national' 
                        ? "window.handleCountyClick('NATIONAL', 'Proiecte Naționale')"
                        : `window.handleCountyClick('${point.code}', '${point.name}')`

                    return `
          <strong>${point.name}</strong><br/>
          ${metric === 'value' ? 'Valoare' : 'Proiecte'}: <strong>${displayValue}</strong><br/>
          ${otherValue}<br/>
          <div style="margin-top: 8px;">
            <button onclick="${clickHandler}" 
                    style="padding: 6px 10px; background: #0ea5e9; color: #fff; border: 0; border-radius: 8px; font-weight: 600; cursor: pointer;">
              ${viewMode === 'national' ? 'Click pentru proiecte naționale' : 'Click pe județ pentru detalii'}
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
                            // For national view mode, always redirect to national projects page
                            if (viewMode === 'national') {
                                onCountyClick('NATIONAL', 'Proiecte Naționale')
                            } else {
                            onCountyClick(this.code, this.name)
                            }
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
            title = `Sursa datelor: ${sourceName} - Proiecte Județene ${metric === 'value' ? `Valoare (${currencySymbol})` : 'Proiecte'}${filterSuffix}`
        } else if (viewMode === 'all') {
            title = `Sursa datelor: ${sourceName} - Toate proiectele ${metric === 'value' ? `Valoare (${currencySymbol})` : 'Proiecte'}${filterSuffix}`
        } else if (viewMode === 'total') {
            title = `Sursa datelor: ${sourceName} - Toate proiectele PNRR (${currencySymbol})`
        } else if (viewMode === 'national') {
            title = `Sursa datelor: ${sourceName} - Proiecte Naționale (${currencySymbol})`
        } else if (viewMode === 'local') {
            title = `Sursa datelor: ${sourceName} - Proiecte Locale ${metric === 'value' ? `Valoare (${currencySymbol})` : 'Proiecte'}${filterSuffix}`
        } else if (viewMode === 'program') {
            title = `Sursa datelor: ${sourceName} - ${componentLabel || activeProgram} - ${metric === 'value' ? `Valoare (${currencySymbol})` : 'Proiecte'}`
        } else {
            title = `Sursa datelor: ${sourceName} - Național - ${metric === 'value' ? `Valoare (${currencySymbol}, împărțită egal între județe)` : 'Proiecte (plin în fiecare județ)'}${filterSuffix}`
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


    // Component totals for pie chart
    const componentTotals = useMemo(() => {
        // Debug: Check if data exists and its structure
        if (!data || data.length === 0) {
            console.log('🔍 No data available for component totals')
            return []
        }
        
        console.log('🔍 Data structure debug:', {
            dataLength: data.length,
            firstItem: data[0],
            dataKeys: data[0] ? Object.keys(data[0]) : 'No data',
            fieldMappings: fieldMappings,
            endpoint: endpoint
        })
        
        // For 'all' view mode, include all data including RO-MULTI
        // For other modes, exclude RO-MULTI (NAȚIONAL projects are in București)
        const baseCounties = data.filter(d => {
            if (!d) return false
            const { code } = getCountyInfo(d)
            return viewMode === 'all' ? true : (code && code !== 'RO-MULTI')
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
                    // Debug: Log first few projects to see structure
                    if (baseCounties.indexOf(county) < 2 && county.extras.rows.indexOf(project) < 3) {
                        console.log('🔍 Project Debug:', {
                            projectKeys: Object.keys(project),
                            componentCodeField: fieldMappings.componentCode,
                            componentKey: componentKey,
                            project: project
                        })
                    }
                    if (totals[componentKey]) {
                        const projectValue = getValueField(project)
                        totals[componentKey].value += projectValue
                        totals[componentKey].projects += 1
                    }
                })
            } else {
                // Debug: Log counties without extras.rows structure
                console.log('🔍 County without extras.rows:', {
                    countyName: county.name,
                    countyKeys: Object.keys(county),
                    hasExtras: !!county.extras,
                    extrasKeys: county.extras ? Object.keys(county.extras) : 'No extras'
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

        const result = Object.entries(totals)
            .filter(([_, data]) => data.value > 0)
            .map(([key, data]) => ({
                name: data.label,
                y: data.value,
                color: componentColors[key],
                key
            }))
            .sort((a, b) => b.y - a.y)
        
        // Debug: Log component totals with detailed breakdown
        // console.log('📊 TOTALS OBJECT:', totals)
        // console.log('📊 TOTALS ENTRIES:', Object.entries(totals))
        // console.log('📊 RESULT ARRAY LENGTH:', result.length)
        // console.log('📊 RESULT ARRAY:', result)
        // console.log('🔍 Component Totals Debug:', {
        //     endpoint,
        //     viewMode,
        //     baseCountiesCount: baseCounties.length,
        //     multiDataExists: !!multiData,
        //     multiDataRows: multiData?.extras?.rows?.length || 0,
        //     resultLength: result.length
        // })
        
        // If no real data is found, create some test data for debugging
        if (result.length === 0 && data && data.length > 0) {
            console.log('🔍 No component data found, creating test data for debugging')
            return [
                { name: 'Test Component 1', y: 1000000, color: '#0ea5e9', key: 'TEST1' },
                { name: 'Test Component 2', y: 750000, color: '#22c55e', key: 'TEST2' },
                { name: 'Test Component 3', y: 500000, color: '#16a34a', key: 'TEST3' }
            ]
        }
        
        return result
    }, [data, fieldMappings, COMPONENT_MAPPING, currency, getValueField, viewMode])

    // Memoize table data to prevent recreation on every render
    const tableData = useMemo(() => {
        // Get all projects/payments from all counties
        const allData = []
        data.forEach(county => {
            // Handle different view modes for projects endpoint
            if (endpoint === 'projects') {
                if (viewMode === 'national') {
                    // Only include National projects (county = "Național" OR RO-MULTI)
                    if (county.county?.name !== 'Național' && county.name !== 'Național' && 
                        county.county?.code !== 'RO-MULTI' && county.code !== 'RO-MULTI') {
                        return;
                    }
                } else if (viewMode === 'local') {
                    // Only include Local projects (county != "Național" AND != RO-MULTI)
                    if (county.county?.name === 'Național' || county.name === 'Național' ||
                        county.county?.code === 'RO-MULTI' || county.code === 'RO-MULTI') {
                        return;
                    }
                } else if (viewMode === 'total') {
                    // Include all projects (both National and Local)
                    // No filtering needed
                } else {
                    // For other view modes, exclude RO-MULTI
                    if (county.county?.code === 'RO-MULTI' || county.code === 'RO-MULTI') {
                        return;
                    }
                }
            } else {
                // For payments endpoint, use original logic
                if (viewMode !== 'all' && (county.county?.code === 'RO-MULTI' || county.code === 'RO-MULTI')) {
                    return;
                }
            }
            
            if (county.extras?.rows) {
                county.extras.rows.forEach(item => {
                    // Use only the title (titlu_contract) field
                    const fullTitle = item[fieldMappings.title] || 'N/A'
                    
                    // Handle FinancialAmount object for projects
                    const financialAmount = item[fieldMappings.value]
                    const valueRON = endpoint === 'projects' && financialAmount && typeof financialAmount === 'object' 
                        ? financialAmount.ron 
                        : item[fieldMappings.valueRON] || 0
                    
                    const progressValue = item[fieldMappings.progress] !== undefined && item[fieldMappings.progress] !== null && item[fieldMappings.progress] !== '' ? item[fieldMappings.progress] : '-';
                    
                    const componentCode = item[fieldMappings.componentCode]
                    const measureCode = item[fieldMappings.measureCode]
                    
                    allData.push({
                        // Add original data for semantic search first
                        ...item,
                        // Then override with display values
                        title: fullTitle,
                        beneficiary: item[fieldMappings.beneficiary],
                        cui: endpoint === 'payments' ? item.CUI_BENEFICIAR_FINAL : undefined,
                        fundingSource: item[fieldMappings.fundingSource],
                        value: getValueField(item),
                        value_ron: valueRON,
                        progress: progressValue,
                        componentCode: componentCode,
                        measureCode: measureCode,
                        componentLabel: item[fieldMappings.componentLabel] || '',
                        locality: item[fieldMappings.locality] || '',
                        cri: item[fieldMappings.cri] || '',
                        county: county.county?.name || county.name || 'N/A',
                        startDate: item[fieldMappings.startDate] || ''
                    })
                })
            }
        })
        
        // Filter by active program or component filter if selected
        const filteredData = (activeProgram || filterComponent)
            ? allData.filter(item => item.componentCode === (activeProgram || filterComponent))
            : allData
        
        // Don't filter out zero values to maintain correct count
        return filteredData
    }, [data, endpoint, viewMode, fieldMappings, activeProgram, filterComponent, getValueField])

    // Pie chart configuration - Stable version
    const pieOptions = {
        chart: {
            type: 'pie',
            height: 400,
            backgroundColor: 'transparent',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: `Distribuție pe componente – Valoare (EUR)`
        },
        tooltip: {
            pointFormatter: function () {
                const val = fmtMoney(this.y)
                return `${this.name}: <b>${val}</b>`
            }
        },
        plotOptions: {
            pie: {
                innerSize: '55%',
                allowPointSelect: true,
                cursor: 'pointer',
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
                point: {
                    events: {
                        click: function () {
                            setViewMode('program')
                            setActiveProgram(this.options.key)
                        }
                    }
                },
                states: {
                    hover: {
                        enabled: true,
                        brightness: 0.1
                    },
                    inactive: {
                        enabled: false
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
                        <p>Acest tablou de bord reprezintă angajamentul României față de transparența publică în ceea ce privește fondurile NextGenerationEU și reflectă cifrele prezentate în PNRR, în urma aprobării de către Comisia Europeană, la 22 octombrie 2025, a propunerii de decizie de punere în aplicare a Consiliului de modificare a CID a planului României, în conformitate cu procedura prevăzută la articolul 21 din Regulamentul (UE) 2021/241 de instituire a Mecanismului de redresare și reziliență.</p>
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
                    <p>Acest tablou de bord reprezintă angajamentul României față de transparența publică în ceea ce privește fondurile NextGenerationEU și reflectă cifrele prezentate în PNRR, în urma aprobării de către Comisia Europeană, la 22 octombrie 2025, a propunerii de decizie de punere în aplicare a Consiliului de modificare a CID a planului României, în conformitate cu procedura prevăzută la articolul 21 din Regulamentul (UE) 2021/241 de instituire a Mecanismului de redresare și reziliență.</p>
                </div>
            </div>
            
            <header className="page-header">
                <h1>{pageTitle}</h1>

                {/* Header Info Section */}
                <div className="header-info">
                    <div className="header-info-left">
                        <div className="data-timestamp">
                            <div className="timestamp-content">
                                <span className="timestamp-label">Set de date:</span>
                                <select 
                                    className="data-date-selector"
                                    value={dataDate}
                                    onChange={(e) => setDataDate(e.target.value)}
                                    title="Selectează setul de date PNRR"
                                    disabled={isLoadingDates}
                                >
                                    {isLoadingDates ? (
                                        <option>Se încarcă date...</option>
                                    ) : availableDates && availableDates.length > 0 ? (
                                        availableDates.map(date => (
                                            <option key={date.value} value={date.value}>
                                                {date.label}
                                                {!date.hasAllEndpoints && ' ⚠️'}
                                            </option>
                                        ))
                                    ) : (
                                        <option value={dataDate}>{dataDate}</option>
                                    )}
                                </select>
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


            {/* Controls layout */}
            <div className="controls controls--map">
                {/* Row 1: Data Source + Currency */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '15px', 
                    width: '100%',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    <div className="control-group">
                        <p className="control-label" style={{ margin: 0 }}>Sursa datelor:</p>
                        <div className="segment" style={{ margin: 0 }}>    
                            <button
                                className={endpoint === 'payments' ? 'active' : ''}
                                onClick={() => switchEndpoint('payments')}
                            >
                                Plăți PNRR
                            </button>
                            <button
                                className={endpoint === 'projects' ? 'active' : ''}
                                onClick={() => switchEndpoint('projects')}
                            >
                                Proiecte PNRR în execuție
                            </button>
                        </div>
                    </div>
                    
                    <div className="control-group" style={{ 
                        marginLeft: 'auto', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px'
                    }}>
                        <p className="control-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Moneda:</p>
                        <div className="segment" style={{ margin: 0, display: 'flex', whiteSpace: 'nowrap' }}>
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
                    </div>
                </div>
                
                {/* Row 2: Vizualizare + Căutare Semantică - only show if not payments */}
                {endpoint !== 'payments' && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        width: '100%',
                        flexWrap: 'wrap',
                        gap: '15px'
                    }}>
                        <div className="control-group">
                            <p className="control-label" style={{ margin: 0 }}>Vizualizare:</p>
                            <div className="segment" style={{ margin: 0 }}>
                                <button
                                    className={viewMode === 'total' ? 'active' : ''}
                                    onClick={() => {
                                        setViewMode('total');
                                        setMetric('value');
                                        setActiveProgram(null);
                                    }}
                                >
                                    Toate Proiectele
                                </button>
                                <button
                                    className={viewMode === 'national' ? 'active' : ''}
                                    onClick={() => {
                                        setViewMode('national');
                                        setMetric('value');
                                        setActiveProgram(null);
                                    }}
                                >
                                    Proiecte Naționale
                                </button>
                                <button
                                    className={viewMode === 'local' ? 'active' : ''}
                                    onClick={() => {
                                        setViewMode('local');
                                        setMetric('value');
                                        setActiveProgram(null);
                                    }}
                                >
                                    Proiecte Locale
                                </button>
                            </div>
                        </div>
                        
                        <div style={{ marginLeft: 'auto' }}>
                            <SemanticSearchCard endpoint={endpoint} />
                        </div>
                    </div>
                )}
            </div>
            
            {/* Filtre secundare - Hide View Mode section for Payments */}
            {endpoint !== 'payments' && (
            <div className="controls controls--map" style={{ display: 'none' }}>
                {/* This section is now integrated in the grid above */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <p className="control-label" style={{ margin: 0, minWidth: '120px' }}>Vizualizare:</p>
                    <div className="segment" style={{ margin: 0 }}>
                    </div>
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
                        Național · Valoare
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
                        Național · Proiecte
                    </button>
                </div> */}


                </div>
            )}
            
            {/* Component Filters - Always visible */}
            <div className="controls controls--map">
                {/* Component Filters - Compact label with break rows */}
                <div style={{ marginBottom: '15px' }}>
                    <p className="control-label" style={{ margin: '0 0 10px 0', width: 'fit-content' }}>VIZUALIZARE PE COMPONENTE:</p>
                    <div className="programs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                        <div className="mobile-total-label">{endpoint === 'payments' ?  "TOTAL PLĂTIT" : "VALOARE PNRR CONTRACTATĂ" }</div>
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
                        <div className="map-total-label">{endpoint === 'payments' ? "TOTAL PLĂTIT" : "VALOARE PNRR CONTRACTATĂ" }</div>
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
                <section className="ranking-section">
                    <div className="card rank-card">
                        <h3>Topul beneficiarilor PNRR raportat la plăți (Top 100)</h3>
                    {loadingBeneficiaries ? (
                        <div className="beneficiaries-loading">
                            <div className="loading-spinner-small"></div>
                            <span>Se încarcă topul beneficiarilor...</span>
                        </div>
                    ) : topBeneficiaries && topBeneficiaries.items && topBeneficiaries.items.length > 0 ? (
                            <>
                                <ol className="rank-list">
                                        {topBeneficiaries.items
                                            .slice(0, showAllBeneficiaries ? 100 : 5)
                                            .map((beneficiary, index) => {
                                                // Use actual API field names: beneficiar, cui, total_euro, total
                                                // total = RON amount, total_euro = EUR amount (from API)
                                                const amountRON = beneficiary['total'] || 0
                                                const amountEUR = beneficiary['total_euro'] || 0 // Use total_euro directly from API
                                                
                                                const beneficiaryName = beneficiary['beneficiar'] || 'N/A'
                                                
                                                const taxId = beneficiary['cui'] ? String(beneficiary['cui']) : ''
                                                
                                                // Use correct currency amount based on selection
                                                const displayAmount = currency === 'RON' ? amountRON : amountEUR
                                                const isTopFive = index < 5
                                                
                                                // Format as millions with currency symbol
                                                const millions = displayAmount / 1e6
                                                const formattedAmount = `${millions.toLocaleString('ro-RO', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })} mil ${getCurrencySymbol()}`

                                                // Calculate percentage for bar (similar to county ranking)
                                                // Use total_euro for EUR comparison when currency is EUR, total for RON
                                                const firstItem = topBeneficiaries.items[0]
                                                const maxAmount = firstItem 
                                                    ? (currency === 'EUR' ? (firstItem['total_euro'] || 0) : (firstItem['total'] || 0))
                                                    : 1
                                                const percentage = maxAmount ? Math.max(2, (displayAmount / maxAmount) * 100) : 0

                                                return (
                                                <li
                                                    key={index}
                                                    className="rank-item"
                                                    onClick={() => {
                                                        console.log('Beneficiary clicked:', beneficiary);
                                                        console.log('Tax ID:', taxId);
                                                        
                                                        // Switch to payments endpoint
                                                        if (switchEndpoint) {
                                                            switchEndpoint('payments');
                                                            console.log('Switched to payments endpoint');
                                                        }
                                                        
                                                        // Set search term to the CUI/tax ID
                                                        if (taxId) {
                                                            setSearchTerm(taxId);
                                                            console.log('Set search term to:', taxId);
                                                        }
                                                        
                                                        // Scroll to the table
                                                        setTimeout(() => {
                                                            const element = document.getElementById('projects-table');
                                                            if (element) {
                                                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                console.log('Scrolled to table');
                                                            }
                                                        }, 500);
                                                    }}
                                                >
                                                    <div className="rank-pos">{index + 1}</div>
                                                    <div className="rank-name" style={{ fontWeight: isTopFive ? 'bold' : 'normal' }}>
                                                        {beneficiaryName}
                                                    </div>
                                                    <div className="rank-bar-wrap">
                                                        <div className="rank-bar" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                    <div className="rank-value" style={{ fontWeight: isTopFive ? 'bold' : 'normal' }}>
                                                            {formattedAmount}
                                                    </div>
                                                </li>
                                            )
                                        })}
                                </ol>
                                <div className="rank-actions">
                                <button
                                        className="btn ghost"
                                    onClick={() => setShowAllBeneficiaries(!showAllBeneficiaries)}
                                    >
                                        {showAllBeneficiaries ? 'Restrânge' : 'Afișează tot'}
                                </button>
                            </div>
                                <div className="rank-note">
                                    Click pe un beneficiar pentru a vedea plățile lui. (Ctrl/⌘-clic pentru un nou tab.)
                                </div>
                            </>
                    ) : (
                        <div className="beneficiaries-empty">
                            <p>Nu s-au găsit date despre beneficiari sau datele nu sunt încă disponibile.</p>
                            {topBeneficiaries && console.log('Top beneficiaries state:', topBeneficiaries)}
                        </div>
                    )}
                    </div>
                </section>
            )}

            {/* Pie Chart - Full Row (always show) */}
            <section className="pie-chart-section">
                <div className="card pie-card">
                    {isLoadingRealData ? (
                        <div className="chart-container" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '400px',
                            color: '#64748b',
                            fontSize: '16px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div className="loading-spinner-small" style={{ margin: '0 auto 16px auto' }}></div>
                                <div>Se încarcă datele pentru distribuția pe componente...</div>
                            </div>
                        </div>
                    ) : componentTotals && componentTotals.length > 0 ? (
                        <div className="chart-container">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={pieOptions}
                            />
                        </div>
                    ) : (
                        <div className="chart-container" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '400px',
                            color: '#64748b',
                            fontSize: '16px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                                <div>Nu există date pentru distribuția pe componente</div>
                                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                                    Verifică filtrele sau încarcă datele
                                </div>
                                <div style={{ fontSize: '12px', marginTop: '8px', color: '#94a3b8' }}>
                                    Debug: Data length: {data?.length || 0} | Endpoint: {endpoint}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* County Ranking - Full Row - Hide when viewing National Projects */}
            {viewMode !== 'national' && (
            <section className="ranking-section">
                <div className="card rank-card">
                    <h3>Clasament județe – {getSelectionLabel()}</h3>
                    <ol className="rank-list">
                        {rankingData.map((county, index) => {
                            const percentage = maxValue ? Math.max(2, (county.value / maxValue) * 100) : 0
                            // Convert to RON if needed (county.money is in EUR)
                            const valueToDisplay = currency === 'RON' ? county.money * 5 : county.money
                            const displayValue = fmtMoney(valueToDisplay, getCurrencySymbol())
                            // Simple display name - no special case for București
                            const displayName = county.name

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
            )}


            {/* Projects/Payments Table */}
            <section id="projects-table" className="projects-payments-section">
                <EnhancedTable
                    data={tableData}
                    columns={[
                        {
                            key: 'title',
                            label: endpoint === 'payments' ? 'Titlu Plată' : 'Titlu Proiect',
                            searchable: true,
                            render: (value) => <div style={{ maxWidth: '350px', wordWrap: 'break-word', fontSize: '12px', lineHeight: '1.3', textTransform: 'uppercase' }}>{value}</div>
                        },
                        {
                            key: 'beneficiary',
                            label: 'Nume Beneficiar',
                            searchable: true,
                            render: (value) => <div style={{ maxWidth: '250px', wordWrap: 'break-word', fontSize: '12px', lineHeight: '1.3' }}>{value}</div>
                        },
                        ...(endpoint === 'payments' ? [{
                            key: 'cui',
                            label: 'CUI',
                            searchable: true,
                            render: (value) => <div style={{ fontSize: '12px', minWidth: '100px', fontFamily: 'monospace' }}>{value}</div>
                        }] : []),
                        {
                            key: 'county',
                            label: 'Județ',
                            searchable: true,
                            render: (value) => <div style={{ fontSize: '12px', minWidth: '70px' }}>{value}</div>
                        },
                        {
                            key: 'fundingSource',
                            label: 'Sursă Finanțare',
                            searchable: true,
                            render: (value) => {
                                // Capitalize first letter for all values
                                return <div style={{ fontSize: '12px', minWidth: '120px' }}>{value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '-'}</div>
                            }
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
                                        return <div style={{ fontSize: '12px', minWidth: '120px', textAlign: 'center' }}>
                                            {currency === 'RON' 
                                                ? formatMoneyWithCurrency(financialAmount.ron, financialAmount.ron, item.startDate)
                                                : formatMoneyWithCurrency(financialAmount.eur, financialAmount.ron, item.startDate)
                                            }
                                        </div>
                                    }
                                }
                                return <div style={{ fontSize: '12px', minWidth: '120px', textAlign: 'center' }}>
                                    {formatMoneyWithCurrency(value, item.value_ron, item.startDate)}
                                </div>
                            }
                        },
                        {
                            key: 'progress',
                            label: endpoint === 'payments' ? 'Progres Fizic (%)' : 'Progres Tehnic',
                            numeric: true,
                            searchable: false,
                            sortable: true,
                            sortValue: (item) => {
                                // For payments: use progress value directly
                                if (endpoint === 'payments') {
                                    return item.progress || 0;
                                }
                                // For projects: use PROGRES_FIZIC if available
                                const progresFizic = item.PROGRES_FIZIC;
                                if (progresFizic !== null && progresFizic !== undefined && progresFizic !== '') {
                                    return parseFloat(String(progresFizic).replace(',', '.'));
                                }
                                return 0; // Default for stadiu text
                            },
                            render: (value, item) => {
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
                                
                                // For projects: if progres_fizic exists, show percentage, otherwise show stadiu text
                                const progresFizic = item.PROGRES_FIZIC
                                
                                if (progresFizic !== null && progresFizic !== undefined && progresFizic !== '') {
                                    // Convert to string first, then convert Romanian decimal format (0,3 -> 30%)
                                    const progresFizicStr = String(progresFizic)
                                    const percentage = Math.round(parseFloat(progresFizicStr.replace(',', '.')) * 100)
                                    return <div style={{ 
                                        fontSize: '12px', 
                                        minWidth: '100px', 
                                        textAlign: 'center',
                                        fontWeight: '700',
                                        whiteSpace: 'nowrap',
                                        padding: '2px 4px',
                                        color: '#059669'
                                    }}>{percentage}%</div>
                                }
                                
                                // No progres_fizic - show stadiu text
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
                            key: 'financialProgress',
                            label: 'Progres Financiar',
                            numeric: true,
                            searchable: false,
                            sortable: true,
                            sortValue: (item) => {
                                return item.PROGRES_FINANCIAR ?? 0;
                            },
                            render: (value, item) => {
                                const progresFinanciar = item.PROGRES_FINANCIAR;
                                
                                if (progresFinanciar === null || progresFinanciar === undefined) {
                                    return <div style={{ 
                                        fontSize: '12px', 
                                        minWidth: '100px', 
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                        fontStyle: 'italic'
                                    }}>-</div>
                                }
                                
                                // Convert 0.58 -> 58%
                                const percentage = Math.round(progresFinanciar * 100);
                                
                                return <div style={{ 
                                    fontSize: '12px', 
                                    minWidth: '100px', 
                                    textAlign: 'center',
                                    fontWeight: '500'
                                }}>{percentage}%</div>
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
                    title={endpoint === 'payments' ? 'Plăți PNRR' : 
                           viewMode === 'total' ? 'Toate proiectele PNRR' : 
                           viewMode === 'national' ? 'Proiecte Naționale PNRR' :
                           viewMode === 'local' ? 'Proiecte Locale PNRR' : 'Proiecte PNRR'}
                    subtitle={
                        (() => {
                            // Use filtered totals from the table if available, otherwise fallback to calculated values
                            if (filteredTotals.count > 0) {
                                // For Total Proiecte view, show combined National + Local totals
                                if (endpoint === 'projects' && viewMode === 'total') {
                                    // Calculate National and Local totals separately, filtered by activeProgram if selected
                                    const nationalData = data.filter(county => 
                                        county.county?.name === 'Național' || county.name === 'Național' ||
                                        county.county?.code === 'RO-MULTI' || county.code === 'RO-MULTI'
                                    )
                                    const localData = data.filter(county => 
                                        county.county?.name !== 'Național' && county.name !== 'Național' && 
                                county.county?.code !== 'RO-MULTI' && county.code !== 'RO-MULTI'
                            )
                            
                                    // Helper function to apply all filters to a row
                                    const applyAllFilters = (item) => {
                                        // Component filter
                                        if (activeProgram && item[fieldMappings.componentCode] !== activeProgram) return false
                                        if (filterComponent && item[fieldMappings.componentCode] !== filterComponent) return false
                                        
                                        // Progress/Stage filter
                                        if (filterStadiu && item[fieldMappings.progress] !== filterStadiu) return false
                                        
                                        // Locality filter
                                        if (filterLocality && item[fieldMappings.locality] !== filterLocality) return false
                                        
                                        // Funding source filter
                                        if (filterFundingSource && item[fieldMappings.fundingSource] !== filterFundingSource) return false
                                        
                                        // Measure filter
                                        if (filterMasura && item[fieldMappings.measureCode] !== filterMasura) return false
                                        
                                        // CRI filter
                                        if (filterCRI && item[fieldMappings.cri] !== filterCRI) return false
                                        
                                        return true
                                    }
                                    
                                    // Calculate counts and values with ALL filters applied
                                    const nationalCount = nationalData.reduce((sum, county) => {
                                        if (county.extras?.rows) {
                                            const filteredRows = county.extras.rows.filter(applyAllFilters)
                                            return sum + filteredRows.length
                                        }
                                        return sum
                                    }, 0)
                                    
                                    const localCount = localData.reduce((sum, county) => {
                                        if (county.extras?.rows) {
                                            const filteredRows = county.extras.rows.filter(applyAllFilters)
                                            return sum + filteredRows.length
                                        }
                                        return sum
                                    }, 0)
                                    
                                    const nationalValue = nationalData.reduce((sum, county) => {
                                        if (county.extras?.rows) {
                                            const filteredRows = county.extras.rows.filter(applyAllFilters)
                                            return sum + filteredRows.reduce((countySum, item) => {
                                                const value = getValueField(item)
                                                return countySum + value
                                            }, 0)
                                        }
                                        return sum
                                    }, 0)
                                    
                                    const localValue = localData.reduce((sum, county) => {
                                        if (county.extras?.rows) {
                                            const filteredRows = county.extras.rows.filter(applyAllFilters)
                                            return sum + filteredRows.reduce((countySum, item) => {
                                                const value = getValueField(item)
                                                return countySum + value
                                            }, 0)
                                        }
                                        return sum
                                    }, 0)
                                    
                                    const totalCount = nationalCount + localCount
                                    return `${nationalCount} Naționale + ${localCount} Locale = ${totalCount} proiecte${(activeProgram || filterComponent) ? ` (${COMPONENT_MAPPING[activeProgram || filterComponent]?.label})` : ''} • ${formatMoneyWithCurrency(nationalValue)} + ${formatMoneyWithCurrency(localValue)} = ${formatMoneyWithCurrency(filteredTotals.totalValue)} valoare totală`
                                } else {
                                    return `${filteredTotals.count} ${endpoint === 'payments' ? 'plăți' : 'proiecte'} găsite${(activeProgram || filterComponent) ? ` (${COMPONENT_MAPPING[activeProgram || filterComponent]?.label})` : ''} • ${formatMoneyWithCurrency(filteredTotals.totalValue)} valoare totală`
                                }
                            }
                            
                            // Fallback calculation for initial load
                            const dataToUse = viewMode === 'all' 
                                ? data 
                                : data.filter(county => 
                                county.county?.code !== 'RO-MULTI' && county.code !== 'RO-MULTI'
                            )
                            
                            const totalData = dataToUse.reduce((sum, county) => sum + (county.extras?.rows?.length || 0), 0)
                            const filteredData = activeProgram 
                                ? dataToUse.reduce((sum, county) => {
                                    if (county.extras?.rows) {
                                        return sum + county.extras.rows.filter(item => item[fieldMappings.componentCode] === activeProgram).length
                                    }
                                    return sum
                                }, 0)
                                : totalData
                            
                            const totalValue = dataToUse.reduce((sum, county) => {
                                if (county.extras?.rows) {
                                    return sum + county.extras.rows.reduce((countySum, item) => {
                                        const value = getValueField(item)
                                        return countySum + value
                                    }, 0)
                                }
                                return sum
                            }, 0)
                            
                            return `${filteredData} ${endpoint === 'payments' ? 'plăți' : 'proiecte'} găsite${(activeProgram || filterComponent) ? ` (${COMPONENT_MAPPING[activeProgram || filterComponent]?.label})` : ''} • ${formatMoneyWithCurrency(totalValue)} valoare totală`
                        })()
                    }
                    itemsPerPage={10}
                    searchable={true}
                    searchPlaceholder={`Caută ${endpoint === 'payments' ? 'plată' : 'proiect'}, beneficiar, componentă, localitate...`}
                    defaultSortColumn="value"
                    defaultSortDirection="desc"
                    endpoint={endpoint}
                    enableExport={true}
                    exportFileName={`${endpoint === 'payments' ? 'plati' : 'proiecte'}_pnrr_toate`}
                    activeProgram={activeProgram}
                    setActiveProgram={setActiveProgram}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterStadiu={filterStadiu}
                    setFilterStadiu={setFilterStadiu}
                    filterLocality={filterLocality}
                    setFilterLocality={setFilterLocality}
                    filterFundingSource={filterFundingSource}
                    setFilterFundingSource={setFilterFundingSource}
                    filterCounty={filterCounty}
                    setFilterCounty={setFilterCounty}
                    filterComponent={filterComponent}
                    setFilterComponent={setFilterComponent}
                    filterMasura={filterMasura}
                    setFilterMasura={setFilterMasura}
                    filterCRI={filterCRI}
                    setFilterCRI={setFilterCRI}
                    filtersRef={filtersRef}
                    fieldMappings={fieldMappings}
                    getValueField={getValueField}
                    formatMoneyWithCurrency={formatMoneyWithCurrency}
                    getCurrencySymbol={getCurrencySymbol}
                    currency={currency}
                    onFilteredDataChange={setFilteredTotals}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    setMetric={setMetric}
                    criData={criData}
                    criLoading={criLoading}
                    criError={criError}
                />
            </section>

            {/* Components Overview */}
            <ComponentsOverview 
              currency={currency}
              setActiveProgram={(componentCode) => {
                setActiveProgram(componentCode)
                // For projects endpoint, default to 'total' view mode to show all projects
                if (endpoint === 'projects') {
                  setViewMode('total')
                } else {
                  setViewMode('all')
                }
                setMetric('projects')
              }}
              setFilterMasura={setFilterMasura}
              switchEndpoint={switchEndpoint}
              setViewMode={setViewMode}
              setMetric={setMetric}
            />

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

        if (viewMode === 'general') return `Proiecte Județene${filterSuffix} · Total Valoare`
        if (viewMode === 'all') return `Toate proiectele${filterSuffix} · Total Valoare`
        if (viewMode === 'program') {
            const program = PROGRAMS.find(p => p.key === activeProgram)
            return `${program?.label || activeProgram} · Total Valoare`
        }
        if (viewMode === 'total') return `Total${filterSuffix} · Total Valoare`
        return `Național${filterSuffix} · Total Valoare`
    }
}

/**
 * Semantic Search Card Component
 * Card pentru căutare semantică cu input și butoane de exemple
 */
function SemanticSearchCard({ endpoint }) {
    const navigate = useNavigate()
    const [semanticQuery, setSemanticQuery] = useState('')
    
    const handleSemanticSearch = (query = semanticQuery) => {
        if (!query.trim()) return
        
        // Navigare către pagina de căutare semantică
        navigate(`/semantic-search?q=${encodeURIComponent(query)}&endpoint=${endpoint}`)
    }
    
    const exampleTerms = ['apă uzată', 'spital', 'drum', 'energie', 'școală']
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <p className="control-label" style={{ margin: 0 }}>Căutare Semantică:</p>
                <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '250px' }}>
                    <input
                        type="text"
                        placeholder="Ex: apă uzată, spital, drum..."
                        value={semanticQuery}
                        onChange={(e) => setSemanticQuery(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSemanticSearch()
                        }}
                        style={{
                            padding: '10px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '14px',
                            flex: 1,
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            minWidth: '150px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <button
                        onClick={() => handleSemanticSearch()}
                        style={{
                            padding: '10px 24px',
                            background: '#0ea5e9',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#0284c7'}
                        onMouseLeave={(e) => e.target.style.background = '#0ea5e9'}
                    >
                        🔍 Caută
                    </button>
                </div>
            </div>
            
            {/* Exemple quick search */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '13px',
                color: '#64748b',
                flexWrap: 'wrap'
            }}>
                <span>Exemple:</span>
                {exampleTerms.map(term => (
                    <button
                        key={term}
                        onClick={() => {
                            setSemanticQuery(term)
                            handleSemanticSearch(term)
                        }}
                        style={{
                            padding: '4px 10px',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            color: '#475569'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#e2e8f0'
                            e.target.style.borderColor = '#cbd5e1'
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#f1f5f9'
                            e.target.style.borderColor = '#e2e8f0'
                        }}
                    >
                        {term}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default MapView
