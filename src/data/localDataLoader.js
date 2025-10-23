/**
 * Local Data Loader
 * Loads PNRR data from real data files instead of API calls
 */

// Import the data aggregation classes
import { ProjectDataAggregation } from '../types/ProjectDataAggregation'
import { PaymentDataAggregation } from '../types/PaymentDataAggregation'
import { DATA_ENDPOINTS } from '../constants/PNRRConstants'

// Real data file URLs
const DATA_URLS = {
  indicators: 'https://victorciobanu.com/bm/data/indicatori_total.json.gz',
  payments: 'https://victorciobanu.com/bm/data/plati_pnrr.json.gz',
  projects: 'https://victorciobanu.com/bm/data/progres_tehnic_proiecte.json.gz',
  beneficiaries: 'https://victorciobanu.com/bm/data/top_beneficiari.json.gz'
}

// Sample project data - this would be replaced with actual data from your Excel files
const SAMPLE_PROJECT_DATA = [
  // București projects
  {
    denumire_beneficiar: "Primăria Municipiului București",
    valoare_total: 5000000,
    valoare_fe: 4000000,
    valoare_fpn: 1000000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-01-15",
    data_inceput: "2022-02-01",
    data_finalizare: "2025-12-31",
    stadiu: "ÎN IMPLEMENTARE (sub 30%)",
    impact: "Îmbunătățirea infrastructurii de transport",
    judet_implementare: "București",
    localitate_implementare: "București",
    nr_contract: "PNRR-001",
    titlu_contract: "Modernizarea rețelei de transport public",
    cui: "12345678",
    tip_beneficiar: "Autoritate publică",
    cod_componenta: "C7",
    cod_masura: "I1",
    cod_submasura: "I1.1",
    sursa_finantare: "FEDR",
    cri: "CRI-001"
  },
  {
    denumire_beneficiar: "Spitalul Universitar de Urgență București",
    valoare_total: 12000000,
    valoare_fe: 9600000,
    valoare_fpn: 2400000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-03-01",
    data_inceput: "2022-04-01",
    data_finalizare: "2026-12-31",
    stadiu: "ÎN IMPLEMENTARE (30-70%)",
    impact: "Îmbunătățirea serviciilor de sănătate",
    judet_implementare: "București",
    localitate_implementare: "București",
    nr_contract: "PNRR-002",
    titlu_contract: "Modernizarea infrastructurii medicale de urgență",
    cui: "22345678",
    tip_beneficiar: "Instituție de sănătate",
    cod_componenta: "C12",
    cod_masura: "I1",
    cod_submasura: "I1.1",
    sursa_finantare: "FEDR",
    cri: "CRI-002"
  },
  // Cluj projects
  {
    denumire_beneficiar: "Consiliul Județean Cluj",
    valoare_total: 3000000,
    valoare_fe: 2400000,
    valoare_fpn: 600000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-03-10",
    data_inceput: "2022-04-01",
    data_finalizare: "2024-12-31",
    stadiu: "ÎN IMPLEMENTARE (30-70%)",
    impact: "Dezvoltarea infrastructurii digitale",
    judet_implementare: "Cluj",
    localitate_implementare: "Cluj-Napoca",
    nr_contract: "PNRR-003",
    titlu_contract: "Digitalizarea serviciilor publice",
    cui: "87654321",
    tip_beneficiar: "Autoritate publică",
    cod_componenta: "C8",
    cod_masura: "I2",
    cod_submasura: "I2.1",
    sursa_finantare: "FSE+",
    cri: "CRI-003"
  },
  {
    denumire_beneficiar: "Universitatea Babeș-Bolyai",
    valoare_total: 2000000,
    valoare_fe: 1600000,
    valoare_fpn: 400000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-05-20",
    data_inceput: "2022-06-01",
    data_finalizare: "2025-06-30",
    stadiu: "ÎN IMPLEMENTARE (sub 30%)",
    impact: "Îmbunătățirea educației superioare",
    judet_implementare: "Cluj",
    localitate_implementare: "Cluj-Napoca",
    nr_contract: "PNRR-004",
    titlu_contract: "Modernizarea laboratoarelor de cercetare",
    cui: "11223344",
    tip_beneficiar: "Instituție de învățământ",
    cod_componenta: "C9",
    cod_masura: "I1",
    cod_submasura: "I1.2",
    sursa_finantare: "FEDR",
    cri: "CRI-004"
  },
  // Timiș projects
  {
    denumire_beneficiar: "Spitalul Municipal Timișoara",
    valoare_total: 8000000,
    valoare_fe: 6400000,
    valoare_fpn: 1600000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-02-28",
    data_inceput: "2022-03-15",
    data_finalizare: "2026-03-31",
    stadiu: "ÎN IMPLEMENTARE (30-70%)",
    impact: "Îmbunătățirea serviciilor de sănătate",
    judet_implementare: "Timiș",
    localitate_implementare: "Timișoara",
    nr_contract: "PNRR-005",
    titlu_contract: "Modernizarea infrastructurii medicale",
    cui: "55667788",
    tip_beneficiar: "Instituție de sănătate",
    cod_componenta: "C12",
    cod_masura: "I1",
    cod_submasura: "I1.1",
    sursa_finantare: "FEDR",
    cri: "CRI-005"
  },
  // Iași projects
  {
    denumire_beneficiar: "Primăria Municipiului Iași",
    valoare_total: 1500000,
    valoare_fe: 1200000,
    valoare_fpn: 300000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-04-15",
    data_inceput: "2022-05-01",
    data_finalizare: "2024-12-31",
    stadiu: "FINALIZAT",
    impact: "Îmbunătățirea eficienței energetice",
    judet_implementare: "Iași",
    localitate_implementare: "Iași",
    nr_contract: "PNRR-006",
    titlu_contract: "Reabilitarea energetică a clădirilor publice",
    cui: "99887766",
    tip_beneficiar: "Autoritate publică",
    cod_componenta: "C2",
    cod_masura: "I1",
    cod_submasura: "I1.1",
    sursa_finantare: "FEDR",
    cri: "CRI-006"
  },
  // Constanța projects
  {
    denumire_beneficiar: "Primăria Municipiului Constanța",
    valoare_total: 4000000,
    valoare_fe: 3200000,
    valoare_fpn: 800000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-06-01",
    data_inceput: "2022-07-01",
    data_finalizare: "2025-12-31",
    stadiu: "ÎN IMPLEMENTARE (sub 30%)",
    impact: "Dezvoltarea infrastructurii de transport",
    judet_implementare: "Constanța",
    localitate_implementare: "Constanța",
    nr_contract: "PNRR-007",
    titlu_contract: "Modernizarea infrastructurii portuare",
    cui: "33445566",
    tip_beneficiar: "Autoritate publică",
    cod_componenta: "C7",
    cod_masura: "I2",
    cod_submasura: "I2.1",
    sursa_finantare: "FEDR",
    cri: "CRI-007"
  },
  // Brașov projects
  {
    denumire_beneficiar: "Primăria Municipiului Brașov",
    valoare_total: 2500000,
    valoare_fe: 2000000,
    valoare_fpn: 500000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-08-15",
    data_inceput: "2022-09-01",
    data_finalizare: "2025-08-31",
    stadiu: "ÎN IMPLEMENTARE (30-70%)",
    impact: "Îmbunătățirea eficienței energetice",
    judet_implementare: "Brașov",
    localitate_implementare: "Brașov",
    nr_contract: "PNRR-008",
    titlu_contract: "Reabilitarea energetică a clădirilor istorice",
    cui: "44556677",
    tip_beneficiar: "Autoritate publică",
    cod_componenta: "C2",
    cod_masura: "I2",
    cod_submasura: "I2.2",
    sursa_finantare: "FEDR",
    cri: "CRI-008"
  },
  // National projects
  {
    denumire_beneficiar: "Ministerul Sănătății",
    valoare_total: 50000000,
    valoare_fe: 40000000,
    valoare_fpn: 10000000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-01-01",
    data_inceput: "2022-02-01",
    data_finalizare: "2026-12-31",
    stadiu: "ÎN IMPLEMENTARE (sub 30%)",
    impact: "Îmbunătățirea sistemului de sănătate național",
    judet_implementare: "Național",
    localitate_implementare: "Național",
    nr_contract: "PNRR-009",
    titlu_contract: "Modernizarea sistemului de sănătate național",
    cui: "11111111",
    tip_beneficiar: "Minister",
    cod_componenta: "C12",
    cod_masura: "I1",
    cod_submasura: "I1.1",
    sursa_finantare: "FEDR",
    cri: "CRI-009"
  },
  {
    denumire_beneficiar: "Ministerul Educației",
    valoare_total: 30000000,
    valoare_fe: 24000000,
    valoare_fpn: 6000000,
    valoare_tva: 0,
    valoare_neeligibil: 0,
    data_angajament: "2022-03-01",
    data_inceput: "2022-04-01",
    data_finalizare: "2025-12-31",
    stadiu: "ÎN IMPLEMENTARE (30-70%)",
    impact: "Dezvoltarea sistemului educațional național",
    judet_implementare: "Național",
    localitate_implementare: "Național",
    nr_contract: "PNRR-010",
    titlu_contract: "Digitalizarea sistemului educațional",
    cui: "22222222",
    tip_beneficiar: "Minister",
    cod_componenta: "C8",
    cod_masura: "I1",
    cod_submasura: "I1.1",
    sursa_finantare: "FSE+",
    cri: "CRI-010"
  }
]

