const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Read the component names from qwe.xlsx
const workbook = XLSX.readFile(path.join(__dirname, 'qwe.xlsx'));
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const componentNamesData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Create component name mapping
const componentNames = {};
componentNamesData.forEach(row => {
    if (row && row[0] && row[1]) {
        const code = row[0].toString().trim().replace('.', '');
        const name = row[1].toString().trim();
        componentNames[code] = name;
    }
});

console.log('Loaded component names:', componentNames);

// Read the CSV file
const csvPath = path.join(__dirname, 'AlocariComponente.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV content
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = lines[0].split(';');

const components = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(';');
    
    // Skip rows with "Fără costuri asociate" (no associated costs)
    if (values[3] && values[3].includes('Fără costuri asociate')) {
        continue;
    }
    
    const component = {
        componenta: values[0] || '',
        masura: values[1] || '',
        finantare: values[2] || '', // loan or grant
        titlul_masurii: values[3] || '',
        alocare_financiara_euro: values[4] ? parseFloat(values[4].replace(/\./g, '').replace(/,/g, '.')) : 0,
        executat_euro: values[5] ? parseFloat(values[5].replace(/\./g, '').replace(/,/g, '.')) : 0,
        executat_procent: values[6] ? parseFloat(values[6].replace('%', '').replace(',', '.')) : 0
    };
    
    components.push(component);
}

// Group by componenta
const groupedComponents = {};

components.forEach(component => {
    const componenta = component.componenta;
    if (!groupedComponents[componenta]) {
        groupedComponents[componenta] = {
            componenta: componenta,
            numeComponenta: componentNames[componenta] || componenta,
            masuri: [],
            totalAlocare: 0,
            totalExecutat: 0,
            totalExecutatProcent: 0
        };
    }
    
    groupedComponents[componenta].masuri.push({
        masura: component.masura,
        finantare: component.finantare,
        titlul_masurii: component.titlul_masurii,
        alocare_financiara_euro: component.alocare_financiara_euro,
        executat_euro: component.executat_euro,
        executat_procent: component.executat_procent
    });
    
    groupedComponents[componenta].totalAlocare += component.alocare_financiara_euro;
    groupedComponents[componenta].totalExecutat += component.executat_euro;
});

// Calculate total percentages for each component
Object.keys(groupedComponents).forEach(componenta => {
    const comp = groupedComponents[componenta];
    comp.totalExecutatProcent = comp.totalAlocare > 0 ? 
        (comp.totalExecutat / comp.totalAlocare) * 100 : 0;
});

// Convert to array and sort by componenta
const componentsArray = Object.values(groupedComponents).sort((a, b) => {
    const aNum = parseInt(a.componenta.replace('C', ''));
    const bNum = parseInt(b.componenta.replace('C', ''));
    return aNum - bNum;
});

// Create the final JSON structure
const result = {
    components: componentsArray,
    totalAlocare: componentsArray.reduce((sum, comp) => sum + comp.totalAlocare, 0),
    totalExecutat: componentsArray.reduce((sum, comp) => sum + comp.totalExecutat, 0),
    lastUpdated: new Date().toISOString()
};

// Write to JSON file
const outputPath = path.join(__dirname, 'src', 'data', 'alocariComponente.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log(`Converted CSV to JSON successfully!`);
console.log(`Total components: ${componentsArray.length}`);
console.log(`Total allocation: ${result.totalAlocare.toLocaleString('ro-RO')} EUR`);
console.log(`Total executed: ${result.totalExecutat.toLocaleString('ro-RO')} EUR`);
console.log(`Output file: ${outputPath}`);

