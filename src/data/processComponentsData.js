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
  
  // Sort investments and reforms by measure code (I1, I2, R1, R2, etc.)
  Object.values(componentsData).forEach(component => {
    const extractNumber = (description) => {
      const match = description.match(/^([IR])(\d+)/)
      if (match) {
        return parseInt(match[2], 10)
      }
      return 999 // Put items without code at the end
    }
    
    component.investments.sort((a, b) => {
      const numA = extractNumber(a.description)
      const numB = extractNumber(b.description)
      return numA - numB
    })
    
    component.reforms.sort((a, b) => {
      const numA = extractNumber(a.description)
      const numB = extractNumber(b.description)
      return numA - numB
    })
  })
  
  return componentsData
}

export default getProcessedComponentsData
