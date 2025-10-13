#!/usr/bin/env node

// Script to convert date_test.xlsx to JSON format matching realDataProjects.js structure
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

// Component and measure mappings (same as in realDataProjects.js)
const COMPONENT_MAPPING = {
  'C1': { key: 'C1', label: 'Managementul apei', program: 'Tranziția spre o economie verde' },
  'C2': { key: 'C2', label: 'Păduri și protecția biodiversității', program: 'Tranziția spre o economie verde' },
  'C3': { key: 'C3', label: 'Managementul deșeurilor', program: 'Tranziția spre o economie verde' },
  'C4': { key: 'C4', label: 'Transport sustenabil', program: 'Tranziția spre o economie verde' },
  'C5': { key: 'C5', label: 'Valul Renovării', program: 'Tranziția spre o economie verde' },
  'C6': { key: 'C6', label: 'Energie', program: 'Tranziția spre o economie verde' },
  'C7': { key: 'C7', label: 'Transformare digitală', program: 'Transformarea digitală' },
  'C8': { key: 'C8', label: 'Reforma fiscala și reforma sistemului de pensii', program: 'Creșterea economică inteligentă, sustenabilă și incluzivă' },
  'C9': { key: 'C9', label: 'Suport pentru sectorul privat, cercetare, dezvoltare și inovare', program: 'Creșterea economică inteligentă, sustenabilă și incluzivă' },
  'C10': { key: 'C10', label: 'Fondul local', program: 'Coeziunea socială și teritorială' },
  'C11': { key: 'C11', label: 'Turism și cultură', program: 'Coeziunea socială și teritorială' },
  'C12': { key: 'C12', label: 'Sănătate', program: 'Sănătate și reziliență instituțională' },
  'C13': { key: 'C13', label: 'Reforme sociale', program: 'Sănătate și reziliență instituțională' },
  'C14': { key: 'C14', label: 'Bună guvernanță', program: 'Sănătate și reziliență instituțională' },
  'C15': { key: 'C15', label: 'Educație', program: 'Copii, tineri, educație și competențe' },
  'C16': { key: 'C16', label: 'REPowerEU', program: 'Tranziția spre o economie verde' }
}

// County mapping (same as in mockData.js)
const COUNTY_MAP = {
  'AB': 'Alba',
  'AR': 'Arad', 
  'AG': 'Argeș',
  'BC': 'Bacău',
  'BH': 'Bihor',
  'BN': 'Bistrița-Năsăud',
  'BT': 'Botoșani',
  'BR': 'Brăila',
  'BV': 'Brașov',
  'BZ': 'Buzău',
  'CL': 'Călărași',
  'CS': 'Caraș-Severin',
  'CJ': 'Cluj',
  'CT': 'Constanța',
  'CV': 'Covasna',
  'DB': 'Dâmbovița',
  'DJ': 'Dolj',
  'GL': 'Galați',
  'GR': 'Giurgiu',
  'GJ': 'Gorj',
  'HR': 'Harghita',
  'HD': 'Hunedoara',
  'IL': 'Ialomița',
  'IS': 'Iași',
  'IF': 'Ilfov',
  'MM': 'Maramureș',
  'MH': 'Mehedinți',
  'MS': 'Mureș',
  'NT': 'Neamț',
  'OT': 'Olt',
  'PH': 'Prahova',
  'SJ': 'Sălaj',
  'SM': 'Satu Mare',
  'SB': 'Sibiu',
  'SV': 'Suceava',
  'TR': 'Teleorman',
  'TM': 'Timiș',
  'TL': 'Tulcea',
  'VL': 'Vâlcea',
  'VS': 'Vaslui',
  'VN': 'Vrancea',
  'BI': 'București'
}

