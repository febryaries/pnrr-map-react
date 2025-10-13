// Mock data structure based on the original project
import { convertRONToEUR } from '../services/ExchangeRateService'
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

export const COUNTY_MAP = {
  'AB': 'Alba', 'AG': 'Argeș', 'AR': 'Arad', 'BC': 'Bacău', 'BH': 'Bihor', 'BN': 'Bistrița-Năsăud',
  'BR': 'Brăila', 'BT': 'Botoșani', 'BV': 'Brașov', 'BZ': 'Buzău', 'CJ': 'Cluj', 'CL': 'Călărași',
  'CS': 'Caraș-Severin', 'CT': 'Constanța', 'CV': 'Covasna', 'DB': 'Dâmbovița', 'DJ': 'Dolj', 'GJ': 'Gorj',
  'GL': 'Galați', 'GR': 'Giurgiu', 'HD': 'Hunedoara', 'HR': 'Harghita', 'IF': 'Ilfov', 'IL': 'Ialomița',
  'IS': 'Iași', 'MH': 'Mehedinți', 'MM': 'Maramureș', 'MS': 'Mureș', 'NT': 'Neamț', 'OT': 'Olt',
  'PH': 'Prahova', 'SB': 'Sibiu', 'SJ': 'Sălaj', 'SM': 'Satu Mare', 'SV': 'Suceava', 'TL': 'Tulcea',
  'TM': 'Timiș', 'TR': 'Teleorman', 'VL': 'Vâlcea', 'VN': 'Vrancea', 'VS': 'Vaslui', 'BI': 'București'
};

// Generate mock county data
export const mockCountyData = Object.entries(COUNTY_MAP).map(([code, name]) => {
  const baseValue = Math.random() * 5000000000; // Random base value up to 5 billion RON
  const baseProjects = Math.floor(Math.random() * 200) + 10; // 10-210 projects
  
  // Generate component distribution - ensure all components are included
  const programs = {};
  
  // Initialize all components with zero values first
  PROGRAMS.forEach(component => {
    programs[component.key] = {
      value: 0,
      projects: 0
    };
  });
  
  // Then distribute the actual values randomly
  let remainingValue = baseValue;
  let remainingProjects = baseProjects;
  
  PROGRAMS.forEach((component, index) => {
    const isLast = index === PROGRAMS.length - 1;
    const valueShare = isLast ? remainingValue : Math.random() * remainingValue * 0.15; // Smaller share per component
    const projectShare = isLast ? remainingProjects : Math.floor(Math.random() * remainingProjects * 0.15);
    
    programs[component.key] = {
      value: Math.max(0, valueShare),
      projects: Math.max(0, projectShare)
    };
    
    remainingValue -= valueShare;
    remainingProjects -= projectShare;
  });

  return {
    code: `RO-${code}`,
    name,
    total: {
      value: baseValue,
      projects: baseProjects
    },
    programs,
    extras: {
      rows: generateMockProjects(code, baseProjects),
      col_labels: {
        'TITLU_PROIECT': 'Titlul Proiectului',
        'NUME_BENEFICIAR': 'Nume Beneficiar',
        'SURSA_FINANTARE': 'Sursa Finanțare',
        'VALOARE_PLATA_FE': 'Valoare Plată (EUR)',
        'VALOARE_PLATA_FE_EURO': 'Valoare Plată (EUR)',
        'PROGRES_FIZIC': 'Progres Fizic (%)',
        'COD_COMPONENTA': 'Cod Componentă',
        'COMPONENTA_LABEL': 'Componentă',
        'LOCALITATE_BENEFICIAR': 'Localitate Beneficiar',
        'COD_MASURA': 'Cod Măsură'
      }
    }
  };
});

