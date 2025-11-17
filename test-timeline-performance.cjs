/**
 * Test Performance Timeline Plăți 2025
 * 
 * Testează dacă agregarea datelor va fi smooth
 */

const https = require('https');
const zlib = require('zlib');

async function testPerformance() {
  console.log('🔍 Starting performance test...\n');
  
  const startTotal = Date.now();
  
  // 1. Download & Decompress
  console.log('📥 Step 1: Downloading plati_pnrr.json.gz...');
  const startDownload = Date.now();
  
  const data = await new Promise((resolve, reject) => {
    https.get('https://mfe.gov.ro/pnrr-dashboard/generator/data/20251106-plati_pnrr.json.gz', (res) => {
      const chunks = [];
      const gunzip = zlib.createGunzip();
      
      res.pipe(gunzip);
      
      gunzip.on('data', (chunk) => chunks.push(chunk));
      gunzip.on('end', () => resolve(Buffer.concat(chunks).toString()));
      gunzip.on('error', reject);
    }).on('error', reject);
  });
  
  const downloadTime = Date.now() - startDownload;
  console.log(`✅ Downloaded in ${downloadTime}ms`);
  console.log(`📦 Size: ${(data.length / 1024 / 1024).toFixed(2)} MB\n`);
  
  // 2. Parse JSON
  console.log('📝 Step 2: Parsing JSON...');
  const startParse = Date.now();
  const allPayments = JSON.parse(data);
  const parseTime = Date.now() - startParse;
  console.log(`✅ Parsed in ${parseTime}ms`);
  console.log(`📊 Total payments: ${allPayments.length}\n`);
  
  // 3. Filter 2025
  console.log('🔍 Step 3: Filtering 2025 payments...');
  const startFilter = Date.now();
  const plati2025 = allPayments.filter(p => p.data_plata && p.data_plata.startsWith('2025'));
  const filterTime = Date.now() - startFilter;
  console.log(`✅ Filtered in ${filterTime}ms`);
  console.log(`📅 Payments from 2025: ${plati2025.length}\n`);
  
  // 4. Group by month
  console.log('📊 Step 4: Grouping by month...');
  const startGroup = Date.now();
  const byMonth = {};
  
  plati2025.forEach(p => {
    const month = p.data_plata.substring(0, 7); // "2025-01"
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(p);
  });
  
  const groupTime = Date.now() - startGroup;
  console.log(`✅ Grouped in ${groupTime}ms`);
  console.log(`📆 Months found: ${Object.keys(byMonth).length}\n`);
  
  // 5. Aggregate by county (CRITICAL TEST!)
  console.log('🗺️  Step 5: Aggregating by county (CRITICAL)...');
  const startAggregate = Date.now();
  
  const timeline = Object.keys(byMonth).sort().map(month => {
    const payments = byMonth[month];
    
    // Aggregate by county
    const byCounty = {};
    const beneficiaries = new Set();
    
    payments.forEach(p => {
      const county = p.judet_beneficiar || 'UNKNOWN';
      
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
    
    // Convert to array (for JSON)
    const counties = Object.entries(byCounty).map(([name, data]) => ({
      name,
      totalEUR: data.totalEUR,
      totalRON: data.totalRON,
      paymentsCount: data.paymentsCount,
      beneficiariesCount: data.beneficiaries.size
    }));
    
    return {
      date: month,
      totalPayments: payments.length,
      totalEUR: payments.reduce((sum, p) => sum + (p.valoare_plata_fe_euro || 0), 0),
      totalRON: payments.reduce((sum, p) => sum + (p.valoare_plata_fe || 0), 0),
      uniqueBeneficiaries: beneficiaries.size,
      counties
    };
  });
  
  const aggregateTime = Date.now() - startAggregate;
  console.log(`✅ Aggregated in ${aggregateTime}ms`);
  console.log(`📦 Timeline frames: ${timeline.length}\n`);
  
  // 6. Calculate final JSON size
  console.log('💾 Step 6: Calculating output size...');
  const jsonString = JSON.stringify(timeline, null, 2);
  const jsonSize = jsonString.length;
  console.log(`📦 Final JSON size: ${(jsonSize / 1024).toFixed(2)} KB\n`);
  
  // 7. Test frame switching speed
  console.log('⚡ Step 7: Testing frame switching speed...');
  const switchTests = 100;
  const startSwitch = Date.now();
  
  for (let i = 0; i < switchTests; i++) {
    const frame = timeline[i % timeline.length];
    // Simulate what Timeline component does
    const _ = frame.counties.map(c => ({
      value: c.totalEUR,
      name: c.name
    }));
  }
  
  const switchTime = (Date.now() - startSwitch) / switchTests;
  console.log(`✅ Average frame switch: ${switchTime.toFixed(2)}ms`);
  console.log(`🎯 Target: <16ms for 60 FPS\n`);
  
  // RESULTS
  const totalTime = Date.now() - startTotal;
  
  console.log('═══════════════════════════════════════');
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Download:        ${downloadTime}ms`);
  console.log(`Parse JSON:      ${parseTime}ms`);
  console.log(`Filter 2025:     ${filterTime}ms`);
  console.log(`Group by month:  ${groupTime}ms`);
  console.log(`Aggregate:       ${aggregateTime}ms`);
  console.log(`─────────────────────────────────────`);
  console.log(`TOTAL:           ${totalTime}ms`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Output size:     ${(jsonSize / 1024).toFixed(2)} KB`);
  console.log(`Frame switch:    ${switchTime.toFixed(2)}ms`);
  console.log(`═══════════════════════════════════════\n`);
  
  // VERDICT
  console.log('🎯 VERDICT:');
  if (jsonSize < 100 * 1024) {
    console.log('✅ Output size: EXCELLENT (<100 KB)');
  } else if (jsonSize < 500 * 1024) {
    console.log('⚠️  Output size: OK (<500 KB)');
  } else {
    console.log('❌ Output size: TOO LARGE (>500 KB)');
  }
  
  if (switchTime < 16) {
    console.log('✅ Frame switching: SMOOTH (60 FPS)');
  } else if (switchTime < 33) {
    console.log('⚠️  Frame switching: OK (30 FPS)');
  } else {
    console.log('❌ Frame switching: LAGGY (<30 FPS)');
  }
  
  if (totalTime < 3000) {
    console.log('✅ Initial load: FAST (<3s)');
  } else if (totalTime < 5000) {
    console.log('⚠️  Initial load: OK (<5s)');
  } else {
    console.log('❌ Initial load: SLOW (>5s)');
  }
  
  console.log('\n🚀 Ready for implementation!');
}

testPerformance().catch(console.error);
