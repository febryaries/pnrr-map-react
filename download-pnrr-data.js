#!/usr/bin/env node

/**
 * PNRR Data Downloader Script
 * Downloads all payment data from the PNRR API and saves it to a JSON file
 * 
 * Usage: node download-pnrr-data.js
 */

const fs = require('fs').promises;
const path = require('path');

// API configuration
const API_BASE_URL = 'https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/plati_pnrr';
const BATCH_SIZE = 5000; // Same as your updated limit
const DELAY_BETWEEN_REQUESTS = 100; // ms
const MAX_RETRIES = 3;
const OUTPUT_FILE = 'pnrr-data-complete.json';

// Fetch data from PNRR API with retry logic
async function fetchPNRRBatch(offset, limit, retryCount = 0) {
  const url = `${API_BASE_URL}?offset=${offset}&limit=${limit}`;
  
  try {
    console.log(`Fetching: ${url}`);
    
    // Use dynamic import for fetch in Node.js
    const { default: fetch } = await import('node-fetch');
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PNRR-Data-Downloader/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
    
  } catch (error) {
    console.error(`Error fetching batch at offset ${offset}:`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return fetchPNRRBatch(offset, limit, retryCount + 1);
    } else {
      throw error;
    }
  }
}

// Download all PNRR data with pagination
async function downloadAllPNRRData() {
  const allData = [];
  let offset = 0;
  let hasMoreData = true;
  let batchNumber = 1;
  
  console.log('🚀 Starting PNRR data download...');
  console.log(`📊 Batch size: ${BATCH_SIZE} records`);
  console.log(`⏱️  Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log('');
  
  const startTime = Date.now();
  
  while (hasMoreData) {
    try {
      console.log(`📦 Batch ${batchNumber}: Fetching records ${offset + 1}-${offset + BATCH_SIZE}...`);
      
      const batchData = await fetchPNRRBatch(offset, BATCH_SIZE);
      
      if (batchData.length === 0) {
        console.log('✅ No more data available');
        hasMoreData = false;
      } else {
        allData.push(...batchData);
        console.log(`   ✓ Fetched ${batchData.length} records. Total: ${allData.length}`);
        
        // Check if we've reached the end
        if (batchData.length < BATCH_SIZE) {
          console.log('✅ Reached end of data (partial batch)');
          hasMoreData = false;
        } else {
          // Move to next batch
          offset += BATCH_SIZE;
          batchNumber++;
          
          // Add delay between requests
          if (hasMoreData) {
            console.log(`   ⏳ Waiting ${DELAY_BETWEEN_REQUESTS}ms...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Error in batch ${batchNumber}:`, error.message);
      
      // Check if it's a "no more data" type error
      if (error.message.includes('404') || error.message.includes('400')) {
        console.log('✅ Reached end of available data');
        hasMoreData = false;
      } else {
        // For other errors, try to continue with next batch
        console.log('⚠️  Continuing with next batch...');
        offset += BATCH_SIZE;
        batchNumber++;
        
        // Safety check to prevent infinite loops
        if (offset > 100000) {
          console.log('⚠️  Reached safety limit (100,000 records), stopping');
          hasMoreData = false;
        }
      }
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('');
  console.log('📈 Download Summary:');
  console.log(`   Total records: ${allData.length.toLocaleString()}`);
  console.log(`   Total batches: ${batchNumber}`);
  console.log(`   Duration: ${duration} seconds`);
  console.log(`   Average: ${(allData.length / parseFloat(duration)).toFixed(0)} records/second`);
  
  return allData;
}

// Save data to JSON file with pretty formatting
async function saveDataToFile(data, filename) {
  try {
    console.log('');
    console.log(`💾 Saving data to ${filename}...`);
    
    const jsonData = JSON.stringify(data, null, 2);
    const filePath = path.join(process.cwd(), filename);
    
    await fs.writeFile(filePath, jsonData, 'utf8');
    
    const stats = await fs.stat(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Data saved successfully!`);
    console.log(`   File: ${filePath}`);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log(`   Records: ${data.length.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error saving file:', error.message);
    throw error;
  }
}

// Generate summary statistics
function generateSummary(data) {
  console.log('');
  console.log('📊 Data Summary:');
  
  // Count by component
  const componentCounts = {};
  const countyCounts = {};
  const programCounts = {};
  let totalValue = 0;
  
  data.forEach(record => {
    // Component analysis
    const component = record.cod_componenta || 'Unknown';
    componentCounts[component] = (componentCounts[component] || 0) + 1;
    
    // County analysis
    const county = record.judet_beneficiar || 'Unknown';
    countyCounts[county] = (countyCounts[county] || 0) + 1;
    
    // Value analysis
    totalValue += parseFloat(record.valoare_plata_fe || 0);
  });
  
  console.log(`   Total value: ${totalValue.toLocaleString('ro-RO')} RON`);
  console.log(`   Unique components: ${Object.keys(componentCounts).length}`);
  console.log(`   Unique counties: ${Object.keys(countyCounts).length}`);
  
  // Top 5 components
  console.log('');
  console.log('🏆 Top 5 Components:');
  Object.entries(componentCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([component, count], index) => {
      console.log(`   ${index + 1}. ${component}: ${count.toLocaleString()} records`);
    });
  
  // Top 5 counties
  console.log('');
  console.log('🏆 Top 5 Counties:');
  Object.entries(countyCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([county, count], index) => {
      console.log(`   ${index + 1}. ${county}: ${count.toLocaleString()} records`);
    });
}

// Main execution
async function main() {
  try {
    console.log('🇷🇴 PNRR Data Downloader');
    console.log('========================');
    console.log('');
    
    // Check if node-fetch is available
    try {
      await import('node-fetch');
    } catch (error) {
      console.log('📦 Installing node-fetch...');
      const { execSync } = require('child_process');
      execSync('npm install node-fetch@3', { stdio: 'inherit' });
      console.log('✅ node-fetch installed');
      console.log('');
    }
    
    // Download all data
    const allData = await downloadAllPNRRData();
    
    if (allData.length === 0) {
      console.log('⚠️  No data was downloaded. Please check the API endpoint.');
      return;
    }
    
    // Save to file
    await saveDataToFile(allData, OUTPUT_FILE);
    
    // Generate summary
    generateSummary(allData);
    
    console.log('');
    console.log('🎉 Download completed successfully!');
    console.log(`📁 Check the file: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('');
    console.error('💥 Fatal error:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('');
  console.log('⚠️  Download interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('⚠️  Download terminated');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  downloadAllPNRRData,
  fetchPNRRBatch,
  saveDataToFile
};
