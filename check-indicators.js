const https = require('https');
const zlib = require('zlib');

const url = 'https://mfe.gov.ro/pnrr-dashboard/generator/data/20251106-indicatori_total.json.gz';

https.get(url, (response) => {
  const gunzip = zlib.createGunzip();
  let data = '';

  response.pipe(gunzip);

  gunzip.on('data', (chunk) => {
    data += chunk.toString();
  });

  gunzip.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.log('Raw data:', data);
    }
  });

  gunzip.on('error', (error) => {
    console.error('Decompression error:', error);
  });
}).on('error', (error) => {
  console.error('Request error:', error);
});
