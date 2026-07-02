import { computed } from 'vue';
import { useStore } from './useStore.js';
import { useUiState } from './useUiState.js';
import { listActiveCharacters, averageIncomingScore } from '../model/reputation.js';

export function useDisplayedCharacters() {
  const { state } = useStore();
  const ui = useUiState();

  // Insieme completo filtrato + ordinato (l'equivalente del web_search_read di Odoo
  // PRIMA della paginazione): è la sorgente del totale.
  const all = computed(() => {
    const allChars = state.value.characters;
    const base = ui.showArchived ? allChars : listActiveCharacters(state.value);
    const needle = ui.search.trim().toLowerCase();
    const filtered = needle.length === 0
      ? base
      : base.filter((c) => c.name.toLowerCase().includes(needle));
    const withScore = filtered.map((c) => {
      const score = averageIncomingScore(state.value, c.id, ui.showArchived);
      return { char: c, score };
    });
    const { key, dir } = ui.sort;
    const mul = dir === 'asc' ? 1 : -1;
    const sorted = [...withScore].sort((a, b) => {
      // Archiviati sempre in fondo, a prescindere dall'ordinamento scelto.
      const aArchived = a.char.deletedAt !== null;
      const bArchived = b.char.deletedAt !== null;
      if (aArchived !== bArchived) {
        const arch = aArchived ? 1 : -1;
        return arch;
      }
      if (key === 'name') {
        const cmp = a.char.name.localeCompare(b.char.name) * mul;
        return cmp;
      }
      // key === 'score': i "senza punteggio" (null) restano sempre in coda.
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      const cmp = (a.score - b.score) * mul;
      return cmp;
    });
    return sorted;
  });

  const total = computed(() => all.value.length);

  // Pagina corrente. Matrix non consuma items, quindi paginare sempre copre
  // lista + gallery senza condizioni sull'activeView.
  const items = computed(() => {
    const start = ui.page * ui.pageSize;
    const page = all.value.slice(start, start + ui.pageSize);
    return page;
  });

  return { items, total, all };
}
