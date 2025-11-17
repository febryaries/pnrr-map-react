/**
 * Debug Timeline Spike - Analyze payments in Mai-Septembrie 2025
 */

const https = require('https');
const zlib = require('zlib');

const url = 'https://mfe.gov.ro/pnrr-dashboard/generator/data/20251108-plati_pnrr.json.gz';

console.log('📥 Downloading plati_pnrr.json.gz...\n');

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept-Encoding': 'gzip, deflate'
  }
}, (res) => {
  if (res.statusCode !== 200) {
    console.error(`❌ HTTP ${res.statusCode}`);
    return;
  }
  
  const chunks = [];
  const gunzip = zlib.createGunzip();
  
  res.pipe(gunzip);
  
  gunzip.on('data', (chunk) => chunks.push(chunk));
  gunzip.on('end', () => {
    try {
      const data = Buffer.concat(chunks).toString();
      const allPayments = JSON.parse(data);
      
      console.log(`✅ Downloaded ${allPayments.length} payments\n`);
      
      // Filter payments with dates
      const paymentsWithDate = allPayments.filter(p => {
        if (!p.data_plata) return false;
        const county = p.judet_beneficiar || '';
        if (county.toUpperCase().includes('MULTI')) return false;
        return true;
      });
      
      console.log(`✅ Filtered to ${paymentsWithDate.length} payments (excluding MULTI-JUDEȚ)\n`);
      
      // Analyze payments by month
      const months = [
        '2025-01', '2025-02', '2025-03', '2025-04', '2025-05',
        '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11'
      ];
      
      console.log('📊 CUMULATIVE ANALYSIS:\n');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      months.forEach(month => {
        const endOfMonth = month + '-31';
        
        // Count payments up to end of month
        const cumulativePayments = paymentsWithDate.filter(p => 
          p.data_plata <= endOfMonth
        );
        
        const totalEUR = cumulativePayments.reduce((sum, p) => 
          sum + (p.valoare_plata_fe_euro || 0), 0
        );
        
        console.log(`${month}: ${cumulativePayments.length.toString().padStart(6)} payments, ${(totalEUR / 1000000).toFixed(2).padStart(10)} mil EUR`);
      });
      
      console.log('\n═══════════════════════════════════════════════════════════\n');
      
      // Find payments in problematic range
      console.log('🔍 PAYMENTS IN MAI-SEPTEMBRIE 2025:\n');
      
      const problematicPayments = paymentsWithDate.filter(p => {
        const date = p.data_plata;
        return date >= '2025-05-01' && date <= '2025-09-30';
      });
      
      console.log(`Found ${problematicPayments.length} payments in Mai-Septembrie 2025\n`);
      
      // Group by month
      const byMonth = {};
      problematicPayments.forEach(p => {
        const month = p.data_plata.substring(0, 7);
        if (!byMonth[month]) {
          byMonth[month] = { count: 0, totalEUR: 0 };
        }
        byMonth[month].count++;
        byMonth[month].totalEUR += p.valoare_plata_fe_euro || 0;
      });
      
      Object.keys(byMonth).sort().forEach(month => {
        const data = byMonth[month];
        console.log(`${month}: ${data.count.toString().padStart(5)} payments, ${(data.totalEUR / 1000000).toFixed(2).padStart(8)} mil EUR`);
      });
      
      console.log('\n═══════════════════════════════════════════════════════════\n');
      
      // Check for payments with future dates or weird dates
      console.log('🔍 CHECKING FOR ANOMALIES:\n');
      
      const today = '2025-11-08';
      const futurePayments = paymentsWithDate.filter(p => p.data_plata > today);
      console.log(`Payments with future dates (> ${today}): ${futurePayments.length}`);
      
      if (futurePayments.length > 0) {
        console.log('\nSample future payments:');
        futurePayments.slice(0, 5).forEach(p => {
          console.log(`  - ${p.data_plata}: ${p.nume_beneficiar} (${(p.valoare_plata_fe_euro / 1000000).toFixed(2)} mil EUR)`);
        });
      }
      
      // Check for payments with year > 2025
      const year2026Plus = paymentsWithDate.filter(p => p.data_plata >= '2026-01-01');
      console.log(`\nPayments in 2026+: ${year2026Plus.length}`);
      
      if (year2026Plus.length > 0) {
        console.log('\nSample 2026+ payments:');
        year2026Plus.slice(0, 5).forEach(p => {
          console.log(`  - ${p.data_plata}: ${p.nume_beneficiar} (${(p.valoare_plata_fe_euro / 1000000).toFixed(2)} mil EUR)`);
        });
      }
      
      console.log('\n');
      
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  });
  
  gunzip.on('error', (err) => {
    console.error('❌ Gunzip error:', err.message);
  });
  
}).on('error', (err) => {
  console.error('❌ Request error:', err.message);
});
