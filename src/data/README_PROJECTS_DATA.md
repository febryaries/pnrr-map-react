# PNRR Projects Data Source

This directory contains an alternative data source for the PNRR application that fetches data from the `progres_tehnic_proiecte` endpoint instead of the `plati_pnrr` endpoint.

## Files

- `realDataProjects.js` - Main data fetcher and processor for projects data
- `exampleUsage.js` - Examples of how to use the new data source
- `realData.js` - Original data source (payments data)

## New Data Source: `realDataProjects.js`

### Endpoint
- **URL**: `https://pnrr.fonduri-ue.ro/ords/pnrr/mfe/progres_tehnic_proiecte`
- **Data Type**: Project progress and technical information
- **Fields**: More detailed project information including implementation dates, contract details, beneficiary information, etc.

### Key Differences from Payments Data

| Feature | Payments Data (`realData.js`) | Projects Data (`realDataProjects.js`) |
|---------|-------------------------------|---------------------------------------|
| **Endpoint** | `plati_pnrr` | `progres_tehnic_proiecte` |
| **Data Type** | Payment transactions | Project progress/technical info |
| **Value Field** | `valoare_plata_fe_euro` | `valoare_fe` |
| **Location Field** | `judet_beneficiar` | `judet_implementare` |
| **Additional Fields** | Basic payment info | Contract details, dates, status, impact, etc. |

### Available Fields in Projects Data

```javascript
{
  "cod_componenta": "C7",                    // Component code
  "cod_masura": "I10",                       // Measure code
  "cod_submasura": null,                     // Sub-measure code
  "cri": "ANFP",                            // CRI identifier
  "sursa_finantare": "grant",               // Funding source
  "nr_contract": "Ordin de finanțare nr.515", // Contract number
  "titlu_contract": null,                    // Contract title
  "denumire_beneficiar": "ANFP",            // Beneficiary name
  "cui": 12979825,                          // CUI (tax ID)
  "tip_beneficiar": "Instituţie publică",   // Beneficiary type
  "data_angajament": "2022-07-12T21:00:00Z", // Commitment date
  "data_inceput": "2022-07-12T21:00:00Z",   // Start date
  "data_finalizare": "2025-12-30T22:00:00Z", // End date
  "valoare_total": 11900000,                // Total value (RON)
  "valoare_fe": 10000000,                   // FE value (RON)
  "valoare_fpn": 0,                         // FPN value (RON)
  "valoare_tva": 1892400,                   // VAT value (RON)
  "valoare_neeligibil": 0,                  // Ineligible value (RON)
  "impact": "URBAN",                        // Impact type
  "judet_implementare": "MUNICIPIUL BUCURESTI", // Implementation county
  "localitate_implementare": "MUNICIPIUL BUCURESTI", // Implementation locality
  "stadiu": "ÎN IMPLEMENTARE"               // Project status
}
```

## Usage

### Basic Usage

```javascript
import { getRealPNRRProjectsData } from './realDataProjects'

// Get all processed projects data
const projectsData = await getRealPNRRProjectsData()
console.log(projectsData)
```

### Advanced Usage

```javascript
import { 
  fetchPNRRProjectsData, 
  processPNRRProjectsData 
} from './realDataProjects'

// Fetch raw data
const rawData = await fetchPNRRProjectsData(0, 100)

// Process raw data
const processedData = processPNRRProjectsData(rawData)
```

### Example Functions

See `exampleUsage.js` for comprehensive examples including:
- Filtering by project status
- Filtering by component
- Filtering by county
- Filtering by date range
- Filtering by value range
- Filtering by beneficiary type
- Comparing with payments data

## Integration with Existing App

To use the projects data instead of payments data in your React components:

1. **Replace the import**:
   ```javascript
   // Instead of:
   import { getRealPNRRData } from './data/realData'
   
   // Use:
   import { getRealPNRRProjectsData } from './data/realDataProjects'
   ```

2. **Update the function call**:
   ```javascript
   // Instead of:
   const realData = await getRealPNRRData()
   
   // Use:
   const realData = await getRealPNRRProjectsData()
   ```

3. **Update column labels** (if displaying detailed data):
   The projects data has different column labels in the `extras.col_labels` object.

## Data Structure

The processed data maintains the same structure as the payments data for compatibility:

```javascript
{
  code: "RO-BI",                    // County code
  name: "București",               // County name
  total: {
    value: 1000000,                // Total FE value
    projects: 50                   // Number of projects
  },
  programs: {                      // Program breakdown
    "Transformarea digitală": {
      value: 500000,
      projects: 25
    },
    // ... other programs
  },
  extras: {
    rows: [...],                   // Detailed project data
    col_labels: {...}              // Column labels for display
  }
}
```

## Benefits of Projects Data

1. **More Detailed Information**: Includes contract details, implementation dates, project status
2. **Better Project Tracking**: Can track project progress and status
3. **Enhanced Filtering**: More fields available for filtering and analysis
4. **Implementation Focus**: Data is organized by implementation location rather than beneficiary location
5. **Status Tracking**: Can filter by project status (e.g., "ÎN IMPLEMENTARE", "FINALIZAT")

## Notes

- The projects data uses `valoare_fe` (FE value in RON) instead of `valoare_plata_fe_euro` (payment value in EUR)
- County mapping is based on `judet_implementare` instead of `judet_beneficiar`
- The data structure is compatible with existing components but provides more detailed information
- All date fields are automatically formatted to Romanian locale format
- Multi-county projects are handled similarly to the payments data
