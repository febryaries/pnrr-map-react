/**
 * Script pentru generare date timeline
 * Descarcă și procesează fișierele .gz de pe mfe.gov.ro
 * Generează public/data/timeline-data.json cu totaluri
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://mfe.gov.ro/generator/data/';
const CONTAINS_URL = 'https://mfe.gov.ro/generator/data/contains.json';

/**
 * Download și decompress fișier .gz
 */
function downloadAndDecompress(url) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${url}`);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };
    
    https.get(url, options, (response) => {
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
  if (!rawData || !Array.isArray(rawData)) {
    return { totalValue: 0, totalProjects: 0 };
  }

  let totalValue = 0;
  let totalProjects = rawData.length;

  rawData.forEach(item => {
    const value = parseFloat(item.valoare_plata_fe_euro || 0);
    totalValue += value;
  });

  return { totalValue, totalProjects };
}

/**
 * Fetch available dates from contains.json
 */
async function fetchAvailableDates() {
  console.log('📅 Fetching available dates from contains.json...');
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };
    
    const req = https.get(CONTAINS_URL, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          // Extract dates for plati_pnrr endpoint
          const dates = [];
          json.files.forEach(fileObj => {
            if (fileObj.endpoint === 'plati_pnrr') {
              dates.push(fileObj.date_yyyymmdd);
            }
          });
          
          // Sort dates chronologically
          dates.sort();
          
          console.log(`✅ Found ${dates.length} dates for plati_pnrr`);
          console.log(`📊 Range: ${dates[0]} → ${dates[dates.length - 1]}`);
          
          resolve(dates);
        } catch (err) {
          reject(err);
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Main function
 */
async function generateTimelineData() {
  console.log('🚀 Starting timeline data generation...\n');
  
  // Fetch available dates from contains.json
  const DATES = await fetchAvailableDates();
  
  if (DATES.length === 0) {
    console.error('❌ No dates found in contains.json');
    return;
  }
  
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
  
  // Salvează în public/
  const outputDir = path.join(__dirname, '..', 'public');
  const outputFile = path.join(outputDir, 'timeline-plati-2025.json');
  
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
