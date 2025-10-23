import componentsRawData from './componentsData.json'

// Component names mapping (from DETALII_COMPONENTE.md documentation)
const COMPONENT_NAMES = {
  'C1': 'Managementul apei',
  'C2': 'Protejarea pădurilor și a biodiversității',
  'C3': 'Managementul deșeurilor',
  'C4': 'Transport sustenabil',
  'C5': 'Valul Renovării',
  'C6': 'Energie',
  'C7': 'Transformare digitală',
  'C8': 'Reforme fiscale și pensiilor',
  'C9': 'Sprijin pentru mediul de afaceri și cercetare',
  'C10': 'Fondul local',
  'C11': 'Turism și cultura',
  'C12': 'Sănătate',
  'C13': 'Reforme sociale',
  'C14': 'Buna guvernanță',
  'C15': 'Educație',
  'C16': 'RePOWER EU'
}

/**
 * Process components data from JSON to the format needed by ComponentsOverview
 */
export function getProcessedComponentsData() {
  // Process each component from the updated JSON structure
  // componentsRawData is now an object, so we need to iterate over its values
  Object.values(componentsRawData).forEach(component => {
    // Set the correct component name from the mapping
    component.name = COMPONENT_NAMES[component.code] || `Componenta ${component.code}`
    
    // Sort investments and reforms by measure code (I1, I2, R1, R2, etc.)
    const extractNumber = (masura) => {
      const match = masura.match(/^([IR])(\d+)/)
      if (match) {
        return parseInt(match[2], 10)
      }
      return 999 // Put items without code at the end
    }
    
    component.investments.sort((a, b) => {
      const numA = extractNumber(a.masura)
      const numB = extractNumber(b.masura)
      return numA - numB
    })
    
    component.reforms.sort((a, b) => {
      const numA = extractNumber(a.masura)
      const numB = extractNumber(b.masura)
      return numA - numB
    })
  })
  
  // Convert to array and sort by component code (C1, C2, C3, ..., C16)
  const sortedComponents = Object.values(componentsRawData).sort((a, b) => {
    const numA = parseInt(a.code.replace('C', ''));
    const numB = parseInt(b.code.replace('C', ''));
    return numA - numB;
  });
  
  return sortedComponents
}

export default getProcessedComponentsData