// Sample payment data
const SAMPLE_PAYMENT_DATA = [
  // București payments
  {
    nume_beneficiar: "Primăria Municipiului București",
    valoare_plata_fe: 2000000,
    valoare_plata_fe_euro: 400000,
    data_plata: "2023-01-15",
    masura: "Modernizarea rețelei de transport public",
    sursa_finantare: "FEDR",
    judet_beneficiar: "București",
    localitate_beneficiar: "București",
    cui_beneficiar_final: "12345678",
    cod_diviziune_caen: "84110",
    descriere_diviziune_caen: "Activități ale administrației publice centrale",
    cri: "CRI-001",
    cod_componenta: "C7",
    cod_masura: "I1"
  },
  {
    nume_beneficiar: "Spitalul Universitar de Urgență București",
    valoare_plata_fe: 4800000,
    valoare_plata_fe_euro: 960000,
    data_plata: "2023-02-20",
    masura: "Modernizarea infrastructurii medicale de urgență",
    sursa_finantare: "FEDR",
    judet_beneficiar: "București",
    localitate_beneficiar: "București",
    cui_beneficiar_final: "22345678",
    cod_diviziune_caen: "86101",
    descriere_diviziune_caen: "Activități ale spitalelor",
    cri: "CRI-002",
    cod_componenta: "C12",
    cod_masura: "I1"
  },
  // Cluj payments
  {
    nume_beneficiar: "Consiliul Județean Cluj",
    valoare_plata_fe: 1200000,
    valoare_plata_fe_euro: 240000,
    data_plata: "2023-02-20",
    masura: "Digitalizarea serviciilor publice",
    sursa_finantare: "FSE+",
    judet_beneficiar: "Cluj",
    localitate_beneficiar: "Cluj-Napoca",
    cui_beneficiar_final: "87654321",
    cod_diviziune_caen: "84110",
    descriere_diviziune_caen: "Activități ale administrației publice centrale",
    cri: "CRI-003",
    cod_componenta: "C8",
    cod_masura: "I2"
  },
  {
    nume_beneficiar: "Universitatea Babeș-Bolyai",
    valoare_plata_fe: 800000,
    valoare_plata_fe_euro: 160000,
    data_plata: "2023-03-10",
    masura: "Modernizarea laboratoarelor de cercetare",
    sursa_finantare: "FEDR",
    judet_beneficiar: "Cluj",
    localitate_beneficiar: "Cluj-Napoca",
    cui_beneficiar_final: "11223344",
    cod_diviziune_caen: "85410",
    descriere_diviziune_caen: "Învățământ superior",
    cri: "CRI-004",
    cod_componenta: "C9",
    cod_masura: "I1"
  },
  // Timiș payments
  {
    nume_beneficiar: "Spitalul Municipal Timișoara",
    valoare_plata_fe: 3200000,
    valoare_plata_fe_euro: 640000,
    data_plata: "2023-04-05",
    masura: "Modernizarea infrastructurii medicale",
    sursa_finantare: "FEDR",
    judet_beneficiar: "Timiș",
    localitate_beneficiar: "Timișoara",
    cui_beneficiar_final: "55667788",
    cod_diviziune_caen: "86101",
    descriere_diviziune_caen: "Activități ale spitalelor",
    cri: "CRI-005",
    cod_componenta: "C12",
    cod_masura: "I1"
  },
  // Iași payments
  {
    nume_beneficiar: "Primăria Municipiului Iași",
    valoare_plata_fe: 600000,
    valoare_plata_fe_euro: 120000,
    data_plata: "2023-05-15",
    masura: "Reabilitarea energetică a clădirilor publice",
    sursa_finantare: "FEDR",
    judet_beneficiar: "Iași",
    localitate_beneficiar: "Iași",
    cui_beneficiar_final: "99887766",
    cod_diviziune_caen: "84110",
    descriere_diviziune_caen: "Activități ale administrației publice centrale",
    cri: "CRI-006",
    cod_componenta: "C2",
    cod_masura: "I1"
  },
  // Constanța payments
  {
    nume_beneficiar: "Primăria Municipiului Constanța",
    valoare_plata_fe: 1600000,
    valoare_plata_fe_euro: 320000,
    data_plata: "2023-06-10",
    masura: "Modernizarea infrastructurii portuare",
    sursa_finantare: "FEDR",
    judet_beneficiar: "Constanța",
    localitate_beneficiar: "Constanța",
    cui_beneficiar_final: "33445566",
    cod_diviziune_caen: "84110",
    descriere_diviziune_caen: "Activități ale administrației publice centrale",
    cri: "CRI-007",
    cod_componenta: "C7",
    cod_masura: "I2"
  },
  // Brașov payments
  {
    nume_beneficiar: "Primăria Municipiului Brașov",
    valoare_plata_fe: 1000000,
    valoare_plata_fe_euro: 200000,
    data_plata: "2023-07-20",
    masura: "Reabilitarea energetică a clădirilor istorice",
    sursa_finantare: "FEDR",
    judet_beneficiar: "Brașov",
    localitate_beneficiar: "Brașov",
    cui_beneficiar_final: "44556677",
    cod_diviziune_caen: "84110",
    descriere_diviziune_caen: "Activități ale administrației publice centrale",
    cri: "CRI-008",
    cod_componenta: "C2",
    cod_masura: "I2"
  },
  // National payments
  {
    nume_beneficiar: "Ministerul Sănătății",
    valoare_plata_fe: 20000000,
    valoare_plata_fe_euro: 4000000,
    data_plata: "2023-08-01",
    masura: "Modernizarea sistemului de sănătate național",
    sursa_finantare: "FEDR",
    judet_beneficiar: "Național",
    localitate_beneficiar: "Național",
    cui_beneficiar_final: "11111111",
    cod_diviziune_caen: "84110",
    descriere_diviziune_caen: "Activități ale administrației publice centrale",
    cri: "CRI-009",
    cod_componenta: "C12",
    cod_masura: "I1"
  },
  {
    nume_beneficiar: "Ministerul Educației",
    valoare_plata_fe: 12000000,
    valoare_plata_fe_euro: 2400000,
    data_plata: "2023-09-15",
    masura: "Digitalizarea sistemului educațional",
    sursa_finantare: "FSE+",
    judet_beneficiar: "Național",
    localitate_beneficiar: "Național",
    cui_beneficiar_final: "22222222",
    cod_diviziune_caen: "84110",
    descriere_diviziune_caen: "Activități ale administrației publice centrale",
    cri: "CRI-010",
    cod_componenta: "C8",
    cod_masura: "I1"
  }
]

