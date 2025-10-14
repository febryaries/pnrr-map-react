/**
 * Utilitar pentru testarea conexiunii cu Gemini API
 * Folosește acest fișier pentru a verifica că API-ul funcționează
 */

import { GEMINI_CONFIG, getGeminiURL, isGeminiConfigured } from '../config/gemini'

/**
 * Testează conexiunea cu Gemini API
 */
export const testGeminiConnection = async () => {
  console.log('🧪 Testare conexiune Gemini API...')
  
  // Verifică dacă API key-ul este configurat
  if (!isGeminiConfigured()) {
    console.error('❌ API Key nu este configurat!')
    console.log('💡 Verifică fișierul .env.local')
    return { success: false, error: 'API Key lipsă' }
  }
  
  console.log('✅ API Key găsit')
  console.log('📡 Endpoint:', getGeminiURL().split('?')[0])
  
  try {
    const response = await fetch(getGeminiURL(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Salut! Ești funcțional? Răspunde scurt în română.' }]
        }],
        generationConfig: GEMINI_CONFIG.generationConfig
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Eroare HTTP:', response.status)
      console.error('📄 Detalii:', errorData)
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}` 
      }
    }
    
    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ Răspuns invalid de la API')
      return { success: false, error: 'Răspuns invalid' }
    }
    
    const aiResponse = data.candidates[0].content.parts[0].text
    
    console.log('✅ Gemini funcționează perfect!')
    console.log('🤖 Răspuns AI:', aiResponse)
    console.log('📊 Tokens folosiți:', data.usageMetadata)
    
    return { 
      success: true, 
      response: aiResponse,
      usage: data.usageMetadata
    }
    
  } catch (error) {
    console.error('❌ Eroare la testare:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Testează cu un prompt PNRR specific
 */
export const testPNRRPrompt = async () => {
  console.log('🧪 Testare prompt PNRR...')
  
  if (!isGeminiConfigured()) {
    console.error('❌ API Key nu este configurat!')
    return { success: false, error: 'API Key lipsă' }
  }
  
  const testPrompt = `
Ești asistentul AI pentru platforma PNRR Map România.

Date test:
- București: 2.5 miliarde EUR, 342 proiecte
- Cluj: 850 milioane EUR, 156 proiecte
- Timiș: 720 milioane EUR, 134 proiecte

Întrebare: Care este județul cu cele mai multe fonduri PNRR?

Răspunde scurt și profesional în română.
`
  
  try {
    const response = await fetch(getGeminiURL(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: testPrompt }]
        }],
        generationConfig: GEMINI_CONFIG.generationConfig
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const aiResponse = data.candidates[0].content.parts[0].text
    
    console.log('✅ Test PNRR reușit!')
    console.log('🤖 Răspuns:', aiResponse)
    
    return { success: true, response: aiResponse }
    
  } catch (error) {
    console.error('❌ Eroare:', error)
    return { success: false, error: error.message }
  }
}

// Export pentru utilizare în console
if (typeof window !== 'undefined') {
  window.testGemini = testGeminiConnection
  window.testPNRR = testPNRRPrompt
}
