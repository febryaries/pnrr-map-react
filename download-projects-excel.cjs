#!/usr/bin/env node

/**
 * PNRR Projects Excel Export Tool
 * 
 * This script fetches all project data from the PNRR progres_tehnic_proiecte API
 * and exports it to a comprehensive Excel file with multiple sheets.
 */

// Import necessary modules
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
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

// Component mapping based on PNRR structure
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

// County mapping
const COUNTY_MAP = {
  'AB': 'Alba', 'AG': 'Argeș', 'AR': 'Arad', 'BC': 'Bacău', 'BH': 'Bihor', 'BN': 'Bistrița-Năsăud',
  'BR': 'Brăila', 'BT': 'Botoșani', 'BV': 'Brașov', 'BZ': 'Buzău', 'CJ': 'Cluj', 'CL': 'Călărași',
  'CS': 'Caraș-Severin', 'CT': 'Constanța', 'CV': 'Covasna', 'DB': 'Dâmbovița', 'DJ': 'Dolj',
  'GL': 'Galați', 'GR': 'Giurgiu', 'GJ': 'Gorj', 'HD': 'Hunedoara', 'HR': 'Harghita', 'IF': 'Ilfov',
  'IL': 'Ialomița', 'IS': 'Iași', 'MH': 'Mehedinți', 'MM': 'Maramureș', 'MS': 'Mureș', 'NT': 'Neamț',
  'OT': 'Olt', 'PH': 'Prahova', 'SB': 'Sibiu', 'SJ': 'Sălaj', 'SM': 'Satu Mare', 'SV': 'Suceava',
  'TL': 'Tulcea', 'TM': 'Timiș', 'TR': 'Teleorman', 'VL': 'Vâlcea', 'VN': 'Vrancea', 'VS': 'Vaslui',
  'BI': 'București'
};

