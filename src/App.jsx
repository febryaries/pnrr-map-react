import { useState, useEffect } from 'react'
import MapView from './components/MapView'
import CountyDetails from './components/CountyDetails'
import { mockData } from './data/data'
import { useDataEndpoint } from './hooks/useDataEndpoint'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('map') // 'map' or 'county'
  const [selectedCounty, setSelectedCounty] = useState(null)
  const [isLoadingCounty, setIsLoadingCounty] = useState(false)
  const [viewMode, setViewMode] = useState('general') // 'general', 'multi', 'total', 'program'
  const [metric, setMetric] = useState('value') // 'value' or 'projects'
  const [activeProgram, setActiveProgram] = useState(null)
  const [data, setData] = useState(mockData)
  const [useRealData, setUseRealData] = useState(false)
  const [useMockData, setUseMockData] = useState(false) // Force mock data for testing
  const [currency, setCurrency] = useState('EUR') // 'EUR' or 'RON'

  // Use the data endpoint hook
  const { 
    endpoint, 
    isLoading: isLoadingRealData, 
    error: dataError, 
    fetchData, 
    switchEndpoint, 
    endpointInfo,
    isInitialLoading,
    initialLoadError
  } = useDataEndpoint()

  // Load real data on component mount and when endpoint changes
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
    
    loadRealData()
  }, [endpoint, fetchData, endpointInfo.name, useMockData])

  const handleCountyClick = (countyCode, countyName) => {
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
    
    const county = data.find(c => (c.county?.code || c.code) === countyCode)
    if (county) {
      setIsLoadingCounty(true)
      setSelectedCounty(county)
      setCurrentView('county')
    }
  }

  const handleBackToMap = () => {
    setCurrentView('map')
    setSelectedCounty(null)
    setIsLoadingCounty(false)
  }

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
      {currentView === 'map' ? (
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
      )}
    </div>
  )
}

export default App
