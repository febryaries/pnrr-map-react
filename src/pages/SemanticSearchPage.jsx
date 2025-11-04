import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMap from 'highcharts/modules/map'
import { createSemanticMatcher } from '../utils/semanticSearch'
import { fmtMoney, fmtNum } from '../data/data'
import { getPNRRDataService } from '../services/PNRRDataService'
import { DATA_ENDPOINTS } from '../constants/PNRRConstants'
import roLocalities from '../data/ro_localities_geoapify.json'
import '../App.css'

// Initialize Highcharts Map module
if (typeof Highcharts === 'object') {
  HighchartsMap(Highcharts)
}

/**
 * Normalizează nume localitate pentru matching
 * Elimină diacritice, cratimă, spații multiple
 */
const normalizeLocalityName = (name) => {
  if (!name) return ''
  
  // IMPORTANT: Curățăm spațiile la început/sfârșit IMEDIAT
  let normalized = name
    .toString()
    .trim()  // ← Trim ÎNAINTE de orice altceva!
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ș|Ş/gi, 'S')
    .replace(/Ț|Ţ/gi, 'T')
    .replace(/Ă/gi, 'A')
    .replace(/Â/gi, 'A')
    .replace(/Î/gi, 'I')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')  // Spații multiple → 1 spațiu
    .trim()
  
  // Eliminăm prefixe comune din datele PNRR (cu toate variantele)
  normalized = normalized
    .replace(/^MUNICIPIUL\s+/gi, '')
    .replace(/^ORASUL\s+/gi, '')
    .replace(/^ORAS\s+/gi, '')
    .replace(/^COMUNA\s+/gi, '')
    .replace(/^SATUL\s+/gi, '')
    .trim()
  
  return normalized
}

/**
 * Creează index rapid pentru localități (o singură dată)
 * Map: "COUNTY_LOCALITY" → { lat, lon }
 * Folosește județ + localitate pentru a evita confuzii între localități cu același nume
 */
const createLocalitiesIndex = () => {
  const index = new Map()
  
  for (const loc of roLocalities) {
    const countyNorm = (loc.county || '').toUpperCase().trim()
    
    // Index pe nume cu județ
    const normalized = normalizeLocalityName(loc.name)
    const key = `${countyNorm}_${normalized}`
    index.set(key, { lat: loc.lat, lon: loc.lon, county: loc.county })
    
    // Index pe aliasuri cu județ
    if (loc.aliases) {
      for (const alias of loc.aliases) {
        const aliasNormalized = normalizeLocalityName(alias)
        const aliasKey = `${countyNorm}_${aliasNormalized}`
        index.set(aliasKey, { lat: loc.lat, lon: loc.lon, county: loc.county })
      }
    }
  }
  
  return index
}

// Creează index-ul o singură dată (la nivel global)
const localitiesIndex = createLocalitiesIndex()

/**
 * Găsește coordonate exacte pentru o localitate (RAPID cu index)
 * Caută după județ + localitate pentru a evita confuzii
 */