// Helper function to convert old Romanian diacritics to UTF-8
const convertRomanianDiacritics = (text) => {
  if (!text || typeof text !== 'string') return text
  
  return text
    .replace(/ă/g, 'ă')  // Keep UTF-8 ă
    .replace(/â/g, 'â')  // Keep UTF-8 â
    .replace(/î/g, 'î')  // Keep UTF-8 î
    .replace(/ș/g, 'ș')  // Keep UTF-8 ș
    .replace(/ț/g, 'ț')  // Keep UTF-8 ț
    .replace(/Ă/g, 'Ă')  // Keep UTF-8 Ă
    .replace(/Â/g, 'Â')  // Keep UTF-8 Â
    .replace(/Î/g, 'Î')  // Keep UTF-8 Î
    .replace(/Ș/g, 'Ș')  // Keep UTF-8 Ș
    .replace(/Ț/g, 'Ț')  // Keep UTF-8 Ț
    // Convert old encoding to UTF-8
    .replace(/ã/g, 'ă')  // Old encoding ã -> UTF-8 ă
    .replace(/â/g, 'â')  // Old encoding â -> UTF-8 â (already correct)
    .replace(/î/g, 'î')  // Old encoding î -> UTF-8 î (already correct)
    .replace(/ş/g, 'ș')  // Old encoding ş -> UTF-8 ș
    .replace(/ţ/g, 'ț')  // Old encoding ţ -> UTF-8 ț
    .replace(/Ã/g, 'Ă')  // Old encoding Ã -> UTF-8 Ă
    .replace(/Â/g, 'Â')  // Old encoding Â -> UTF-8 Â (already correct)
    .replace(/Î/g, 'Î')  // Old encoding Î -> UTF-8 Î (already correct)
    .replace(/Ş/g, 'Ș')  // Old encoding Ş -> UTF-8 Ș
    .replace(/Ţ/g, 'Ț')  // Old encoding Ţ -> UTF-8 Ț
}

// Helper function to normalize county names
const normalizeCountyName = (countyName) => {
  if (!countyName) return null
  
  const normalized = countyName.toUpperCase().trim()
  
  // Handle special cases
  if (normalized.includes('BUCUREŞTI') || normalized.includes('BUCUREȘTI') || normalized.includes('MUNICIPIUL BUCURESTI')) {
    return 'BI'
  }
  
  // Handle NATIONAL projects (multi-county)
  if (normalized.includes('NATIONAL') || normalized.includes('NAȚIONAL') || normalized.includes('NATIUNAL')) {
    return null // This will be treated as multi-county
  }
  
  // Try to find county code by matching county names
  for (const [code, name] of Object.entries(COUNTY_MAP)) {
    if (normalized.includes(name.toUpperCase())) {
      return code
    }
  }
  
  // Handle common variations
  const countyMappings = {
    'ALBA': 'AB',
    'ARGEŞ': 'AG', 'ARGES': 'AG',
    'ARAD': 'AR',
    'BACĂU': 'BC', 'BACAU': 'BC',
    'BIHOR': 'BH',
    'BISTRIŢA': 'BN', 'BISTRITA': 'BN',
    'BRĂILA': 'BR', 'BRAILA': 'BR',
    'BOTOŞANI': 'BT', 'BOTOSANI': 'BT',
    'BRAŞOV': 'BV', 'BRASOV': 'BV',
    'BUZĂU': 'BZ', 'BUZAU': 'BZ',
    'CLUJ': 'CJ',
    'CĂLĂRAŞI': 'CL', 'CALARASI': 'CL',
    'CARAŞ': 'CS', 'CARAS': 'CS',
    'CONSTANŢA': 'CT', 'CONSTANTA': 'CT',
    'COVASNA': 'CV',
    'DÂMBOVIŢA': 'DB', 'DAMBOVITA': 'DB',
    'DOLJ': 'DJ',
    'GALAŢI': 'GL', 'GALATI': 'GL',
    'GIURGIU': 'GR',
    'GORJ': 'GJ',
    'HUNEDOARA': 'HD',
    'HARGHITA': 'HR',
    'ILFOV': 'IF',
    'IALOMIŢA': 'IL', 'IALOMITA': 'IL',
    'IAŞI': 'IS', 'IASI': 'IS',
    'MEHEDINŢI': 'MH', 'MEHEDINTI': 'MH',
    'MARAMUREŞ': 'MM', 'MARAMURES': 'MM',
    'MUREŞ': 'MS', 'MURES': 'MS',
    'NEAMŢ': 'NT', 'NEAMT': 'NT',
    'OLT': 'OT',
    'PRAHOVA': 'PH',
    'SIBIU': 'SB',
    'SĂLAJ': 'SJ', 'SALAJ': 'SJ',
    'SATU MARE': 'SM',
    'SUCEAVA': 'SV',
    'TULCEA': 'TL',
    'TIMIŞ': 'TM', 'TIMIS': 'TM',
    'TELEORMAN': 'TR',
    'VÂLCEA': 'VL', 'VALCEA': 'VL',
    'VRANCEA': 'VN',
    'VASLUI': 'VS'
  }
  
  for (const [key, code] of Object.entries(countyMappings)) {
    if (normalized.includes(key)) {
      return code
    }
  }
  
  return null
}

