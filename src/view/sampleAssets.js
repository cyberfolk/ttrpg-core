// Seed dei ritratti del dataset d'esempio: i byte dei file in `assets/personaggi/`
// vengono caricati nel PhotoBlobStore (IndexedDB) quando si preme «Carica dati
// d'esempio». I metadati foto (`photos[]`) e gli `avatarPhotoId` vivono già nel
// dataset; qui si colma il solo pezzo mancante — i byte — che l'export JSON non
// porta (vedi ADR 0005). Best-effort: un file mancante non blocca gli altri.

import { prepareImage } from '../store/prepareImage.js';

// Vite raccoglie gli URL degli asset a build-time. Se la cartella è vuota, la
// mappa è {} e il seed non fa nulla (nessun errore).
const portraitUrls = import.meta.glob(
  '../../assets/personaggi/*.{jpg,jpeg,png,webp}',
  { eager: true, query: '?url', import: 'default' },
);

// Personaggio (id stabile del dataset FR) → slug del file ritratto.
const CHAR_PORTRAIT_SLUG = {
  'd0000000-0000-4000-8000-000000000001': 'drizzt',
  'd0000000-0000-4000-8000-000000000002': 'bruenor',
  'd0000000-0000-4000-8000-000000000003': 'catti-brie',
  'd0000000-0000-4000-8000-000000000004': 'wulfgar',
  'd0000000-0000-4000-8000-000000000005': 'regis',
  'd0000000-0000-4000-8000-000000000006': 'jarlaxle',
  'd0000000-0000-4000-8000-000000000007': 'entreri',
  'd0000000-0000-4000-8000-000000000008': 'elminster',
  'd0000000-0000-4000-8000-000000000009': 'khelben',
  'd0000000-0000-4000-8000-00000000000a': 'laeral',
  'd0000000-0000-4000-8000-00000000000b': 'manshoon',
  'd0000000-0000-4000-8000-00000000000c': 'fzoul',
  'd0000000-0000-4000-8000-00000000000d': 'szass-tam',
  'd0000000-0000-4000-8000-00000000000e': 'volo',
  'd0000000-0000-4000-8000-00000000000f': 'minsc',
};

function urlForSlug(slug) {
  const entry = Object.entries(portraitUrls).find(([path]) => {
    const file = path.split('/').pop() || '';
    const base = file.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const match = base === slug;
    return match;
  });
  const url = entry ? entry[1] : null;
  return url;
}

// Carica in `blobStore` i byte dei ritratti presenti in assets/ per le foto del
// dataset. Ritorna un riepilogo { ok, skipped }. Non lancia: best-effort.
export async function seedSamplePhotos(state, blobStore) {
  const result = { ok: 0, skipped: 0 };
  const photos = Array.isArray(state.photos) ? state.photos : [];
  for (const photo of photos) {
    const slug = CHAR_PORTRAIT_SLUG[photo.entityId];
    const url = slug ? urlForSlug(slug) : null;
    if (!url) {
      result.skipped += 1;
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) {
        result.skipped += 1;
        continue;
      }
      const raw = await res.blob();
      // Ridimensiona/ricomprime come un upload di galleria (stessa pipeline);
      // se la codifica canvas fallisce, ripiega sui byte grezzi (best-effort).
      let toStore = raw;
      try {
        toStore = await prepareImage(raw, { maxLong: 640, quality: 0.82 });
      } catch {
        toStore = raw;
      }
      await blobStore.put(photo.id, toStore);
      result.ok += 1;
    } catch {
      result.skipped += 1;
    }
  }
  return result;
}