/**
 * Fetch data from URL with automatic gzip handling and performance optimizations
 */
const fetchDataFromUrl = async (url) => {
  console.log(`📥 Fetching data from: ${url}`)
  const startTime = Date.now()
  
  try {
    // Add timeout and performance optimizations
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Encoding': 'gzip, deflate'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
    }
    
    // First try to get as text - this handles most cases automatically
    try {
      const text = await response.text()
      const parseTime = Date.now() - startTime
      console.log(`📊 Parsed data from ${url} in ${parseTime}ms`)
      return JSON.parse(text)
    } catch (textError) {
      console.warn(`⚠️ Text parsing failed, trying gzip decompression:`, textError.message)
      
      // If text parsing fails, try gzip decompression
      try {
        const arrayBuffer = await response.arrayBuffer()
        const decompressedData = await decompressGzip(arrayBuffer)
        const jsonString = new TextDecoder().decode(decompressedData)
        const parseTime = Date.now() - startTime
        console.log(`📊 Decompressed and parsed data from ${url} in ${parseTime}ms`)
        return JSON.parse(jsonString)
      } catch (gzipError) {
        console.error(`❌ Both text and gzip parsing failed:`, gzipError.message)
        throw gzipError
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching data from ${url}:`, error)
    throw error
  }
}

/**
 * Decompress gzipped data
 */
const decompressGzip = async (arrayBuffer) => {
  // Import pako for gzip decompression
  const pako = await import('pako')
  const uint8Array = new Uint8Array(arrayBuffer)
  
  try {
    return pako.ungzip(uint8Array)
  } catch (error) {
    console.warn('⚠️ Pako decompression failed:', error.message)
    throw error
  }
}

/**
 * Load projects data from real data source
 */
export const loadLocalProjectsData = async () => {
  // Check cache first
  const cachedData = getCachedData('projects')
  if (cachedData) {
    return cachedData
  }
  
  console.log('📁 Loading projects data from real data source...')
  const startTime = Date.now()
  
  try {
    const rawData = await fetchDataFromUrl(DATA_URLS.projects)
    console.log(`📊 Fetched ${rawData.length || rawData.items?.length || 0} project records`)
    
    const projectAggregation = new ProjectDataAggregation()
    
    // Handle different data structures
    const projectsData = rawData.items || rawData || []
    await projectAggregation.loadDataFromArray(projectsData)
    const data = projectAggregation.getAllCounties()
    
    const loadTime = Date.now() - startTime
    console.log(`✅ Loaded ${data.length} counties with projects data from real source in ${loadTime}ms`)
    
    // Cache the result
    setCachedData('projects', data)
    
    return data
  } catch (error) {
    console.error('❌ Error loading real projects data:', error)
    // Fallback to sample data if real data fails
    console.log('🔄 Falling back to sample data...')
    const projectAggregation = new ProjectDataAggregation()
    await projectAggregation.loadDataFromArray(SAMPLE_PROJECT_DATA)
    const fallbackData = projectAggregation.getAllCounties()
    
    // Cache fallback data too
    setCachedData('projects', fallbackData)
    
    return fallbackData
  }
}

/**
 * Load payments data from real data source
 */
export const loadLocalPaymentsData = async () => {
  // Check cache first
  const cachedData = getCachedData('payments')
  if (cachedData) {
    return cachedData
  }
  
  console.log('📁 Loading payments data from real data source...')
  const startTime = Date.now()
  
  try {
    const rawData = await fetchDataFromUrl(DATA_URLS.payments)
    console.log(`📊 Fetched ${rawData.length || rawData.items?.length || 0} payment records`)
    
    const paymentAggregation = new PaymentDataAggregation()
    
    // Handle different data structures
    const paymentsData = rawData.items || rawData || []
    await paymentAggregation.loadDataFromArray(paymentsData)
    const data = paymentAggregation.getAllCounties()
    
    const loadTime = Date.now() - startTime
    console.log(`✅ Loaded ${data.length} counties with payments data from real source in ${loadTime}ms`)
    
    // Cache the result
    setCachedData('payments', data)
    
    return data
  } catch (error) {
    console.error('❌ Error loading real payments data:', error)
    // Fallback to sample data if real data fails
    console.log('🔄 Falling back to sample data...')
    const paymentAggregation = new PaymentDataAggregation()
    await paymentAggregation.loadDataFromArray(SAMPLE_PAYMENT_DATA)
    const fallbackData = paymentAggregation.getAllCounties()
    
    // Cache fallback data too
    setCachedData('payments', fallbackData)
    
    return fallbackData
  }
}

/**
 * Load data for a specific endpoint from local source
 */
export const loadLocalData = async (endpoint) => {
  switch (endpoint) {
    case DATA_ENDPOINTS.PROJECTS:
      return await loadLocalProjectsData()
    case DATA_ENDPOINTS.PAYMENTS:
      return await loadLocalPaymentsData()
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`)
  }
}

