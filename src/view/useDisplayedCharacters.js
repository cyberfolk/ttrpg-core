import { computed } from 'vue';
import { useStore } from './useStore.js';
import { useUiState } from './useUiState.js';
import { listActiveCharacters, averageIncomingScore } from '../model/reputation.js';

function compareItems(a, b, sort) {
  const dirMul = sort.dir === 'asc' ? 1 : -1;
  if (sort.key === 'name') {
    const cmp = a.char.name.localeCompare(b.char.name);
    return cmp * dirMul;
  }
  // sort.key === 'score' — i null vanno sempre in fondo, a prescindere dalla direzione
  if (a.score === null && b.score === null) {
    return 0;
  }
  if (a.score === null) {
    return 1;
  }
  if (b.score === null) {
    return -1;
  }
  const cmp = a.score - b.score;
  return cmp * dirMul;
}

export function useDisplayedCharacters() {
  const { state } = useStore();
  const ui = useUiState();

  const items = computed(() => {
    const all = state.value.characters;
    const base = ui.showArchived ? all : listActiveCharacters(state.value);
    const needle = ui.search.trim().toLowerCase();
    const filtered = needle.length === 0
      ? base
      : base.filter((c) => c.name.toLowerCase().includes(needle));
    const withScore = filtered.map((c) => {
      const score = averageIncomingScore(state.value, c.id, ui.showArchived);
      const item = { char: c, score };
      return item;
    });
    const sorted = [...withScore].sort((a, b) => compareItems(a, b, ui.sort));
    return sorted;
  });

  return items;
}
