/**
 * PNRR Constants and Configuration
 * 
 * This file contains all the static constants, mappings, and configurations
 * used throughout the PNRR application. It consolidates data that was
 * previously scattered across multiple data files.
 */

// Component and measure mappings based on Componente_și_investiții.xlsx
export const COMPONENT_MAPPING = {
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
};

// Programs list for easy iteration
export const PROGRAMS = [
  { key: 'C1', label: 'Managementul apei' },
  { key: 'C2', label: 'Păduri și protecția biodiversității' },
  { key: 'C3', label: 'Managementul deșeurilor' },
  { key: 'C4', label: 'Transport sustenabil' },
  { key: 'C5', label: 'Valul Renovării' },
  { key: 'C6', label: 'Energie' },
  { key: 'C7', label: 'Transformare digitală' },
  { key: 'C8', label: 'Reforma fiscala și reforma sistemului de pensii' },
  { key: 'C9', label: 'Suport pentru sectorul privat, cercetare, dezvoltare și inovare' },
  { key: 'C10', label: 'Fondul local' },
  { key: 'C11', label: 'Turism și cultură' },
  { key: 'C12', label: 'Sănătate' },
  { key: 'C13', label: 'Reforme sociale' },
  { key: 'C14', label: 'Bună guvernanță' },
  { key: 'C15', label: 'Educație' },
  { key: 'C16', label: 'REPowerEU' }
];

// Color mapping for programs/components
export const PROGRAM_COLORS = {
  'C1': '#0ea5e9',  // Managementul apei - blue
  'C2': '#22c55e',  // Păduri și protecția biodiversității - green
  'C3': '#16a34a',  // Managementul deșeurilor - dark green
  'C4': '#059669',  // Transport sustenabil - emerald
  'C5': '#0d9488',  // Valul Renovării - teal
  'C6': '#0891b2',  // Energie - cyan
  'C7': '#6366f1',  // Transformare digitală - indigo
  'C8': '#7c3aed',  // Reforma fiscala și reforma sistemului de pensii - violet
  'C9': '#a855f7',  // Suport pentru sectorul privat - purple
  'C10': '#c084fc', // Fondul local - light purple
  'C11': '#d946ef', // Turism și cultură - fuchsia
  'C12': '#ef4444', // Sănătate - red
  'C13': '#f97316', // Reforme sociale - orange
  'C14': '#f59e0b', // Bună guvernanță - amber
  'C15': '#eab308', // Educație - yellow
  'C16': '#84cc16', // REPowerEU - lime
  OTHER: '#94a3b8'
};

// Romanian counties mapping
export const COUNTY_MAP = {
  'AB': 'Alba', 'AG': 'Argeș', 'AR': 'Arad', 'BC': 'Bacău', 'BH': 'Bihor', 'BN': 'Bistrița-Năsăud',
  'BR': 'Brăila', 'BT': 'Botoșani', 'BV': 'Brașov', 'BZ': 'Buzău', 'CJ': 'Cluj', 'CL': 'Călărași',
  'CS': 'Caraș-Severin', 'CT': 'Constanța', 'CV': 'Covasna', 'DB': 'Dâmbovița', 'DJ': 'Dolj', 'GJ': 'Gorj',
  'GL': 'Galați', 'GR': 'Giurgiu', 'HD': 'Hunedoara', 'HR': 'Harghita', 'IF': 'Ilfov', 'IL': 'Ialomița',
  'IS': 'Iași', 'MH': 'Mehedinți', 'MM': 'Maramureș', 'MS': 'Mureș', 'NT': 'Neamț', 'OT': 'Olt',
  'PH': 'Prahova', 'SB': 'Sibiu', 'SJ': 'Sălaj', 'SM': 'Satu Mare', 'SV': 'Suceava', 'TL': 'Tulcea',
  'TM': 'Timiș', 'TR': 'Teleorman', 'VL': 'Vâlcea', 'VN': 'Vrancea', 'VS': 'Vaslui', 'BI': 'București'
};

