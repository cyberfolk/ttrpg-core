// Configurazione statica delle funzioni dell'app (layer VIEW).
// Modulo puro: nessuna dipendenza da Vue o dal browser.
export const APP_FUNCTIONS = [
  { id: 'reputazione', label: 'Reputazione', routeName: 'characters', status: 'active' },
  { id: 'altro', label: 'Altro', routeName: null, status: 'soon' },
];

// Route che appartengono alla funzione Reputazione.
const REPUTATION_ROUTES = ['characters', 'profile'];

// Restituisce l'id della funzione attiva data la route corrente, o null.
export function activeFunctionId(routeName) {
  const isReputation = REPUTATION_ROUTES.includes(routeName);
  const id = isReputation ? 'reputazione' : null;
  return id;
}
