// Centralized data exports
// All static data and utilities are exported from here

// Import from new constants file
import { 
  COMPONENT_MAPPING,
  PROGRAMS, 
  PROGRAM_COLORS, 
  COUNTY_MAP, 
  formatMoney, 
  formatNumber, 
  formatMoneyShort, 
  formatMoneyCompact 
} from '../constants/PNRRConstants'

// Import from new data service
import { 
  getRealPNRRData, 
  getRealPNRRProjectsData 
} from '../services/PNRRDataService'

// Import mock data and localities
import { mockData } from './mockData.js'
import { ro_localities } from './ro_localities.js'

// Export data fetchers (backward compatibility)
export { getRealPNRRData, getRealPNRRProjectsData }

// Export component mappings (backward compatibility)
export const COMPONENT_MAPPING_PAYMENTS = COMPONENT_MAPPING
export const COMPONENT_MAPPING_PROJECTS = COMPONENT_MAPPING

// Re-export all other data with new function names
export {
  mockData,
  PROGRAMS,
  PROGRAM_COLORS,
  COUNTY_MAP,
  ro_localities,
  // Backward compatibility aliases
  formatMoney as fmtMoney,
  formatNumber as fmtNum,
  formatMoneyShort as fmtMoneyShort,
  formatMoneyCompact as fmtMoneyCompact
}