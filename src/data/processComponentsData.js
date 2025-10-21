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
  
  // Process each component from the updated JSON structure
  componentsRawData.forEach(component => {
    const code = component.code
    
    if (!componentsData[code]) {
      componentsData[code] = {
        code: code,
        name: COMPONENT_NAMES[code] || component.name,
        totalValue: 0,
        totalExecutedValue: 0,
        investments: [],
        reforms: []
      }
    }
    
    // Process investments
    component.investments.forEach(investment => {
      const measureItem = {
        masura: investment.masura,
        titlul_masurii: investment.titlul_masurii,
        alocare_financiara_euro: investment.alocare_financiara_euro,
        executat_euro: investment.executat_euro,
        executat_procent: investment.executat_procent,
        finantare: investment.finantare
      }
      
      componentsData[code].investments.push(measureItem)
      componentsData[code].totalValue += investment.alocare_financiara_euro
      componentsData[code].totalExecutedValue += investment.executat_euro
    })
    
    // Process reforms
    component.reforms.forEach(reform => {
      const measureItem = {
        masura: reform.masura,
        titlul_masurii: reform.titlul_masurii,
        alocare_financiara_euro: reform.alocare_financiara_euro,
        executat_euro: reform.executat_euro,
        executat_procent: reform.executat_procent,
        finantare: reform.finantare
      }
      
      componentsData[code].reforms.push(measureItem)
      componentsData[code].totalValue += reform.alocare_financiara_euro
      componentsData[code].totalExecutedValue += reform.executat_euro
    })
  })
  
  // Sort investments and reforms by measure code (I1, I2, R1, R2, etc.)
  Object.values(componentsData).forEach(component => {
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
  const sortedComponents = Object.values(componentsData).sort((a, b) => {
    const numA = parseInt(a.code.replace('C', ''));
    const numB = parseInt(b.code.replace('C', ''));
    return numA - numB;
  });
  
  return sortedComponents
}

export default getProcessedComponentsData
