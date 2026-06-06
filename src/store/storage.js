// Interfaccia comune: { getItem(key) -> string|null, setItem(key, value) }

export function memoryStorageAdapter() {
  const map = new Map();
  const adapter = {
    getItem(key) {
      const value = map.has(key) ? map.get(key) : null;
      return value;
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
  return adapter;
}

export function localStorageAdapter() {
  const adapter = {
    getItem(key) {
      const value = window.localStorage.getItem(key);
      return value;
    },
    setItem(key, value) {
      window.localStorage.setItem(key, value);
    },
  };
  return adapter;
}
