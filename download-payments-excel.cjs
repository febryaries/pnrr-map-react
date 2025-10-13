#!/usr/bin/env node

/**
 * Download All PNRR Payments to Excel
 * 
 * This script fetches all payment data from the PNRR API and exports it to an Excel file.
 * It handles pagination to get all records and includes proper Romanian diacritic conversion.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Import fetch for Node.js
const fetch = require('node-fetch');
const https = require('https');

// Create an agent that ignores SSL certificate errors (for development)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Romanian diacritic conversion function
function convertRomanianDiacritics(text) {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/ă/g, 'ă')  // Keep UTF-8 ă
    .replace(/â/g, 'â')  // Keep UTF-8 â
    .replace(/î/g, 'î')  // Keep UTF-8 î
    .replace(/ș/g, 'ș')  // Keep UTF-8 ș
    .replace(/ț/g, 'ț')  // Keep UTF-8 ț
    .replace(/Ă/g, 'Ă')  // Keep UTF-8 Ă
    .replace(/Â/g, 'Â')  // Keep UTF-8 Â
    .replace(/Î/g, 'Î')  // Keep UTF-8 Î
    .replace(/Ș/g, 'Ș')  // Keep UTF-8 Ș
    .replace(/Ț/g, 'Ț')  // Keep UTF-8 Ț
    // Convert old encoding to UTF-8
    .replace(/ã/g, 'ă')  // Old encoding ã -> UTF-8 ă
    .replace(/â/g, 'â')  // Old encoding â -> UTF-8 â (already correct)
    .replace(/î/g, 'î')  // Old encoding î -> UTF-8 î (already correct)
    .replace(/ş/g, 'ș')  // Old encoding ş -> UTF-8 ș
    .replace(/ţ/g, 'ț')  // Old encoding ţ -> UTF-8 ț
    .replace(/Ã/g, 'Ă')  // Old encoding Ã -> UTF-8 Ă
    .replace(/Â/g, 'Â')  // Old encoding Â -> UTF-8 Â (already correct)
    .replace(/Î/g, 'Î')  // Old encoding Î -> UTF-8 Î (already correct)
    .replace(/Ş/g, 'Ș')  // Old encoding Ş -> UTF-8 Ș
    .replace(/Ţ/g, 'Ț');  // Old encoding Ţ -> UTF-8 Ț
}

// Component mapping for better readability
const COMPONENT_MAPPING = {
  'C1': { key: 'C1', label: 'Managementul apei', program: 'Tranziția spre o economie verde' },
  'C2': { key: 'C2', label: 'Păduri și protecția biodiversității', program: 'Tranziția spre o economie verde' },
  'C3': { key: 'C3', label: 'Managementul deșeurilor', program: 'Tranziția spre o economie verde' },
  'C4': { key: 'C4', label: 'Transport sustenabil', program: 'Tranziția spre o economie verde' },
  'C5': { key: 'C5', label: 'Valul Renovării', program: 'Tranziția spre o economie verde' },
  'C6': { key: 'C6', label: 'Energie', program: 'Tranziția spre o economie verde' },
  'C7': { key: 'C7', label: 'Transformare digitală', program: 'Transformarea digitală' },
  'C8': { key: 'C8', label: 'Reforma fiscala și reforma sistemului de pensii', program: 'Creșterea economică inteligentă, sustenabilă și incluzivă' },
  'C9': { key: 'C9', label: 'Suport pentru sectorul privat, cercetare, dezvoltare și inovare', program: 'Creșterea economică inteligentă, sustenabilă și incluzivă' },
  'C10': { key: 'C10', label: 'Fondul local', program: 'Coeziunea socială și teritorială' },
  'C11': { key: 'C11', label: 'Turism și cultură', program: 'Coeziunea socială și teritorială' },
  'C12': { key: 'C12', label: 'Sănătate', program: 'Sănătate și reziliență instituțională' },
  'C13': { key: 'C13', label: 'Reforme sociale', program: 'Sănătate și reziliență instituțională' },
  'C14': { key: 'C14', label: 'Bună guvernanță', program: 'Sănătate și reziliență instituțională' },
  'C15': { key: 'C15', label: 'Educație', program: 'Copii, tineri, educație și competențe' },
  'C16': { key: 'C16', label: 'REPowerEU', program: 'Tranziția spre o economie verde' }
};

// Fetch a single batch of payment data
async function fetchPaymentBatch(offset, limit) {
  const url = `https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/plati_pnrr?offset=${offset}&limit=${limit}`;
  
  console.log(`📥 Fetching batch: offset=${offset}, limit=${limit}`);
  
  try {
    const response = await fetch(url, {
      agent: httpsAgent
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`❌ Error fetching batch at offset ${offset}:`, error.message);
    return [];
  }
}

// Fetch all payment data with pagination
async function fetchAllPaymentData() {
  const allData = [];
  let offset = 0;
  const limit = 5000; // API limit per request
  let hasMoreData = true;
  
  console.log('🚀 Starting to fetch all PNRR payment data...');
  
  while (hasMoreData) {
    try {
      const batchData = await fetchPaymentBatch(offset, limit);
      
      if (batchData.length === 0) {
        hasMoreData = false;
        console.log('✅ No more data available');
      } else {
        allData.push(...batchData);
        console.log(`📊 Fetched ${batchData.length} records. Total so far: ${allData.length}`);
        
        // If we got less than the limit, we've reached the end
        if (batchData.length < limit) {
          hasMoreData = false;
          console.log('✅ Reached end of data (partial batch)');
        } else {
          // Move to next batch
          offset += limit;
          
          // Add a small delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error(`❌ Error in batch processing:`, error.message);
      hasMoreData = false;
    }
  }
  
  console.log(`🎉 Finished fetching. Total records: ${allData.length}`);
  return allData;
}

// Process raw data for Excel export
function processDataForExcel(rawData) {
  console.log('🔄 Processing data for Excel export...');
  
  return rawData.map((item, index) => {
    const componentInfo = COMPONENT_MAPPING[item.cod_componenta] || { 
      label: 'Componentă necunoscută', 
      program: 'Program necunoscut' 
    };
    
    return {
      // Basic info
      'ID_Record': index + 1,
      'Data_Export': new Date().toISOString().split('T')[0],
      
      // Component and measure info (exact API fields)
      'Cod_Componenta': item.cod_componenta || '',
      'Cod_Masura': item.cod_masura || '',
      'Cod_Submasura': item.cod_submasura || '',
      'Masura': convertRomanianDiacritics(item.masura || ''),
      'CRI': item.cri || '',
      'Sursa_Finantare': convertRomanianDiacritics(item.sursa_finantare || ''),
      
      // Financial info (exact API fields)
      'Valoare_Plata_RON': parseFloat(item.valoare_plata_fe || 0),
      'Valoare_Plata_EUR': parseFloat(item.valoare_plata_fe_euro || 0),
      'Data_Plata': item.data_plata || '',
      
      // Beneficiary info (exact API fields)
      'CUI_Beneficiar_Final': item.cui_beneficiar_final || '',
      'Nume_Beneficiar': convertRomanianDiacritics(item.nume_beneficiar || ''),
      'Judet_Beneficiar': convertRomanianDiacritics(item.judet_beneficiar || ''),
      'Localitate_Beneficiar': convertRomanianDiacritics(item.localitate_beneficiar || ''),
      
      // CAEN info (exact API fields)
      'Cod_Diviziune_CAEN': item.cod_diviziune_caen || '',
      'Descriere_Diviziune_CAEN': convertRomanianDiacritics(item.descriere_diviziune_caen || ''),
      
      // Enhanced info (derived from API data)
      'Componenta_Label': convertRomanianDiacritics(componentInfo.label),
      'Program': convertRomanianDiacritics(componentInfo.program),
      
      // Calculated and formatted fields
      'Scop_Proiect': convertRomanianDiacritics(`${item.masura || ''} - ${item.localitate_beneficiar || ''}`.trim()),
      'Valoare_EUR_Formatata': `${parseFloat(item.valoare_plata_fe_euro || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`,
      'Valoare_RON_Formatata': `${parseFloat(item.valoare_plata_fe || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON`,
      'Data_Plata_Formatata': item.data_plata ? new Date(item.data_plata).toLocaleDateString('ro-RO') : '',
      'An_Plata': item.data_plata ? new Date(item.data_plata).getFullYear() : '',
      'Luna_Plata': item.data_plata ? new Date(item.data_plata).getMonth() + 1 : '',
      'Trimestru_Plata': item.data_plata ? Math.ceil((new Date(item.data_plata).getMonth() + 1) / 3) : ''
    };
  });
}

// Create Excel file with multiple sheets
function createExcelFile(processedData) {
  console.log('📊 Creating Excel file...');
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Main data sheet
  const mainSheet = XLSX.utils.json_to_sheet(processedData);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Plati_PNRR');
  
  // Summary sheet
  const summaryData = createSummaryData(processedData);
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sumar');
  
  // Component breakdown sheet
  const componentData = createComponentBreakdown(processedData);
  const componentSheet = XLSX.utils.json_to_sheet(componentData);
  XLSX.utils.book_append_sheet(workbook, componentSheet, 'Componente');
  
  // County breakdown sheet
  const countyData = createCountyBreakdown(processedData);
  const countySheet = XLSX.utils.json_to_sheet(countyData);
  XLSX.utils.book_append_sheet(workbook, countySheet, 'Judete');
  
  return workbook;
}

// Create summary data
function createSummaryData(data) {
  const totalRecords = data.length;
  const totalValueEUR = data.reduce((sum, item) => sum + item.Valoare_Plata_EUR, 0);
  const totalValueRON = data.reduce((sum, item) => sum + item.Valoare_Plata_RON, 0);
  const uniqueBeneficiaries = new Set(data.map(item => item.CUI_Beneficiar_Final)).size;
  const uniqueCounties = new Set(data.map(item => item.Judet_Beneficiar)).size;
  const uniqueComponents = new Set(data.map(item => item.Cod_Componenta)).size;
  const uniqueMeasures = new Set(data.map(item => item.Cod_Masura)).size;
  const uniqueCRIs = new Set(data.map(item => item.CRI)).size;
  
  // Calculate date range
  const dates = data.map(item => item.Data_Plata).filter(date => date).map(date => new Date(date));
  const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;
  
  return [
    { 'Indicator': 'Total Inregistrari', 'Valoare': totalRecords },
    { 'Indicator': 'Valoare Totala EUR', 'Valoare': totalValueEUR.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { 'Indicator': 'Valoare Totala RON', 'Valoare': totalValueRON.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { 'Indicator': 'Numar Beneficiari Unici', 'Valoare': uniqueBeneficiaries },
    { 'Indicator': 'Numar Judete', 'Valoare': uniqueCounties },
    { 'Indicator': 'Numar Componente', 'Valoare': uniqueComponents },
    { 'Indicator': 'Numar Masuri', 'Valoare': uniqueMeasures },
    { 'Indicator': 'Numar CRI-uri', 'Valoare': uniqueCRIs },
    { 'Indicator': 'Data Prima Plata', 'Valoare': minDate ? minDate.toLocaleDateString('ro-RO') : 'N/A' },
    { 'Indicator': 'Data Ultima Plata', 'Valoare': maxDate ? maxDate.toLocaleDateString('ro-RO') : 'N/A' },
    { 'Indicator': 'Data Export', 'Valoare': new Date().toISOString().split('T')[0] }
  ];
}

// Create component breakdown
function createComponentBreakdown(data) {
  const componentTotals = {};
  
  data.forEach(item => {
    const key = item.Cod_Componenta;
    if (!componentTotals[key]) {
      componentTotals[key] = {
        'Cod_Componenta': key,
        'Componenta_Label': item.Componenta_Label,
        'Program': item.Program,
        'Numar_Plati': 0,
        'Valoare_EUR': 0,
        'Valoare_RON': 0,
        'Numar_Beneficiari': new Set(),
        'Numar_Judete': new Set(),
        'Numar_Masuri': new Set(),
        'Numar_CRI': new Set()
      };
    }
    
    componentTotals[key].Numar_Plati += 1;
    componentTotals[key].Valoare_EUR += item.Valoare_Plata_EUR;
    componentTotals[key].Valoare_RON += item.Valoare_Plata_RON;
    componentTotals[key].Numar_Beneficiari.add(item.CUI_Beneficiar_Final);
    componentTotals[key].Numar_Judete.add(item.Judet_Beneficiar);
    componentTotals[key].Numar_Masuri.add(item.Cod_Masura);
    componentTotals[key].Numar_CRI.add(item.CRI);
  });
  
  return Object.values(componentTotals).map(item => ({
    ...item,
    'Numar_Beneficiari': item.Numar_Beneficiari.size,
    'Numar_Judete': item.Numar_Judete.size,
    'Numar_Masuri': item.Numar_Masuri.size,
    'Numar_CRI': item.Numar_CRI.size,
    'Valoare_EUR_Formatata': `${item.Valoare_EUR.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`,
    'Valoare_RON_Formatata': `${item.Valoare_RON.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON`,
    'Valoare_Medie_EUR': item.Numar_Plati > 0 ? (item.Valoare_EUR / item.Numar_Plati).toFixed(2) : 0
  }));
}

// Create county breakdown
function createCountyBreakdown(data) {
  const countyTotals = {};
  
  data.forEach(item => {
    const key = item.Judet_Beneficiar;
    if (!countyTotals[key]) {
      countyTotals[key] = {
        'Judet': key,
        'Numar_Plati': 0,
        'Valoare_EUR': 0,
        'Valoare_RON': 0,
        'Numar_Beneficiari': new Set(),
        'Numar_Componente': new Set(),
        'Numar_Masuri': new Set(),
        'Numar_CRI': new Set(),
        'Numar_Localitati': new Set()
      };
    }
    
    countyTotals[key].Numar_Plati += 1;
    countyTotals[key].Valoare_EUR += item.Valoare_Plata_EUR;
    countyTotals[key].Valoare_RON += item.Valoare_Plata_RON;
    countyTotals[key].Numar_Beneficiari.add(item.CUI_Beneficiar_Final);
    countyTotals[key].Numar_Componente.add(item.Cod_Componenta);
    countyTotals[key].Numar_Masuri.add(item.Cod_Masura);
    countyTotals[key].Numar_CRI.add(item.CRI);
    countyTotals[key].Numar_Localitati.add(item.Localitate_Beneficiar);
  });
  
  return Object.values(countyTotals).map(item => ({
    ...item,
    'Numar_Beneficiari': item.Numar_Beneficiari.size,
    'Numar_Componente': item.Numar_Componente.size,
    'Numar_Masuri': item.Numar_Masuri.size,
    'Numar_CRI': item.Numar_CRI.size,
    'Numar_Localitati': item.Numar_Localitati.size,
    'Valoare_EUR_Formatata': `${item.Valoare_EUR.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`,
    'Valoare_RON_Formatata': `${item.Valoare_RON.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON`,
    'Valoare_Medie_EUR': item.Numar_Plati > 0 ? (item.Valoare_EUR / item.Numar_Plati).toFixed(2) : 0
  }));
}

// Main function
async function main() {
  try {
    console.log('🎯 PNRR Payments Excel Export Tool');
    console.log('=====================================');
    
    // Fetch all data
    const rawData = await fetchAllPaymentData();
    
    if (rawData.length === 0) {
      console.log('❌ No data found to export');
      return;
    }
    
    // Process data
    const processedData = processDataForExcel(rawData);
    
    // Create Excel file
    const workbook = createExcelFile(processedData);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `PNRR_Plati_${timestamp}.xlsx`;
    const filepath = path.join(__dirname, filename);
    
    // Write file
    XLSX.writeFile(workbook, filepath);
    
    console.log('✅ Excel file created successfully!');
    console.log(`📁 File location: ${filepath}`);
    console.log(`📊 Total records exported: ${processedData.length}`);
    console.log(`📈 File size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  fetchAllPaymentData,
  processDataForExcel,
  createExcelFile
};