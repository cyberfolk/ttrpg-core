import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { placeInViewport, createStructuralResize, containsFocus } from './anchoring.js';

// Popup ancorato a un trigger, teleportato su <body>. Incapsula il boilerplate
// condiviso da ActionMenu e dal menu "Filtri" di RelationList: posizione fixed
// allineata al bordo destro del trigger, apertura/chiusura, chiusura su
// scroll/resize/click esterno ed Esc, focus alla prima voce all'apertura.
//
// I menu vivono in Teleport su <body> (le card profilo hanno overflow:hidden e le
// tabelle overflow-x:auto: in posizione assoluta verrebbero clippati), quindi la
// posizione è fixed calcolata dal rettangolo del trigger.
//
// triggerRef: ref all'elemento trigger (per il rect e per restituirgli il focus).
// popRef:     ref al box del popover (per trovare la prima voce focusabile).
// opts.focusSelector: selettore della prima voce da mettere a fuoco (default: voce menu).
// opts.onOpen:        hook opzionale eseguito prima di aprire (es. nascondere un tooltip).
export function useAnchoredMenu(triggerRef, popRef, opts = {}) {
  const focusSelector = opts.focusSelector || '[role="menuitem"]';
  const open = ref(false);
  const popStyle = ref(null);

  // Posizione provvisoria (il popover non è ancora nel DOM, non se ne conosce la
  // larghezza reale): allineata al bordo destro del trigger, appena sotto.
  function anchorStyle() {
    const rect = triggerRef.value.getBoundingClientRect();
    const style = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      right: `${window.innerWidth - rect.right}px`,
    };
    return style;
  }

  // focusFirst=false: apertura passiva (hover) che non sposta il focus sulla
  // prima voce (evita scroll/anello di focus indesiderati passando col mouse).
  async function openMenu(focusFirst = true) {
    if (opts.onOpen) opts.onOpen();
    popStyle.value = anchorStyle();
    open.value = true;
    await nextTick();
    // Montato il popover se ne conosce la larghezza: lo si clampa nel viewport
    // (helper condiviso). Con spazio a sufficienza l'allineamento a destra resta
    // identico a prima; cambia solo nei casi che prima uscivano dallo schermo —
    // trigger vicino al bordo, o poco spazio sotto (flip verso l'alto).
    popStyle.value = placeInViewport(triggerRef.value, popRef.value, { align: 'right' });
    if (!focusFirst) return;
    const first = popRef.value?.querySelector(focusSelector);
    if (first) first.focus();
  }

  // Chiusura intenzionale (toggle, Esc, scelta voce): riporta il focus al trigger.
  function close() {
    if (!open.value) return;
    open.value = false;
    triggerRef.value?.focus();
  }

  // Chiusura passiva (click esterno, scroll, resize): non rubare il focus.
  function closePassive() {
    open.value = false;
  }

  function toggle() {
    if (open.value) close();
    else openMenu();
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && open.value) close();
  }

  // Un resize di sola altezza mentre il focus è dentro il menu è la tastiera
  // software del telefono, non un ridimensionamento: il popover va riancorato al
  // trigger, non chiuso. Solo un cambio di larghezza (rotazione, finestra
  // trascinata) lo scollega davvero. Vedi `createStructuralResize`.
  const isStructuralResize = createStructuralResize();
  function onResize() {
    if (!open.value) return;
    if (!isStructuralResize() && containsFocus(popRef.value)) {
      popStyle.value = placeInViewport(triggerRef.value, popRef.value, { align: 'right' });
      return;
    }
    closePassive();
  }

  // Click su trigger/menu usa @click.stop, quindi qui arrivano solo click esterni.
  // Con posizione fixed, scroll/resize scollegherebbero il popover dal trigger.
  onMounted(() => {
    document.addEventListener('click', closePassive);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', closePassive, true);
    window.addEventListener('resize', onResize);
  });
  onUnmounted(() => {
    document.removeEventListener('click', closePassive);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('scroll', closePassive, true);
    window.removeEventListener('resize', onResize);
  });

  return { open, popStyle, openMenu, close, closePassive, toggle };
}
