/**
 * Generate Timeline Data for Plăți PNRR 2025
 * 
 * Descarcă datele de plăți, filtrează doar 2025, agregă pe luni și județe
 * Output: timeline-plati-2025.json (~76 KB)
 */

const https = require('https');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Romanian month names
const ROMANIAN_MONTHS = {
  '01': 'Ianuarie',
  '02': 'Februarie',
  '03': 'Martie',
  '04': 'Aprilie',
  '05': 'Mai',
  '06': 'Iunie',
  '07': 'Iulie',
  '08': 'August',
  '09': 'Septembrie',
  '10': 'Octombrie',
  '11': 'Noiembrie',
  '12': 'Decembrie'
};

// County name normalization
const COUNTY_NORMALIZATION = {
  'MUNICIPIUL BUCUREŞTI': 'BUCUREȘTI',
  'MUNICIPIUL BUCUREȘTI': 'BUCUREȘTI',
  'BUCURESTI': 'BUCUREȘTI',
  'BUCUREŞTI': 'BUCUREȘTI'
};

function normalizeCountyName(name) {
  if (!name) return 'NECUNOSCUT';
  
  const upper = name.toUpperCase().trim();
  
  // Check normalization map
  if (COUNTY_NORMALIZATION[upper]) {
    return COUNTY_NORMALIZATION[upper];
  }
  
  // Remove "MUNICIPIUL" prefix
  if (upper.startsWith('MUNICIPIUL ')) {
    return upper.replace('MUNICIPIUL ', '');
  }
  
  return upper;
}

