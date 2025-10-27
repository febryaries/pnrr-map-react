import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMap from 'highcharts/modules/map'
import { createSemanticMatcher } from '../utils/semanticSearch'
import { fmtMoney, fmtNum } from '../data/data'
import { getPNRRDataService } from '../services/PNRRDataService'
import { DATA_ENDPOINTS } from '../constants/PNRRConstants'
import '../App.css'

// Initialize Highcharts Map module
if (typeof Highcharts === 'object') {
  HighchartsMap(Highcharts)
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const query = searchParams.get('q') || ''
  const endpoint = searchParams.get('endpoint') || 'projects'
  
  const [loading, setLoading] = useState(true)
  const [allProjects, setAllProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [mapData, setMapData] = useState(null)
  
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
              countyName: county.name || county.county?.name
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
  
  // Prepare map options with pins
  const mapOptions = useMemo(() => {
    if (!mapData || filteredProjects.length === 0) return null
    
    // Aggregate projects by locality to create pins (1 pin per locality)
    const localityMap = new Map()
    
    filteredProjects.forEach(project => {
      const locality = project.LOCALIZARE_LOCALITATE || project.locality || 'Necunoscut'
      const countyName = project.countyName || project.JUDET_IMPLEMENTARE || project.county?.name || ''
      const value = project.__share_value || project.valoare_fe || project.value || 0
      const smis = project.COD_SMIS || project.contractNumber || ''
      
      // Use locality + county as unique key
      const key = `${locality}|${countyName}`.toUpperCase()
      
      if (!localityMap.has(key)) {
        localityMap.set(key, {
          locality: locality,
          county: countyName,
          value: 0,
          count: 0,
          smis: []
        })
      }
      
      const loc = localityMap.get(key)
      loc.value += Number(value)
      loc.count += 1
      if (smis && !loc.smis.includes(smis)) {
        loc.smis.push(smis)
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
    
    // Create pin data points - 1 pin per locality
    const pins = Array.from(localityMap.values()).map((loc) => {
      // Match county name to coordinates
      let lat = 45.94, lon = 24.97 // Center of Romania as fallback
      
      const countyUpper = loc.county.toUpperCase()
        .replace(/Ă/g, 'A').replace(/Â/g, 'A')
        .replace(/Î/g, 'I').replace(/Ș/g, 'S')
        .replace(/Ț/g, 'T')
      
      // Try to find county coordinates
      for (const [countyKey, coords] of Object.entries(countyCoords)) {
        const keyNorm = countyKey.replace(/Ă/g, 'A').replace(/Â/g, 'A')
          .replace(/Î/g, 'I').replace(/Ș/g, 'S').replace(/Ț/g, 'T')
        
        if (countyUpper.includes(keyNorm) || keyNorm.includes(countyUpper) || countyUpper === keyNorm) {
          // Add random offset so multiple localities in same county don't overlap
          lat = coords[0] + (Math.random() - 0.5) * 0.4
          lon = coords[1] + (Math.random() - 0.5) * 0.4
          break
        }
      }
      
      return {
        name: `${loc.locality}${loc.county ? `, ${loc.county}` : ''}`,
        locality: loc.locality,
        county: loc.county,
        lat,
        lon,
        value: loc.value,
        count: loc.count,
        smis: loc.smis,
        marker: {
          radius: Math.min(10, 4 + Math.log(loc.count + 1)),
          fillColor: '#ef4444',
          lineColor: '#fff',
          lineWidth: 2
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
        enabled: true,
        enableDoubleClickZoomTo: true,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
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
          const smisList = this.point.smis.slice(0, 3).join(', ')
          const moreSmis = this.point.smis.length > 3 ? `, +${this.point.smis.length - 3} altele` : ''
          
          return `<div style="font-weight: 700; margin-bottom: 6px;">${this.point.locality || this.point.name}</div>` +
                 (this.point.county ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Județul ${this.point.county}</div>` : '') +
                 `<div>Proiecte: <b>${this.point.count}</b></div>` +
                 `<div>Valoare: <b>${fmtMoney(this.point.value, 'EUR')}</b></div>` +
                 (this.point.smis.length > 0 ? `<div style="margin-top: 4px; font-size: 11px; color: #64748b;">SMIS: ${smisList}${moreSmis}</div>` : '')
        }
      },
      series: [{
        name: 'România',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        nullColor: '#f8fafc',
        showInLegend: false,
        enableMouseTracking: false
      }, {
        type: 'mappoint',
        name: 'Proiecte',
        color: '#ef4444',
        data: pins,
        dataLabels: {
          enabled: false
        }
      }]
    }
  }, [mapData, filteredProjects])
  
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
        
        {/* Tabel rezultate */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#0f172a' }}>
            Proiecte – „{query}"
          </h2>
          
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
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Proiect</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Beneficiar</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Localitate</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Valoare (EUR)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.slice(0, 50).map((project, index) => {
                    const title = project.SCOP_PROIECT || project.Scop_Proiect || project.title || 'N/A'
                    const beneficiary = project.DENUMIRE_BENEFICIAR || project.beneficiaryName || 'N/A'
                    const locality = project.LOCALIZARE_LOCALITATE || project.locality || project.countyName || 'N/A'
                    const value = project.__share_value || project.valoare_fe || project.value || 0
                    
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', maxWidth: '300px' }}>
                          <div style={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#0f172a'
                          }}>
                            {title}
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#475569' }}>{beneficiary}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{locality}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                          {fmtMoney(value, 'EUR')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {filteredProjects.length > 50 && (
                <div style={{ marginTop: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Afișate primele 50 din {fmtNum(filteredProjects.length)} proiecte găsite
                </div>
              )}
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}
