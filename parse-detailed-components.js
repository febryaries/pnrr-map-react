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

// Convert to JSON with raw values to preserve formatting
const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1, 
  defval: '',
  raw: false 
});

console.log('Excel file parsed successfully!');
console.log('Sheet name:', sheetName);
console.log('Number of rows:', jsonData.length);

// Process the data to extract detailed components structure
const components = [];
let currentComponent = null;

jsonData.forEach((row, index) => {
  if (row && row.length > 0) {
    const firstCell = row[0];
    const secondCell = row[1];
    
    // Look for main component headers (C1, C2, etc.)
    if (typeof firstCell === 'string' && firstCell.match(/^C\d+\./)) {
      // Save previous component if exists
      if (currentComponent) {
        components.push(currentComponent);
      }
      
      // Start new component
      const componentCode = firstCell.split('.')[0];
      const componentName = firstCell.split('.')[1]?.trim();
      const totalValue = parseFloat(secondCell?.toString().replace(/[.,]/g, '')) || 0;
      
      currentComponent = {
        code: componentCode,
        name: componentName,
        fullName: firstCell,
        totalValue: totalValue,
        investments: []
      };
    }
    // Look for investment items (numbered or lettered)
    else if (currentComponent && firstCell && (
      firstCell.match(/^\d+\./) || 
      firstCell.match(/^[A-Z]\d*\./) ||
      firstCell.match(/^[a-z]\./) ||
      (firstCell.includes('Investiții') || firstCell.includes('Reforme') || firstCell.includes('Sprijin'))
    )) {
      const investmentValue = parseFloat(secondCell?.toString().replace(/[.,]/g, '')) || 0;
      
      currentComponent.investments.push({
        description: firstCell,
        value: investmentValue
      });
    }
  }
});

// Add the last component
if (currentComponent) {
  components.push(currentComponent);
}

console.log('Found components with detailed investments:');
components.forEach(comp => {
  console.log(`${comp.code}: ${comp.name} - ${comp.investments.length} investments - Total: ${comp.totalValue}`);
});

// Save detailed components data
const detailedOutputPath = path.join(__dirname, 'src', 'data', 'detailed-components.json');
fs.writeFileSync(detailedOutputPath, JSON.stringify(components, null, 2));
console.log('Detailed components data saved to:', detailedOutputPath);

// Also create a summary for the main components table
const summaryComponents = components.map(comp => ({
  code: comp.code,
  name: comp.name,
  fullName: comp.fullName,
  totalValue: comp.totalValue,
  investmentCount: comp.investments.length
}));

const summaryOutputPath = path.join(__dirname, 'src', 'data', 'components-summary.json');
fs.writeFileSync(summaryOutputPath, JSON.stringify(summaryComponents, null, 2));
console.log('Components summary saved to:', summaryOutputPath);
