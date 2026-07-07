# Galleria foto per entità — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere a personaggi e gruppi una tab Galleria con foto+metadati; una foto può diventare avatar del profilo, in modo reciproco e coerente; tutto client-side, byte in IndexedDB dietro un'interfaccia sostituibile col server.

**Architecture:** Metadati foto come oggetti piani nel MODEL (array top-level `photos`), avatar come puntatore (`avatarPhotoId` sull'entità). I byte vivono solo nello STORE dietro `PhotoBlobStore` (impl IndexedDB oggi, `fetch` server domani). Reciprocità = conseguenza delle funzioni pure, non codice extra.

**Tech Stack:** JS ESM (no TypeScript), Vue 3 + Vite (solo VIEW), `node:test`/`node:assert` per MODEL/STORE/IO, IndexedDB per i blob, `<canvas>` per il resize.

## Global Constraints

- **3 layer, dipendenze solo verso il basso** `VIEW → STORE → MODEL`. MODEL/STORE framework-agnostici (nessun `window`/`document` nel MODEL; il resize `<canvas>` e IndexedDB stanno nello STORE/VIEW, mai nel MODEL).
- **Logica di reputazione/dati solo nel MODEL**; VIEW e STORE non la duplicano.
- **Persistenza solo nello STORE.** localStorage per il JSON di stato; IndexedDB per i byte foto, sempre dietro lo STORE.
- **Avatar = puntatore**, mai copia dei byte. Fonte byte unica.
- **Stile codice utente:** mai `return <espressione>` diretto — prima assegnare a variabile con nome, poi ritornare la variabile (già lo stile del codebase).
- **Commit:** `git add` solo dei file specifici (mai `-A`/`.`); messaggio `[TAG] Titolo`. Tag per questo lavoro: `[FEAT]` per codice, `[DOCS]` per documentazione. Nessun trailer `Co-Authored-By`.
- **Test discovery:** `npm test` (= `node --test`, auto-discovery `tests/**/*.test.js`). Singolo file: `node --test tests/<nome>.test.js` (mai la forma directory).
- **Grafica:** prima di implementare la VIEW (Task 5) invocare la skill `impeccable` (direttiva grafica di progetto).
- **Schema:** `SCHEMA_VERSION` passa da **3 a 4**. Bumparla romperà i test esistenti che asseriscono `version === 3`: vanno aggiornati nella stessa task che bumpa (Task 3).

---

## File Structure

- `src/model/schema.js` — *modifica*: `SCHEMA_VERSION = 4`, `createPhoto()`, `photos: []` in `createState()`, `avatarPhotoId: null` in `createCharacter`/`createGroup`.
- `src/model/photos.js` — *nuovo*: funzioni pure `addPhoto`/`removePhoto`/`setAvatar`/`clearAvatar`/`updatePhotoMeta`.
- `src/store/io.js` — *modifica*: serializza `photos`, migrazione v4, validazione foto+avatar.
- `src/store/photoBlobStore.js` — *nuovo*: `memoryBlobStore()` (test) + `indexedDbBlobStore()` (browser). Il seam per il server.
- `src/store/prepareImage.js` — *nuovo*: `computeResizeDims()` (puro, testabile) + `prepareImage()` (canvas, browser).
- `src/view/photoStore.js` — *nuovo*: singleton blob store per la VIEW (IndexedDB).
- `src/view/usePhotoUrl.js` — *nuovo*: composable blob→objectURL con revoca.
- `src/view/components/Gallery.vue` — *nuovo*: pannello tab condiviso (personaggio/gruppo).
- `src/view/components/ProfileView.vue` · `GroupProfileView.vue` — *modifica*: tab Galleria.
- `src/view/components/EntitySheet.vue` — *modifica*: avatar in testata (confermare che è la testata anagrafica condivisa).
- `tests/photos.test.js` · `tests/io-v4.test.js` · `tests/photo-blob-store.test.js` · `tests/prepare-image.test.js` — *nuovi*.
- Docs: `docs/requisiti-funzionali/01,03,04,05` + `docs/architettura.md` + `docs/ADR/0005-*.md`.

---

## Task 1: Schema — tipo Photo, campo avatar, bump versione

**Files:**
- Modify: `src/model/schema.js`
- Test: `tests/photos.test.js` (creato qui, esteso in Task 2)

**Interfaces:**
- Produces:
  - `SCHEMA_VERSION === 4`
  - `createPhoto(entityId, meta = {})` → `{ id, entityId, caption, description, tagIds, createdAt }`
  - `createState()` include `photos: []`
  - `createCharacter(name)` e `createGroup(name, type)` includono `avatarPhotoId: null`

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/photos.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA_VERSION, createState, createPhoto, createCharacter, createGroup,
} from '../src/model/schema.js';

test('SCHEMA_VERSION è 4', () => {
  assert.equal(SCHEMA_VERSION, 4);
});

test('createState ha photos vuoto', () => {
  const s = createState();
  assert.deepEqual(s.photos, []);
});

