import { computed } from 'vue';
import { useStore } from './useStore.js';
import { useUiState } from './useUiState.js';
import { listActiveCharacters, averageIncomingScore } from '../model/reputation.js';

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
      return { char: c, score };
    });
    return [...withScore].sort((a, b) => {
      const aArchived = a.char.deletedAt !== null;
      const bArchived = b.char.deletedAt !== null;
      if (aArchived !== bArchived) return aArchived ? 1 : -1;
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    });
  });

  return items;
}
