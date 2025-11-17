/**
 * Check available fields in plati_pnrr.json.gz
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
      const json = JSON.parse(data);
      
      console.log(`✅ Downloaded ${json.length} payments\n`);
      
      // Get first payment
      const firstPayment = json[0];
      
      console.log('📋 AVAILABLE FIELDS IN FIRST PAYMENT:\n');
      console.log('═══════════════════════════════════════\n');
      
      Object.keys(firstPayment).sort().forEach(key => {
        const value = firstPayment[key];
        const type = typeof value;
        const preview = type === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : value;
        
        console.log(`${key.padEnd(35)} = ${preview}`);
      });
      
      console.log('\n═══════════════════════════════════════\n');
      
      // Check for date fields
      const dateFields = Object.keys(firstPayment).filter(key => 
        key.toLowerCase().includes('data') || 
        key.toLowerCase().includes('date')
      );
      
      console.log('📅 DATE FIELDS FOUND:\n');
      dateFields.forEach(field => {
        console.log(`  ✓ ${field} = ${firstPayment[field]}`);
      });
      
      if (dateFields.length === 0) {
        console.log('  ⚠️  No date fields found!');
      }
      
      console.log('\n');
      
      // Full first payment
      console.log('📄 FULL FIRST PAYMENT (JSON):\n');
      console.log(JSON.stringify(firstPayment, null, 2));
      
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