// API Endpoints
export const API_ENDPOINTS = {
  PAYMENTS: 'https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/plati_pnrr',
  PROJECTS: 'https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/progres_tehnic_proiecte',
  TOP_BENEFICIARIES: 'https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/top_beneficiari'
};

// Data endpoint types
export const DATA_ENDPOINTS = {
  PAYMENTS: 'payments',
  PROJECTS: 'projects'
} as const;

export type DataEndpointType = typeof DATA_ENDPOINTS[keyof typeof DATA_ENDPOINTS];

// Default programs structure
export const DEFAULT_PROGRAMS = {
  'Tranziția spre o economie verde': { value: 0, projects: 0 },
  'Transformarea digitală': { value: 0, projects: 0 },
  'Creșterea economică inteligentă, sustenabilă și incluzivă': { value: 0, projects: 0 },
  'Coeziunea socială și teritorială': { value: 0, projects: 0 },
  'Sănătate și reziliență instituțională': { value: 0, projects: 0 },
  'Copii, tineri, educație și competențe': { value: 0, projects: 0 }
};

// Utility functions
export const formatMoney = (amount: number, currency: string = 'EUR'): string => {
  const value = amount || 0;
  const millions = value / 1e6;
  const rounded = Math.ceil(millions * 100) / 100;
  return `${rounded.toLocaleString('ro-RO', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })} mil ${currency}`;
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ro-RO').format(num || 0);
};

export const formatMoneyShort = (amount: number, currency: string = 'EUR'): string => {
  return formatMoney(amount, currency);
};

export const formatMoneyCompact = (amount: number, currency: string = 'EUR'): string => {
  return formatMoney(amount, currency);
};

// Romanian diacritics conversion helper
export const convertRomanianDiacritics = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  
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
    .replace(/ş/g, 'ș')  // Old encoding ş -> UTF-8 ș
    .replace(/ţ/g, 'ț')  // Old encoding ţ -> UTF-8 ț
    .replace(/Ã/g, 'Ă')  // Old encoding Ã -> UTF-8 Ă
    .replace(/Ş/g, 'Ș')  // Old encoding Ş -> UTF-8 Ș
    .replace(/Ţ/g, 'Ț');  // Old encoding Ţ -> UTF-8 Ț
};

