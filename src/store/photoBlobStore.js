// memoryBlobStore: per i test e come fallback. indexedDbBlobStore: persistenza reale
// nel browser. Stessa interfaccia async → il seam per un futuro store server (fetch).
export function memoryBlobStore() {
  const map = new Map();
  const store = {
    async put(id, blob) {
      map.set(id, blob);
    },
    async get(id) {
      const value = map.has(id) ? map.get(id) : null;
      return value;
    },
    async delete(id) {
      map.delete(id);
    },
  };
  return store;
}

const STORE_NAME = 'photos';

function openDb(dbName) {
  const promise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return promise;
}

function tx(db, mode, fn) {
  const promise = new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = fn(objectStore);
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(transaction.error);
  });
  return promise;
}

export function indexedDbBlobStore(dbName = 'ttrpg-photos') {
  const dbPromise = openDb(dbName);
  const store = {
    async put(id, blob) {
      const db = await dbPromise;
      await tx(db, 'readwrite', (os) => os.put(blob, id));
    },
    async get(id) {
      const db = await dbPromise;
      const result = await tx(db, 'readonly', (os) => os.get(id));
      const value = result ?? null;
      return value;
    },
    async delete(id) {
      const db = await dbPromise;
      await tx(db, 'readwrite', (os) => os.delete(id));
    },
  };
  return store;
}
