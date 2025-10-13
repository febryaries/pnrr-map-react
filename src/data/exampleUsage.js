// Example usage of the new PNRR projects data source
// This file demonstrates how to use realDataProjects.js as an alternative to realData.js

import { 
  getRealPNRRProjectsData, 
  fetchPNRRProjectsData, 
  processPNRRProjectsData,
  COMPONENT_MAPPING 
} from './realDataProjects'

// Example 1: Get all processed projects data (similar to getRealPNRRData)
export const loadProjectsData = async () => {
  try {
    console.log('Loading PNRR projects data...')
    const projectsData = await getRealPNRRProjectsData()
    console.log('Projects data loaded:', projectsData)
    return projectsData
  } catch (error) {
    console.error('Error loading projects data:', error)
    return []
  }
}

// Example 2: Fetch a specific batch of raw data
export const loadBatchData = async (offset = 0, limit = 100) => {
  try {
    const batchData = await fetchPNRRProjectsData(offset, limit)
    console.log(`Fetched ${batchData.length} projects from batch`)
    return batchData
  } catch (error) {
    console.error('Error loading batch data:', error)
    return []
  }
}

// Example 3: Process raw data manually
export const processRawData = (rawData) => {
  try {
    const processedData = processPNRRProjectsData(rawData)
    console.log('Processed data:', processedData)
    return processedData
  } catch (error) {
    console.error('Error processing data:', error)
    return []
  }
}

// Example 4: Compare with payments data
export const compareDataSources = async () => {
  try {
    // Load both data sources
    const [projectsData, paymentsData] = await Promise.all([
      getRealPNRRProjectsData(),
      import('./realData').then(module => module.getRealPNRRData())
    ])
    
    console.log('Projects data summary:', {
      totalCounties: projectsData.length,
      totalProjects: projectsData.reduce((sum, county) => sum + county.total.projects, 0),
      totalValue: projectsData.reduce((sum, county) => sum + county.total.value, 0)
    })
    
    console.log('Payments data summary:', {
      totalCounties: paymentsData.length,
      totalProjects: paymentsData.reduce((sum, county) => sum + county.total.projects, 0),
      totalValue: paymentsData.reduce((sum, county) => sum + county.total.value, 0)
    })
    
    return { projectsData, paymentsData }
  } catch (error) {
    console.error('Error comparing data sources:', error)
    return { projectsData: [], paymentsData: [] }
  }
}

// Example 5: Filter projects by specific criteria
export const filterProjectsByStatus = async (status = 'ÎN IMPLEMENTARE') => {
  try {
    const rawData = await fetchPNRRProjectsData(0, 1000) // Adjust limit as needed
    const filteredData = rawData.filter(project => 
      project.stadiu && project.stadiu.includes(status)
    )
    
    console.log(`Found ${filteredData.length} projects with status: ${status}`)
    return filteredData
  } catch (error) {
    console.error('Error filtering projects:', error)
    return []
  }
}

// Example 6: Get projects by component
export const getProjectsByComponent = async (componentCode = 'C7') => {
  try {
    const rawData = await fetchPNRRProjectsData(0, 1000) // Adjust limit as needed
    const componentProjects = rawData.filter(project => 
      project.cod_componenta === componentCode
    )
    
    const componentInfo = COMPONENT_MAPPING[componentCode]
    console.log(`Found ${componentProjects.length} projects for component ${componentCode}: ${componentInfo?.label}`)
    return componentProjects
  } catch (error) {
    console.error('Error getting projects by component:', error)
    return []
  }
}

// Example 7: Get projects by county
export const getProjectsByCounty = async (countyName = 'MUNICIPIUL BUCURESTI') => {
  try {
    const rawData = await fetchPNRRProjectsData(0, 1000) // Adjust limit as needed
    const countyProjects = rawData.filter(project => 
      project.judet_implementare && 
      project.judet_implementare.toUpperCase().includes(countyName.toUpperCase())
    )
    
    console.log(`Found ${countyProjects.length} projects for county: ${countyName}`)
    return countyProjects
  } catch (error) {
    console.error('Error getting projects by county:', error)
    return []
  }
}

// Example 8: Get projects by date range
export const getProjectsByDateRange = async (startDate, endDate) => {
  try {
    const rawData = await fetchPNRRProjectsData(0, 1000) // Adjust limit as needed
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const dateFilteredProjects = rawData.filter(project => {
      if (!project.data_angajament) return false
      const projectDate = new Date(project.data_angajament)
      return projectDate >= start && projectDate <= end
    })
    
    console.log(`Found ${dateFilteredProjects.length} projects between ${startDate} and ${endDate}`)
    return dateFilteredProjects
  } catch (error) {
    console.error('Error getting projects by date range:', error)
    return []
  }
}

// Example 9: Get projects by value range
export const getProjectsByValueRange = async (minValue, maxValue) => {
  try {
    const rawData = await fetchPNRRProjectsData(0, 1000) // Adjust limit as needed
    const valueFilteredProjects = rawData.filter(project => {
      const value = parseFloat(project.valoare_fe) || 0
      return value >= minValue && value <= maxValue
    })
    
    console.log(`Found ${valueFilteredProjects.length} projects with value between ${minValue} and ${maxValue}`)
    return valueFilteredProjects
  } catch (error) {
    console.error('Error getting projects by value range:', error)
    return []
  }
}

// Example 10: Get projects by beneficiary type
export const getProjectsByBeneficiaryType = async (beneficiaryType = 'Instituţie publică') => {
  try {
    const rawData = await fetchPNRRProjectsData(0, 1000) // Adjust limit as needed
    const typeFilteredProjects = rawData.filter(project => 
      project.tip_beneficiar && 
      project.tip_beneficiar.includes(beneficiaryType)
    )
    
    console.log(`Found ${typeFilteredProjects.length} projects for beneficiary type: ${beneficiaryType}`)
    return typeFilteredProjects
  } catch (error) {
    console.error('Error getting projects by beneficiary type:', error)
    return []
  }
}

// Export all examples for easy importing
export default {
  loadProjectsData,
  loadBatchData,
  processRawData,
  compareDataSources,
  filterProjectsByStatus,
  getProjectsByComponent,
  getProjectsByCounty,
  getProjectsByDateRange,
  getProjectsByValueRange,
  getProjectsByBeneficiaryType
}