test('createPhoto ha la forma attesa e default vuoti', () => {
  const p = createPhoto('e1');
  assert.equal(typeof p.id, 'string');
  assert.ok(p.id.length > 0);
  assert.equal(p.entityId, 'e1');
  assert.equal(p.caption, '');
  assert.equal(p.description, '');
  assert.deepEqual(p.tagIds, []);
  assert.equal(typeof p.createdAt, 'number');
});

test('createPhoto applica i meta passati', () => {
  const p = createPhoto('e1', { caption: 'ciao', description: 'lungo', tagIds: ['t1'] });
  assert.equal(p.caption, 'ciao');
  assert.equal(p.description, 'lungo');
  assert.deepEqual(p.tagIds, ['t1']);
});

test('createCharacter e createGroup partono con avatarPhotoId null', () => {
  assert.equal(createCharacter('A').avatarPhotoId, null);
  assert.equal(createGroup('G', 'fazione').avatarPhotoId, null);
});
```

- [ ] **Step 2: Esegui il test, verifica il fallimento**

Run: `node --test tests/photos.test.js`
Expected: FAIL (`createPhoto` non esportato, `SCHEMA_VERSION` = 3, `photos`/`avatarPhotoId` undefined).

- [ ] **Step 3: Implementa in `src/model/schema.js`**

Cambia la costante di versione:

```js
export const SCHEMA_VERSION = 4;
```

In `createState`, aggiungi `photos: []` all'oggetto stato (accanto a `transactions: []`):

```js
export function createState() {
  const state = {
    version: SCHEMA_VERSION,
    characters: [],
    transactions: [],
    groups: [],
    photos: [],
    tags: [],
    players: [],
    races: [],
    classes: [],
  };
  return state;
}
```

Aggiungi `avatarPhotoId: null` in `createGroup` (accanto a `notes: ''`) e in `createCharacter` (accanto a `notes: ''`). Poi aggiungi il costruttore Photo:

```js
export function createPhoto(entityId, meta = {}) {
  const photo = {
    id: newId(),
    entityId,
    caption: meta.caption ?? '',
    description: meta.description ?? '',
    tagIds: meta.tagIds ?? [],
    createdAt: Date.now(),
  };
  return photo;
}
```

- [ ] **Step 4: Esegui il test, verifica il pass**

Run: `node --test tests/photos.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/schema.js tests/photos.test.js
git commit -m "[FEAT] Schema v4: tipo Photo, avatarPhotoId, photos[] nello stato"
```

---

## Task 2: MODEL — funzioni pure su foto e avatar

**Files:**
- Create: `src/model/photos.js`
- Test: `tests/photos.test.js` (estende Task 1)

**Interfaces:**
- Consumes: `createPhoto` (schema.js).
- Produces (tutte pure, ritornano un nuovo stato, non mutano l'input):
  - `addPhoto(state, entityId, meta) -> state` (aggiunge una Photo a `state.photos`)
  - `removePhoto(state, photoId) -> state` (rimuove la Photo; **cascata**: ogni character/group con `avatarPhotoId === photoId` torna a `null`)
  - `setAvatar(state, entityId, photoId) -> state` (imposta `avatarPhotoId` sull'entità char o group con quell'id)
  - `clearAvatar(state, entityId) -> state` (azzera `avatarPhotoId`; la Photo resta)
  - `updatePhotoMeta(state, photoId, patch) -> state` (merge di `{caption?, description?, tagIds?}`)
  - `listPhotos(state, entityId) -> Photo[]` (foto dell'entità, ordinate per `createdAt` crescente)

- [ ] **Step 1: Scrivi i test che falliscono**

Aggiungi in fondo a `tests/photos.test.js`:

```js
import {
  addPhoto, removePhoto, setAvatar, clearAvatar, updatePhotoMeta, listPhotos,
} from '../src/model/photos.js';

function withEntities() {
  const s0 = createState();
  const c = createCharacter('Aragorn');
  const g = createGroup('Compagnia', 'fazione');
  const s1 = { ...s0, characters: [c], groups: [g] };
  return { state: s1, charId: c.id, groupId: g.id };
}

test('addPhoto aggiunge una foto legata all entità, senza mutare l originale', () => {
  const { state, charId } = withEntities();
  const next = addPhoto(state, charId, { caption: 'ritratto' });
  assert.equal(next.photos.length, 1);
  assert.equal(next.photos[0].entityId, charId);
  assert.equal(next.photos[0].caption, 'ritratto');
  assert.equal(state.photos.length, 0);
});

test('setAvatar punta l avatar del personaggio a una foto; clearAvatar lo azzera lasciando la foto', () => {
  const { state, charId } = withEntities();
  let s = addPhoto(state, charId, {});
  const pid = s.photos[0].id;
  s = setAvatar(s, charId, pid);
  assert.equal(s.characters[0].avatarPhotoId, pid);
  s = clearAvatar(s, charId);
  assert.equal(s.characters[0].avatarPhotoId, null);
  assert.equal(s.photos.length, 1); // la foto resta in galleria
});

test('setAvatar funziona anche sui gruppi', () => {
  const { state, groupId } = withEntities();
  let s = addPhoto(state, groupId, {});
  const pid = s.photos[0].id;
  s = setAvatar(s, groupId, pid);
  assert.equal(s.groups[0].avatarPhotoId, pid);
});

