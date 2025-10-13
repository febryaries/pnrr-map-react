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

// Process the data to extract components and their investments
const components = {};

jsonData.forEach(row => {
  // Get the first key which should be the component name
  const componentKey = Object.keys(row)[0];
  if (componentKey && componentKey.startsWith('C')) {
    const componentName = componentKey;
    
    // Get the investment description (second key)
    const investmentKey = Object.keys(row)[1];
    const investmentDescription = row[investmentKey];
    
    // Get the value (third key)
    const valueKey = Object.keys(row)[2];
    const value = row[valueKey];
    
    if (!components[componentName]) {
      components[componentName] = {
        name: componentName,
        investments: []
      };
    }
    
    if (investmentDescription && value) {
      components[componentName].investments.push({
        description: investmentDescription,
        value: value
      });
    }
  }
});

// Convert to array format
const componentsArray = Object.values(components);

console.log('Processed components:');
componentsArray.forEach(comp => {
  console.log(`${comp.name}: ${comp.investments.length} investments`);
});

// Save as JSON file
const outputPath = path.join(__dirname, 'src', 'data', 'components-processed.json');
fs.writeFileSync(outputPath, JSON.stringify(componentsArray, null, 2));
console.log('Processed data saved to:', outputPath);

// Also create a simpler format for the components table
const componentsTable = componentsArray.map(comp => ({
  code: comp.name.split('.')[0], // Extract C1, C2, etc.
  name: comp.name,
  totalInvestments: comp.investments.length,
  totalValue: comp.investments.reduce((sum, inv) => sum + (inv.value || 0), 0)
}));

const tableOutputPath = path.join(__dirname, 'src', 'data', 'components-table.json');
fs.writeFileSync(tableOutputPath, JSON.stringify(componentsTable, null, 2));
console.log('Components table data saved to:', tableOutputPath);
