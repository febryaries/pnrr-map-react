/**
 * Semantic Search Utilities
 * Implementare căutare semantică cu normalizare diacritice și sinonime
 * Bazat pe sistemul MFE (mfe.gov.ro)
 */

/**
 * Normalizare diacritice și lowercase
 * Convertește text cu diacritice în format normalizat pentru căutare
 * 
 * @param {string} text - Textul de normalizat
 * @returns {string} - Text normalizat (fără diacritice, lowercase)
 * 
 * Exemple:
 * - "Apă Uzată" → "apa uzata"
 * - "Canalizare și Epurare" → "canalizare si epurare"
 */
export const normalizeDiacritics = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .normalize('NFD')                    // Descompune caracterele cu diacritice
    .replace(/[\u0300-\u036f]/g, '')    // Elimină marcajele diacritice
    .replace(/ș|ş/gi, 's')              // Înlocuiește ș cu s
    .replace(/ț|ţ/gi, 't')              // Înlocuiește ț cu t
    .toLowerCase()                       // Convertește la lowercase
    .trim();                             // Elimină spații
};

/**
 * Dicționar de sinonime pentru termeni PNRR comuni
 * Fiecare cheie are o listă de sinonime care vor fi căutate
 */
const PNRR_SYNONYMS = {
  // Apă și canalizare
  'apa uzata': ['canalizare', 'epurare', 'apa uzata', 'ape uzate', 'statii de epurare', 'retea canalizare'],
  'ape uzate': ['canalizare', 'epurare', 'apa uzata', 'ape uzate', 'statii de epurare', 'retea canalizare'],
  'canalizare': ['apa uzata', 'ape uzate', 'epurare', 'canalizare', 'statii de epurare'],
  'epurare': ['apa uzata', 'ape uzate', 'canalizare', 'epurare', 'statii de epurare'],
  
  // Sănătate
  'spital': ['unitate medicala', 'centru medical', 'clinica', 'policlinica', 'spital', 'unitate sanitara'],
  'sanatate': ['spital', 'unitate medicala', 'centru medical', 'clinica', 'sanatate'],
  
  // Educație
  'scoala': ['unitate de invatamant', 'liceu', 'gimnaziu', 'scoala', 'institutie de invatamant'],
  'gradinita': ['cresa', 'gradinita', 'unitate prescolara'],
  'educatie': ['scoala', 'liceu', 'gimnaziu', 'unitate de invatamant', 'educatie'],
  
  // Transport
  'drum': ['infrastructura rutiera', 'autostrada', 'sosea', 'carosabil', 'drum', 'cale rutiera'],
  'autostrada': ['drum', 'infrastructura rutiera', 'sosea', 'autostrada', 'cale rutiera'],
  'transport': ['drum', 'cale ferata', 'infrastructura', 'transport', 'mobilitate'],
  
  // Energie
  'energie': ['fotovoltaic', 'solar', 'eolian', 'termic', 'energie', 'regenerabil'],
  'solar': ['fotovoltaic', 'energie', 'panouri', 'solar', 'regenerabil'],
  'fotovoltaic': ['solar', 'energie', 'panouri', 'fotovoltaic', 'regenerabil'],
  
  // Mediu
  'padure': ['impadurire', 'reimpadurire', 'padure', 'silvicultura', 'arbori'],
  'deseuri': ['gunoi', 'deseuri', 'reciclare', 'management deseuri', 'colectare'],
  
  // Digital
  'digitalizare': ['digital', 'it', 'informatizare', 'digitalizare', 'tehnologie'],
  'digital': ['digitalizare', 'it', 'informatizare', 'digital', 'tehnologie']
};

/**
 * Creează funcție de matching semantic pentru un query
 * 
 * @param {string} query - Query-ul de căutare (ex: "apă uzată")
 * @returns {Function} - Funcție care verifică dacă un text match-uiește query-ul
 * 
 * Logica:
 * 1. Normalizează query-ul
 * 2. Suportă multi-termen despărțiți prin virgulă (OR logic)
 * 3. Pentru fiecare termen:
 *    - Verifică match direct în text
 *    - Verifică match cu sinonime din dicționar
 * 
 * Exemple:
 * - Query: "apă uzată" → găsește: "canalizare", "epurare", "apă uzată"
 * - Query: "spital, drum" → găsește: "spital" SAU "drum" SAU sinonimele lor
 */
export function createSemanticMatcher(query) {
  if (!query) return () => false;
  
  // Normalizează query-ul
  const normalizedQuery = normalizeDiacritics(query);
  
  // Suport multi-termen despărțiți prin virgulă (OR logic)
  const terms = normalizedQuery
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  
  if (terms.length === 0) return () => false;
  
  /**
   * Funcția de matching returnată
   * @param {string} text - Textul în care căutăm
   * @returns {boolean} - True dacă găsește match
   */
  return function(text) {
    if (!text) return false;
    
    const normalizedText = normalizeDiacritics(text);
    
    // Verifică fiecare termen (OR logic)
    for (const term of terms) {
      // 1. Match direct în text
      if (normalizedText.includes(term)) {
        return true;
      }
      
      // 2. Match cu sinonime din dicționar
      const synonyms = PNRR_SYNONYMS[term] || [];
      for (const synonym of synonyms) {
        // Folosim regex cu word boundary pentru match exact
        const regex = new RegExp(`\\b${escapeRegExp(synonym)}\\b`, 'i');
        if (regex.test(normalizedText)) {
          return true;
        }
      }
    }
    
    return false;
  };
}

/**
 * Escape caractere speciale pentru RegExp
 * @param {string} string - String de escape
 * @returns {string} - String escaped
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Filtrează o listă de proiecte folosind căutare semantică
 * 
 * @param {Array} projects - Lista de proiecte
 * @param {string} query - Query-ul de căutare
 * @param {Array<string>} searchableFields - Câmpurile în care căutăm
 * @returns {Array} - Proiecte filtrate
 */
export function filterProjectsSemantic(projects, query, searchableFields = []) {
  if (!query || !projects || projects.length === 0) {
    return projects;
  }
  
  const matcher = createSemanticMatcher(query);
  
  return projects.filter(project => {
    // Verifică fiecare câmp searchable
    for (const field of searchableFields) {
      const value = project[field];
      if (value && matcher(value)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Extrage sinonimele pentru un termen dat
 * Util pentru debugging sau UI
 * 
 * @param {string} term - Termenul pentru care căutăm sinonime
 * @returns {Array<string>} - Lista de sinonime
 */
export function getSynonymsForTerm(term) {
  const normalized = normalizeDiacritics(term);
  return PNRR_SYNONYMS[normalized] || [];
}

/**
 * Verifică dacă un termen are sinonime definite
 * 
 * @param {string} term - Termenul de verificat
 * @returns {boolean} - True dacă are sinonime
 */
export function hasSynonyms(term) {
  const normalized = normalizeDiacritics(term);
  return normalized in PNRR_SYNONYMS;
}
