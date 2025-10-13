const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('src/data/date_test.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('First row:', JSON.stringify(data[0], null, 2));
console.log('\nSample values:');
console.log('COMPONENTA:', data[0].COMPONENTA);
console.log('VALOARE_FE:', data[0].VALOARE_FE);
console.log('JUDET_IMPLEMENTARE:', data[0].JUDET_IMPLEMENTARE);
console.log('LOCALITATE_IMPLEMENTARE:', data[0].LOCALITATE_IMPLEMENTARE);

// Check if there are any non-zero values
const nonZeroValues = data.filter(row => parseFloat(row.VALOARE_FE) > 0);
console.log(`\nRows with non-zero VALOARE_FE: ${nonZeroValues.length}`);
if (nonZeroValues.length > 0) {
  console.log('Sample non-zero row:', JSON.stringify(nonZeroValues[0], null, 2));
}