// Process raw Excel data into our format
const processExcelData = (rawData) => {
  const countyData = {}
  const multiCountyProjects = []
  
  // Initialize county data structure
  Object.keys(COUNTY_MAP).forEach(code => {
    countyData[code] = {
      code: `RO-${code}`,
      name: COUNTY_MAP[code],
      total: { value: 0, projects: 0 },
      programs: {
        'Tranziția spre o economie verde': { value: 0, projects: 0 },
        'Transformarea digitală': { value: 0, projects: 0 },
        'Creșterea economică inteligentă, sustenabilă și incluzivă': { value: 0, projects: 0 },
        'Coeziunea socială și teritorială': { value: 0, projects: 0 },
        'Sănătate și reziliență instituțională': { value: 0, projects: 0 },
        'Copii, tineri, educație și competențe': { value: 0, projects: 0 }
      },
      extras: {
        rows: [],
        col_labels: {
          'DENUMIRE_BENEFICIAR': 'Denumire Beneficiar',
          'VALOARE_TOTAL': 'Valoare Total (EUR)',
          'VALOARE_FE': 'Valoare FE (EUR)',
          'VALOARE_FPN': 'Valoare FPN (EUR)',
          'VALOARE_TVA': 'Valoare TVA (EUR)',
          'DATA_ANGAJAMENT': 'Data Angajament',
          'DATA_INCEPUT': 'Data Început',
          'DATA_FINALIZARE': 'Data Finalizare',
          'STADIU': 'Stadiu',
          'IMPACT': 'Impact',
          'JUDET_IMPLEMENTARE': 'Județ Implementare',
          'LOCALITATE_IMPLEMENTARE': 'Localitate Implementare',
          'COD_COMPONENTA': 'Cod Componentă',
          'COMPONENTA_LABEL': 'Componentă',
          'COD_MASURA': 'Cod Măsură',
          'NR_CONTRACT': 'Număr Contract',
          'TITLU_CONTRACT': 'Titlu Contract',
          'CUI': 'CUI',
          'TIP_BENEFICIAR': 'Tip Beneficiar',
          'SURSA_FINANTARE': 'Sursa Finanțare',
          'CRI': 'CRI'
        }
      }
    }
  })
  
  // Process each project record
  rawData.forEach(item => {
    // Map Excel column names to expected field names (using actual column names from Excel)
    const mappedItem = {
      denumire_beneficiar: item['DENUMIRE_BENEFICIAR'] || '',
      valoare_total: parseFloat(item['VALOARE_TOTAL']) || 0,
      valoare_fe: parseFloat(item['VALOARE_FE']) || 0,
      valoare_fpn: parseFloat(item['VALOARE_FPN']) || 0,
      valoare_tva: parseFloat(item['VALOARE_TVA']) || 0,
      data_angajament: item['DATA_ANGAJAMENT'] ? new Date((item['DATA_ANGAJAMENT'] - 25569) * 86400 * 1000).toISOString() : '',
      data_inceput: item['DATA_INCEPUT'] ? new Date((item['DATA_INCEPUT'] - 25569) * 86400 * 1000).toISOString() : '',
      data_finalizare: item['DATA_FINALIZARE'] ? new Date((item['DATA_FINALIZARE'] - 25569) * 86400 * 1000).toISOString() : '',
      stadiu: item['STADIU'] || '',
      impact: item['IMPACT'] || '',
      judet_implementare: item['JUDET_IMPLEMENTARE'] || '',
      localitate_implementare: item['LOCALITATE_IMPLEMENTARE'] || '',
      cod_componenta: item['COMPONENTA'] || '',
      cod_masura: item['INVESTITIA'] || '',
      nr_contract: item['NR_CONTRACT'] || '',
      titlu_contract: item['TITLU_CONTRACT'] || '',
      cui: item['CUI'] || '',
      tip_beneficiar: item['TIP_BENEFICIAR'] || '',
      sursa_finantare: item['SURSA_FINANTARE'] || '',
      cri: item['COORDONATOR'] || '',
      cod_submasura: item['COD_SUBMASURA'] || '',
      valoare_neeligibil: parseFloat(item['VALOARE_NEELIGIBIL']) || 0
    }
    
    const countyCode = normalizeCountyName(mappedItem.judet_implementare)
    const componentMapping = COMPONENT_MAPPING[mappedItem.cod_componenta]
    
    if (!countyCode || !componentMapping) {
      // Handle as multi-county or unknown
      multiCountyProjects.push(mappedItem)
      return
    }
    
    const county = countyData[countyCode]
    if (!county) return

    const programKey = componentMapping.program
    const value = parseFloat(mappedItem.valoare_fe) || 0
    
    // Add to county totals
    county.total.value += value
    county.total.projects += 1
    
    // Update county programs
    if (county.programs[programKey]) {
      county.programs[programKey].value += value
      county.programs[programKey].projects += 1
    }
    
    // Create project row for extras
    const projectRow = {
      DENUMIRE_BENEFICIAR: convertRomanianDiacritics(mappedItem.denumire_beneficiar || ''),
      VALOARE_TOTAL: parseFloat(mappedItem.valoare_total) || 0,
      VALOARE_FE: value,
      VALOARE_FPN: parseFloat(mappedItem.valoare_fpn) || 0,
      VALOARE_TVA: parseFloat(mappedItem.valoare_tva) || 0,
      DATA_ANGAJAMENT: mappedItem.data_angajament ? new Date(mappedItem.data_angajament).toLocaleDateString('ro-RO') : '',
      DATA_INCEPUT: mappedItem.data_inceput ? new Date(mappedItem.data_inceput).toLocaleDateString('ro-RO') : '',
      DATA_FINALIZARE: mappedItem.data_finalizare ? new Date(mappedItem.data_finalizare).toLocaleDateString('ro-RO') : '',
      STADIU: convertRomanianDiacritics(mappedItem.stadiu || ''),
      IMPACT: convertRomanianDiacritics(mappedItem.impact || ''),
      JUDET_IMPLEMENTARE: convertRomanianDiacritics(mappedItem.judet_implementare || ''),
      LOCALITATE_IMPLEMENTARE: convertRomanianDiacritics(mappedItem.localitate_implementare || ''),
      COD_COMPONENTA: mappedItem.cod_componenta || '',
      COMPONENTA_LABEL: convertRomanianDiacritics(componentMapping.label || ''),
      COD_MASURA: mappedItem.cod_masura || '',
      NR_CONTRACT: convertRomanianDiacritics(mappedItem.nr_contract || ''),
      TITLU_CONTRACT: convertRomanianDiacritics(mappedItem.titlu_contract || ''),
      CUI: mappedItem.cui || '',
      TIP_BENEFICIAR: convertRomanianDiacritics(mappedItem.tip_beneficiar || ''),
      SURSA_FINANTARE: convertRomanianDiacritics(mappedItem.sursa_finantare || ''),
      CRI: mappedItem.cri || '',
      COD_SUBMASURA: mappedItem.cod_submasura || '',
      VALOARE_NEELIGIBIL: parseFloat(mappedItem.valoare_neeligibil) || 0,
      __program_key: programKey,
      __share_value: value,
      __share_projects: 1
    }
    
    county.extras.rows.push(projectRow)
  })
  
  // Convert to array format
  const result = Object.values(countyData)
  
  // Add multi-county data if exists
  if (multiCountyProjects.length > 0) {
    const multiData = {
      code: 'RO-MULTI',
      name: 'Multi Județe',
      total: { 
        value: multiCountyProjects.reduce((sum, item) => sum + (parseFloat(item.valoare_fe) || 0), 0),
        projects: multiCountyProjects.length 
      },
      programs: {
        'Tranziția spre o economie verde': { value: 0, projects: 0 },
        'Transformarea digitală': { value: 0, projects: 0 },
        'Creșterea economică inteligentă, sustenabilă și incluzivă': { value: 0, projects: 0 },
        'Coeziunea socială și teritorială': { value: 0, projects: 0 },
        'Sănătate și reziliență instituțională': { value: 0, projects: 0 },
        'Copii, tineri, educație și competențe': { value: 0, projects: 0 }
      },
      extras: {
        rows: multiCountyProjects.map(item => {
          const componentMapping = COMPONENT_MAPPING[item.cod_componenta]
          const programKey = componentMapping?.program || 'Coeziunea socială și teritorială'
          const value = parseFloat(item.valoare_fe) || 0
          
          return {
            DENUMIRE_BENEFICIAR: convertRomanianDiacritics(item.denumire_beneficiar || ''),
            VALOARE_TOTAL: parseFloat(item.valoare_total) || 0,
            VALOARE_FE: value,
            VALOARE_FPN: parseFloat(item.valoare_fpn) || 0,
            VALOARE_TVA: parseFloat(item.valoare_tva) || 0,
            DATA_ANGAJAMENT: item.data_angajament ? new Date(item.data_angajament).toLocaleDateString('ro-RO') : '',
            DATA_INCEPUT: item.data_inceput ? new Date(item.data_inceput).toLocaleDateString('ro-RO') : '',
            DATA_FINALIZARE: item.data_finalizare ? new Date(item.data_finalizare).toLocaleDateString('ro-RO') : '',
            STADIU: convertRomanianDiacritics(item.stadiu || ''),
            IMPACT: convertRomanianDiacritics(item.impact || ''),
            JUDET_IMPLEMENTARE: convertRomanianDiacritics(item.judet_implementare || ''),
            LOCALITATE_IMPLEMENTARE: convertRomanianDiacritics(item.localitate_implementare || ''),
            COD_COMPONENTA: item.cod_componenta || '',
            COMPONENTA_LABEL: convertRomanianDiacritics(componentMapping?.label || ''),
            COD_MASURA: item.cod_masura || '',
            NR_CONTRACT: convertRomanianDiacritics(item.nr_contract || ''),
            TITLU_CONTRACT: convertRomanianDiacritics(item.titlu_contract || ''),
            CUI: item.cui || '',
            TIP_BENEFICIAR: convertRomanianDiacritics(item.tip_beneficiar || ''),
            SURSA_FINANTARE: convertRomanianDiacritics(item.sursa_finantare || ''),
            CRI: item.cri || '',
            COD_SUBMASURA: item.cod_submasura || '',
            VALOARE_NEELIGIBIL: parseFloat(item.valoare_neeligibil) || 0,
            __program_key: programKey,
            __share_value: value,
            __share_projects: 1
          }
        }),
        multi_agg_by_county: {}
      }
    }
    
    result.push(multiData)
  }
  
  return result
}

