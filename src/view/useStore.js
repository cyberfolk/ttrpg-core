import { ref } from 'vue';
import { localStorageAdapter } from '../store/storage.js';
import { createStore } from '../store/store.js';

const store = createStore({ storage: localStorageAdapter() });
const state = ref(store.getState());
store.subscribe((s) => { state.value = s; });

export function useStore() {
  const api = {
    state,
    getState: store.getState,
    dispatch: store.dispatch,
    replaceState: store.replaceState,
  };
  return api;
}