test('removePhoto elimina la foto e azzera a cascata l avatar che la puntava', () => {
  const { state, charId } = withEntities();
  let s = addPhoto(state, charId, {});
  const pid = s.photos[0].id;
  s = setAvatar(s, charId, pid);
  s = removePhoto(s, pid);
  assert.equal(s.photos.length, 0);
  assert.equal(s.characters[0].avatarPhotoId, null);
});

test('updatePhotoMeta fa il merge dei soli campi passati', () => {
  const { state, charId } = withEntities();
  let s = addPhoto(state, charId, { caption: 'a', description: 'b' });
  const pid = s.photos[0].id;
  s = updatePhotoMeta(s, pid, { caption: 'nuovo' });
  assert.equal(s.photos[0].caption, 'nuovo');
  assert.equal(s.photos[0].description, 'b');
});

test('listPhotos ritorna solo le foto dell entità ordinate per createdAt', () => {
  const { state, charId, groupId } = withEntities();
  let s = addPhoto(state, charId, { caption: 'x' });
  s = addPhoto(s, groupId, { caption: 'y' });
  const only = listPhotos(s, charId);
  assert.equal(only.length, 1);
  assert.equal(only[0].caption, 'x');
});
```

- [ ] **Step 2: Esegui il test, verifica il fallimento**

Run: `node --test tests/photos.test.js`
Expected: FAIL (`../src/model/photos.js` inesistente).

- [ ] **Step 3: Implementa `src/model/photos.js`**

```js
import { createPhoto } from './schema.js';

export function addPhoto(state, entityId, meta = {}) {
  const photo = createPhoto(entityId, meta);
  const next = { ...state, photos: [...state.photos, photo] };
  return next;
}

function setEntityAvatar(state, entityId, photoId) {
  const characters = state.characters.map((c) => {
    if (c.id !== entityId) {
      return c;
    }
    const updated = { ...c, avatarPhotoId: photoId };
    return updated;
  });
  const groups = state.groups.map((g) => {
    if (g.id !== entityId) {
      return g;
    }
    const updated = { ...g, avatarPhotoId: photoId };
    return updated;
  });
  const next = { ...state, characters, groups };
  return next;
}

export function setAvatar(state, entityId, photoId) {
  const next = setEntityAvatar(state, entityId, photoId);
  return next;
}

export function clearAvatar(state, entityId) {
  const next = setEntityAvatar(state, entityId, null);
  return next;
}

export function removePhoto(state, photoId) {
  const photos = state.photos.filter((p) => p.id !== photoId);
  const characters = state.characters.map((c) => {
    const wasAvatar = c.avatarPhotoId === photoId;
    if (!wasAvatar) {
      return c;
    }
    const updated = { ...c, avatarPhotoId: null };
    return updated;
  });
  const groups = state.groups.map((g) => {
    const wasAvatar = g.avatarPhotoId === photoId;
    if (!wasAvatar) {
      return g;
    }
    const updated = { ...g, avatarPhotoId: null };
    return updated;
  });
  const next = { ...state, photos, characters, groups };
  return next;
}

export function updatePhotoMeta(state, photoId, patch) {
  const photos = state.photos.map((p) => {
    if (p.id !== photoId) {
      return p;
    }
    const updated = { ...p, ...patch };
    return updated;
  });
  const next = { ...state, photos };
  return next;
}