function generateMockProjects(countyCode, count) {
  const projects = [];
  const beneficiaryTypes = ['Primăria', 'Consiliul Județean', 'SC', 'SRL', 'Universitatea', 'Spitalul'];
  const fundingSources = ['FEDR', 'FSE+', 'FC', 'FEPAM'];
  
  // Sample localities per county for SCOP_PROIECT generation
  const sampleLocalities = {
    'AB': ['Alba Iulia', 'Sebeș', 'Aiud', 'Blaj', 'Cugir'],
    'AG': ['Pitești', 'Curtea de Argeș', 'Câmpulung', 'Mioveni'],
    'AR': ['Arad', 'Ineu', 'Lipova', 'Pecica'],
    'BC': ['Bacău', 'Onești', 'Moinești', 'Comănești'],
    'BH': ['Oradea', 'Salonta', 'Marghita', 'Beiuș'],
    'BI': ['București', 'Sectorul 1', 'Sectorul 2', 'Sectorul 3'],
    'BN': ['Bistrița', 'Beclean', 'Năsăud'],
    'BR': ['Brăila', 'Ianca', 'Însurăței'],
    'BT': ['Botoșani', 'Dorohoi', 'Săveni'],
    'BV': ['Brașov', 'Făgăraș', 'Săcele', 'Codlea'],
    'BZ': ['Buzău', 'Râmnicu Sărat', 'Nehoiu'],
    'CJ': ['Cluj-Napoca', 'Turda', 'Dej', 'Câmpia Turzii'],
    'CL': ['Călărași', 'Oltenița', 'Fundulea'],
    'CS': ['Reșița', 'Caransebeș', 'Lugoj'],
    'CT': ['Constanța', 'Mangalia', 'Medgidia', 'Năvodari'],
    'CV': ['Sfântu Gheorghe', 'Târgu Secuiesc', 'Covasna'],
    'DB': ['Târgoviște', 'Moreni', 'Pucioasa'],
    'DJ': ['Craiova', 'Băilești', 'Calafat'],
    'GL': ['Galați', 'Tecuci', 'Târgu Bujor'],
    'GR': ['Giurgiu', 'Bolintin-Vale', 'Mihăilești'],
    'GJ': ['Târgu Jiu', 'Motru', 'Rovinari'],
    'HD': ['Deva', 'Hunedoara', 'Petroșani', 'Vulcan'],
    'HR': ['Miercurea Ciuc', 'Odorheiu Secuiesc', 'Gheorgheni'],
    'IF': ['Buftea', 'Otopeni', 'Voluntari', 'Pantelimon'],
    'IL': ['Slobozia', 'Fetești', 'Țăndărei'],
    'IS': ['Iași', 'Pașcani', 'Târgu Frumos'],
    'MH': ['Drobeta-Turnu Severin', 'Orșova', 'Vânju Mare'],
    'MM': ['Baia Mare', 'Sighetu Marmației', 'Borșa'],
    'MS': ['Târgu Mureș', 'Reghin', 'Sighișoara'],
    'NT': ['Piatra Neamț', 'Roman', 'Târgu Neamț'],
    'OT': ['Slatina', 'Caracal', 'Balș'],
    'PH': ['Ploiești', 'Câmpina', 'Băicoi'],
    'SB': ['Sibiu', 'Mediaș', 'Cisnădie'],
    'SJ': ['Zalău', 'Șimleu Silvaniei', 'Jibou'],
    'SM': ['Satu Mare', 'Carei', 'Negrești-Oaș'],
    'SV': ['Suceava', 'Fălticeni', 'Rădăuți'],
    'TL': ['Tulcea', 'Babadag', 'Măcin'],
    'TM': ['Timișoara', 'Lugoj', 'Sânnicolau Mare'],
    'TR': ['Alexandria', 'Rosiori de Vede', 'Turnu Măgurele'],
    'VL': ['Râmnicu Vâlcea', 'Drăgășani', 'Băbeni'],
    'VN': ['Focșani', 'Adjud', 'Mărășești'],
    'VS': ['Vaslui', 'Bârlad', 'Huși']
  };
  
  const localities = sampleLocalities[countyCode] || [COUNTY_MAP[countyCode]];
  
  for (let i = 0; i < Math.min(count, 50); i++) { // Limit to 50 projects for demo
    const componentCode = `C${Math.floor(Math.random() * 16) + 1}`;
    const componentMapping = COMPONENT_MAPPING[componentCode];
    const value = Math.random() * 10000000; // Up to 10M RON per project
    
    // Generate SCOP_PROIECT with locality mentions
    const randomLocality = localities[Math.floor(Math.random() * localities.length)];
    const scopeTemplates = [
      `Modernizarea infrastructurii în ${randomLocality}`,
      `Dezvoltarea serviciilor publice în municipiul ${randomLocality}`,
      `Proiect de reabilitare urbană în orașul ${randomLocality}`,
      `Îmbunătățirea calității vieții în comuna ${randomLocality}`,
      `Investiții în infrastructura din ${randomLocality}`,
      `Dezvoltare durabilă în ${randomLocality} și împrejurimi`
    ];
    
    projects.push({
      TITLU_PROIECT: `Proiect ${componentMapping.label} ${i + 1} - ${COUNTY_MAP[countyCode]}`,
      NUME_BENEFICIAR: `${beneficiaryTypes[Math.floor(Math.random() * beneficiaryTypes.length)]} ${COUNTY_MAP[countyCode]} ${i + 1}`,
      SURSA_FINANTARE: fundingSources[Math.floor(Math.random() * fundingSources.length)],
      VALOARE_PLATA_FE: value,
      VALOARE_PLATA_FE_EURO: convertRONToEUR(value), // Using exchange rate service
      PROGRES_FIZIC: Math.floor(Math.random() * 100),
      COD_COMPONENTA: componentCode,
      COMPONENTA_LABEL: componentMapping.label,
      COD_MASURA: `M${Math.floor(Math.random() * 50) + 1}`,
      LOCALITATE_BENEFICIAR: randomLocality, // Add locality field
      SCOP_PROIECT: scopeTemplates[Math.floor(Math.random() * scopeTemplates.length)],
      __program_key: componentCode, // Use component code as program key
      __share_value: value,
      __share_projects: 1
    });
  }
  
  return projects;
}

