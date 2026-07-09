import { ref } from 'vue';

// Navigazione da tastiera di una lista di opzioni (combobox, listbox, picker):
// indice attivo, frecce su/giù cicliche, Invio che sceglie, scroll dell'opzione
// attiva dentro la vista. Estratto dalle tre copie divergenti di InlineSelect,
// Many2ManyField ed EntityPicker: prima le frecce funzionavano solo nel primo.
//
// Non conosce il markup: il chiamante dichiara quante voci ci sono (`count`),
// cosa fare quando se ne sceglie una (`onPick`) e dove stanno nel DOM
// (`container` + `itemSelector`) perché lo scroll possa seguirle.
//
// Escape resta al chiamante: alcuni popover lo gestiscono in locale, altri lo
// delegano a `useDismiss`. Qui si tratta solo la navigazione.
//
// @param {Object} opts
// @param {() => number} opts.count - numero di voci navigabili, ora.
// @param {(index: number) => void} opts.onPick - scelta della voce all'indice.
// @param {import('vue').Ref<HTMLElement>} [opts.container] - box scrollabile.
// @param {string} [opts.itemSelector] - selettore delle voci dentro `container`.
export function useListNav(opts) {
  const { count, onPick, container = null, itemSelector = '[role="option"]' } = opts;

  const activeIndex = ref(0);

  function scrollActiveIntoView() {
    const root = container?.value;
    if (!root) return;
    const el = root.querySelectorAll(itemSelector)[activeIndex.value];
    el?.scrollIntoView({ block: 'nearest' });
  }

  // Ciclico: dall'ultima voce si torna alla prima, e viceversa.
  function move(delta) {
    const total = count();
    if (!total) return;
    activeIndex.value = (activeIndex.value + delta + total) % total;
    scrollActiveIntoView();
  }

  function pick() {
    const total = count();
    if (!total) return;
    const index = Math.min(activeIndex.value, total - 1);
    onPick(index);
  }

  // Riporta l'evidenziazione a una voce nota (di norma la prima, o la selezionata
  // quando il popover si apre su un valore già scelto).
  function reset(index = 0) {
    activeIndex.value = index;
  }

  // Ritorna true se il tasto è stato consumato: il chiamante può concatenare la
  // propria logica (Escape, Tab) senza duplicare i preventDefault.
  function onKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
      return true;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      pick();
      return true;
    }
    return false;
  }

  return { activeIndex, move, pick, reset, scrollActiveIntoView, onKeydown };
}