export function listPhotos(state, entityId) {
  const list = state.photos
    .filter((p) => p.entityId === entityId)
    .sort((a, b) => a.createdAt - b.createdAt);
  return list;
}
```

- [ ] **Step 4: Esegui il test, verifica il pass**

Run: `node --test tests/photos.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/photos.js tests/photos.test.js
git commit -m "[FEAT] MODEL foto: addPhoto/removePhoto(cascata)/setAvatar/clearAvatar/updatePhotoMeta"
```

---

## Task 3: IO — serializzazione, migrazione v4, validazione foto/avatar

**Files:**
- Modify: `src/store/io.js`
- Modify (fix asserzioni versione): `tests/io-v3.test.js` e ogni altro test che asserisce `version === 3`
- Test: `tests/io-v4.test.js` (nuovo)

**Interfaces:**
- Consumes: `SCHEMA_VERSION` (=4).
- Produces: `serializeState` include `photos`; `migrate` porta a v4 (backfill `photos: []`, `avatarPhotoId: null`); `validateState` verifica foto e avatar; `parseImport` include `photos`.

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/io-v4.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, serializeState, parseImport, validateState } from '../src/store/io.js';

function v3State() {
  const data = {
    version: 3,
    characters: [{ id: 'c1', name: 'A', deletedAt: null, isPg: false, raceId: null,
      classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
    groups: [{ id: 'g1', name: 'G', type: 'fazione', memberIds: [], deletedAt: null,
      seat: '', guideId: null, motto: '', tagIds: [], notes: '' }],
    transactions: [], tags: [], players: [], races: [], classes: [],
  };
  return data;
}

test('migrate v3→v4 aggiunge photos e avatarPhotoId, bumpa la versione', () => {
  const m = migrate(v3State());
  assert.equal(m.version, 4);
  assert.deepEqual(m.photos, []);
  assert.equal(m.characters[0].avatarPhotoId, null);
  assert.equal(m.groups[0].avatarPhotoId, null);
});

test('migrate non sovrascrive avatarPhotoId già presente', () => {
  const data = v3State();
  data.photos = [{ id: 'p1', entityId: 'c1', caption: '', description: '', tagIds: [], createdAt: 1 }];
  data.characters[0].avatarPhotoId = 'p1';
  const m = migrate(data);
  assert.equal(m.characters[0].avatarPhotoId, 'p1');
});

test('serialize→parse round-trip conserva le foto', () => {
  const data = v3State();
  data.photos = [{ id: 'p1', entityId: 'c1', caption: 'x', description: '', tagIds: [], createdAt: 1 }];
  const state = parseImport(serializeState(migrate(data)));
  assert.equal(state.photos.length, 1);
  assert.equal(state.photos[0].id, 'p1');
});

test('validateState rifiuta una foto con entityId inesistente', () => {
  const m = migrate(v3State());
  m.photos = [{ id: 'p1', entityId: 'MANCA', caption: '', description: '', tagIds: [], createdAt: 1 }];
  assert.throws(() => validateState(m), /foto|photo|nodo/i);
});

test('validateState rifiuta avatarPhotoId che non esiste tra le foto', () => {
  const m = migrate(v3State());
  m.characters[0].avatarPhotoId = 'p-fantasma';
  assert.throws(() => validateState(m), /avatar/i);
});

test('validateState rifiuta un avatar che punta a una foto di un altra entità', () => {
  const m = migrate(v3State());
  m.photos = [{ id: 'p1', entityId: 'g1', caption: '', description: '', tagIds: [], createdAt: 1 }];
  m.characters[0].avatarPhotoId = 'p1'; // p1 è del gruppo, non del personaggio
  assert.throws(() => validateState(m), /avatar/i);
});
```

- [ ] **Step 2: Esegui il test, verifica il fallimento**

Run: `node --test tests/io-v4.test.js`
Expected: FAIL (migrate non produce `version 4`/`photos`; validazione avatar assente).

- [ ] **Step 3: Implementa in `src/store/io.js`**

In `serializeState`, aggiungi `photos: state.photos,` al payload (dopo `groups`).

Aggiungi `avatarPhotoId: null` a entrambi i default:

```js
const CHARACTER_DEFAULTS = {
  isPg: false, raceId: null, classLevels: [], alignment: '',
  playerId: null, tagIds: [], notes: '', avatarPhotoId: null,
};
const GROUP_DEFAULTS = {
  seat: '', guideId: null, motto: '', tagIds: [], notes: '', avatarPhotoId: null,
};
```

In `migrate`, aggiungi il backfill di `photos` e includilo nell'oggetto migrato:

```js
export function migrate(data) {
  const groups = Array.isArray(data.groups) ? data.groups : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const players = Array.isArray(data.players) ? data.players : [];
  const races = Array.isArray(data.races) ? data.races : [];
  const classes = Array.isArray(data.classes) ? data.classes : [];
  const photos = Array.isArray(data.photos) ? data.photos : [];
  const characters = (data.characters || []).map((c) => withDefaults(c, CHARACTER_DEFAULTS));
  const migratedGroups = groups.map((g) => withDefaults(g, GROUP_DEFAULTS));
  const migrated = {
    ...data,
    characters,
    groups: migratedGroups,
    photos,
    tags,
    players,
    races,
    classes,
    version: SCHEMA_VERSION,
  };
  return migrated;
}
```

In `validateState`, dopo il blocco di validazione dei gruppi (dopo la riga `}` che chiude il `for (const g of data.groups)` dei tag), aggiungi la validazione foto+avatar. `nodeIds` è già calcolato più in alto; riusalo:

```js
  if (!Array.isArray(data.photos)) {
    throw new Error('Stato non valido: photos mancante');
  }
  const photoById = new Map();
  for (const p of data.photos) {
    const validId = typeof p.id === 'string' && p.id.length > 0;
    const validEntity = typeof p.entityId === 'string' && nodeIds.has(p.entityId);
    const validCaption = typeof p.caption === 'string';
    const validDesc = typeof p.description === 'string';
    const validTags = Array.isArray(p.tagIds) && p.tagIds.every((tid) => tagIdSet.has(tid));
    const validCreatedAt = typeof p.createdAt === 'number';
    if (!validId || !validCaption || !validDesc || !validTags || !validCreatedAt) {
      throw new Error(`Foto non valida: campi mancanti o errati (${JSON.stringify(p)})`);
    }
    if (!validEntity) {
      throw new Error(`Foto ${p.id}: entityId punta a un nodo inesistente`);
    }
    photoById.set(p.id, p);
  }
  const checkAvatar = (entity) => {
    if (entity.avatarPhotoId === null || entity.avatarPhotoId === undefined) {
      return;
    }
    const photo = photoById.get(entity.avatarPhotoId);
    if (!photo) {
      throw new Error(`Entità ${entity.id}: avatarPhotoId punta a una foto inesistente`);
    }
    if (photo.entityId !== entity.id) {
      throw new Error(`Entità ${entity.id}: avatar punta a una foto di un'altra entità`);
    }
  };
  for (const c of data.characters) {
    checkAvatar(c);
  }
  for (const g of data.groups) {
    checkAvatar(g);
  }
