import { reactive } from 'vue';

const ui = reactive({
  activeView: 'gallery', // 'gallery' | 'list' | 'matrix'
  search: '',
  sort: { key: 'score', dir: 'desc' }, // key: 'name' | 'score' ; dir: 'asc' | 'desc'
  showArchived: false,
});

export function useUiState() {
  return ui;
}
