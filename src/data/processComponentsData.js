import componentsRawData from './componentsData.json'

// Component names mapping
const COMPONENT_NAMES = {
  'C1': 'Managementul apei',
  'C2': 'Păduri și protecția biodiversității',
  'C3': 'Managementul deșeurilor',
  'C4': 'Transport sustenabil',
  'C5': 'Valul Renovării',
  'C6': 'Energie',
  'C7': 'Transformare digitală',
  'C8': 'Reforma fiscală și reforma sistemului de pensii',
  'C9': 'Suport pentru sectorul privat, cercetare, dezvoltare și inovare',
  'C10': 'Fondul local',
  'C11': 'Turism și cultură',
  'C12': 'Sănătate',
  'C13': 'Reforme sociale',
  'C14': 'Bună guvernanță',
  'C15': 'Educație',
  'C16': 'REPowerEU'
}

/**
 * Process components data from JSON to the format needed by ComponentsOverview
 */
export function getProcessedComponentsData() {
  const componentsData = {}
  
  // Group by component code
  componentsRawData.forEach(item => {
    const code = item.componentCode
    
    if (!componentsData[code]) {
      componentsData[code] = {
        code: code,
        name: COMPONENT_NAMES[code] || code,
        totalValue: 0,
        totalExecutedValue: 0,
        investments: [],
        reforms: []
      }
    }
    
    // Determine if it's an investment (I) or reform (R)
    const isInvestment = item.measureCode.startsWith('I')
    const isReform = item.measureCode.startsWith('R')
    
    const measureItem = {
      description: item.title,
      value: item.allocatedValue || 0,
      executedValue: item.executedValue || 0,
      executionPercent: item.executionPercent || '0%'
    }
    
    if (isInvestment) {
      componentsData[code].investments.push(measureItem)
    } else if (isReform) {
      componentsData[code].reforms.push(measureItem)
    }
    
    // Add to total value and executed value
    componentsData[code].totalValue += (item.allocatedValue || 0)
    componentsData[code].totalExecutedValue += (item.executedValue || 0)
  })
  
  // Sort investments and reforms: items with value > 0 first, then items with value = 0
  Object.values(componentsData).forEach(component => {
    component.investments.sort((a, b) => {
      // If one has value 0 and the other doesn't, put the one with value first
      if (a.value === 0 && b.value !== 0) return 1
      if (a.value !== 0 && b.value === 0) return -1
      // Otherwise maintain original order
      return 0
    })
    
    component.reforms.sort((a, b) => {
      // If one has value 0 and the other doesn't, put the one with value first
      if (a.value === 0 && b.value !== 0) return 1
      if (a.value !== 0 && b.value === 0) return -1
      // Otherwise maintain original order
      return 0
    })
  })
  
  return componentsData
}

export default getProcessedComponentsData
