const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const filePath = path.join(process.cwd(), 'src/data/20251020 Validari buget PNRR.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Available sheets:', workbook.SheetNames);

// Check if "status PNRR" sheet exists
const targetSheet = workbook.SheetNames.find(name => 
  name.toLowerCase().includes('status') && name.toLowerCase().includes('pnrr')
);

if (!targetSheet) {
  console.log('❌ Sheet "status PNRR" not found');
  console.log('Available sheets:', workbook.SheetNames);
  process.exit(1);
}

console.log('✅ Found sheet:', targetSheet);

// Get the worksheet
const worksheet = workbook.Sheets[targetSheet];

// Convert to JSON with headers
const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1, 
  defval: '',
  raw: false 
});

console.log('📊 Sheet dimensions:', jsonData.length, 'rows');
console.log('📋 First few rows:');
jsonData.slice(0, 5).forEach((row, i) => {
  console.log(`Row ${i}:`, row);
});

// Try to find the header row and data
let headerRowIndex = -1;
let headerRow = [];

for (let i = 0; i < Math.min(10, jsonData.length); i++) {
  const row = jsonData[i];
  if (row && row.some(cell => 
    typeof cell === 'string' && (
      cell.toLowerCase().includes('component') ||
      cell.toLowerCase().includes('masura') ||
      cell.toLowerCase().includes('alocare') ||
      cell.toLowerCase().includes('executat')
    )
  )) {
    headerRowIndex = i;
    headerRow = row;
    break;
  }
}

if (headerRowIndex === -1) {
  console.log('❌ Could not find header row with expected columns');
  console.log('First 10 rows:');
  jsonData.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
  });
  process.exit(1);
}

console.log('✅ Found header row at index:', headerRowIndex);
console.log('📋 Header columns:', headerRow);

// Extract data rows
const dataRows = jsonData.slice(headerRowIndex + 1).filter(row => 
  row && row.some(cell => cell && cell.toString().trim() !== '')
);

console.log('📊 Found', dataRows.length, 'data rows');

// Show sample data
console.log('📋 Sample data rows:');
dataRows.slice(0, 5).forEach((row, i) => {
  console.log(`Data row ${i}:`, row);
});

// Save raw data for inspection
fs.writeFileSync('status-pnrr-raw.json', JSON.stringify({
  sheetName: targetSheet,
  headerRow: headerRow,
  dataRows: dataRows.slice(0, 20) // First 20 rows for inspection
}, null, 2));

console.log('💾 Raw data saved to status-pnrr-raw.json');