async function downloadAndDecompress(url) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${url}`);
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Encoding': 'gzip, deflate'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      const chunks = [];
      const gunzip = zlib.createGunzip();
      
      res.pipe(gunzip);
      
      gunzip.on('data', (chunk) => chunks.push(chunk));
      gunzip.on('end', () => {
        const data = Buffer.concat(chunks).toString();
        resolve(JSON.parse(data));
      });
      gunzip.on('error', reject);
    }).on('error', reject);
  });
}

async function getLatestDataDate() {
  return new Promise((resolve, reject) => {
    console.log('📅 Fetching latest data date from contains.json...');
    
    https.get('https://mfe.gov.ro/pnrr-dashboard/generator/data/contains.json', (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Find latest plati_pnrr file
          const platiFiles = json.files.filter(f => f.endpoint === 'plati_pnrr');
          if (platiFiles.length === 0) {
            reject(new Error('No plati_pnrr files found'));
            return;
          }
          
          // First file is the latest (sorted by date desc)
          const latestDate = platiFiles[0].date_yyyymmdd;
          console.log(`✅ Latest data date: ${latestDate} (${platiFiles[0].dataset_date})\n`);
          resolve(latestDate);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function generateTimeline() {
  console.log('🚀 Starting timeline generation for Plăți PNRR 2025\n');
  const startTime = Date.now();
  
  try {
    // 1. Get latest data date automatically (with fallback)
    let latestDate;
    try {
      latestDate = await getLatestDataDate();
    } catch (error) {
      console.log(`⚠️  Could not fetch latest date: ${error.message}`);
      console.log(`📅 Using fallback date: 20251110\n`);
      latestDate = '20251110';
    }
    
    // 2. Download data
    const url = `https://mfe.gov.ro/pnrr-dashboard/generator/data/${latestDate}-plati_pnrr.json.gz`;
    const allPayments = await downloadAndDecompress(url);
    console.log(`✅ Downloaded ${allPayments.length} total payments\n`);
    
    // 3. Filter payments: exclude MULTI-JUDEȚ (to match Homepage behavior)
    console.log('📊 Processing payments (excluding MULTI-JUDEȚ)...');
    const allPaymentsWithDate = allPayments.filter(p => {
      if (!p.data_plata) return false;
      
      // Exclude MULTI-JUDEȚ payments (like Homepage does)
      const county = p.judet_beneficiar || '';
      if (county.toUpperCase().includes('MULTI')) return false;
      
      return true;
    });
    console.log(`✅ Found ${allPaymentsWithDate.length} payments with dates (excluding MULTI-JUDEȚ)\n`);
    
    // 4. Define target months for FULL timeline (2020-2025)
    console.log('📊 Creating cumulative timeline for 2020-2025...');
    const targetMonths = [];
    
    // Generate all months from Dec 2020 to Nov 2025
    const startYear = 2020;
    const startMonth = 12; // December
    const endYear = 2025;
    const endMonth = 11; // November
    
    for (let year = startYear; year <= endYear; year++) {
      const firstMonth = (year === startYear) ? startMonth : 1;
      const lastMonth = (year === endYear) ? endMonth : 12;
      
      for (let month = firstMonth; month <= lastMonth; month++) {
        const monthStr = String(month).padStart(2, '0');
        targetMonths.push(`${year}-${monthStr}`);
      }
    }
    
    console.log(`✅ Target months: ${targetMonths.length} months (${targetMonths[0]} to ${targetMonths[targetMonths.length - 1]})\n`);
    
    // 5. Aggregate by county for each month (CUMULATIVE)
    console.log('🗺️  Aggregating by county (cumulative)...');
    const timeline = [];
    
    targetMonths.forEach((month, index) => {
      // Get ALL payments up to end of this month (CUMULATIVE)
      const endOfMonth = month + '-31'; // Approximate end (works for all months)
      const cumulativePayments = allPaymentsWithDate.filter(p => 
        p.data_plata <= endOfMonth
      );
      
      // Aggregate by county
      const byCounty = {};
      const beneficiaries = new Set();
      
      cumulativePayments.forEach(p => {
        const countyRaw = p.judet_beneficiar || 'NECUNOSCUT';
        const county = normalizeCountyName(countyRaw);
        
        // Skip MULTI-JUDEȚ (should already be filtered, but double-check)
        if (county.includes('MULTI')) return;
        
        if (!byCounty[county]) {
          byCounty[county] = {
            totalEUR: 0,
            totalRON: 0,
            paymentsCount: 0,
            beneficiaries: new Set()
          };
        }
        
        // Include ALL payments (positive and negative) for accurate cumulative totals
        byCounty[county].totalEUR += p.valoare_plata_fe_euro || 0;
        byCounty[county].totalRON += p.valoare_plata_fe || 0;
        byCounty[county].paymentsCount++;
        byCounty[county].beneficiaries.add(p.cui_beneficiar_final);
        beneficiaries.add(p.cui_beneficiar_final);
      });
      
      // Convert to array
      const counties = Object.entries(byCounty)
        .map(([name, data]) => ({
          name,
          totalEUR: Math.round(data.totalEUR * 100) / 100, // Round to 2 decimals
          totalRON: Math.round(data.totalRON * 100) / 100,
          paymentsCount: data.paymentsCount,
          beneficiariesCount: data.beneficiaries.size
        }))
        .sort((a, b) => b.totalEUR - a.totalEUR); // Sort by value DESC
      
      // Calculate totals (include ALL payments - positive and negative)
      const totalEUR = cumulativePayments.reduce((sum, p) => 
        sum + (p.valoare_plata_fe_euro || 0), 0
      );
      const totalRON = cumulativePayments.reduce((sum, p) => 
        sum + (p.valoare_plata_fe || 0), 0
      );
      
      const [year, monthNum] = month.split('-');
      const monthName = ROMANIAN_MONTHS[monthNum];
      
      timeline.push({
        date: month,
        dateYYYYMMDD: month.replace(/-/g, ''),
        label: `${monthName} ${year}`,
        totalPayments: cumulativePayments.length,
        totalEUR: Math.round(totalEUR * 100) / 100,
        totalRON: Math.round(totalRON * 100) / 100,
        uniqueBeneficiaries: beneficiaries.size,
        counties
      });
      
      console.log(`  ✓ ${monthName}: ${cumulativePayments.length} plăți, ${(totalEUR / 1000000).toFixed(2)} mil EUR, ${beneficiaries.size} beneficiari`);
    });
    
    console.log(`\n✅ Generated ${timeline.length} timeline frames\n`);
    
    // 5. Save to file
    const output = {
      generated_at: new Date().toISOString(),
      description: 'Timeline plăți PNRR 2020-2025 - date cumulative pe luni (fără MULTI-JUDEȚ)',
      source: url,
      startYear: 2020,
      endYear: 2025,
      months: timeline.length,
      totalPayments: timeline[timeline.length - 1].totalPayments,
      totalEUR: timeline[timeline.length - 1].totalEUR,
      uniqueBeneficiaries: timeline[timeline.length - 1].uniqueBeneficiaries,
      timeline
    };
    
    const outputPath = path.join(__dirname, '..', 'public', 'timeline-plati-2025.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    const fileSize = fs.statSync(outputPath).size;
    console.log(`💾 Saved to: ${outputPath}`);
    console.log(`📦 File size: ${(fileSize / 1024).toFixed(2)} KB\n`);
    
    // 6. Summary
    const totalTime = Date.now() - startTime;
    console.log('═══════════════════════════════════════');
    console.log('✅ TIMELINE GENERATION COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`Total time:          ${totalTime}ms`);
    console.log(`Output size:         ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`Timeline frames:     ${timeline.length} months`);
    console.log(`Total payments:      ${output.totalPayments}`);
    console.log(`Total EUR:           ${(output.totalEUR / 1000000).toFixed(2)} mil`);
    console.log(`Unique beneficiaries: ${output.uniqueBeneficiaries}`);
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
generateTimeline();