// Mock multi-county data
export const mockMultiCountyData = {
  code: 'RO-MULTI',
  name: 'Multi Județe',
  total: { value: 2000000000, projects: 45 },
  programs: {
    'C1': { value: 200000000, projects: 5 },
    'C2': { value: 150000000, projects: 4 },
    'C3': { value: 180000000, projects: 3 },
    'C4': { value: 300000000, projects: 6 },
    'C5': { value: 250000000, projects: 5 },
    'C6': { value: 200000000, projects: 4 },
    'C7': { value: 100000000, projects: 3 },
    'C8': { value: 120000000, projects: 2 },
    'C9': { value: 150000000, projects: 3 },
    'C10': { value: 100000000, projects: 2 },
    'C11': { value: 80000000, projects: 2 },
    'C12': { value: 200000000, projects: 4 },
    'C13': { value: 100000000, projects: 2 },
    'C14': { value: 120000000, projects: 2 },
    'C15': { value: 150000000, projects: 3 },
    'C16': { value: 100000000, projects: 2 }
  },
  extras: {
    rows: [],
    multi_agg_by_county: generateMultiCountyAggregation()
  }
};

function generateMultiCountyAggregation() {
  const agg = {};
  Object.keys(COUNTY_MAP).forEach(code => {
    agg[code] = {
      value: Math.random() * 100000000, // Random multi-county value per county
      projects: Math.floor(Math.random() * 5) + 1 // 1-5 multi-county projects
    };
  });
  return agg;
}

// Combine all data
export const mockData = [...mockCountyData, mockMultiCountyData];

// Utility functions
export const fmtMoney = (n, currency = 'EUR') => {
  const value = n || 0;
  const millions = value / 1e6;
  // Round up to 2 decimal places
  const rounded = Math.ceil(millions * 100) / 100;
  return `${rounded.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mil ${currency}`;
};

export const fmtNum = (n) => new Intl.NumberFormat('ro-RO').format(n || 0);

export const fmtMoneyShort = (n, currency = 'EUR') => {
  const value = n || 0;
  const millions = value / 1e6;
  // Round up to 2 decimal places
  const rounded = Math.ceil(millions * 100) / 100;
  return `${rounded.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mil ${currency}`;
};

// Alternative short format for very compact display
export const fmtMoneyCompact = (n, currency = 'EUR') => {
  const value = n || 0;
  const millions = value / 1e6;
  // Round up to 2 decimal places
  const rounded = Math.ceil(millions * 100) / 100;
  return `${rounded.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mil ${currency}`;
};
