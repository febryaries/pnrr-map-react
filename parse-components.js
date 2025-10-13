import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const filePath = path.join(__dirname, 'src', 'data', 'ComponenteInvestitiiSite.xlsx');
const workbook = XLSX.readFile(filePath);

// Get the first sheet name
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet);

console.log('Excel file parsed successfully!');
console.log('Sheet name:', sheetName);
console.log('Number of rows:', jsonData.length);
console.log('First few rows:');
console.log(JSON.stringify(jsonData.slice(0, 3), null, 2));

// Save as JSON file
const outputPath = path.join(__dirname, 'src', 'data', 'components.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
console.log('Data saved to:', outputPath);
