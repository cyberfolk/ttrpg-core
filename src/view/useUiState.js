import { reactive } from 'vue';

const ui = reactive({
  activeView: 'gallery', // 'gallery' | 'list' | 'matrix'
  search: '',
  sort: { key: 'name', dir: 'asc' }, // key: 'name' | 'score' ; dir: 'asc' | 'desc'
  showArchived: false,
});

export function useUiState() {
  return ui;
}