```

In `parseImport`, aggiungi `photos: migrated.photos,` all'oggetto `state` ritornato (dopo `groups`).

- [ ] **Step 4: Aggiorna i test esistenti rotti dal bump di versione**

Esegui l'intera suite per scoprire i test che asserivano `version === 3`:

Run: `npm test`
Expected: falliscono asserzioni in `tests/io-v3.test.js` (e possibilmente `io.test.js`, `store.test.js`, `import-legacy.test.js`).

Per ciascun fallimento dovuto alla versione: aggiorna l'asserzione da `3` a `4`. In `tests/io-v3.test.js`, nel test «migrate v2 aggiunge i pool…» cambia `assert.equal(m.version, 3)` in `assert.equal(m.version, 4)` e aggiungi:

```js
  assert.deepEqual(m.photos, []);
  assert.equal(m.characters[0].avatarPhotoId, null);
  assert.equal(m.groups[0].avatarPhotoId, null);
```

Non modificare la logica testata, solo le attese di versione/shape. Ripeti finché `npm test` è verde.

- [ ] **Step 5: Esegui la suite completa**

Run: `npm test`
Expected: PASS (inclusi `io-v4` e i test aggiornati).

- [ ] **Step 6: Commit**

```bash
git add src/store/io.js tests/io-v4.test.js tests/io-v3.test.js
git commit -m "[FEAT] IO v4: serializza/migra photos e avatarPhotoId, valida integrità avatar"
```

(Aggiungi al `git add` anche gli altri file di test toccati allo Step 4, se presenti.)

---

## Task 4: STORE — blob store e preparazione immagine

**Files:**
- Create: `src/store/photoBlobStore.js`
- Create: `src/store/prepareImage.js`
- Test: `tests/photo-blob-store.test.js`, `tests/prepare-image.test.js`

**Interfaces:**
- Produces:
  - `memoryBlobStore() -> { put(id, blob): Promise<void>, get(id): Promise<Blob|null>, delete(id): Promise<void> }`
  - `indexedDbBlobStore(dbName?) -> { put, get, delete }` (stessa forma; browser)
  - `computeResizeDims({ width, height }, maxLong) -> { width, height }` (puro; scala giù finché il lato lungo ≤ `maxLong`, mai upscaling)
  - `prepareImage(file, opts?) -> Promise<Blob>` (browser, `<canvas>`; usa `computeResizeDims`)

- [ ] **Step 1: Scrivi i test che falliscono**

`tests/prepare-image.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeResizeDims } from '../src/store/prepareImage.js';

test('non fa upscaling quando l immagine è più piccola del massimo', () => {
  const d = computeResizeDims({ width: 800, height: 600 }, 1600);
  assert.deepEqual(d, { width: 800, height: 600 });
});

test('scala giù mantenendo l aspect ratio (lato lungo orizzontale)', () => {
  const d = computeResizeDims({ width: 3200, height: 1600 }, 1600);
  assert.deepEqual(d, { width: 1600, height: 800 });
});

test('scala giù quando il lato lungo è verticale', () => {
  const d = computeResizeDims({ width: 1000, height: 4000 }, 1600);
  assert.deepEqual(d, { width: 400, height: 1600 });
});
```

`tests/photo-blob-store.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryBlobStore } from '../src/store/photoBlobStore.js';

test('put/get round-trip', async () => {
  const store = memoryBlobStore();
  const blob = { fake: 'blob' };
  await store.put('p1', blob);
  const got = await store.get('p1');
  assert.equal(got, blob);
});

test('get di una chiave assente ritorna null', async () => {
  const store = memoryBlobStore();
  const got = await store.get('nada');
  assert.equal(got, null);
});

test('delete rimuove il blob', async () => {
  const store = memoryBlobStore();
  await store.put('p1', { a: 1 });
  await store.delete('p1');
  const got = await store.get('p1');
  assert.equal(got, null);
});
```

- [ ] **Step 2: Esegui i test, verifica il fallimento**

Run: `node --test tests/prepare-image.test.js tests/photo-blob-store.test.js`
Expected: FAIL (moduli inesistenti).

- [ ] **Step 3: Implementa `src/store/prepareImage.js`**

```js
// computeResizeDims è puro e testabile; prepareImage usa <canvas> (solo browser).
export function computeResizeDims({ width, height }, maxLong) {
  const longSide = Math.max(width, height);
  if (longSide <= maxLong) {
    const same = { width, height };
    return same;
  }
  const scale = maxLong / longSide;
  const dims = { width: Math.round(width * scale), height: Math.round(height * scale) };
  return dims;
}

