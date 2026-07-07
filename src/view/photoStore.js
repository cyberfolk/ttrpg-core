import { indexedDbBlobStore } from '../store/photoBlobStore.js';

// Singleton del blob store foto per la VIEW. Impl IndexedDB (byte nel browser);
// domani un'impl `fetch` verso server sostituisce solo questa riga (seam ADR 0005).
export const photoBlobStore = indexedDbBlobStore();
