/**
 * Web Worker pentru procesare DATE REALE în background
 * Fetch + procesare fără să blocheze UI-ul
 */

// Import pako pentru decompresare gzip
importScripts('https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js');

// Funcție pentru fetch și decompresare
async function fetchAndDecompress(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Decompresare cu pako
    const decompressed = pako.ungzip(uint8Array, { to: 'string' });
    return JSON.parse(decompressed);
    
  } catch (error) {
    console.error('Worker fetch error:', error);
    throw error;
  }
}

// Procesare date - calculează totaluri
function processData(rawData) {
  if (!rawData || !rawData.items) {
    return { totalValue: 0, totalProjects: 0, counties: [] };
  }
  
  let totalValue = 0;
  let totalProjects = rawData.items.length;
  const countyMap = {};
  
  rawData.items.forEach(item => {
    const value = parseFloat(item.valoare_plata_fe_euro || 0);
    totalValue += value;
    
    const county = item.judet_beneficiar || 'NECUNOSCUT';
    if (!countyMap[county]) {
      countyMap[county] = { value: 0, projects: 0 };
    }
    countyMap[county].value += value;
    countyMap[county].projects += 1;
  });
  
  const counties = Object.entries(countyMap).map(([name, data]) => ({
    county: name,
    totalValue: data.value,
    totalProjects: data.projects
  }));
  
  return { totalValue, totalProjects, counties };
}

// Message handler
self.onmessage = async function(e) {
  const { type, date } = e.data;
  
  if (type === 'LOAD_DATE') {
    try {
      console.log(`Worker: Loading REAL data for ${date}...`);
      
      const url = `https://mfe.gov.ro/pnrr-dashboard/generator/data/${date}-plati_pnrr.json.gz`;
      const rawData = await fetchAndDecompress(url);
      const processedData = processData(rawData);
      
      console.log(`Worker: Loaded ${processedData.totalProjects} projects, ${(processedData.totalValue / 1000000).toFixed(2)} mil EUR`);
      
      self.postMessage({
        type: 'DATA_LOADED',
        date: date,
        data: processedData
      });
      
    } catch (error) {
      console.error(`Worker: Error loading ${date}:`, error);
      self.postMessage({
        type: 'ERROR',
        date: date,
        error: error.message
      });
    }
  }
};
