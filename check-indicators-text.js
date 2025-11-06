const url = 'https://mfe.gov.ro/generator/data/20251106-indicatori_total.json.gz';

async function fetchIndicators() {
  try {
    console.log('Fetching:', url);
    const response = await fetch(url, {
      headers: {
        'Accept-Encoding': 'gzip, deflate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('Reading as text...');
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      console.log('✅ Successfully parsed JSON:');
      console.log(JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('❌ Not JSON, raw text length:', text.length);
      console.log('First 500 chars:', text.substring(0, 500));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchIndicators();
