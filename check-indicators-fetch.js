import pako from 'pako';

const url = 'https://mfe.gov.ro/generator/data/20251106-indicatori_total.json.gz';

async function fetchIndicators() {
  try {
    console.log('Fetching:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('Decompressing...');
    const decompressed = pako.ungzip(uint8Array);
    const jsonString = new TextDecoder().decode(decompressed);
    const data = JSON.parse(jsonString);
    
    console.log('Data structure:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchIndicators();
