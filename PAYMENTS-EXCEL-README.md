# PNRR Payments Excel Export Tool

This tool downloads all payment data from the PNRR API and exports it to a comprehensive Excel file with multiple sheets.

## Features

- 📊 **Complete Data Export**: Downloads all payment records from the PNRR API
- 🔄 **Pagination Handling**: Automatically handles API pagination to get all data
- 📈 **Multiple Excel Sheets**: 
  - Main data sheet with all payment records
  - Summary sheet with key statistics
  - Component breakdown sheet
  - County breakdown sheet
- 🌍 **Romanian Diacritics**: Properly converts and handles Romanian characters
- 💰 **Financial Data**: Includes both EUR and RON amounts
- 📋 **Rich Metadata**: Component labels, program information, and beneficiary details

## Quick Start

### Option 1: Using the Bash Script (Recommended)

```bash
./download-payments.sh
```

### Option 2: Manual Installation

1. Install dependencies:
```bash
npm install xlsx
```

2. Run the script:
```bash
node download-payments-excel.js
```

## Requirements

- Node.js (version 14 or higher)
- npm (comes with Node.js)
- Internet connection to access the PNRR API

## Output

The script creates an Excel file named `PNRR_Plati_YYYY-MM-DD.xlsx` with the following sheets:

### 1. Plati_PNRR (Main Data)
Contains all payment records with columns:

**Basic Information:**
- ID_Record, Data_Export

**Component and Measure Information (exact API fields):**
- Cod_Componenta, Cod_Masura, Cod_Submasura, Masura
- CRI, Sursa_Finantare

**Financial Information (exact API fields):**
- Valoare_Plata_RON, Valoare_Plata_EUR, Data_Plata

**Beneficiary Information (exact API fields):**
- CUI_Beneficiar_Final, Nume_Beneficiar
- Judet_Beneficiar, Localitate_Beneficiar

**CAEN Information (exact API fields):**
- Cod_Diviziune_CAEN, Descriere_Diviziune_CAEN

**Enhanced Information (derived from API data):**
- Componenta_Label, Program

**Calculated and Formatted Fields:**
- Scop_Proiect, Valoare_EUR_Formatata, Valoare_RON_Formatata
- Data_Plata_Formatata, An_Plata, Luna_Plata, Trimestru_Plata

### 2. Sumar (Summary)
Key statistics:
- Total records, total values (EUR/RON)
- Number of unique beneficiaries, counties, components, measures, CRI-uri
- Date range (first and last payment dates)
- Export date

### 3. Componente (Components)
Breakdown by component:
- Component code, label, program
- Number of payments, total values, average value per payment
- Number of unique beneficiaries, counties, measures, CRI-uri

### 4. Judete (Counties)
Breakdown by county:
- County name
- Number of payments, total values, average value per payment
- Number of unique beneficiaries, components, measures, CRI-uri, localities

## Data Processing

The script includes:
- **Romanian Diacritic Conversion**: Converts old encoding to UTF-8
- **Component Mapping**: Maps component codes to readable labels and programs
- **Financial Formatting**: Properly formats currency values
- **Data Validation**: Handles missing or invalid data gracefully

## API Information

- **Endpoint**: `https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/plati_pnrr`
- **Pagination**: 5000 records per request
- **Rate Limiting**: 100ms delay between requests
- **Data Format**: JSON with Romanian diacritics

## Troubleshooting

### Common Issues

1. **"Node.js is not installed"**
   - Install Node.js from https://nodejs.org/
   - Make sure to restart your terminal after installation

2. **"npm is not installed"**
   - npm comes with Node.js, reinstall Node.js if missing

3. **"Failed to install dependencies"**
   - Check your internet connection
   - Try running `npm install xlsx` manually

4. **"HTTP error"**
   - Check your internet connection
   - The PNRR API might be temporarily unavailable

5. **"No data found"**
   - The API might be empty or returning an error
   - Check the console output for specific error messages

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Ensure you have a stable internet connection
3. Verify that the PNRR API is accessible
4. Check that you have write permissions in the current directory

## File Structure

```
pnrr/
├── download-payments-excel.js    # Main script
├── download-payments.sh          # Bash wrapper script
├── package-payments-excel.json   # Dependencies
├── PAYMENTS-EXCEL-README.md      # This file
└── PNRR_Plati_YYYY-MM-DD.xlsx   # Generated Excel file
```

## Performance

- **Typical Runtime**: 2-5 minutes depending on data size
- **Memory Usage**: ~100-200MB during processing
- **File Size**: Typically 10-50MB depending on data volume
- **Records**: Usually 50,000-200,000 payment records

## Data Quality

The script includes data quality features:
- Handles missing values gracefully
- Converts Romanian diacritics properly
- Validates financial amounts
- Maps component codes to readable labels
- Provides both raw and formatted values
