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

async function generateTimeline() {
  console.log('🚀 Starting timeline generation for Plăți PNRR 2025\n');
  const startTime = Date.now();
  
  try {
    // 1. Download data
    const url = 'https://mfe.gov.ro/generator/data/20251106-plati_pnrr.json.gz';
    const allPayments = await downloadAndDecompress(url);
    console.log(`✅ Downloaded ${allPayments.length} total payments\n`);
    
    // 2. Filter 2025
    console.log('🔍 Filtering payments from 2025...');
    const plati2025 = allPayments.filter(p => 
      p.data_plata && p.data_plata.startsWith('2025')
    );
    console.log(`✅ Found ${plati2025.length} payments from 2025\n`);
    
    // 3. Group by month
    console.log('📊 Grouping by month...');
    const byMonth = {};
    
    plati2025.forEach(p => {
      const month = p.data_plata.substring(0, 7); // "2025-01"
      if (!byMonth[month]) {
        byMonth[month] = [];
      }
      byMonth[month].push(p);
    });
    
    const months = Object.keys(byMonth).sort();
    console.log(`✅ Grouped into ${months.length} months: ${months.join(', ')}\n`);
    
    // 4. Aggregate by county for each month (CUMULATIVE)
    console.log('🗺️  Aggregating by county (cumulative)...');
    const timeline = [];
    let cumulativePayments = [];
    
    months.forEach((month, index) => {
      // Add current month payments to cumulative
      cumulativePayments = cumulativePayments.concat(byMonth[month]);
      
      // Aggregate by county
      const byCounty = {};
      const beneficiaries = new Set();
      
      cumulativePayments.forEach(p => {
        const countyRaw = p.judet_beneficiar || 'NECUNOSCUT';
        const county = normalizeCountyName(countyRaw);
        
        if (!byCounty[county]) {
          byCounty[county] = {
            totalEUR: 0,
            totalRON: 0,
            paymentsCount: 0,
            beneficiaries: new Set()
          };
        }
        
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
      
      // Calculate totals
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
      description: 'Timeline plăți PNRR 2025 - date cumulative pe luni',
      source: 'https://mfe.gov.ro/generator/data/20251106-plati_pnrr.json.gz',
      year: 2025,
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