// Fetch project data from API
async function fetchProjectBatch(offset, limit) {
  const url = `https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/progres_tehnic_proiecte?offset=${offset}&limit=${limit}`;
  
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

// Fetch all project data with pagination
async function fetchAllProjectData() {
  const allData = [];
  let offset = 0;
  const limit = 5000;
  let hasMoreData = true;
  
  console.log('🚀 Starting to fetch all PNRR project data...');
  
  while (hasMoreData) {
    try {
      const batchData = await fetchProjectBatch(offset, limit);
      
      if (batchData.length === 0) {
        hasMoreData = false;
        console.log('✅ No more data available');
      } else {
        allData.push(...batchData);
        console.log(`📊 Fetched ${batchData.length} records. Total so far: ${allData.length}`);
        
        if (batchData.length < limit) {
          hasMoreData = false;
          console.log('✅ Reached end of data (partial batch)');
        } else {
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
      
      // Contract and project info (exact API fields)
      'Nr_Contract': item.nr_contract || '',
      'Titlu_Contract': convertRomanianDiacritics(item.titlu_contract || ''),
      'Cod_Componenta': item.cod_componenta || '',
      'Cod_Masura': item.cod_masura || '',
      'Cod_Submasura': item.cod_submasura || '',
      'Stadiu': convertRomanianDiacritics(item.stadiu || ''),
      'Impact': convertRomanianDiacritics(item.impact || ''),
      'Sursa_Finantare': convertRomanianDiacritics(item.sursa_finantare || ''),
      
      // Financial info (exact API fields)
      'Valoare_Total_RON': parseFloat(item.valoare_total || 0),
      'Valoare_FE_EUR': parseFloat(item.valoare_fe || 0),
      'Valoare_FPN': parseFloat(item.valoare_fpn || 0),
      'Valoare_TVA': parseFloat(item.valoare_tva || 0),
      'Valoare_Neeligibil': parseFloat(item.valoare_neeligibil || 0),
      
      // Dates (exact API fields)
      'Data_Angajament': item.data_angajament || '',
      'Data_Inceput': item.data_inceput || '',
      'Data_Finalizare': item.data_finalizare || '',
      
      // Beneficiary info (exact API fields)
      'CUI': item.cui || '',
      'Denumire_Beneficiar': convertRomanianDiacritics(item.denumire_beneficiar || ''),
      'Tip_Beneficiar': convertRomanianDiacritics(item.tip_beneficiar || ''),
      'Judet_Implementare': convertRomanianDiacritics(item.judet_implementare || ''),
      'Localitate_Implementare': convertRomanianDiacritics(item.localitate_implementare || ''),
      
      // Additional info (exact API fields)
      'CRI': item.cri || '',
      
      // Enhanced info (derived from API data)
      'Componenta_Label': convertRomanianDiacritics(componentInfo.label),
      'Program': convertRomanianDiacritics(componentInfo.program),
      
      // Calculated and formatted fields
      'Scop_Proiect': convertRomanianDiacritics(`${item.titlu_contract || ''} - ${item.localitate_implementare || ''}`.trim()),
      'Valoare_EUR_Formatata': `${parseFloat(item.valoare_fe || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`,
      'Valoare_RON_Formatata': `${parseFloat(item.valoare_total || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON`,
      'Data_Angajament_Formatata': item.data_angajament ? new Date(item.data_angajament).toLocaleDateString('ro-RO') : '',
      'Data_Inceput_Formatata': item.data_inceput ? new Date(item.data_inceput).toLocaleDateString('ro-RO') : '',
      'Data_Finalizare_Formatata': item.data_finalizare ? new Date(item.data_finalizare).toLocaleDateString('ro-RO') : '',
      'An_Angajament': item.data_angajament ? new Date(item.data_angajament).getFullYear() : '',
      'Luna_Angajament': item.data_angajament ? new Date(item.data_angajament).getMonth() + 1 : '',
      'Trimestru_Angajament': item.data_angajament ? Math.ceil((new Date(item.data_angajament).getMonth() + 1) / 3) : ''
    };
  });
}

// Create summary data
function createSummaryData(processedData) {
  console.log('📊 Creating summary data...');
  
  const totalProjects = processedData.length;
  const totalValueEUR = processedData.reduce((sum, item) => sum + item.Valoare_FE_EUR, 0);
  const totalValueRON = processedData.reduce((sum, item) => sum + item.Valoare_Total_RON, 0);
  
  // Component breakdown
  const componentBreakdown = {};
  processedData.forEach(item => {
    const component = item.Cod_Componenta;
    if (!componentBreakdown[component]) {
      componentBreakdown[component] = {
        label: item.Componenta_Label,
        program: item.Program,
        count: 0,
        valueEUR: 0,
        valueRON: 0
      };
    }
    componentBreakdown[component].count++;
    componentBreakdown[component].valueEUR += item.Valoare_FE_EUR;
    componentBreakdown[component].valueRON += item.Valoare_Total_RON;
  });
  
  // County breakdown
  const countyBreakdown = {};
  processedData.forEach(item => {
    const county = item.Judet_Implementare;
    if (!countyBreakdown[county]) {
      countyBreakdown[county] = {
        count: 0,
        valueEUR: 0,
        valueRON: 0
      };
    }
    countyBreakdown[county].count++;
    countyBreakdown[county].valueEUR += item.Valoare_FE_EUR;
    countyBreakdown[county].valueRON += item.Valoare_Total_RON;
  });
  
  // Unique measures and stages
  const uniqueMeasures = [...new Set(processedData.map(item => item.Cod_Masura).filter(Boolean))];
  const uniqueStages = [...new Set(processedData.map(item => item.Stadiu).filter(Boolean))];
  const uniqueCRI = [...new Set(processedData.map(item => item.CRI).filter(Boolean))];
  
  // Date range
  const dates = processedData
    .map(item => item.Data_Angajament)
    .filter(Boolean)
    .map(date => new Date(date))
    .sort((a, b) => a - b);
  
  const dateRange = dates.length > 0 ? {
    earliest: dates[0].toISOString().split('T')[0],
    latest: dates[dates.length - 1].toISOString().split('T')[0]
  } : { earliest: 'N/A', latest: 'N/A' };
  
  return {
    summary: {
      'Total_Proiecte': totalProjects,
      'Valoare_Total_EUR': totalValueEUR,
      'Valoare_Total_RON': totalValueRON,
      'Valoare_Medie_EUR': totalProjects > 0 ? totalValueEUR / totalProjects : 0,
      'Valoare_Medie_RON': totalProjects > 0 ? totalValueRON / totalProjects : 0,
      'Masuri_Unice': uniqueMeasures.length,
      'Stadii_Unice': uniqueStages.length,
      'CRI_Unice': uniqueCRI.length,
      'Data_Angajament_Minima': dateRange.earliest,
      'Data_Angajament_Maxima': dateRange.latest,
      'Data_Export': new Date().toISOString().split('T')[0]
    },
    componentBreakdown: Object.entries(componentBreakdown).map(([code, data]) => ({
      'Cod_Componenta': code,
      'Componenta_Label': data.label,
      'Program': data.program,
      'Numar_Proiecte': data.count,
      'Valoare_EUR': data.valueEUR,
      'Valoare_RON': data.valueRON,
      'Valoare_Medie_EUR': data.count > 0 ? data.valueEUR / data.count : 0,
      'Valoare_Medie_RON': data.count > 0 ? data.valueRON / data.count : 0
    })),
    countyBreakdown: Object.entries(countyBreakdown).map(([county, data]) => ({
      'Judet': county,
      'Numar_Proiecte': data.count,
      'Valoare_EUR': data.valueEUR,
      'Valoare_RON': data.valueRON,
      'Valoare_Medie_EUR': data.count > 0 ? data.valueEUR / data.count : 0,
      'Valoare_Medie_RON': data.count > 0 ? data.valueRON / data.count : 0
    }))
  };
}

// Main function
async function main() {
  try {
    console.log('🎯 PNRR Projects Excel Export Tool');
    console.log('=====================================');
    
    // Fetch all data
    const rawData = await fetchAllProjectData();
    
    if (rawData.length === 0) {
      console.log('❌ No data found to export');
      return;
    }
    
    // Process data
    const processedData = processDataForExcel(rawData);
    console.log('🔄 Processing data for Excel export...');
    
    // Create summary data
    const summaryData = createSummaryData(processedData);
    
    // Create Excel workbook
    console.log('📊 Creating Excel file...');
    const workbook = XLSX.utils.book_new();
    
    // Add main data sheet
    const mainSheet = XLSX.utils.json_to_sheet(processedData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Proiecte_PNRR');
    
    // Add summary sheet
    const summarySheet = XLSX.utils.json_to_sheet([summaryData.summary]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sumar');
    
    // Add component breakdown sheet
    const componentSheet = XLSX.utils.json_to_sheet(summaryData.componentBreakdown);
    XLSX.utils.book_append_sheet(workbook, componentSheet, 'Componente');
    
    // Add county breakdown sheet
    const countySheet = XLSX.utils.json_to_sheet(summaryData.countyBreakdown);
    XLSX.utils.book_append_sheet(workbook, countySheet, 'Judete');
    
    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `PNRR_Proiecte_${currentDate}.xlsx`;
    const filepath = path.join(process.cwd(), filename);
    
    // Write file
    XLSX.writeFile(workbook, filepath);
    
    // Get file size
    const stats = fs.statSync(filepath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Excel file created successfully!');
    console.log(`📁 File location: ${filepath}`);
    console.log(`📊 Total records exported: ${processedData.length}`);
    console.log(`📈 File size: ${fileSizeInMB} MB`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, fetchAllProjectData, processDataForExcel };