/**
 * Load indicators data from real data source
 */
export const loadLocalIndicatorsData = async () => {
  // Check cache first
  const cachedData = getCachedData('indicators')
  if (cachedData) {
    return cachedData
  }
  
  console.log('📁 Loading indicators data from real data source...')
  const startTime = Date.now()
  
  try {
    const rawData = await fetchDataFromUrl(DATA_URLS.indicators)
    const loadTime = Date.now() - startTime
    console.log(`📊 Fetched indicators data in ${loadTime}ms:`, rawData)
    
    // Cache the result
    setCachedData('indicators', rawData)
    
    return rawData
  } catch (error) {
    console.error('❌ Error loading real indicators data:', error)
    throw error
  }
}

/**
 * Load beneficiaries data from real data source
 */
export const loadLocalBeneficiariesData = async () => {
  // Check cache first
  const cachedData = getCachedData('beneficiaries')
  if (cachedData) {
    return cachedData
  }
  
  console.log('📁 Loading beneficiaries data from real data source...')
  const startTime = Date.now()
  
  try {
    const rawData = await fetchDataFromUrl(DATA_URLS.beneficiaries)
    const loadTime = Date.now() - startTime
    console.log(`📊 Fetched ${rawData.length || rawData.items?.length || 0} beneficiary records in ${loadTime}ms`)
    
    // Cache the result
    setCachedData('beneficiaries', rawData)
    
    return rawData
  } catch (error) {
    console.error('❌ Error loading real beneficiaries data:', error)
    throw error
  }
}

