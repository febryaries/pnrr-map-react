const url = 'https://mfe.gov.ro/pnrr-dashboard/generator/data/contains.json';

async function fetchContains() {
  try {
    console.log('Fetching:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('\n📅 Total files:', data.count);
    console.log('📅 Generated at:', data.generated_at);
    
    // Extract unique dates
    const dates = new Set();
    data.files.forEach(file => {
      if (!file.is_legacy) {
        dates.add(file.date_yyyymmdd);
      }
    });
    
    const sortedDates = Array.from(dates).sort().reverse();
    
    console.log('\n📅 Available dates (newest first):');
    sortedDates.forEach(date => {
      console.log('  -', date);
    });
    
    console.log('\n📅 Latest date:', sortedDates[0]);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchContains();
