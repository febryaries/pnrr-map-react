/**
 * Google Gemini API Configuration
 * Pentru AI Assistant PNRR Map
 */

export const GEMINI_CONFIG = {
  // API Key din environment variables
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  
  // Model Gemini
  model: 'gemini-2.5-flash',
  
  // Endpoint base
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  
  // Configurare generare răspunsuri
  generationConfig: {
    temperature: 0.7,        // Creativitate moderată (0.0 = precis, 1.0 = creativ)
    topK: 40,                // Diversitate vocabular
    topP: 0.95,              // Nucleus sampling
    maxOutputTokens: 1024,   // Lungime maximă răspuns
  },
  
  // Safety settings
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
}

/**
 * Verifică dacă API key-ul este configurat
 */
export const isGeminiConfigured = () => {
  return !!GEMINI_CONFIG.apiKey && GEMINI_CONFIG.apiKey !== 'undefined'
}

/**
 * Construiește URL-ul complet pentru API
 */
export const getGeminiURL = () => {
  return `${GEMINI_CONFIG.endpoint}/${GEMINI_CONFIG.model}:generateContent?key=${GEMINI_CONFIG.apiKey}`
}