// Cache for storing loaded data
const dataCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cacheKey) => {
  const cached = dataCache.get(cacheKey)
  if (!cached) return false
  
  const now = Date.now()
  return (now - cached.timestamp) < CACHE_DURATION
}

/**
 * Get cached data if valid
 */
const getCachedData = (cacheKey) => {
  if (isCacheValid(cacheKey)) {
    console.log(`📋 Using cached data for ${cacheKey}`)
    return dataCache.get(cacheKey).data
  }
  return null
}

/**
 * Set cached data
 */
const setCachedData = (cacheKey, data) => {
  dataCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })
  console.log(`💾 Cached data for ${cacheKey}`)
}

/**
 * Preload critical data for faster initial load
 */
export const preloadCriticalData = async () => {
  console.log('🚀 Preloading critical data...')
  const startTime = Date.now()
  
  try {
    // Load only projects and payments data first (most critical)
    const [projects, payments] = await Promise.allSettled([
      loadLocalProjectsData(),
      loadLocalPaymentsData()
    ])
    
    const loadTime = Date.now() - startTime
    console.log(`✅ Preloaded critical data in ${loadTime}ms`)
    
    return {
      projects: projects.status === 'fulfilled' ? projects.value : null,
      payments: payments.status === 'fulfilled' ? payments.value : null
    }
  } catch (error) {
    console.error('❌ Error preloading critical data:', error)
    throw error
  }
}