const findLocalityCoordinates = (localityName, countyName) => {
  if (!localityName) return null
  
  const localityNorm = normalizeLocalityName(localityName)
  
  // Dacă avem județ, caută cu județ + localitate (CORECT)
  if (countyName) {
    // Curățăm și normalizăm județul
    let countyUpper = countyName.toUpperCase()
      .replace(/Ă/g, 'A').replace(/Â/g, 'A')
      .replace(/Î/g, 'I').replace(/Ș/g, 'S')
      .replace(/Ț/g, 'T')
      .trim()
    
    // Eliminăm prefixe comune: "JUDEȚUL", "JUDETUL", "JUD.", "MUNICIPIUL"
    countyUpper = countyUpper
      .replace(/^JUDETUL\s+/g, '')
      .replace(/^JUDEȚUL\s+/g, '')
      .replace(/^JUD\.\s*/g, '')
      .replace(/^MUNICIPIUL\s+/g, '')
      .trim()
    
    // Mapare județe la coduri (pentru matching)
    const countyCodeMap = {
      'ALBA': 'AB', 'ARAD': 'AR', 'ARGES': 'AG', 'BACAU': 'BC', 'BIHOR': 'BH',
      'BISTRITA-NASAUD': 'BN', 'BOTOSANI': 'BT', 'BRASOV': 'BV', 'BRAILA': 'BR',
      'BUZAU': 'BZ', 'CARAS-SEVERIN': 'CS', 'CALARASI': 'CL', 'CLUJ': 'CJ',
      'CONSTANTA': 'CT', 'COVASNA': 'CV', 'DAMBOVITA': 'DB', 'DOLJ': 'DJ',
      'GALATI': 'GL', 'GIURGIU': 'GR', 'GORJ': 'GJ', 'HARGHITA': 'HR',
      'HUNEDOARA': 'HD', 'IALOMITA': 'IL', 'IASI': 'IS', 'ILFOV': 'IF',
      'MARAMURES': 'MM', 'MEHEDINTI': 'MH', 'MURES': 'MS', 'NEAMT': 'NT',
      'OLT': 'OT', 'PRAHOVA': 'PH', 'SATU MARE': 'SM', 'SALAJ': 'SJ',
      'SIBIU': 'SB', 'SUCEAVA': 'SV', 'TELEORMAN': 'TR', 'TIMIS': 'TM',
      'TULCEA': 'TL', 'VASLUI': 'VS', 'VALCEA': 'VL', 'VRANCEA': 'VN',
      'BUCURESTI': 'B', 'MUNICIPIUL BUCURESTI': 'B'
    }
    
    // Cazuri speciale
    if (countyUpper === 'NATIONAL' || countyUpper === 'NAȚIONAL') {
      // Proiecte naționale - folosim București ca fallback
      countyUpper = 'BUCURESTI'
    }
    
    // Încearcă să găsești codul județului
    let countyCode = null
    
    // Dacă e deja cod (2 litere), folosește direct
    if (countyUpper.length === 2) {
      countyCode = countyUpper
    } else {
      // Caută match exact în mapare (mai întâi)
      if (countyCodeMap[countyUpper]) {
        countyCode = countyCodeMap[countyUpper]
      } else {
        // Dacă nu găsim match exact, căutăm cu includes (mai permisiv)
        for (const [fullName, code] of Object.entries(countyCodeMap)) {
          if (countyUpper === fullName || countyUpper.includes(fullName) || fullName.includes(countyUpper)) {
            countyCode = code
            break
          }
        }
      }
    }
    
    // Încearcă cu codul județului
    if (countyCode) {
      const key = `${countyCode}_${localityNorm}`
      const result = localitiesIndex.get(key)
      if (result) return result
    }
  }
  
  // Fallback: caută fără județ (poate returna localitate greșită dacă există duplicate)
  // Acest fallback e doar pentru cazuri excepționale
  return null
}

/**
 * Pagină dedicată căutării semantice
 * Similar cu cautare.php de la MFE
 * 
 * Features:
 * - Căutare semantică cu sinonime
 * - Hartă cu pin-uri pe localități
 * - KPIs (valoare totală, număr proiecte, top program)
 * - Tabel cu rezultate
 * - Export CSV
 */
