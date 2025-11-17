/**
 * Script pentru generare timeline din ultimul fișier plati_pnrr
 * Procesează UN SINGUR fișier (cel mai recent) care conține TOATE plățile
 * Grupează după data_raportarii și creează timeline lunar 2023-2025
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://mfe.gov.ro/pnrr-dashboard/generator/data/';
const LATEST_FILE = '20251111-plati_pnrr.json.gz'; // Ultimul fișier disponibil

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
 * Generează timeline lunar din toate plățile
 * Grupează după data_raportarii (YYYY-MM) și județ
 */
function generateMonthlyTimeline(rawData) {
  console.log(`\n📊 Processing ${rawData.length} payments...`);
  
  // Grupează plățile după lună (YYYY-MM)
  const byMonth = {};
  let skipped = 0;
  
  rawData.forEach(item => {
    const reportDate = item.data_raportarii ? item.data_raportarii.split('T')[0] : null;
    
    if (!reportDate) {
      skipped++;
      return;
    }
    
    // Extract YYYY-MM
    const month = reportDate.substring(0, 7); // "2024-03"
    const value = parseFloat(item.valoare_plata_fe_euro || 0);
    const valueRON = parseFloat(item.valoare_plata_fe || 0);
    // Normalizează diacritice: ş→ș, ţ→ț
    const county = (item.judet_beneficiar || 'NECUNOSCUT')
      .replace(/ş/g, 'ș').replace(/Ş/g, 'Ș')
      .replace(/ţ/g, 'ț').replace(/Ţ/g, 'Ț');
    
    if (!byMonth[month]) {
      byMonth[month] = {
        totalEUR: 0,
        totalRON: 0,
        totalPayments: 0,
        uniqueBeneficiaries: new Set(),
        counties: {}
      };
    }
    
    byMonth[month].totalEUR += value;
    byMonth[month].totalRON += valueRON;
    byMonth[month].totalPayments += 1;
    
    if (item.cui_beneficiar_final) {
      byMonth[month].uniqueBeneficiaries.add(item.cui_beneficiar_final);
    }
    
    // Grupează pe județ
    if (!byMonth[month].counties[county]) {
      byMonth[month].counties[county] = {
        name: county,
        totalEUR: 0,
        totalRON: 0,
        payments: 0
      };
    }
    
    byMonth[month].counties[county].totalEUR += value;
    byMonth[month].counties[county].totalRON += valueRON;
    byMonth[month].counties[county].payments += 1;
  });
  
  console.log(`✅ Processed ${rawData.length - skipped} payments`);
  console.log(`⚠️  Skipped ${skipped} payments without data_raportarii`);
  console.log(`📅 Found ${Object.keys(byMonth).length} unique months`);
  
  // Convertește în format final
  const timeline = [];
  const sortedMonths = Object.keys(byMonth).sort();
  
  // Calculează cumulativ
  let cumulativeEUR = 0;
  let cumulativeRON = 0;
  let cumulativePayments = 0;
  
  sortedMonths.forEach(month => {
    const data = byMonth[month];
    
    cumulativeEUR += data.totalEUR;
    cumulativeRON += data.totalRON;
    cumulativePayments += data.totalPayments;
    
    // Format label: "Martie 2024"
    const [year, monthNum] = month.split('-');
    const monthNames = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
                       'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
    const label = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    
    // Convertește județele în array
    const countiesArray = Object.values(data.counties).map(c => ({
      name: c.name,
      value: c.totalEUR,
      valueRON: c.totalRON,
      payments: c.payments
    }));
    
    timeline.push({
      date: month,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      totalEUR: cumulativeEUR,
      totalRON: cumulativeRON,
      totalPayments: cumulativePayments,
      uniqueBeneficiaries: data.uniqueBeneficiaries.size,
      counties: countiesArray
    });
  });
  
  return {
    generated_at: new Date().toISOString(),
    months: timeline.length,
    totalEUR: cumulativeEUR,
    totalRON: cumulativeRON,
    totalPayments: cumulativePayments,
    timeline: timeline
  };
}

/**
 * Main function
 */
async function generateTimeline() {
  console.log('🚀 Starting timeline generation from latest file...\n');
  
  try {
    const url = `${BASE_URL}${LATEST_FILE}`;
    const rawData = await downloadAndDecompress(url);
    
    const timelineData = generateMonthlyTimeline(rawData);
    
    // Salvează în public/
    const outputDir = path.join(__dirname, '..', 'public');
    const outputFile = path.join(outputDir, 'timeline-plati-2025.json');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, JSON.stringify(timelineData, null, 2));
    
    console.log(`\n✅ Timeline saved to: ${outputFile}`);
    console.log(`📊 Stats:`);
    console.log(`   - Months: ${timelineData.months}`);
    console.log(`   - Total EUR: ${(timelineData.totalEUR / 1000000).toFixed(2)} mil`);
    console.log(`   - Total RON: ${(timelineData.totalRON / 1000000).toFixed(2)} mil`);
    console.log(`   - Total Payments: ${timelineData.totalPayments}`);
    console.log(`   - Date range: ${timelineData.timeline[0].date} → ${timelineData.timeline[timelineData.timeline.length - 1].date}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
generateTimeline().catch(console.error);