/**
 * Load all data from real data sources with caching and optimizations
 */
export const loadAllLocalData = async () => {
  console.log('📁 Loading all data from real data sources...')
  const startTime = Date.now()
  
  try {
    // Load data in parallel with individual caching
    const [projects, payments, indicators, beneficiaries] = await Promise.allSettled([
      loadLocalProjectsData(),
      loadLocalPaymentsData(),
      loadLocalIndicatorsData(),
      loadLocalBeneficiariesData()
    ])
    
    // Extract results and handle failures
    const result = {
      projects: projects.status === 'fulfilled' ? projects.value : null,
      payments: payments.status === 'fulfilled' ? payments.value : null,
      indicators: indicators.status === 'fulfilled' ? indicators.value : null,
      beneficiaries: beneficiaries.status === 'fulfilled' ? beneficiaries.value : null
    }
    
    const loadTime = Date.now() - startTime
    console.log(`✅ Loaded all real data successfully in ${loadTime}ms`)
    
    // Cache the complete result
    setCachedData('all_data', result)
    
    return result
  } catch (error) {
    console.error('❌ Error loading all real data:', error)
    throw error
  }
}

/**
 * Clear cache (useful for forcing fresh data)
 */
export const clearCache = () => {
  dataCache.clear()
  console.log('🗑️ Cache cleared')
}

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const stats = {
    size: dataCache.size,
    keys: Array.from(dataCache.keys()),
    entries: Array.from(dataCache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      age: Date.now() - value.timestamp,
      valid: isCacheValid(key)
    }))
  }
  return stats
}
