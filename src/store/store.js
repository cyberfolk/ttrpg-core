import { createState } from '../model/schema.js';
import { serializeState, parseImport } from './io.js';

const STORAGE_KEY = 'ttrpg-reputation-state';

function loadInitial(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) {
    const fresh = createState();
    return fresh;
  }
  const restored = parseImport(raw);
  return restored;
}

export function createStore({ storage }) {
  let state = loadInitial(storage);
  const listeners = new Set();

  function persist() {
    storage.setItem(STORAGE_KEY, serializeState(state));
  }

  function notify() {
    for (const listener of listeners) {
      listener(state);
    }
  }

  function getState() {
    return state;
  }

  function dispatch(modelFn) {
    state = modelFn(state);
    persist();
    notify();
  }

  function replaceState(newState) {
    state = newState;
    persist();
    notify();
  }

  function subscribe(listener) {
    listeners.add(listener);
    const unsubscribe = () => listeners.delete(listener);
    return unsubscribe;
  }

  const store = { getState, dispatch, replaceState, subscribe };
  return store;
}