export default function SemanticSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const query = searchParams.get('q') || ''
  const endpoint = searchParams.get('endpoint') || 'projects'
  
  const [loading, setLoading] = useState(true)
  const [allProjects, setAllProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [mapData, setMapData] = useState(null)
  const [searchQuery, setSearchQuery] = useState(query)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [hoveredCounty, setHoveredCounty] = useState(null)
  
  // Sortare state
  const [sortColumn, setSortColumn] = useState('value')
  const [sortDirection, setSortDirection] = useState('desc')
  
  // Filtre state
  const [filterCounty, setFilterCounty] = useState('')
  const [filterLocality, setFilterLocality] = useState('')
  const [filterComponent, setFilterComponent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // Load data on mount
  useEffect(() => {
    loadData()
  }, [endpoint])
  
  // Filter data when query changes
  useEffect(() => {
    if (query && allProjects.length > 0) {
      filterData()
    }
  }, [query, allProjects])
  
  // Sync searchQuery with URL query
  useEffect(() => {
    setSearchQuery(query)
  }, [query])
  
  // Load Romania map topology
  useEffect(() => {
    const loadMap = async () => {
      try {
        const response = await fetch('https://code.highcharts.com/mapdata/countries/ro/ro-all.topo.json')
        const topology = await response.json()
        setMapData(topology)
      } catch (error) {
        console.error('Error loading map:', error)
      }
    }
    loadMap()
  }, [])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const dataService = getPNRRDataService()
      
      // Determine which endpoint to use
      const endpointType = endpoint === 'payments' ? DATA_ENDPOINTS.PAYMENTS : DATA_ENDPOINTS.PROJECTS
      
      // Load county aggregations
      const countyData = await dataService.loadData(endpointType)
      
      // Extract all projects from all counties
      const projects = []
      countyData.forEach(county => {
        if (county.extras?.rows) {
          county.extras.rows.forEach(row => {
            projects.push({
              ...row,
              countyCode: county.code || county.county?.code,
              countyName: county.name || county.county?.name,
              _uniqueId: `${row.COD_SMIS || row.contractNumber || row.NR_CONTRACT || ''}_${county.code || ''}_${Math.random().toString(36).substr(2, 9)}`
            })
          })
        }
      })
      
      setAllProjects(projects)
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }
  
  const filterData = () => {
    const matcher = createSemanticMatcher(query)
    
    const filtered = allProjects.filter(project => {
      // Search in multiple fields
      const searchableFields = [
        project.SCOP_PROIECT || project.Scop_Proiect || project.title || '',
        project.DENUMIRE_BENEFICIAR || project.beneficiaryName || '',
        project.COMPONENTA || project.componentLabel || '',
        project.LOCALIZARE_LOCALITATE || project.locality || '',
        project.COD_SMIS || project.contractNumber || ''
      ]
      
      return searchableFields.some(field => matcher(field))
    })
    
    setFilteredProjects(filtered)
  }
  
  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalValue = filteredProjects.reduce((sum, p) => {
      // Try different value fields
      const value = p.__share_value || p.valoare_fe || p.value || 0
      return sum + Number(value)
    }, 0)
    const totalCount = filteredProjects.length
    
    // Calculate top program
    const programCounts = {}
    filteredProjects.forEach(p => {
      const program = p.__program_key || p.PROGRAMUL || 'OTHER'
      programCounts[program] = (programCounts[program] || 0) + 1
    })
    
    let topProgram = null
    let maxCount = 0
    Object.entries(programCounts).forEach(([program, count]) => {
      if (count > maxCount) {
        topProgram = program
        maxCount = count
      }
    })
    
    return {
      totalValue,
      totalCount,
      topProgram,
      topProgramCount: maxCount
    }
  }, [filteredProjects])
  
  const handleBackToMap = () => {
    navigate('/')
  }
  
  const handleNewSearch = (newQuery = searchQuery) => {
    if (!newQuery.trim()) return
    
    // Update URL with new query
    setSearchParams({ q: newQuery, endpoint })
  }
  
  const exampleTerms = ['apă uzată', 'spital', 'drum', 'energie', 'școală']
  
  // Get unique values for filters
  const uniqueCounties = useMemo(() => {
    const values = new Set()
    filteredProjects.forEach(p => {
      const county = p.countyName || p.JUDET_IMPLEMENTARE
      if (county) values.add(county)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ro'))
  }, [filteredProjects])
  
  const uniqueLocalities = useMemo(() => {
    const values = new Set()
    filteredProjects.forEach(p => {
      // Apply county filter
      if (filterCounty) {
        const county = p.countyName || p.JUDET_IMPLEMENTARE
        if (county !== filterCounty) return
      }
      
      const locality = p.LOCALIZARE_LOCALITATE || p.locality
      if (locality) values.add(locality)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ro'))
  }, [filteredProjects, filterCounty])
  
  const uniqueComponents = useMemo(() => {
    const values = new Set()
    filteredProjects.forEach(p => {
      const component = p.COD_COMPONENTA || p.component
      if (component) values.add(component)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ro'))
  }, [filteredProjects])
  
  const uniqueStatuses = useMemo(() => {
    const values = new Set()
    filteredProjects.forEach(p => {
      const status = p.STADIU || p.status
      if (status) values.add(status)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ro'))
  }, [filteredProjects])
  
  // Apply dropdown filters
  const filteredByDropdowns = useMemo(() => {
    return filteredProjects.filter(project => {
      // County filter
      if (filterCounty) {
        const county = project.countyName || project.JUDET_IMPLEMENTARE || ''
        if (county !== filterCounty) return false
      }
      
      // Locality filter
      if (filterLocality) {
        const locality = project.LOCALIZARE_LOCALITATE || project.locality || ''
        if (locality !== filterLocality) return false
      }
      
      // Component filter
      if (filterComponent) {
        const component = project.COD_COMPONENTA || project.component || ''
        if (component !== filterComponent) return false
      }
      
      // Status filter
      if (filterStatus) {
        const status = project.STADIU || project.status || ''
        if (status !== filterStatus) return false
      }
      
      return true
    })
  }, [filteredProjects, filterCounty, filterLocality, filterComponent, filterStatus])
  
  // Sort projects
  const sortedProjects = useMemo(() => {
    if (!sortColumn) return filteredByDropdowns
    
    return [...filteredByDropdowns].sort((a, b) => {
      let aVal, bVal
      
      switch(sortColumn) {
        case 'title':
          aVal = a.DENUMIRE_PROIECT || a.SCOP_PROIECT || a.title || ''
          bVal = b.DENUMIRE_PROIECT || b.SCOP_PROIECT || b.title || ''
          break
        case 'beneficiary':
          aVal = a.BENEFICIAR || a.DENUMIRE_BENEFICIAR || ''
          bVal = b.BENEFICIAR || b.DENUMIRE_BENEFICIAR || ''
          break
        case 'county':
          aVal = a.countyName || a.JUDET_IMPLEMENTARE || ''
          bVal = b.countyName || b.JUDET_IMPLEMENTARE || ''
          break
        case 'locality':
          aVal = a.LOCALIZARE_LOCALITATE || a.locality || ''
          bVal = b.LOCALIZARE_LOCALITATE || b.locality || ''
          break
        case 'component':
          aVal = a.COD_COMPONENTA || a.component || ''
          bVal = b.COD_COMPONENTA || b.component || ''
          break
        case 'status':
          aVal = a.STADIU || a.status || ''
          bVal = b.STADIU || b.status || ''
          break
        case 'value':
          aVal = a.__share_value || a.valoare_fe || a.value || 0
          bVal = b.__share_value || b.valoare_fe || b.value || 0
          break
        default:
          return 0
      }
      
      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      // String comparison (case-insensitive, Romanian locale)
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr, 'ro')
      } else {
        return bStr.localeCompare(aStr, 'ro')
      }
    })
  }, [filteredByDropdowns, sortColumn, sortDirection])
  
  // Get projects to display in table (filtered by pin selection)
  const displayedProjects = useMemo(() => {
    if (selectedProjectId !== null) {
      // Găsește proiect după ID (funcționează și după sortare!)
      const selected = sortedProjects.find(p => p._uniqueId === selectedProjectId)
      return selected ? [selected] : []
    }
    // Show first 50 from SORTED projects
    return sortedProjects.slice(0, 50)
  }, [sortedProjects, selectedProjectId])
  
  // Handle sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  
  // Handle pin click - filter table to show only selected project
  const handlePinClick = useCallback((projectId) => {
    if (selectedProjectId === projectId) {
      // Deselect - show all projects
      setSelectedProjectId(null)
    } else {
      // Select - show only this project
      setSelectedProjectId(projectId)
      
      // Scroll to table
      setTimeout(() => {
        const tableElement = document.querySelector('.projects-table-container')
        if (tableElement) {
          tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [selectedProjectId])
  
  // Prepare map options with pins
  const mapOptions = useMemo(() => {
    if (!mapData || sortedProjects.length === 0) return null
    
    // Create 1 pin per project (no aggregation) - folosește sortedProjects pentru a include filtrele
    const projectPins = sortedProjects.map((project) => {
      const locality = project.LOCALIZARE_LOCALITATE || project.locality || 'Necunoscut'
      const countyName = project.countyName || project.JUDET_IMPLEMENTARE || project.county?.name || ''
      const value = project.__share_value || project.valoare_fe || project.value || 0
      const smis = project.COD_SMIS || project.contractNumber || ''
      const projectName = project.DENUMIRE_PROIECT || project.projectName || 'Proiect'
      const beneficiary = project.BENEFICIAR || project.beneficiary || ''
      
      return {
        locality,
        county: countyName,
        value: Number(value),
        smis,
        projectName,
        beneficiary,
        uniqueId: project._uniqueId  // ID unic pentru identificare
      }
    })
    
    // County center coordinates (approximate centers of Romanian counties)
    const countyCoords = {
      'ALBA': [46.07, 23.58], 'ARAD': [46.18, 21.32], 'ARGEȘ': [44.85, 24.87],
      'BACĂU': [46.57, 26.91], 'BIHOR': [47.05, 22.10], 'BISTRIȚA-NĂSĂUD': [47.13, 24.50],
      'BOTOȘANI': [47.75, 26.66], 'BRAȘOV': [45.65, 25.60], 'BRĂILA': [45.27, 27.97],
      'BUZĂU': [45.15, 26.82], 'CARAȘ-SEVERIN': [45.30, 22.00], 'CĂLĂRAȘI': [44.20, 27.33],
      'CLUJ': [46.77, 23.60], 'CONSTANȚA': [44.18, 28.63], 'COVASNA': [45.85, 26.18],
      'DÂMBOVIȚA': [44.93, 25.45], 'DOLJ': [44.32, 23.80], 'GALAȚI': [45.43, 28.05],
      'GIURGIU': [43.90, 25.97], 'GORJ': [45.04, 23.28], 'HARGHITA': [46.36, 25.80],
      'HUNEDOARA': [45.88, 22.90], 'IALOMIȚA': [44.57, 27.37], 'IAȘI': [47.16, 27.59],
      'ILFOV': [44.55, 26.22], 'MARAMUREȘ': [47.66, 23.58], 'MEHEDINȚI': [44.63, 22.66],
      'MUREȘ': [46.54, 24.56], 'NEAMȚ': [46.98, 26.38], 'OLT': [44.43, 24.36],
      'PRAHOVA': [45.10, 26.02], 'SATU MARE': [47.79, 22.88], 'SĂLAJ': [47.18, 23.05],
      'SIBIU': [45.79, 24.15], 'SUCEAVA': [47.65, 25.62], 'TELEORMAN': [43.98, 25.33],
      'TIMIȘ': [45.75, 21.23], 'TULCEA': [45.18, 28.80], 'VASLUI': [46.64, 27.73],
      'VÂLCEA': [45.10, 24.37], 'VRANCEA': [45.70, 27.18], 'BUCUREȘTI': [44.43, 26.10]
    }
    
    // Romania bounds (based on actual locality data + safety margin for random offset)
    const romaniaBounds = {
      minLat: 43.70, maxLat: 48.20,  // +0.05 margin south, exact north (48.24 max in data)
      minLon: 20.35, maxLon: 29.65   // +0.05 margin west, exact east (29.66 max in data)
    }
    
    // Create pin data points - 1 pin per project
    const pins = projectPins.map((proj) => {
      // Default to center of Romania as fallback
      let lat = 45.94, lon = 24.97
      
      // Try to find exact locality coordinates with county matching
      const localityCoords = findLocalityCoordinates(proj.locality, proj.county)
      
      if (localityCoords) {
        // Use exact locality coordinates
        lat = localityCoords.lat
        lon = localityCoords.lon
      } else {
        // Fallback to county center with small random offset
        const countyUpper = proj.county.toUpperCase()
          .replace(/Ă/g, 'A').replace(/Â/g, 'A')
          .replace(/Î/g, 'I').replace(/Ș/g, 'S')
          .replace(/Ț/g, 'T')
        
        // Try to find county coordinates
        for (const [countyKey, coords] of Object.entries(countyCoords)) {
          const keyNorm = countyKey.replace(/Ă/g, 'A').replace(/Â/g, 'A')
            .replace(/Î/g, 'I').replace(/Ș/g, 'S').replace(/Ț/g, 'T')
          
          if (countyUpper.includes(keyNorm) || keyNorm.includes(countyUpper) || countyUpper === keyNorm) {
            // Use county center with very small offset to avoid complete overlap
            // ±0.02 degrees = ~2 km (much better than previous ±22 km)
            lat = coords[0] + (Math.random() - 0.5) * 0.04
            lon = coords[1] + (Math.random() - 0.5) * 0.04
            break
          }
        }
      }
      
      // Clamp coordinates within Romania bounds (safety check)
      lat = Math.max(romaniaBounds.minLat, Math.min(romaniaBounds.maxLat, lat))
      lon = Math.max(romaniaBounds.minLon, Math.min(romaniaBounds.maxLon, lon))
      
      return {
        name: proj.projectName,
        locality: proj.locality,
        county: proj.county,
        lat,
        lon,
        geometry: {
          type: 'Point',
          coordinates: [lon, lat]  // Highcharts Maps expects [longitude, latitude]
        },
        value: proj.value,
        smis: proj.smis,
        beneficiary: proj.beneficiary,
        projectId: proj.uniqueId,  // Store ID for click handling
        marker: {
          radius: selectedProjectId === proj.uniqueId ? 8 : 5,  // Pin mai mare când e selectat
          fillColor: selectedProjectId === proj.uniqueId ? '#10b981' : '#ef4444',  // Verde când e selectat
          lineColor: '#fff',
          lineWidth: selectedProjectId === proj.uniqueId ? 3 : 2
        },
        dataLabels: {
          enabled: false
        }
      }
    })
    
    return {
      chart: {
        map: mapData,
        backgroundColor: 'transparent',
        spacing: [0, 0, 0, 0]
      },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      mapNavigation: {
        enabled: false
      },
      tooltip: {
        useHTML: true,
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        style: {
          fontSize: '13px'
        },
        formatter: function() {
          return `<div style="font-weight: 700; margin-bottom: 6px; max-width: 300px;">${this.point.name}</div>` +
                 (this.point.beneficiary ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Beneficiar: ${this.point.beneficiary}</div>` : '') +
                 (this.point.locality ? `<div style="font-size: 12px; color: #64748b;">Localitate: ${this.point.locality}, ${this.point.county}</div>` : '') +
                 `<div style="margin-top: 4px;">Valoare: <b>${fmtMoney(this.point.value, 'EUR')}</b></div>` +
                 (this.point.smis ? `<div style="margin-top: 4px; font-size: 11px; color: #64748b;">SMIS: ${this.point.smis}</div>` : '')
        }
      },
      series: [{
        name: 'România',
        borderColor: '#cbd5e1',
        borderWidth: 1.5,
        nullColor: '#f8fafc',
        showInLegend: false,
        enableMouseTracking: true,
        states: {
          hover: {
            color: '#e0f2fe',
            borderColor: '#0ea5e9',
            borderWidth: 2
          },
          inactive: {
            opacity: 0.1  // Fade out non-hovered counties
          }
        },
        dataLabels: {
          enabled: true,
          format: '{point.properties.hc-a2}',  // County code (BV, SV, etc.)
          allowOverlap: true,  // Allow labels to overlap with pins
          style: {
            fontSize: '16px',
            fontWeight: '700',
            color: '#64748b',
            textOutline: '2px white',
            opacity: 0.6,
            pointerEvents: 'none'  // Labels don't block mouse events
          },
          states: {
            hover: {
              style: {
                color: '#0ea5e9',
                opacity: 1,
                fontSize: '18px'
              }
            }
          }
        },
        point: {
          events: {
            mouseOver: function(e) {
              // Only trigger if hovering directly on county (not on pins)
              if (e.target && e.target.point && e.target.point.series.name === 'România') {
                // Highlight only this county, fade others
                const chart = this.series.chart
                chart.series[0].points.forEach(point => {
                  if (point !== this) {
                    point.setState('inactive')
                  } else {
                    point.setState('hover')
                  }
                })
              }
            },
            mouseOut: function(e) {
              // Only reset if leaving county (not moving to pin)
              if (e.target && e.target.point && e.target.point.series.name === 'România') {
                // Reset all counties to normal state
                const chart = this.series.chart
                chart.series[0].points.forEach(point => {
                  point.setState('')
                })
              }
            }
          }
        }
      }, {
        type: 'mappoint',
        name: 'Proiecte',
        color: '#ef4444',
        data: pins,
        zIndex: 10,  // Pins above counties and labels
        dataLabels: {
          enabled: false
        },
        cursor: 'pointer',
        enableMouseTracking: true,  // Keep tooltip on pins
        stickyTracking: false,  // Don't stick to pins
        states: {
          hover: {
            enabled: true  // Allow pin hover
          },
          inactive: {
            enabled: false  // Pins are NEVER faded out
          }
        },
        point: {
          events: {
            click: function() {
              // Handle pin click - scroll to project
              if (this.projectId !== undefined) {
                handlePinClick(this.projectId)
              }
            },
            mouseOver: function(e) {
              // Prevent county fade when hovering pins
              // Stop event propagation to county layer
              if (e.stopPropagation) e.stopPropagation()
              
              // Ensure all counties stay in normal state
              const chart = this.series.chart
              if (chart.series[0]) {
                chart.series[0].points.forEach(point => {
                  point.setState('')  // Reset to normal
                })
              }
              
              return true  // Show pin tooltip
            },
            mouseOut: function(e) {
              // Prevent event propagation
              if (e.stopPropagation) e.stopPropagation()
              return true
            }
          }
        }
      }]
    }
  }, [mapData, sortedProjects, handlePinClick, selectedProjectId])
  
  return (
    <div className="semantic-search-page">
      {/* Header */}
      <header style={{
        padding: '20px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={handleBackToMap}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#0ea5e9',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            ← Înapoi
          </button>
          
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: '#0f172a'
          }}>
            Harta tematică – „{query}"
          </h1>
          
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0
          }}>
            Selectăm proiectele în care apare expresia „{query}" (cu/fără diacritice)
          </p>
        </div>
      </header>
      
      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 40px' }}>
        
        {/* KPIs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
              Total valoare (EUR)
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
              {fmtMoney(kpis.totalValue, 'EUR')}
            </div>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
              suma valorilor proiectelor selectate
            </div>
          </div>
          
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
              Număr proiecte
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
              {fmtNum(kpis.totalCount)}
            </div>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
              intrări unice care potrivesc query-ul
            </div>
          </div>
          
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
              Top program
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
              {kpis.topProgram || '—'}
            </div>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
              {kpis.topProgramCount > 0 ? `${kpis.topProgramCount} proiecte` : 'Niciun proiect găsit'}
            </div>
          </div>
        </div>
        
        {/* Hartă cu pin-uri */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px'
        }}>
          {mapOptions ? (
            <>
              <div style={{ height: '700px', width: '100%', minHeight: '700px' }}>
                <HighchartsReact
                  highcharts={Highcharts}
                  constructorType={'mapChart'}
                  options={mapOptions}
                  containerProps={{ style: { height: '100%', width: '100%' } }}
                />
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                Click pe pin → detalii localitate
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              {loading ? 'Se încarcă harta...' : 'Nicio locație găsită'}
            </div>
          )}
        </div>
        
        {/* Căutare nouă */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Ex: apă uzată, spital, drum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleNewSearch()
              }}
              style={{
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                flex: 1,
                minWidth: '200px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <button
              onClick={() => handleNewSearch()}
              style={{
                padding: '12px 28px',
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
          
          {/* Exemple quick search */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '13px',
            color: '#64748b',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontWeight: '500' }}>Exemple:</span>
            {exampleTerms.map(term => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term)
                  handleNewSearch(term)
                }}
                style={{
                  padding: '6px 12px',
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
        
        {/* Filtre Dropdown */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>🔍 Filtrează rezultatele</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Județ Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>📍 Județ</label>
              <select
                value={filterCounty}
                onChange={(e) => {
                  setFilterCounty(e.target.value)
                  setFilterLocality('')  // Reset locality when county changes
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="">Toate județele</option>
                {uniqueCounties.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>
            
            {/* Localitate Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>🏘️ Localitate</label>
              <select
                value={filterLocality}
                onChange={(e) => setFilterLocality(e.target.value)}
                disabled={!filterCounty}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: filterCounty ? '#fff' : '#f8fafc',
                  cursor: filterCounty ? 'pointer' : 'not-allowed',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: filterCounty ? 1 : 0.6
                }}
                onFocus={(e) => filterCounty && (e.target.style.borderColor = '#0ea5e9')}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="">{filterCounty ? `Toate localitățile din ${filterCounty}` : '⚠️ Selectează mai întâi județul'}</option>
                {uniqueLocalities.map(locality => (
                  <option key={locality} value={locality}>{locality}</option>
                ))}
              </select>
            </div>
            
            {/* Componentă Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>🎯 Componentă</label>
              <select
                value={filterComponent}
                onChange={(e) => setFilterComponent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="">Toate componentele</option>
                {uniqueComponents.map(component => (
                  <option key={component} value={component}>{component}</option>
                ))}
              </select>
            </div>
            
            {/* Stadiu Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>📊 Stadiu</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              >
                <option value="">Toate stadiile</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Reset Filters Button */}
          {(filterCounty || filterLocality || filterComponent || filterStatus) && (
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={() => {
                  setFilterCounty('')
                  setFilterLocality('')
                  setFilterComponent('')
                  setFilterStatus('')
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#475569',
                  fontWeight: '500',
                  transition: 'all 0.2s'
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
                ✕ Resetează filtrele
              </button>
            </div>
          )}
        </div>
        
        {/* Tabel rezultate */}
        <div className="projects-table-container" style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Proiecte – „{query}"
            </h2>
            {selectedProjectId !== null && (
              <button
                onClick={() => setSelectedProjectId(null)}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#475569',
                  fontWeight: '500'
                }}
              >
                ✕ Arată toate
              </button>
            )}
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
              <p style={{ color: '#64748b' }}>Se încarcă datele...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '16px', color: '#64748b' }}>Niciun proiect găsit pentru „{query}"</p>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
                Încercați un alt termen de căutare sau verificați ortografia.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop: Tabel clasic cu 7 coloane + sortare */}
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th 
                        onClick={() => handleSort('title')}
                        style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          fontWeight: '600', 
                          color: sortColumn === 'title' ? '#0ea5e9' : '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#0ea5e9'}
                        onMouseLeave={(e) => e.target.style.color = sortColumn === 'title' ? '#0ea5e9' : '#64748b'}
                      >
                        Proiect
                        {sortColumn === 'title' && (
                          <span style={{ marginLeft: '6px' }}>
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        onClick={() => handleSort('beneficiary')}
                        style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          fontWeight: '600', 
                          color: sortColumn === 'beneficiary' ? '#0ea5e9' : '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#0ea5e9'}
                        onMouseLeave={(e) => e.target.style.color = sortColumn === 'beneficiary' ? '#0ea5e9' : '#64748b'}
                      >
                        Beneficiar
                        {sortColumn === 'beneficiary' && (
                          <span style={{ marginLeft: '6px' }}>
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        onClick={() => handleSort('county')}
                        style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          fontWeight: '600', 
                          color: sortColumn === 'county' ? '#0ea5e9' : '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#0ea5e9'}
                        onMouseLeave={(e) => e.target.style.color = sortColumn === 'county' ? '#0ea5e9' : '#64748b'}
                      >
                        Județ
                        {sortColumn === 'county' && (
                          <span style={{ marginLeft: '6px' }}>
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        onClick={() => handleSort('locality')}
                        style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          fontWeight: '600', 
                          color: sortColumn === 'locality' ? '#0ea5e9' : '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#0ea5e9'}
                        onMouseLeave={(e) => e.target.style.color = sortColumn === 'locality' ? '#0ea5e9' : '#64748b'}
                      >
                        Localitate
                        {sortColumn === 'locality' && (
                          <span style={{ marginLeft: '6px' }}>
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        onClick={() => handleSort('component')}
                        style={{ 
                          padding: '12px', 
                          textAlign: 'center', 
                          fontWeight: '600', 
                          color: sortColumn === 'component' ? '#0ea5e9' : '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#0ea5e9'}
                        onMouseLeave={(e) => e.target.style.color = sortColumn === 'component' ? '#0ea5e9' : '#64748b'}
                      >
                        Componentă
                        {sortColumn === 'component' && (
                          <span style={{ marginLeft: '6px' }}>
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        onClick={() => handleSort('status')}
                        style={{ 
                          padding: '12px', 
                          textAlign: 'center', 
                          fontWeight: '600', 
                          color: sortColumn === 'status' ? '#0ea5e9' : '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#0ea5e9'}
                        onMouseLeave={(e) => e.target.style.color = sortColumn === 'status' ? '#0ea5e9' : '#64748b'}
                      >
                        Stadiu
                        {sortColumn === 'status' && (
                          <span style={{ marginLeft: '6px' }}>
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                      <th 
                        onClick={() => handleSort('value')}
                        style={{ 
                          padding: '12px', 
                          textAlign: 'right', 
                          fontWeight: '600', 
                          color: sortColumn === 'value' ? '#0ea5e9' : '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#0ea5e9'}
                        onMouseLeave={(e) => e.target.style.color = sortColumn === 'value' ? '#0ea5e9' : '#64748b'}
                      >
                        Valoare (EUR)
                        {sortColumn === 'value' && (
                          <span style={{ marginLeft: '6px' }}>
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProjects.map((project, index) => {
                      const title = project.DENUMIRE_PROIECT || project.SCOP_PROIECT || project.title || 'N/A'
                      const beneficiary = project.BENEFICIAR || project.DENUMIRE_BENEFICIAR || 'N/A'
                      const county = project.countyName || project.JUDET_IMPLEMENTARE || 'N/A'
                      const locality = project.LOCALIZARE_LOCALITATE || project.locality || 'N/A'
                      const component = project.COD_COMPONENTA || project.component || '-'
                      const status = project.STADIU || project.status || '-'
                      const value = project.__share_value || project.valoare_fe || project.value || 0
                      
                      return (
                        <tr 
                          key={project._uniqueId || index} 
                          style={{ 
                            borderBottom: '1px solid #f1f5f9',
                            background: selectedProjectId === project._uniqueId ? '#dbeafe' : '#fff',
                            borderLeft: selectedProjectId === project._uniqueId ? '4px solid #0ea5e9' : 'none'
                          }}
                        >
                          <td style={{ padding: '12px', maxWidth: '400px' }}>
                            <div style={{ 
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              color: '#0f172a',
                              fontSize: '13px',
                              fontWeight: '500',
                              lineHeight: '1.4'
                            }}>
                              {title}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#475569', fontSize: '13px', maxWidth: '200px' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {beneficiary}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#0f172a', fontSize: '13px' }}>{county}</td>
                          <td style={{ padding: '12px', color: '#0f172a', fontSize: '13px' }}>{locality}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>{component}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#0f172a' }}>{status}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#0f172a', fontSize: '14px', whiteSpace: 'nowrap' }}>
                            {value ? `${(value / 1000000).toFixed(2)} mil EUR` : '0.00 mil EUR'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile: Carduri */}
              <div className="mobile-only" style={{ flexDirection: 'column', gap: '16px' }}>
                {displayedProjects.map((project, index) => {
                const title = project.DENUMIRE_PROIECT || project.SCOP_PROIECT || project.title || 'N/A'
                const beneficiary = project.BENEFICIAR || project.DENUMIRE_BENEFICIAR || 'N/A'
                const locality = project.LOCALIZARE_LOCALITATE || project.locality || 'N/A'
                const county = project.countyName || project.JUDET_IMPLEMENTARE || 'N/A'
                const value = project.__share_value || project.valoare_fe || project.value || 0
                const smis = project.COD_SMIS || project.contractNumber || ''
                const component = project.COD_COMPONENTA || project.component || ''
                const measure = project.COD_MASURA || project.measure || ''
                const status = project.STADIU || project.status || ''
                const fundingSource = project.SURSA_FINANTARE || project.fundingSource || 'Grant/loan'
                
                return (
                  <div 
                    key={index} 
                    id={`project-${index}`}
                    style={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Titlu proiect */}
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#0f172a',
                      marginBottom: '12px',
                      lineHeight: '1.4',
                      textTransform: 'uppercase'
                    }}>
                      {title}
                    </h3>
                    
                    {/* Valoare */}
                    <div style={{
                      background: '#d1fae5',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: '#059669'
                      }}>
                        {fmtMoney(value, 'EUR')}
                      </div>
                    </div>
                    
                    {/* Beneficiar */}
                    <div style={{
                      borderLeft: '3px solid #3b82f6',
                      paddingLeft: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                        BENEFICIAR
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                        {beneficiary}
                      </div>
                    </div>
                    
                    {/* Grid 2 coloane */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      fontSize: '13px'
                    }}>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '4px' }}>JUDEȚ</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{county}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '4px' }}>SURSĂ FINANȚARE</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{fundingSource}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '4px' }}>STADIU</div>
                        <div style={{ fontWeight: '600', color: status.includes('IMPLEMENTARE') ? '#10b981' : '#0f172a' }}>
                          {status || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '4px' }}>LOCALITATE</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{locality}</div>
                      </div>
                      {component && (
                        <div>
                          <div style={{ color: '#64748b', marginBottom: '4px' }}>COD COMPONENTĂ</div>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{component}</div>
                        </div>
                      )}
                      {measure && (
                        <div>
                          <div style={{ color: '#64748b', marginBottom: '4px' }}>COD MĂSURĂ</div>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{measure}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* SMIS */}
                    {smis && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #f1f5f9',
                        fontSize: '11px',
                        color: '#64748b'
                      }}>
                        SMIS: {smis}
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
              
              {selectedProjectId === null && sortedProjects.length > 50 && (
                <div style={{ marginTop: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Afișate primele 50 din {fmtNum(sortedProjects.length)} proiecte găsite
                </div>
              )}
              
              {selectedProjectId !== null && (
                <div style={{ marginTop: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Afișat 1 proiect selectat din {fmtNum(sortedProjects.length)} proiecte găsite
                </div>
              )}
            </>
          )}
        </div>
        
      </div>
    </div>
  )
}