// Ridimensiona e ricomprime un File immagine in un Blob (WebP, fallback JPEG).
// Solo browser: usa createImageBitmap/<canvas>. Non coperto da node:test.
export async function prepareImage(file, opts = {}) {
  const maxLong = opts.maxLong ?? 1600;
  const quality = opts.quality ?? 0.85;
  const bitmap = await createImageBitmap(file);
  const dims = computeResizeDims({ width: bitmap.width, height: bitmap.height }, maxLong);
  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, dims.width, dims.height);
  const type = 'image/webp';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  const out = blob ?? await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  return out;
}
```

- [ ] **Step 4: Implementa `src/store/photoBlobStore.js`**

```js
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
```

- [ ] **Step 5: Esegui i test, verifica il pass**

Run: `node --test tests/prepare-image.test.js tests/photo-blob-store.test.js`
Expected: PASS (i test coprono `computeResizeDims` e `memoryBlobStore`; `prepareImage`/`indexedDbBlobStore` si verificano nel browser al Task 5).

- [ ] **Step 6: Commit**

```bash
git add src/store/photoBlobStore.js src/store/prepareImage.js tests/photo-blob-store.test.js tests/prepare-image.test.js
git commit -m "[FEAT] STORE: PhotoBlobStore (memory+IndexedDB) e prepareImage (resize canvas)"
```

---

## Task 5: VIEW — tab Galleria, avatar in testata, upload

**Grafica:** invocare la skill `impeccable` PRIMA di scrivere il markup/CSS di `Gallery.vue` e dell'avatar. Il codice sotto è lo scheletro funzionale (wiring store, upload, azioni); la resa visiva (griglia, miniature, stati vuoti, avatar) la definisce `impeccable`.

**Files:**
- Create: `src/view/photoStore.js`, `src/view/usePhotoUrl.js`, `src/view/components/Gallery.vue`
- Modify: `src/view/components/ProfileView.vue`, `src/view/components/GroupProfileView.vue`, `src/view/components/EntitySheet.vue`
- Verifica: manuale nel browser (dev server sull'utente, porta 5173 — **non** avviarne uno tuo)

**Interfaces:**
- Consumes: `addPhoto`/`removePhoto`/`setAvatar`/`clearAvatar`/`updatePhotoMeta`/`listPhotos` (MODEL), `prepareImage` + `indexedDbBlobStore` (STORE), `useStore` (VIEW).
- Produces: singleton `photoBlobStore` (VIEW), composable `usePhotoUrl`, componente `Gallery.vue` con prop `{ kind, entity }`.

- [ ] **Step 1: Conferma la testata condivisa**

Verifica quale componente rende la testata anagrafica dei profili (atteso: `src/view/components/EntitySheet.vue`, importato da `ProfileView.vue` e `GroupProfileView.vue`). L'avatar va lì. Se la testata è altrove, adatta il path in questa task.

- [ ] **Step 2: Crea il singleton blob store `src/view/photoStore.js`**

```js
import { indexedDbBlobStore } from '../store/photoBlobStore.js';

export const photoBlobStore = indexedDbBlobStore();
```

- [ ] **Step 3: Crea il composable `src/view/usePhotoUrl.js`**

```js
import { ref, watch, onUnmounted } from 'vue';
import { photoBlobStore } from './photoStore.js';

// Risolve un photoId in un object URL utilizzabile in <img :src>. Revoca l URL
// precedente a ogni cambio e allo smontaggio: nessun memory leak.
export function usePhotoUrl(photoIdRef) {
  const url = ref(null);

  function revoke() {
    if (url.value) {
      URL.revokeObjectURL(url.value);
      url.value = null;
    }
  }

  async function load(id) {
    revoke();
    if (!id) {
      return;
    }
    const blob = await photoBlobStore.get(id);
    if (blob) {
      url.value = URL.createObjectURL(blob);
    }
  }

  watch(photoIdRef, (id) => { load(id); }, { immediate: true });
  onUnmounted(revoke);

  return url;
}
```

- [ ] **Step 4: Crea `Gallery.vue` (scheletro funzionale — la resa la rifinisce `impeccable`)**

```vue
<template>
  <div class="gallery">
    <label class="gallery__upload ds-btn ds-btn--sm">
      <input type="file" accept="image/*" multiple hidden @change="onPick" />
      Aggiungi foto
    </label>

    <p v-if="photos.length === 0" class="gallery__empty">Nessuna foto. Aggiungine una.</p>

    <ul v-else class="gallery__grid">
      <li v-for="p in photos" :key="p.id" class="gallery__item"
          :class="{ 'gallery__item--avatar': p.id === entity.avatarPhotoId }">
        <GalleryThumb :photo="p" />
        <input class="ds-input" :value="p.caption"
               @change="(e) => updateMeta(p.id, { caption: e.target.value })" placeholder="Didascalia" />
        <div class="gallery__actions">
          <button v-if="p.id !== entity.avatarPhotoId" type="button"
                  class="ds-btn ds-btn--sm" @click="makeAvatar(p.id)">Imposta come profilo</button>
          <button v-else type="button" class="ds-btn ds-btn--sm ds-btn--secondary"
                  @click="dropAvatar()">Rimuovi dal profilo</button>
          <button type="button" class="ds-btn ds-btn--sm ds-btn--danger"
                  @click="remove(p.id)">Elimina</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from '../useStore.js';
