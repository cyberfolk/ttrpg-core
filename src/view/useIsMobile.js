import { ref } from 'vue';

// Vero su viewport da smartphone. Soglia allineata ai media query CSS della VIEW
// (le tabelle passano al layout stretto a 560px). Singleton a livello di modulo:
// un solo listener condiviso da tutti i consumatori, nessun cleanup necessario
// (vive quanto l'app). Solo VIEW: matchMedia è browser, qui è consentito.
//
// Guardia per ambiente non-browser (node:test importa i composable che usano
// questo modulo): senza window/matchMedia isMobile resta false, così la
// paginazione dei test si comporta come su desktop.
const MOBILE_QUERY = '(max-width: 560px)';

const hasMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
const mediaQuery = hasMatchMedia ? window.matchMedia(MOBILE_QUERY) : null;
const isMobile = ref(mediaQuery ? mediaQuery.matches : false);
if (mediaQuery) {
  mediaQuery.addEventListener('change', (e) => {
    isMobile.value = e.matches;
  });
}

export function useIsMobile() {
  return isMobile;
}
