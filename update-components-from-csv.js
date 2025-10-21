const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(process.cwd(), 'src/data/AlocariComponente.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV
const lines = csvContent.split('\n');
const headers = lines[0].split(';');
const data = [];

for (let i = 1; i < lines.length; i++) {
  if (lines[i].trim()) {
    const values = lines[i].split(';');
    if (values.length >= 6) {
      data.push({
        componentCode: values[0].trim(),
        measureCode: values[1].trim(),
        title: values[2].trim(),
        allocatedValue: values[3].trim(),
        executedValue: values[4].trim(),
        executionPercent: values[5].trim()
      });
    }
  }
}

console.log(`📊 Parsed ${data.length} entries from CSV`);

// Load existing componentsData.json
const componentsDataPath = path.join(process.cwd(), 'src/data/componentsData.json');
const existingData = JSON.parse(fs.readFileSync(componentsDataPath, 'utf8'));

console.log(`📊 Existing data has ${existingData.length} entries`);

// Create a map of existing entries for quick lookup
const existingMap = new Map();
existingData.forEach(item => {
  const key = `${item.componentCode}-${item.measureCode}`;
  existingMap.set(key, item);
});

// Process CSV data and update/create entries
const updatedData = [...existingData];
let addedCount = 0;
let updatedCount = 0;

data.forEach(csvItem => {
  const key = `${csvItem.componentCode}-${csvItem.measureCode}`;
  
  // Parse values
  let allocatedValue = 0;
  let executedValue = 0;
  let executionPercent = '0%';
  
  if (csvItem.allocatedValue !== 'Fără costuri asociate' && csvItem.allocatedValue) {
    // Remove dots and convert to number (Romanian number format)
    allocatedValue = parseInt(csvItem.allocatedValue.replace(/\./g, '')) || 0;
  }
  
  if (csvItem.executedValue && csvItem.executedValue !== 'Fără costuri asociate') {
    executedValue = parseInt(csvItem.executedValue.replace(/\./g, '')) || 0;
  }
  
  if (csvItem.executionPercent) {
    executionPercent = csvItem.executionPercent;
  }
  
  const newEntry = {
    id: existingMap.get(key)?.id || Date.now() + Math.random(), // Generate ID if new
    componentCode: csvItem.componentCode,
    measureCode: csvItem.measureCode,
    title: csvItem.title,
    allocatedValue: allocatedValue,
    executedValue: executedValue,
    executionPercent: executionPercent
  };
  
  if (existingMap.has(key)) {
    // Update existing entry
    const existingIndex = updatedData.findIndex(item => 
      item.componentCode === csvItem.componentCode && item.measureCode === csvItem.measureCode
    );
    if (existingIndex !== -1) {
      updatedData[existingIndex] = newEntry;
      updatedCount++;
    }
  } else {
    // Add new entry
    updatedData.push(newEntry);
    addedCount++;
    console.log(`➕ Adding new entry: ${csvItem.componentCode} ${csvItem.measureCode} - ${csvItem.title}`);
  }
});

// Save updated data
fs.writeFileSync(componentsDataPath, JSON.stringify(updatedData, null, 2));

console.log(`✅ Update completed!`);
console.log(`📊 Added ${addedCount} new entries`);
console.log(`📊 Updated ${updatedCount} existing entries`);
console.log(`📊 Total entries: ${updatedData.length}`);

// Show summary of "Fără costuri asociate" entries
const noCostEntries = data.filter(item => item.allocatedValue === 'Fără costuri asociate');
console.log(`\n📋 Entries with "Fără costuri asociate" (${noCostEntries.length}):`);
noCostEntries.forEach(entry => {
  console.log(`  - ${entry.componentCode} ${entry.measureCode}: ${entry.title}`);
});