import { photoBlobStore } from '../photoStore.js';
import { prepareImage } from '../../store/prepareImage.js';
import {
  addPhoto, removePhoto, setAvatar, clearAvatar, updatePhotoMeta, listPhotos,
} from '../../model/photos.js';
import GalleryThumb from './GalleryThumb.vue';

const props = defineProps({
  kind: { type: String, required: true },   // 'character' | 'group' (parità con Notes.vue)
  entity: { type: Object, required: true },
});

const { state, dispatch, getState } = useStore();

const photos = computed(() => listPhotos(state.value, props.entity.id));

async function onPick(e) {
  const files = Array.from(e.target.files || []);
  for (const file of files) {
    const blob = await prepareImage(file);
    // 1) crea il metadato, 2) recupera l id appena creato, 3) salva il blob con quell id.
    const before = new Set(getState().photos.map((p) => p.id));
    dispatch((s) => addPhoto(s, props.entity.id, {}));
    const created = getState().photos.find((p) => !before.has(p.id));
    await photoBlobStore.put(created.id, blob);
  }
  e.target.value = '';
}

function makeAvatar(photoId) {
  const id = props.entity.id;
  dispatch((s) => setAvatar(s, id, photoId));
}
function dropAvatar() {
  const id = props.entity.id;
  dispatch((s) => clearAvatar(s, id));
}
async function remove(photoId) {
  dispatch((s) => removePhoto(s, photoId));
  await photoBlobStore.delete(photoId);
}
function updateMeta(photoId, patch) {
  dispatch((s) => updatePhotoMeta(s, photoId, patch));
}
</script>
```

Crea anche `src/view/components/GalleryThumb.vue` (rende una singola miniatura via `usePhotoUrl`):

```vue
<template>
  <img v-if="url" :src="url" :alt="photo.caption" class="gallery__thumb" />
  <span v-else class="gallery__thumb gallery__thumb--empty" aria-hidden="true"></span>
</template>

<script setup>
import { toRef } from 'vue';
import { usePhotoUrl } from '../usePhotoUrl.js';

const props = defineProps({ photo: { type: Object, required: true } });
const url = usePhotoUrl(toRef(() => props.photo.id));
</script>
```

- [ ] **Step 5: Aggiungi la tab in `ProfileView.vue`**

Nel gruppo dei bottoni tab (dopo il bottone `groups`), aggiungi:

```html
<button class="ds-seg__btn" :class="{ active: tab === 'gallery' }" @click="tab = 'gallery'">
  Galleria
</button>
```

Nel corpo dei pannelli, accanto agli altri `v-if`:

```html
<Gallery v-if="tab === 'gallery'" :key="character.id + '-gallery'" kind="character" :entity="character" />
```

E importa il componente nello `<script setup>`:

```js
import Gallery from './Gallery.vue';
```

- [ ] **Step 6: Aggiungi la tab in `GroupProfileView.vue`**

Analogo, usando l'entità gruppo:

```html
<button class="ds-seg__btn" :class="{ active: tab === 'gallery' }" @click="tab = 'gallery'">
  Galleria
</button>
```

```html
<Gallery v-if="tab === 'gallery'" :key="group.id + '-gallery'" kind="group" :entity="group" />
```

```js
import Gallery from './Gallery.vue';
```

(Adatta i nomi `character`/`group` alle variabili realmente usate nei due file.)

- [ ] **Step 7: Mostra l'avatar nella testata `EntitySheet.vue`**

Aggiungi, accanto al nome nella testata, la miniatura avatar (riusa `GalleryThumb` col photo id risolto, o `usePhotoUrl` direttamente). Esempio minimale con `usePhotoUrl`:

```html
<img v-if="avatarUrl" :src="avatarUrl" class="entity-sheet__avatar" :alt="`Avatar di ${entity.name}`" />
```

```js
import { toRef } from 'vue';
import { usePhotoUrl } from '../usePhotoUrl.js';
// entity è la prop già presente nella testata (personaggio o gruppo)
const avatarUrl = usePhotoUrl(toRef(() => props.entity.avatarPhotoId));
```

Se `avatarPhotoId` è `null`, `avatarUrl` resta `null` → mostra il placeholder che definirà `impeccable`.

- [ ] **Step 8: Verifica manuale nel browser**

Con il dev server dell'utente attivo (porta 5173; se non risponde, chiedi all'utente di avviarlo — non accenderne uno tuo), verifica su un profilo personaggio e su un gruppo:
1. Tab Galleria visibile; upload di un'immagine → compare la miniatura.
2. «Imposta come profilo» → l'avatar appare nella testata; il badge avatar marca la foto in galleria.
3. «Rimuovi dal profilo» → l'avatar sparisce dalla testata, la foto resta in galleria.
4. «Elimina» sulla foto avatar → sparisce da galleria e da testata (cascata).
5. Ricarica la pagina → foto e avatar persistono (IndexedDB + localStorage).
6. Didascalia modificata → persiste dopo il reload.

- [ ] **Step 9: Esegui la suite (nessuna regressione MODEL/STORE/IO)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/view/photoStore.js src/view/usePhotoUrl.js src/view/components/Gallery.vue src/view/components/GalleryThumb.vue src/view/components/ProfileView.vue src/view/components/GroupProfileView.vue src/view/components/EntitySheet.vue
git commit -m "[FEAT] VIEW: tab Galleria, avatar in testata, upload con resize e persistenza"
```

