/**
 * Debug Octombrie 2025 - Find negative or corrected payments
 */

const https = require('https');
const zlib = require('zlib');

const url = 'https://mfe.gov.ro/generator/data/20251108-plati_pnrr.json.gz';

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
      
      // Filter payments with dates (exclude MULTI)
      const paymentsWithDate = allPayments.filter(p => {
        if (!p.data_plata) return false;
        const county = p.judet_beneficiar || '';
        if (county.toUpperCase().includes('MULTI')) return false;
        return true;
      });
      
      // Get payments in Octombrie 2025
      const octoberPayments = paymentsWithDate.filter(p => {
        const date = p.data_plata;
        return date >= '2025-10-01' && date <= '2025-10-31';
      });
      
      console.log(`📊 OCTOMBRIE 2025: ${octoberPayments.length} payments\n`);
      
      // Calculate total
      let totalEUR = 0;
      let totalRON = 0;
      let negativeCount = 0;
      let negativeEUR = 0;
      
      octoberPayments.forEach(p => {
        const eur = p.valoare_plata_fe_euro || 0;
        const ron = p.valoare_plata_fe || 0;
        
        totalEUR += eur;
        totalRON += ron;
        
        if (eur < 0) {
          negativeCount++;
          negativeEUR += eur;
        }
      });
      
      console.log(`Total EUR: ${(totalEUR / 1000000).toFixed(2)} mil`);
      console.log(`Total RON: ${(totalRON / 1000000).toFixed(2)} mil`);
      console.log(`Negative payments: ${negativeCount}`);
      console.log(`Negative EUR: ${(negativeEUR / 1000000).toFixed(2)} mil\n`);
      
      // Show negative payments
      if (negativeCount > 0) {
        console.log('🚨 NEGATIVE PAYMENTS:\n');
        const negatives = octoberPayments.filter(p => (p.valoare_plata_fe_euro || 0) < 0);
        negatives.forEach(p => {
          console.log(`  - ${p.data_plata}: ${p.nume_beneficiar}`);
          console.log(`    EUR: ${(p.valoare_plata_fe_euro / 1000000).toFixed(2)} mil`);
          console.log(`    RON: ${(p.valoare_plata_fe / 1000000).toFixed(2)} mil`);
          console.log(`    Județ: ${p.judet_beneficiar}`);
          console.log(`    Măsură: ${p.masura}\n`);
        });
      }
      
      // Compare Septembrie vs Octombrie cumulative
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('📊 CUMULATIVE COMPARISON:\n');
      
      const septemberCumulative = paymentsWithDate.filter(p => p.data_plata <= '2025-09-30');
      const octoberCumulative = paymentsWithDate.filter(p => p.data_plata <= '2025-10-31');
      
      const septEUR = septemberCumulative.reduce((sum, p) => sum + (p.valoare_plata_fe_euro || 0), 0);
      const octEUR = octoberCumulative.reduce((sum, p) => sum + (p.valoare_plata_fe_euro || 0), 0);
      
      console.log(`Septembrie (cumulative): ${septemberCumulative.length} payments, ${(septEUR / 1000000).toFixed(2)} mil EUR`);
      console.log(`Octombrie (cumulative):  ${octoberCumulative.length} payments, ${(octEUR / 1000000).toFixed(2)} mil EUR`);
      console.log(`\nDifference: ${octoberCumulative.length - septemberCumulative.length} payments, ${((octEUR - septEUR) / 1000000).toFixed(2)} mil EUR`);
      
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
