# PNRR Map - React Implementation

This is a React implementation of the PNRR (Plan Național de Redresare și Reziliență) funding absorption map, originally built with PHP and Highcharts. The application visualizes EU funding distribution across Romanian counties for the 2021-2027 period.

## Features

### 1st View (Map by County)
- **Interactive map** displaying Romanian counties
- **Hover functionality** showing:
  - County name
  - Funding amount (value)
  - Number of beneficiaries (projects)
- **Click functionality** to open county details
- **Multiple view modes**:
  - General (all programs)
  - Multi-county projects
  - Total (General + Multi-county)
  - Individual programs (PDD, PEO, PIDS, POCIDIF, PS, PT, PTJ, PR)
- **Metric toggle** between value (RON) and project count
- **Program pie chart** showing distribution
- **County ranking** with interactive bars

### 2nd View (County Details)
- **Aggregated county data**:
  - Total project value
  - Total beneficiaries/projects
  - Total PNRR value (national recovery funds)
  - County ranking by value and beneficiaries
- **Interactive charts**:
  - Program distribution pie chart
  - County ranking bar chart
- **Detailed project table** with:
  - Component code (cod_componenta)
  - Measure code (cod_masura)
  - Project title (titlu_proiect)
  - Beneficiary name (nume_beneficiar)
  - Funding source (sursa_finantare)
  - Payment value in RON (valoare_plata_fe)
  - Payment value in EUR (valoare_plata_fe_euro)
  - Physical progress (progres_fizic)

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Highcharts** - Interactive charts and maps
- **Modern CSS** - Responsive design matching original
- **Mock Data** - Realistic sample data for demonstration

## Programs Supported

- **PDD** - Dezvoltare Durabilă (Sustainable Development)
- **PEO** - Educație și Ocupare (Education and Employment)
- **PIDS** - Incluziune și Demnitate Socială (Social Inclusion and Dignity)
- **POCIDIF** - Creștere Inteligentă (Smart Growth)
- **PS** - Sănătate (Health)
- **PT** - Transport (Transport)
- **PTJ** - Tranziție Justă (Just Transition)
- **PR** - Dezvoltare Regională (Regional Development)

## Setup Instructions

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Build for production**:
```bash
npm run build
```

4. **Preview production build**:
```bash
npm run preview
```

### Single File Build

The Vite configuration is set up to compile everything into a single file for easy deployment. The build output will be in the `dist/` directory.

## Project Structure

```
src/
├── components/
│   ├── MapView.jsx          # Main map view with controls
│   └── CountyDetails.jsx    # County details view
├── data/
│   └── mockData.js          # Mock data structure
├── App.jsx                  # Main app component
├── App.css                  # Application styles
├── main.jsx                 # Entry point
└── index.css                # Global styles
```

## Data Structure

The application uses a data structure compatible with the original PHP implementation:

```javascript
{
  code: "RO-AB",           // County code
  name: "Alba",            // County name
  total: {
    value: 1701242547.28,  // Total funding value
    projects: 127          // Total number of projects
  },
  programs: {              // Per-program breakdown
    PDD: { value: 223121585.19, projects: 1 },
    // ... other programs
  },
  extras: {
    rows: [...],           // Individual project data
    col_labels: {...}      // Column labels for display
  }
}
```

## Features Comparison with Original

| Feature | Original PHP | React Implementation |
|---------|-------------|---------------------|
| Interactive map | ✅ Highcharts | ✅ Highcharts |
| County hover/click | ✅ | ✅ |
| View modes | ✅ | ✅ |
| Program filtering | ✅ | ✅ |
| Pie charts | ✅ | ✅ |
| County ranking | ✅ | ✅ |
| County details | ✅ | ✅ |
| Project tables | ✅ | ✅ |
| Multi-county data | ✅ | ✅ |
| Responsive design | ✅ | ✅ |
| Single file build | ❌ | ✅ |

## Development Notes

- **Mock Data**: The application uses realistic mock data that follows the same structure as the original
- **Responsive**: Fully responsive design that works on desktop and mobile
- **Performance**: Optimized with React hooks and memoization
- **Accessibility**: Maintains accessibility features from the original
- **Styling**: CSS closely matches the original design system

## Deployment

The built application compiles to static files that can be deployed to any web server. No backend is required as it uses mock data.

For production deployment with real data, replace the mock data in `src/data/mockData.js` with actual API calls or data imports.

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

This project is based on the original PNRR mapping application and is intended for demonstration purposes.