---

## Task 6: Documentazione + ADR 0005

**Files:**
- Modify: `docs/requisiti-funzionali/01-entita.md`, `03-viste-e-navigazione.md`, `04-flussi.md`, `05-dati-e-persistenza.md`
- Modify: `docs/architettura.md`, `docs/README.md` (tracker ADR)
- Create: `docs/ADR/0005-persistenza-binaria-photoblobstore.md`

- [ ] **Step 1: Aggiorna i requisiti funzionali**

- `01-entita.md`: aggiungi il campo `avatarPhotoId` a Personaggio e Gruppo, e descrivi il tipo `Photo` (`id`, `entityId`, `caption`, `description`, `tagIds`, `createdAt`) come entità legata a un nodo. Chiarisci che l'avatar è un **puntatore** a una foto, non una copia.
- `03-viste-e-navigazione.md`: aggiungi la **tab Galleria** ai profili personaggio e gruppo.
- `04-flussi.md`: aggiungi i flussi foto — aggiungi/elimina foto, «Imposta come profilo», «Rimuovi dal profilo», e le regole di reciprocità (aggiungi dal profilo→galleria; elimina foto→via da profilo a cascata; rimuovi avatar→foto resta).
- `05-dati-e-persistenza.md`: schema **v4** (`photos[]` + `avatarPhotoId`, con esempio JSON), migrazione v3→v4, byte in **IndexedDB** (non nel JSON), export foto separato (opzionale, Task 7), seed demo via asset.

- [ ] **Step 2: Aggiorna l'architettura**

- `docs/architettura.md`: in «Mappa file» aggiungi `src/model/photos.js`, `src/store/photoBlobStore.js`, `src/store/prepareImage.js`, `src/view/usePhotoUrl.js`, `Gallery.vue`. Nota che IndexedDB è un secondo canale di persistenza, sempre confinato allo STORE.

- [ ] **Step 3: Scrivi l'ADR 0005**

Crea `docs/ADR/0005-persistenza-binaria-photoblobstore.md` con struttura Contesto / Decisione / Conseguenze / Alternative / Quando rivedere. Nucleo: separare metadati (MODEL, riciclabili al 100%) dai byte (dietro `PhotoBlobStore`); impl IndexedDB oggi, `fetch` server domani = un solo file cambia; niente base64 in localStorage. Aggiorna il tracker ADR in `docs/README.md`.

- [ ] **Step 4: Commit**

```bash
git add docs/requisiti-funzionali/01-entita.md docs/requisiti-funzionali/03-viste-e-navigazione.md docs/requisiti-funzionali/04-flussi.md docs/requisiti-funzionali/05-dati-e-persistenza.md docs/architettura.md docs/README.md docs/ADR/0005-persistenza-binaria-photoblobstore.md
git commit -m "[DOCS] Galleria foto: requisiti, architettura, ADR 0005 (PhotoBlobStore)"
```

---

## Task 7 (opzionale, in coda): export foto .zip + seed demo con foto

Da fare solo se/quando serve. Non blocca il rilascio della galleria.

- **Esporta foto:** pulsante separato che impacchetta i blob di `state.photos` in un `.zip` (una lib zip client, es. valutata in fase di piano dedicata), indicizzati per `photoId`. Import speculare che ripopola IndexedDB. `log`ga eventuali foto senza blob.
- **Seed demo:** foto d'esempio come asset statici in `assets/`; un seeder le `fetch()`, le passa per `prepareImage`, e le mette in IndexedDB via `photoBlobStore.put`. Il JSON demo referenzia il path-asset in un campo usato **solo** al seed, mai negli export utente.

Questa task, quando affrontata, avrà il suo mini-piano TDD dedicato.

---

## Self-Review (svolto in fase di scrittura)

- **Copertura spec:** Photo+avatar (Task 1-2), reciprocità/cascata (Task 2), PhotoBlobStore seam (Task 4), resize (Task 4), Gallery+avatar VIEW (Task 5), export/import metadati+migrazione v4 (Task 3), export foto+seed (Task 7 opzionale), docs+ADR (Task 6). Tutte le sezioni dello spec hanno una task.
- **Placeholder:** nessuno; ogni step di codice mostra il codice.
- **Coerenza tipi:** `addPhoto/removePhoto/setAvatar/clearAvatar/updatePhotoMeta/listPhotos`, `avatarPhotoId`, `photoBlobStore.{put,get,delete}`, `computeResizeDims`, `prepareImage` usati con le stesse firme in tutte le task.
- **Rischio noto:** il bump `SCHEMA_VERSION` 3→4 rompe test esistenti; gestito esplicitamente nel Task 3 Step 4.