// Main conversion function
const convertExcelToJson = async () => {
  try {
    console.log('🔄 Reading Excel file...')
    
    // Read the Excel file
    const filePath = path.join(process.cwd(), 'src/data/date_test.xlsx')
    const workbook = XLSX.readFile(filePath)
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet)
    
    console.log(`📊 Found ${rawData.length} rows in Excel file`)
    console.log('📋 Sample columns:', Object.keys(rawData[0] || {}))
    
    // Process the data
    console.log('🔄 Processing data...')
    const processedData = processExcelData(rawData)
    
    // Write to JSON file
    const outputPath = path.join(process.cwd(), 'src/data/test-projects-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2))
    
    // Also create a JavaScript module file that can be imported
    const jsOutputPath = path.join(process.cwd(), 'src/data/testProjectsData.js')
    const jsContent = `// Test projects data converted from Excel
// Generated on ${new Date().toISOString()}

export const testProjectsData = ${JSON.stringify(processedData, null, 2)};

export const COMPONENT_MAPPING_TEST = ${JSON.stringify(COMPONENT_MAPPING, null, 2)};

// Data fetcher function
export const getTestPNRRProjectsData = async () => {
  console.log('✅ Loaded test projects data:', testProjectsData.length, 'counties')
  return testProjectsData
}
`
    fs.writeFileSync(jsOutputPath, jsContent)
    
    console.log('✅ Conversion completed!')
    console.log(`📁 JSON output saved to: ${outputPath}`)
    console.log(`📁 JS module saved to: ${jsOutputPath}`)
    console.log(`📊 Processed ${processedData.length} counties`)
    
    // Show summary
    const totalProjects = processedData.reduce((sum, county) => sum + county.total.projects, 0)
    const totalValue = processedData.reduce((sum, county) => sum + county.total.value, 0)
    
    console.log(`📈 Summary:`)
    console.log(`   - Total projects: ${totalProjects}`)
    console.log(`   - Total value: ${totalValue.toLocaleString()} EUR`)
    console.log(`   - Counties with data: ${processedData.filter(c => c.total.projects > 0).length}`)
    
  } catch (error) {
    console.error('❌ Error converting Excel to JSON:', error)
    process.exit(1)
  }
}

// Run the conversion
convertExcelToJson()
