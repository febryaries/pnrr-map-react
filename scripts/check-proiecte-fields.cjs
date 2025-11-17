/**
 * Check available fields in progres_tehnic_proiecte.json.gz
 */

const https = require('https');
const zlib = require('zlib');

const url = 'https://mfe.gov.ro/pnrr-dashboard/generator/data/20251108-progres_tehnic_proiecte.json.gz';

console.log('📥 Downloading progres_tehnic_proiecte.json.gz...\n');

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
      
      console.log(`✅ Downloaded ${json.length} projects\n`);
      
      // Get first project
      const firstProject = json[0];
      
      console.log('📋 AVAILABLE FIELDS IN FIRST PROJECT:\n');
      console.log('═══════════════════════════════════════\n');
      
      Object.keys(firstProject).sort().forEach(key => {
        const value = firstProject[key];
        const type = typeof value;
        const preview = type === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : value;
        
        console.log(`${key.padEnd(35)} = ${preview}`);
      });
      
      console.log('\n═══════════════════════════════════════\n');
      
      // Check for date fields
      const dateFields = Object.keys(firstProject).filter(key => 
        key.toLowerCase().includes('data') || 
        key.toLowerCase().includes('date')
      );
      
      console.log('📅 DATE FIELDS FOUND:\n');
      dateFields.forEach(field => {
        console.log(`  ✓ ${field} = ${firstProject[field]}`);
      });
      
      if (dateFields.length === 0) {
        console.log('  ⚠️  No date fields found!');
      }
      
      console.log('\n');
      
      // Full first project
      console.log('📄 FULL FIRST PROJECT (JSON):\n');
      console.log(JSON.stringify(firstProject, null, 2));
      
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
