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
  
  // În production build, detectăm din URL
  const pathname = window.location.pathname;
  
  // Dacă URL-ul conține /pnrr-dashboard/, folosim acel base path
  if (pathname.includes('/pnrr-dashboard')) {
    return '/pnrr-dashboard/';
  }
  
  // Altfel, suntem în root (Vercel)
  return '/';
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
