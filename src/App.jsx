import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import MapView from './components/MapView'
import CountyDetails from './components/CountyDetails'
import SemanticSearchPage from './pages/SemanticSearchPage'
import TimelinePage from './pages/TimelinePage'
import { mockData } from './data/data'
import { useDataEndpoint } from './hooks/useDataEndpoint'
import { FALLBACK_DATA_DATE } from './constants/PNRRConstants'
import { useAvailableDates } from './hooks/useAvailableDates'
import './App.css'

function App() {
  const location = useLocation()
  const [currentView, setCurrentView] = useState('map') // 'map' or 'county'
  const [selectedCounty, setSelectedCounty] = useState(null)
  const [isLoadingCounty, setIsLoadingCounty] = useState(false)
  const [viewMode, setViewMode] = useState('total') // 'general', 'multi', 'total', 'program'
  const [metric, setMetric] = useState('value') // 'value' or 'projects'
  const [activeProgram, setActiveProgram] = useState(null)
  const [data, setData] = useState(mockData)
  const [useRealData, setUseRealData] = useState(false)
  const [useMockData, setUseMockData] = useState(false) // Force mock data for testing
  const [currency, setCurrency] = useState('EUR') // 'EUR' or 'RON'
  // Use available dates hook for dynamic date management
  const { availableDates, isLoading: isLoadingDates, latestDate } = useAvailableDates(true)
  
  // Selected data date - use latest from contains.json or fallback
  const [dataDate, setDataDate] = useState(FALLBACK_DATA_DATE)

  // Update dataDate when latestDate becomes available
  useEffect(() => {
    if (latestDate) {
      setDataDate(latestDate)
    }
  }, [latestDate])

  // Use the data endpoint hook with dataDate
  const { 
    endpoint, 
    isLoading: isLoadingRealData, 
    error: dataError, 
    fetchData, 
    switchEndpoint, 
    endpointInfo,
    isInitialLoading,
    initialLoadError
  } = useDataEndpoint(dataDate)

  // Load real data when endpoint changes (initial load is handled by useDataEndpoint)
  useEffect(() => {
    const loadRealData = async () => {
      // If mock data is forced, use it
      if (useMockData) {
        setData(mockData)
        setUseRealData(false)
        return
      }
      
      try {
        const realData = await fetchData()
        if (realData && realData.length > 0) {
          setData(realData)
          setUseRealData(true)
        } else {
          setData(mockData)
          setUseRealData(false)
        }
      } catch (error) {
        console.warn('Failed to load real data, using mock data:', error)
        setData(mockData)
        setUseRealData(false)
      }
    }
    
    // Only load if not initializing (to avoid duplicate loads)
    if (!isInitialLoading) {
      loadRealData()
    }
  }, [endpoint, fetchData, useMockData, isInitialLoading])

  const handleCountyClick = (countyCode, countyName) => {
    // Scroll to top when opening county details
    window.scrollTo(0, 0)
    
    // Special handling for NATIONAL - create a fake county object
    if (countyCode === 'NATIONAL') {
      const nationalCounty = {
        county: {
          code: 'NATIONAL',
          name: 'Proiecte Naționale'
        },
        code: 'NATIONAL',
        name: 'Proiecte Naționale',
        total: {
          value: 0,
          projects: 0
        },
        programs: {},
        components: {},
        extras: {
          rows: []
        }
      }
      setIsLoadingCounty(true)
      setSelectedCounty(nationalCounty)
      setCurrentView('county')
      return
    }
    
    // Convert BH → RO-BH if needed
    const searchCode = countyCode.startsWith('RO-') ? countyCode : `RO-${countyCode}`;
    
    const county = data.find(c => (c.county?.code || c.code) === searchCode)
    
    if (county) {
      setIsLoadingCounty(true)
      setSelectedCounty(county)
      setCurrentView('county')
    }
  }

  const handleBackToMap = () => {
    // Scroll to top when returning to map
    window.scrollTo(0, 0)
    setCurrentView('map')
    setSelectedCounty(null)
  }

  // Handle county selection from Timeline
  useEffect(() => {
    if (location.state?.openCounty) {
      // Switch to payments if requested
      if (location.state.switchToPayments && endpoint !== 'payments') {
        switchEndpoint('payments')
        // Wait longer for data to load after endpoint switch
        setTimeout(() => {
          handleCountyClick(location.state.openCounty)
          // Clear state
          window.history.replaceState({}, document.title)
        }, 1500)
      } else {
        // Already on correct endpoint, open immediately
        setTimeout(() => {
          handleCountyClick(location.state.openCounty)
          // Clear state
          window.history.replaceState({}, document.title)
        }, 300)
      }
    }
  }, [location.state])


  // Show loading screen while initial data is being fetched
  if (isInitialLoading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2>Se încarcă datele PNRR...</h2>
            <p>Se preiau datele pentru {endpointInfo.name === 'Projects' ? 'proiecte în execuție' : 'plăți efectuate'}</p>
            {initialLoadError && (
              <div className="loading-error">
                ⚠️ Eroare la încărcare: {initialLoadError}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={
          currentView === 'map' ? (
            <MapView 
              data={data}
              viewMode={viewMode}
              setViewMode={setViewMode}
              metric={metric}
              setMetric={setMetric}
              activeProgram={activeProgram}
              setActiveProgram={setActiveProgram}
              onCountyClick={handleCountyClick}
              isLoadingRealData={isLoadingRealData}
              useRealData={useRealData}
              endpoint={endpoint}
              switchEndpoint={switchEndpoint}
              endpointInfo={endpointInfo}
              dataError={dataError}
              currency={currency}
              setCurrency={setCurrency}
              useMockData={useMockData}
              setUseMockData={setUseMockData}
              isCountyLoading={isLoadingCounty}
              dataDate={dataDate}
              setDataDate={setDataDate}
              availableDates={availableDates}
              isLoadingDates={isLoadingDates}
            />
          ) : (
            <>
              <CountyDetails 
                county={selectedCounty}
                data={data}
                onBackToMap={handleBackToMap}
                onLoadingComplete={() => setIsLoadingCounty(false)}
                isParentLoading={isLoadingCounty}
                useRealData={useRealData}
                activeProgram={activeProgram}
                setActiveProgram={setActiveProgram}
                endpoint={endpoint}
                currency={currency}
                setCurrency={setCurrency}
              />
              {/* Show loading overlay while county details are being prepared */}
              {isLoadingCounty && (
                <div className="loading-overlay">
                  <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <h2>Se încarcă detaliile județului...</h2>
                    <p>Pregătim harta și datele pentru {selectedCounty?.county?.name || 'județul selectat'}</p>
                  </div>
                </div>
              )}
            </>
          )
        } />
        <Route path="/semantic-search" element={<SemanticSearchPage />} />
        <Route path="/absorbtie-in-timp" element={<TimelinePage onCountyClick={handleCountyClick} />} />
      </Routes>
    </div>
  )
}

export default App
