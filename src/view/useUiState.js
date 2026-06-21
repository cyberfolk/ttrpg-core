import { reactive, watch } from 'vue';

const PAGE_SIZE = 20;

const ui = reactive({
  activeView: 'gallery', // 'gallery' | 'list' | 'matrix'
  search: '',
  sort: { key: 'name', dir: 'asc' }, // key: 'name' | 'score' ; dir: 'asc' | 'desc'
  showArchived: false,
  page: 0, // 0-based; offset = page * pageSize
  pageSize: PAGE_SIZE,
});

// Cambio del "dominio" (ricerca/archiviati) riduce il totale: la pagina corrente
// potrebbe finire oltre i dati e mostrare una lista vuota. Reset a pagina 0.
// (Il sort non cambia il totale, quindi non serve resettare.)
watch(() => [ui.search, ui.showArchived], () => {
  ui.page = 0;
});

export function useUiState() {
  return ui;
}