// County name normalization helper
export const normalizeCountyName = (countyName: string): string | null => {
  if (!countyName) return null;
  
  const normalized = countyName.toUpperCase().trim();
  
  // Handle special cases
  if (normalized.includes('BUCUREŞTI') || normalized.includes('BUCUREȘTI') || normalized.includes('MUNICIPIUL BUCURESTI')) {
    return 'BI';
  }
  
  // Try to find county code by matching county names
  for (const [code, name] of Object.entries(COUNTY_MAP)) {
    if (normalized.includes(name.toUpperCase())) {
      return code;
    }
  }
  
  // Handle common variations
  const countyMappings: Record<string, string> = {
    'ALBA': 'AB',
    'ARGEŞ': 'AG', 'ARGES': 'AG', 'ARGEȘ': 'AG',
    'ARAD': 'AR',
    'BACĂU': 'BC', 'BACAU': 'BC',
    'BIHOR': 'BH',
    'BISTRIŢA': 'BN', 'BISTRITA': 'BN', 'BISTRIȚA': 'BN',
    'BRĂILA': 'BR', 'BRAILA': 'BR',
    'BOTOŞANI': 'BT', 'BOTOSANI': 'BT', 'BOTOȘANI': 'BT',
    'BRAŞOV': 'BV', 'BRASOV': 'BV', 'BRAȘOV': 'BV',
    'BUZĂU': 'BZ', 'BUZAU': 'BZ',
    'CLUJ': 'CJ',
    'CĂLĂRAŞI': 'CL', 'CALARASI': 'CL', 'CĂLĂRAȘI': 'CL',
    'CARAŞ': 'CS', 'CARAS': 'CS', 'CARAȘ': 'CS',
    'CONSTANŢA': 'CT', 'CONSTANTA': 'CT', 'CONSTANȚA': 'CT',
    'COVASNA': 'CV',
    'DÂMBOVIŢA': 'DB', 'DAMBOVITA': 'DB', 'DÂMBOVIȚA': 'DB',
    'DOLJ': 'DJ',
    'GALAŢI': 'GL', 'GALATI': 'GL', 'GALAȚI': 'GL',
    'GIURGIU': 'GR',
    'GORJ': 'GJ',
    'HUNEDOARA': 'HD',
    'HARGHITA': 'HR',
    'ILFOV': 'IF',
    'IALOMIŢA': 'IL', 'IALOMITA': 'IL', 'IALOMIȚA': 'IL',
    'IAŞI': 'IS', 'IASI': 'IS', 'IAȘI': 'IS',
    'MEHEDINŢI': 'MH', 'MEHEDINTI': 'MH', 'MEHEDINȚI': 'MH',
    'MARAMUREŞ': 'MM', 'MARAMURES': 'MM', 'MARAMUREȘ': 'MM',
    'MUREŞ': 'MS', 'MURES': 'MS', 'MUREȘ': 'MS',
    'NEAMŢ': 'NT', 'NEAMT': 'NT', 'NEAMȚ': 'NT',
    'OLT': 'OT',
    'PRAHOVA': 'PH',
    'SIBIU': 'SB',
    'SĂLAJ': 'SJ', 'SALAJ': 'SJ',
    'SATU MARE': 'SM',
    'SUCEAVA': 'SV',
    'TULCEA': 'TL',
    'TIMIŞ': 'TM', 'TIMIS': 'TM', 'TIMIȘ': 'TM',
    'TELEORMAN': 'TR',
    'VÂLCEA': 'VL', 'VALCEA': 'VL',
    'VRANCEA': 'VN',
    'VASLUI': 'VS'
  };
  
  for (const [key, code] of Object.entries(countyMappings)) {
    if (normalized.includes(key)) {
      return code;
    }
  }
  
  return null;
};

// Configuration for different data sources
export const DATA_SOURCE_CONFIG = {
  [DATA_ENDPOINTS.PAYMENTS]: {
    name: 'Payments',
    description: 'PNRR payment transactions data',
    source: 'plati_pnrr endpoint',
    focus: 'Actual payments made to beneficiaries',
    componentMapping: COMPONENT_MAPPING,
    fieldMappings: {
      value: 'VALOARE_PLATA_EURO',
      valueRON: 'VALOARE_PLATA_RON',
      componentCode: 'COD_COMPONENTA',
      beneficiaryName: 'NUME_BENEFICIAR',
      paymentDate: 'DATA_PLATA',
      locality: 'LOCALITATE_BENEFICIAR',
      measure: 'MASURA',
      fundingSource: 'SURSA_FINANTARE'
    }
  },
  [DATA_ENDPOINTS.PROJECTS]: {
    name: 'Projects',
    description: 'PNRR project progress and technical data',
    source: 'progres_tehnic_proiecte endpoint',
    focus: 'Project implementation status and details',
    componentMapping: COMPONENT_MAPPING,
    fieldMappings: {
      value: 'VALOARE_FE',
      valueRON: 'VALOARE_TOTAL',
      componentCode: 'COD_COMPONENTA',
      beneficiaryName: 'DENUMIRE_BENEFICIAR',
      engagementDate: 'DATA_ANGAJAMENT',
      locality: 'LOCALITATE_IMPLEMENTARE',
      county: 'JUDET_IMPLEMENTARE',
      contractNumber: 'NR_CONTRACT',
      projectTitle: 'TITLU_CONTRACT',
      stage: 'STADIU',
      impact: 'IMPACT'
    }
  }
};

// Export type for configuration
export type DataSourceConfig = typeof DATA_SOURCE_CONFIG[keyof typeof DATA_SOURCE_CONFIG];
