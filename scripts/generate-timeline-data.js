/**
 * Script pentru generare date timeline
 * Descarcă și procesează fișierele .gz de pe mfe.gov.ro
 * Generează public/data/timeline-data.json cu totaluri
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Date disponibile
const DATES = [
  '20251029', '20251030', '20251031',
  '20251101', '20251103', '20251104'
];

const BASE_URL = 'https://mfe.gov.ro/generator/data/';

/**
 * Download și decompress fișier .gz
 */
function downloadAndDecompress(url) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${url}`);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      const gunzip = zlib.createGunzip();
      
      response.pipe(gunzip);
      
      gunzip.on('data', (chunk) => chunks.push(chunk));
      gunzip.on('end', () => {
        try {
          const data = Buffer.concat(chunks).toString('utf-8');
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
      gunzip.on('error', reject);
      
    }).on('error', reject);
  });
}

/**
 * Procesează date și extrage totaluri
 */
function processData(rawData) {
  if (!rawData || !rawData.items) {
    return { totalValue: 0, totalProjects: 0 };
  }

  let totalValue = 0;
  let totalProjects = rawData.items.length;

  rawData.items.forEach(item => {
    const value = parseFloat(item.valoare_plata_fe_euro || 0);
    totalValue += value;
  });

  return { totalValue, totalProjects };
}

/**
 * Main function
 */
async function generateTimelineData() {
  console.log('🚀 Starting timeline data generation...\n');
  
  const timelineData = {};
  
  for (const date of DATES) {
    try {
      const url = `${BASE_URL}${date}-plati_pnrr.json.gz`;
      const rawData = await downloadAndDecompress(url);
      const processed = processData(rawData);
      
      timelineData[date] = processed;
      
      console.log(`✅ ${date}: ${(processed.totalValue / 1000000).toFixed(2)} mil EUR, ${processed.totalProjects} projects`);
      
    } catch (error) {
      console.error(`❌ Error processing ${date}:`, error.message);
      timelineData[date] = { totalValue: 0, totalProjects: 0 };
    }
  }
  
  // Salvează în public/data/
  const outputDir = path.join(__dirname, '..', 'public', 'data');
  const outputFile = path.join(outputDir, 'timeline-data.json');
  
  // Creează directorul dacă nu există
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(timelineData, null, 2));
  
  console.log(`\n✅ Timeline data saved to: ${outputFile}`);
  console.log(`📊 Total dates processed: ${Object.keys(timelineData).length}`);
}

// Run
generateTimelineData().catch(console.error);
