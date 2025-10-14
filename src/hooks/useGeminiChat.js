import { useState, useCallback } from 'react'
import { GEMINI_CONFIG, getGeminiURL, isGeminiConfigured } from '../config/gemini'
import { PNRR_SYSTEM_PROMPT, buildAIContext } from '../config/pnrrSystemPrompt'

/**
 * Hook pentru interacțiunea cu Google Gemini API
 * Gestionează trimiterea mesajelor și primirea răspunsurilor
 */
export const useGeminiChat = (pnrrData, appState) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  /**
   * Trimite un mesaj către Gemini și primește răspuns
   */
  const sendMessage = useCallback(async (userMessage) => {
    // Verifică dacă API-ul este configurat
    if (!isGeminiConfigured()) {
      const errorMsg = 'API Key Gemini nu este configurat. Verifică fișierul .env.local'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Verifică dacă avem date
      if (!pnrrData || pnrrData.length === 0) {
        throw new Error('Nu există date PNRR disponibile')
      }
      
      // Construiește contextul cu datele PNRR
      const context = buildAIContext(pnrrData, appState)
      
      // Detectează dacă utilizatorul caută un proiect specific
      const searchResults = searchForProject(userMessage, context.allProjects)
      
      console.log('📊 Context AI:', {
        counties: context.counties.length,
        totalValue: context.statistics.totalValue,
        totalProjects: context.statistics.totalProjects
      })
      
      // Construiește prompt-ul complet
      const fullPrompt = `
${PNRR_SYSTEM_PROMPT}

=== DATE CURENTE PNRR ===

**Statistici Generale:**
- Total județe: ${context.statistics.totalCounties}
- Valoare totală: ${formatMoney(context.statistics.totalValue)} ${context.appState.currency}
- Total proiecte: ${context.statistics.totalProjects}

**Top 5 Județe:**
${context.statistics.topCounties.map((c, i) => 
  `${i + 1}. ${c.name}: ${formatMoney(c.value)} ${context.appState.currency} (${c.projects} proiecte)`
).join('\n')}

**Stare Aplicație:**
- Vizualizare curentă: ${context.appState.currentView}
- Județ selectat: ${context.appState.selectedCounty || 'Niciunul'}
- Mod vizualizare: ${context.appState.viewMode}
- Program activ: ${context.appState.activeProgram || 'Toate programele'}
- Metrică: ${context.appState.metric === 'value' ? 'Valoare' : 'Număr proiecte'}

**Date Județe (primele 10):**
${context.counties.slice(0, 10).map(c => 
  `- ${c.name}: ${formatMoney(c.value)} ${context.appState.currency}, ${c.projects} proiecte`
).join('\n')}

${context.counties.length > 10 ? `... și încă ${context.counties.length - 10} județe` : ''}

**Proiecte Disponibile:**
Total proiecte în baza de date: ${context.allProjects?.length || 0}

${searchResults.found ? `
**🔍 PROIECTE GĂSITE pentru "${searchResults.query}":**

${searchResults.projects.map((p, idx) => `
${idx + 1}. **${p.beneficiary}**
   • Județ: ${p.county}
   • Localitate: ${p.locality || 'N/A'}
   • Componentă: ${p.component}
   • Valoare: ${formatMoney(p.value)} RON
   • Status: ${p.status || 'N/A'}
   • Titlu: ${p.title || 'N/A'}
`).join('\n')}

Folosește aceste informații pentru a răspunde utilizatorului.
` : `
Nu am găsit proiecte specifice căutate de utilizator în întrebarea sa.
Răspunde pe baza statisticilor generale sau cere clarificări.
`}

=== ÎNTREBAREA UTILIZATORULUI ===
${userMessage}

=== INSTRUCȚIUNI ===
Răspunde pe baza datelor de mai sus. Fii precis, prietenos și util.
Folosește emoji cu moderație și formatează răspunsul clar.
`
      
      // Trimite request către Gemini
      const response = await fetch(getGeminiURL(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: GEMINI_CONFIG.generationConfig,
          safetySettings: GEMINI_CONFIG.safetySettings
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error?.message || 
          `HTTP error! status: ${response.status}`
        )
      }
      
      const data = await response.json()
      
      console.log('📥 Răspuns Gemini:', data)
      
      // Extrage răspunsul AI
      if (!data.candidates || data.candidates.length === 0) {
        console.error('❌ Răspuns invalid:', data)
        throw new Error('Nu am primit răspuns de la AI')
      }
      
      const aiResponse = data.candidates[0].content.parts[0].text
      
      console.log('✅ Răspuns AI:', aiResponse.substring(0, 100) + '...')
      
      setIsLoading(false)
      return aiResponse
      
    } catch (err) {
      console.error('❌ Eroare Gemini API:', err)
      console.error('📄 Detalii eroare:', {
        message: err.message,
        stack: err.stack
      })
      setError(err.message)
      setIsLoading(false)
      throw err
    }
  }, [pnrrData, appState])
  
  /**
   * Resetează starea de eroare
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  return {
    sendMessage,
    isLoading,
    error,
    clearError,
    isConfigured: isGeminiConfigured()
  }
}

/**
 * Formatează sume de bani
 */
function formatMoney(value) {
  if (!value) return '0'
  
  // Convertește la milioane sau miliarde
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)} mld`
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)} mil`
  } else {
    return value.toLocaleString('ro-RO')
  }
}

/**
 * Normalizează string pentru căutare (lowercase, fără diacritice, fără spații extra)
 */
function normalizeString(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Elimină diacritice
    .replace(/\s+/g, ' ') // Înlocuiește multiple spații cu unul singur
    .trim()
}

/**
 * Caută proiecte pe baza mesajului utilizatorului
 */
function searchForProject(userMessage, allProjects) {
  if (!allProjects || allProjects.length === 0) {
    return { found: false, query: '', projects: [] }
  }
  
  // Detectează dacă utilizatorul caută un proiect specific
  const searchPatterns = [
    /despre\s+(?:proiectul\s+)?["']?([^"'?]+)["']?/i,
    /(?:proiect|beneficiar)\s+["']?([^"'?]+)["']?/i,
    /stii\s+despre\s+["']?([^"'?]+)["']?/i,
    /gaseste\s+["']?([^"'?]+)["']?/i
  ]
  
  let searchQuery = null
  for (const pattern of searchPatterns) {
    const match = userMessage.match(pattern)
    if (match && match[1]) {
      searchQuery = match[1].trim()
      break
    }
  }
  
  if (!searchQuery) {
    return { found: false, query: '', projects: [] }
  }
  
  console.log('🔍 Căutare proiect:', searchQuery)
  
  // Normalizează query-ul
  const normalizedQuery = normalizeString(searchQuery)
  
  // Caută în toate proiectele
  const foundProjects = allProjects.filter(project => {
    const normalizedBeneficiary = normalizeString(project.beneficiary)
    return normalizedBeneficiary.includes(normalizedQuery) || 
           normalizedQuery.includes(normalizedBeneficiary)
  })
  
  console.log(`✅ Găsite ${foundProjects.length} proiecte pentru "${searchQuery}"`)
  
  return {
    found: foundProjects.length > 0,
    query: searchQuery,
    projects: foundProjects.slice(0, 10) // Limitează la primele 10 rezultate
  }
}
