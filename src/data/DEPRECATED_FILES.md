# Deprecated Data Files

The following files have been deprecated and replaced with the new architecture:

## Replaced Files

### `realData.js` → `src/services/PNRRDataService.ts`
- **Old**: Direct API calls and data processing
- **New**: Uses `PaymentDataAggregation` class with proper exchange rate service
- **Migration**: Import `getRealPNRRData` from `../services/PNRRDataService`

### `realDataProjects.js` → `src/services/PNRRDataService.ts`
- **Old**: Direct API calls and data processing for projects
- **New**: Uses `ProjectDataAggregation` class with proper exchange rate service
- **Migration**: Import `getRealPNRRProjectsData` from `../services/PNRRDataService`

### `mockData.js` → `src/constants/PNRRConstants.ts`
- **Old**: Mixed mock data and constants
- **New**: Constants moved to `PNRRConstants.ts`, mock data kept for testing
- **Migration**: Import constants from `../constants/PNRRConstants`

### `useDataEndpoint.js` → `useDataEndpoint.ts`
- **Old**: JavaScript implementation with old data fetchers
- **New**: TypeScript implementation using aggregation classes
- **Migration**: Import from `../hooks/useDataEndpoint` (TypeScript version)

## New Architecture Benefits

1. **Type Safety**: Full TypeScript support with proper type definitions
2. **Exchange Rate Service**: Centralized, accurate RON to EUR conversion
3. **Separation of Concerns**: Clear separation between data fetching, processing, and presentation
4. **Testability**: Better testable architecture with dependency injection
5. **Maintainability**: Centralized configuration and constants
6. **Performance**: Better caching and data management

## Migration Guide

### For Components
```javascript
// Old
import { getRealPNRRData } from '../data/realData'
import { COMPONENT_MAPPING } from '../data/mockData'

// New
import { getRealPNRRData } from '../services/PNRRDataService'
import { COMPONENT_MAPPING } from '../constants/PNRRConstants'
```

### For Hooks
```javascript
// Old
import { useDataEndpoint } from '../hooks/useDataEndpoint'

// New (same import, but now uses TypeScript version)
import { useDataEndpoint } from '../hooks/useDataEndpoint'
```

### For Constants
```javascript
// Old
import { COUNTY_MAP, PROGRAMS, PROGRAM_COLORS } from '../data/mockData'

// New
import { COUNTY_MAP, PROGRAMS, PROGRAM_COLORS } from '../constants/PNRRConstants'
```

## Files to Remove

The following files can be safely removed after migration:
- `src/data/realData.js`
- `src/data/realDataProjects.js`
- `src/data/useDataEndpoint.js` (already removed)

## Files to Keep

- `src/data/mockData.js` - Still needed for testing and development
- `src/data/data.js` - Updated to use new services, provides backward compatibility
- `src/data/ro_localities.js` - Still needed for locality data

## Backward Compatibility

The `src/data/data.js` file has been updated to provide backward compatibility exports, so existing imports should continue to work without changes.
