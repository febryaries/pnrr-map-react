#!/usr/bin/env node

/**
 * PNRR Data Downloader Script
 * Downloads payment and project data from MFE.gov.ro and saves to JSON files
 * 
 * Usage: node download-pnrr-data.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pako from 'pako';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MFE API configuration
const MFE_BASE_URL = 'https://mfe.gov.ro/pnrr-dashboard/generator/data';
const DATA_DATE = '20251106'; // Latest available date
const MAX_RETRIES = 3;
const OUTPUT_DIR = 'src/data';

const ENDPOINTS = {
  payments: `${DATA_DATE}-plati_pnrr.json.gz`,
  projects: `${DATA_DATE}-progres_tehnic_proiecte.json.gz`,
  indicators: `${DATA_DATE}-indicatori_total.json.gz`,
  beneficiaries: `${DATA_DATE}-top_beneficiari.json.gz`
};

// Fetch and decompress gzipped data from MFE
async function fetchMFEData(endpoint, retryCount = 0) {
  const url = `${MFE_BASE_URL}/${endpoint}`;
  
  try {
    console.log(`📥 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PNRR-Data-Downloader/1.0',
        'Accept': 'application/json, application/gzip',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get compressed data as buffer
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // Decompress with pako
    const decompressed = pako.inflate(uint8Array, { to: 'string' });
    const data = JSON.parse(decompressed);
    
    console.log(`   ✓ Downloaded and decompressed ${data.length.toLocaleString()} records`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`   🔄 Retrying... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
      return fetchMFEData(endpoint, retryCount + 1);
    } else {
      throw error;
    }
  }
}

// Download all MFE datasets
async function downloadAllMFEData() {
  console.log('🚀 Starting MFE data download...');
  console.log(`📅 Data date: ${DATA_DATE}`);
  console.log('');
  
  const startTime = Date.now();
  const results = {};
  
  // Download payments
  try {
    console.log('💰 Downloading payments data...');
    results.payments = await fetchMFEData(ENDPOINTS.payments);
  } catch (error) {
    console.error('⚠️  Failed to download payments:', error.message);
  }
  
  // Download projects
  try {
    console.log('');
    console.log('📊 Downloading projects data...');
    results.projects = await fetchMFEData(ENDPOINTS.projects);
  } catch (error) {
    console.error('⚠️  Failed to download projects:', error.message);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('');
  console.log('📈 Download Summary:');
  console.log(`   Duration: ${duration} seconds`);
  if (results.payments) console.log(`   Payments: ${results.payments.length.toLocaleString()} records`);
  if (results.projects) console.log(`   Projects: ${results.projects.length.toLocaleString()} records`);
  
  return results;
}

// Save data to JSON file
async function saveDataToFile(data, filename) {
  try {
    console.log('');
    console.log(`💾 Saving to ${filename}...`);
    
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    const jsonData = JSON.stringify(data);
    const filePath = path.join(OUTPUT_DIR, filename);
    
    await fs.writeFile(filePath, jsonData, 'utf8');
    
    const stats = await fs.stat(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`   ✅ Saved: ${fileSizeMB} MB, ${data.length.toLocaleString()} records`);
    
  } catch (error) {
    console.error(`   ❌ Error saving ${filename}:`, error.message);
    throw error;
  }
}

// Generate summary statistics
function generateSummary(data, dataType) {
  console.log('');
  console.log(`📊 ${dataType} Summary:`);
  
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
    console.log('🇷🇴 PNRR Data Downloader (MFE)');
    console.log('===============================');
    console.log('');
    
    // Download all datasets
    const results = await downloadAllMFEData();
    
    if (!results.payments && !results.projects) {
      console.log('⚠️  No data was downloaded. Please check the MFE endpoint.');
      return;
    }
    
    // Save payments
    if (results.payments) {
      await saveDataToFile(results.payments, 'plati_pnrr.json');
      generateSummary(results.payments, 'Payments');
    }
    
    // Save projects
    if (results.projects) {
      await saveDataToFile(results.projects, 'progres_tehnic_proiecte.json');
      generateSummary(results.projects, 'Projects');
    }
    
    console.log('');
    console.log('🎉 Download completed successfully!');
    console.log(`📁 Files saved to: ${OUTPUT_DIR}/`);
    
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
main();
