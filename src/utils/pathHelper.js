/**
 * Helper pentru paths relative care funcționează în toate mediile:
 * - Localhost dev: /pnrr-dashboard/
 * - Build local: /pnrr-dashboard/
 * - Vercel: / (root)
 */

/**
 * Returnează base path-ul corect pentru fișierele statice
 * Detectează automat dacă suntem în subfolder sau root
 */
export function getBasePath() {
  // În dev mode (npm run dev), Vite setează import.meta.env.DEV = true
  // Folosim ÎNTOTDEAUNA import.meta.env.BASE_URL în dev
  if (import.meta.env.DEV) {
    return import.meta.env.BASE_URL;
  }
  
  // În production build pe Vercel, fișierele din /public/ sunt ÎNTOTDEAUNA la root
  // indiferent de base path-ul aplicației (chiar dacă app rulează la /pnrr-dashboard)
  // Detectăm Vercel prin hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Vercel deployment (*.vercel.app sau custom domain cu Vercel)
    if (hostname.includes('vercel.app')) {
      return '/';
    }
  }
  
  // Pentru build local (dist/) servit cu base /pnrr-dashboard/
  // Fișierele din /public/ trebuie accesate cu base path-ul
  return import.meta.env.BASE_URL || '/pnrr-dashboard/';
}

/**
 * Returnează path-ul complet pentru un fișier static
 * @param {string} filename - Numele fișierului (ex: 'ro-all.topo.json')
 * @returns {string} - Path-ul complet (ex: '/pnrr-dashboard/ro-all.topo.json')
 */
export function getAssetPath(filename) {
  const basePath = getBasePath();
  // Asigură-te că nu avem double slashes
  return basePath + filename.replace(/^\//, '');
}
