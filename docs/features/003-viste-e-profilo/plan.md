# Feature 003 — Viste personaggi + profilo — Implementation Plan

> **STATO: COMPLETATO (2026-06-08)** — tutti i 15 task implementati (subagent-driven, doppia review per task), 36/36 test verdi, build pulita, mergiato in `main` e deployato su GitHub Pages. Restyle estetico ("tema grimorio") applicato in un passaggio successivo con la skill `frontend-design`. Documento storico: le checkbox `- [ ]` non sono mantenute aggiornate.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire la VIEW vanilla con un'app Vue 3 che offre elenco personaggi (gallery/list/matrix), profilo per-personaggio con reputazione in entrata/uscita, ricerca, ordinamento e gestione archivio — senza toccare MODEL/STORE.

**Architecture:** Tre layer invariati (`src/model` puro, `src/store` persistenza, `src/view` riscritto in Vue). La VIEW parla con lo STORE tramite un bridge sottile (`useStore`: `getState()` avvolto in un `ref`, scritture via `dispatch`). Stato UI (vista attiva, ricerca, ordinamento, toggle archivio) in memoria via un composable `reactive`. Routing vue-router in history mode con `404.html` per GitHub Pages. Unica aggiunta al MODEL: `averageIncomingScore`.

**Tech Stack:** Vue 3 (`<script setup>`), Vite, vue-router 4, `node:test` (solo MODEL), GitHub Actions + Pages.

**Riferimenti:** `docs/features/003-viste-e-profilo/spec.md`, `requisiti.md`, [[03-scelta-framework-frontend]].

---

## File Structure

**Nuovi (build/infra):**
- `vite.config.js` — config Vite + `base` path Pages
- `package.json` — aggiornato (deps Vue/Vite, scripts dev/build/preview)
- `index.html` — riscritto come entry Vite (`#app`)
- `scripts/copy-404.mjs` — postbuild: copia `dist/index.html` → `dist/404.html`
- `.github/workflows/deploy.yml` — build + deploy su Pages

**Nuovi (VIEW Vue) sotto `src/view/`:**
- `main.js` — createApp + router + mount, importa il CSS
- `router.js` — 4 rotte (redirect `/`, `/personaggi`, `/personaggio/:id`, catch-all)
- `useStore.js` — bridge store→ref (singleton)
- `useUiState.js` — stato UI reattivo in memoria
- `useDisplayedCharacters.js` — composable: lista personaggi filtrata+ordinata+con punteggio
- `scoreColor.js` — helper colore (estratto da `matrix.js`)
- `App.vue` — layout: header persistente + `<router-view>`
- `components/CharactersView.vue` — `/personaggi`: switcher + ricerca + ordinamento + add pg + vista attiva
- `components/GalleryView.vue` — griglia di `CharacterCard`
- `components/CharacterCard.vue` — card singola
- `components/ListView.vue` — tabella ordinabile
- `components/MatrixView.vue` — matrice (porting di `matrix.js`)
- `components/ProfileView.vue` — profilo: header + back + tab + modale
- `components/RelationList.vue` — lista relazioni del profilo (gesto doppio)
- `components/TransactionModal.vue` — modale transazioni (porting di `transactionPanel.js`)
- `components/NotFound.vue` — pagina "non trovato"

**Modificati:**
- `src/model/reputation.js` — aggiunta `averageIncomingScore`
- `scripts/tests/reputation.test.js` — test di `averageIncomingScore`
- `CLAUDE.md` — comando avvio (`npm run dev`) e versione schema

**Rimossi (fine migrazione VIEW):**
- `src/view/app.js`, `src/view/dom.js`, `src/view/matrix.js`, `src/view/toolbar.js`, `src/view/transactionPanel.js`

**Invariati:** tutto `src/model/` (tranne aggiunta), tutto `src/store/`, `styles/main.css` (ampliato in coda).

---

## Task 1: MODEL — `averageIncomingScore` (TDD)

**Files:**
- Modify: `src/model/reputation.js`
- Test: `scripts/tests/reputation.test.js`

- [ ] **Step 1: Scrivi i test che falliscono**

Aggiungi in coda a `scripts/tests/reputation.test.js`. Aggiorna anche la riga di import in cima al file per includere `averageIncomingScore`:

```js
import {
  clampView, computeScore, addCharacter, listActiveCharacters, addTransaction,
  editTransaction, deleteTransaction, listTransactions, softDeleteCharacter,
  restoreCharacter, hardDeleteCharacter, listArchivedCharacters, averageIncomingScore,
} from '../../src/model/reputation.js';
```

```js
function threeChars() {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  s = addCharacter(s, 'C');
  return s;
}

test('averageIncomingScore è null se nessuno ha transazioni verso il pg', () => {
  const s = threeChars();
  const a = s.characters[0];
  assert.equal(averageIncomingScore(s, a.id, false), null);
});

test('averageIncomingScore media solo i mittenti con almeno una transazione', () => {
  let s = threeChars();
  const [a, b, c] = s.characters;
  // B -> A: 50 + 10 = 60 ; C non ha transazioni verso A -> escluso
  s = addTransaction(s, b.id, a.id, 10, 'x');
  assert.equal(averageIncomingScore(s, a.id, false), 60);
});

test('averageIncomingScore fa la media su più mittenti', () => {
  let s = threeChars();
  const [a, b, c] = s.characters;
  s = addTransaction(s, b.id, a.id, 10, 'x'); // B->A = 60
  s = addTransaction(s, c.id, a.id, -30, 'y'); // C->A = 20
  assert.equal(averageIncomingScore(s, a.id, false), 40);
});

test('averageIncomingScore esclude mittenti archiviati quando includeArchived=false', () => {
  let s = threeChars();
  const [a, b, c] = s.characters;
  s = addTransaction(s, b.id, a.id, 10, 'x'); // B->A = 60
  s = addTransaction(s, c.id, a.id, -30, 'y'); // C->A = 20
  s = softDeleteCharacter(s, c.id); // C archiviato
  assert.equal(averageIncomingScore(s, a.id, false), 60); // solo B
});

test('averageIncomingScore include mittenti archiviati quando includeArchived=true', () => {
  let s = threeChars();
  const [a, b, c] = s.characters;
  s = addTransaction(s, b.id, a.id, 10, 'x'); // 60
  s = addTransaction(s, c.id, a.id, -30, 'y'); // 20
  s = softDeleteCharacter(s, c.id);
  assert.equal(averageIncomingScore(s, a.id, true), 40); // B e C
});

test('averageIncomingScore non considera il pg stesso come mittente', () => {
  let s = threeChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, a.id, 40, 'auto'); // ignorato (è X stesso)
  s = addTransaction(s, b.id, a.id, 10, 'x'); // 60
  assert.equal(averageIncomingScore(s, a.id, false), 60);
});
```

- [ ] **Step 2: Esegui i test, verifica che falliscano**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL — `averageIncomingScore is not a function` (o export mancante).

- [ ] **Step 3: Implementa la funzione**

Aggiungi in coda a `src/model/reputation.js`:

```js
export function averageIncomingScore(state, charId, includeArchived) {
  const pool = includeArchived
    ? state.characters
    : state.characters.filter((c) => c.deletedAt === null);
  const others = pool.filter((c) => c.id !== charId);
  const senders = others.filter((y) => sumHasTransaction(state, y.id, charId));
  if (senders.length === 0) {
    return null;
  }
  const total = senders.reduce((acc, y) => acc + computeScore(state, y.id, charId), 0);
  const average = Math.round(total / senders.length);
  return average;
}

function sumHasTransaction(state, fromId, toId) {
  const has = state.transactions.some((tx) => tx.fromId === fromId && tx.toId === toId);
  return has;
}
```

Nota: `averageIncomingScore` ritorna un intero arrotondato (`Math.round`) — coerente con i punteggi interi mostrati altrove. Il campo `delta` può rendere `computeScore` già clampato in vista; la media è di valori già `clampView`-ati.

- [ ] **Step 4: Esegui i test, verifica che passino**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS (tutti, inclusi i preesistenti).

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js scripts/tests/reputation.test.js
git commit -m "[FEAT] MODEL: averageIncomingScore (media reputazione in entrata)"
```

---

## Task 2: Scaffolding Vite + Vue

**Files:**
- Modify: `package.json`
- Create: `vite.config.js`, `scripts/copy-404.mjs`
- Modify: `index.html`
- Create: `src/view/main.js`, `src/view/App.vue`
- Create (temporaneo): `src/view/router.js` minimale per far partire l'app

- [ ] **Step 1: Installa le dipendenze**

Run:
```bash
npm install vue vue-router
npm install -D vite @vitejs/plugin-vue
```
Expected: `package.json` ottiene `dependencies` (vue, vue-router) e `devDependencies` (vite, @vitejs/plugin-vue); creato `node_modules/` e `package-lock.json`.

- [ ] **Step 2: Aggiorna gli `scripts` di `package.json`**

Imposta la sezione `scripts` (mantieni `test`):

```json
{
  "name": "ttrpg-core",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "postbuild": "node scripts/copy-404.mjs",
    "preview": "vite preview",
    "test": "node --test"
  }
}
```
(Le righe `dependencies`/`devDependencies` aggiunte da npm allo Step 1 restano.)

- [ ] **Step 3: Crea `vite.config.js`**

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// base = sottopercorso del progetto su GitHub Pages.
// Se la repo si chiama diversamente da 'ttrpg-core', aggiorna qui.
export default defineConfig({
  base: '/ttrpg-core/',
  plugins: [vue()],
});
```

- [ ] **Step 4: Crea `scripts/copy-404.mjs`**

```js
import { copyFileSync, existsSync } from 'node:fs';

const src = 'dist/index.html';
const dest = 'dist/404.html';

if (!existsSync(src)) {
  console.error('copy-404: dist/index.html non trovato. Esegui prima la build.');
  process.exit(1);
}
copyFileSync(src, dest);
console.log('copy-404: creato dist/404.html');
```

- [ ] **Step 5: Riscrivi `index.html` come entry Vite**

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TTRPG — Reputazione</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/view/main.js"></script>
</body>
</html>
```

- [ ] **Step 6: Crea `src/view/main.js`**

```js
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router.js';
import '../../styles/main.css';

createApp(App).use(router).mount('#app');
```

- [ ] **Step 7: Crea `src/view/App.vue` (placeholder iniziale)**

```vue
<template>
  <div id="app-root">
    <router-view />
  </div>
</template>

<script setup></script>
```

- [ ] **Step 8: Crea `src/view/router.js` (minimale, completato nel Task 4)**

```js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', component: { template: '<p>app viva</p>' } },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
```

- [ ] **Step 9: Verifica manuale — il dev server parte**

Run: `npm run dev`
Apri l'URL mostrato (es. `http://localhost:5173/ttrpg-core/`).
Expected: pagina con testo "app viva", nessun errore in console.

- [ ] **Step 10: Aggiorna `.gitignore` per `node_modules` e `dist`**

Aggiungi in `.gitignore`:
```
node_modules/
dist/
```

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json vite.config.js scripts/copy-404.mjs index.html src/view/main.js src/view/App.vue src/view/router.js .gitignore
git commit -m "[CHORE] Scaffolding Vite + Vue 3 + vue-router"
```

---

## Task 3: Bridge stato + stato UI + helper colore

**Files:**
- Create: `src/view/useStore.js`, `src/view/useUiState.js`, `src/view/scoreColor.js`

- [ ] **Step 1: Crea `src/view/useStore.js` (bridge singleton)**

```js
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
```

- [ ] **Step 2: Crea `src/view/useUiState.js`**

```js
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
```

- [ ] **Step 3: Crea `src/view/scoreColor.js` (estratto da matrix.js)**

```js
export function scoreColor(score) {
  // 1 = rosso (0deg), 100 = verde (120deg)
  const hue = Math.round(((score - 1) / 99) * 120);
  const color = `hsl(${hue}, 70%, 75%)`;
  return color;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/view/useStore.js src/view/useUiState.js src/view/scoreColor.js
git commit -m "[FEAT] VIEW: bridge store, stato UI, helper colore"
```

---

## Task 4: Router completo + NotFound

**Files:**
- Modify: `src/view/router.js`
- Create: `src/view/components/NotFound.vue`

- [ ] **Step 1: Crea `src/view/components/NotFound.vue`**

```vue
<template>
  <div class="notfound">
    <h2>Non trovato</h2>
    <p>La pagina o il personaggio che cerchi non esiste.</p>
    <router-link to="/personaggi">Torna all'elenco</router-link>
  </div>
</template>

<script setup></script>
```

- [ ] **Step 2: Sostituisci `src/view/router.js` con le 4 rotte**

```js
import { createRouter, createWebHistory } from 'vue-router';
import CharactersView from './components/CharactersView.vue';
import ProfileView from './components/ProfileView.vue';
import NotFound from './components/NotFound.vue';

const routes = [
  { path: '/', redirect: '/personaggi' },
  { path: '/personaggi', name: 'characters', component: CharactersView },
  { path: '/personaggio/:id', name: 'profile', component: ProfileView, props: true },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFound },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
```

Nota: `CharactersView` e `ProfileView` sono creati nei Task 6 e 9. Finché non esistono, `npm run dev` darà errore di import: procedi ai task successivi prima di rilanciare il dev server. Il commit di questo task avviene dopo il Task 9 (vedi nota), oppure crea stub temporanei. **Per evitare blocchi, crea stub minimi ora** (saranno sovrascritti):

`src/view/components/CharactersView.vue`:
```vue
<template><p>elenco (stub)</p></template>
<script setup></script>
```
`src/view/components/ProfileView.vue`:
```vue
<template><p>profilo (stub)</p></template>
<script setup></script>
```

- [ ] **Step 3: Verifica manuale**

Run: `npm run dev`
- `http://localhost:5173/ttrpg-core/` → redirect a `/ttrpg-core/personaggi`, mostra "elenco (stub)".
- `http://localhost:5173/ttrpg-core/personaggio/xyz` → "profilo (stub)".
- `http://localhost:5173/ttrpg-core/rotta-a-caso` → NotFound.
Expected: tutte e tre ok, nessun errore console.

- [ ] **Step 4: Commit**

```bash
git add src/view/router.js src/view/components/NotFound.vue src/view/components/CharactersView.vue src/view/components/ProfileView.vue
git commit -m "[FEAT] VIEW: router 4 rotte + NotFound (stub viste)"
```

---

## Task 5: Header persistente (`App.vue`) — logo + export/import

**Files:**
- Modify: `src/view/App.vue`

- [ ] **Step 1: Implementa `App.vue` con header**

```vue
<template>
  <div id="app-root">
    <header class="app-header">
      <router-link to="/" class="logo">TTRPG · Reputazione</router-link>
      <div class="data-ops">
        <button @click="onExport">Scarica</button>
        <label class="import">
          Carica
          <input type="file" accept="application/json" @change="onImportFile" />
        </label>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useStore } from './useStore.js';
import { serializeState, parseImport } from '../store/io.js';

const { getState, replaceState } = useStore();

function onExport() {
  const text = serializeState(getState());
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `reputation-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function onImportFile(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const state = parseImport(reader.result);
      if (!window.confirm('Importare sovrascrive i dati correnti. Procedere?')) {
        return;
      }
      replaceState(state);
    } catch (err) {
      window.alert(`Import fallito: ${err.message}`);
    }
  };
  reader.readAsText(file);
}
</script>
```

- [ ] **Step 2: Verifica manuale**

Run: `npm run dev`
Expected: header con logo (link a `/`) ed export/import. "Scarica" produce un file JSON. "Carica" con un export valido chiede conferma e sostituisce lo stato.

- [ ] **Step 3: Commit**

```bash
git add src/view/App.vue
git commit -m "[FEAT] VIEW: header con logo ed export/import"
```

---

## Task 6: Composable lista personaggi + `CharactersView`

**Files:**
- Create: `src/view/useDisplayedCharacters.js`
- Modify: `src/view/components/CharactersView.vue`

- [ ] **Step 1: Crea `src/view/useDisplayedCharacters.js`**

```js
import { computed } from 'vue';
import { useStore } from './useStore.js';
import { useUiState } from './useUiState.js';
import { listActiveCharacters, averageIncomingScore } from '../model/reputation.js';

function compareItems(a, b, sort) {
  const dirMul = sort.dir === 'asc' ? 1 : -1;
  if (sort.key === 'name') {
    const cmp = a.char.name.localeCompare(b.char.name);
    return cmp * dirMul;
  }
  // sort.key === 'score' — i null vanno sempre in fondo, a prescindere dalla direzione
  if (a.score === null && b.score === null) {
    return 0;
  }
  if (a.score === null) {
    return 1;
  }
  if (b.score === null) {
    return -1;
  }
  const cmp = a.score - b.score;
  return cmp * dirMul;
}

export function useDisplayedCharacters() {
  const { state } = useStore();
  const ui = useUiState();

  const items = computed(() => {
    const all = state.value.characters;
    const base = ui.showArchived ? all : listActiveCharacters(state.value);
    const needle = ui.search.trim().toLowerCase();
    const filtered = needle.length === 0
      ? base
      : base.filter((c) => c.name.toLowerCase().includes(needle));
    const withScore = filtered.map((c) => {
      const score = averageIncomingScore(state.value, c.id, ui.showArchived);
      const item = { char: c, score };
      return item;
    });
    const sorted = [...withScore].sort((a, b) => compareItems(a, b, ui.sort));
    return sorted;
  });

  return items;
}
```

- [ ] **Step 2: Implementa `CharactersView.vue`**

```vue
<template>
  <section class="characters-view">
    <div class="controls">
      <input
        class="search"
        type="text"
        placeholder="Cerca per nome…"
        v-model="ui.search"
      />

      <div class="view-switcher">
        <button :class="{ active: ui.activeView === 'gallery' }" @click="ui.activeView = 'gallery'">Gallery</button>
        <button :class="{ active: ui.activeView === 'list' }" @click="ui.activeView = 'list'">Lista</button>
        <button :class="{ active: ui.activeView === 'matrix' }" @click="ui.activeView = 'matrix'">Matrice</button>
      </div>

      <label class="archived-toggle">
        <input type="checkbox" v-model="ui.showArchived" />
        Mostra archiviati
      </label>

      <div class="sort-controls" v-if="ui.activeView !== 'matrix'">
        <span>Ordina:</span>
        <button @click="setSort('name')">
          Nome {{ sortArrow('name') }}
        </button>
        <button @click="setSort('score')">
          Punteggio {{ sortArrow('score') }}
        </button>
      </div>

      <form class="add-char" @submit.prevent="onAdd">
        <input v-model="newName" type="text" placeholder="Nome personaggio" />
        <button type="submit">+ Personaggio</button>
      </form>
    </div>

    <GalleryView v-if="ui.activeView === 'gallery'" :items="items" />
    <ListView v-else-if="ui.activeView === 'list'" :items="items" />
    <MatrixView v-else />
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useUiState } from '../useUiState.js';
import { useStore } from '../useStore.js';
import { useDisplayedCharacters } from '../useDisplayedCharacters.js';
import { addCharacter } from '../../model/reputation.js';
import GalleryView from './GalleryView.vue';
import ListView from './ListView.vue';
import MatrixView from './MatrixView.vue';

const ui = useUiState();
const { dispatch } = useStore();
const items = useDisplayedCharacters();
const newName = ref('');

function setSort(key) {
  if (ui.sort.key === key) {
    ui.sort.dir = ui.sort.dir === 'asc' ? 'desc' : 'asc';
    return;
  }
  ui.sort.key = key;
  ui.sort.dir = 'asc';
}

function sortArrow(key) {
  if (ui.sort.key !== key) {
    return '';
  }
  const arrow = ui.sort.dir === 'asc' ? '▲' : '▼';
  return arrow;
}

function onAdd() {
  const name = newName.value.trim();
  if (name.length === 0) {
    return;
  }
  dispatch((s) => addCharacter(s, name));
  newName.value = '';
}
</script>
```

Nota: importa `GalleryView`, `ListView`, `MatrixView`, creati nei Task 7 e 8. Crea stub minimi ora se non esistono ancora, per non rompere il dev server:
- `GalleryView.vue`: `<template><p>gallery (stub)</p></template><script setup>defineProps(['items']);</script>`
- `ListView.vue`: `<template><p>list (stub)</p></template><script setup>defineProps(['items']);</script>`
- `MatrixView.vue`: `<template><p>matrix (stub)</p></template><script setup></script>`

- [ ] **Step 3: Verifica manuale**

Run: `npm run dev`, vai su `/personaggi`.
Expected: barra controlli (ricerca, switcher, toggle archiviati, ordinamento, add). "+ Personaggio" aggiunge un pg (verificalo passando alla matrice se gli stub non mostrano nulla). Switcher cambia tra gli stub. Nessun errore console.

- [ ] **Step 4: Commit**

```bash
git add src/view/useDisplayedCharacters.js src/view/components/CharactersView.vue src/view/components/GalleryView.vue src/view/components/ListView.vue src/view/components/MatrixView.vue
git commit -m "[FEAT] VIEW: CharactersView (switcher, ricerca, ordinamento, add)"
```

---

## Task 7: Gallery + CharacterCard

**Files:**
- Modify: `src/view/components/GalleryView.vue`
- Create: `src/view/components/CharacterCard.vue`

- [ ] **Step 1: Implementa `CharacterCard.vue`**

```vue
<template>
  <div class="character-card" :class="{ archived: isArchived }">
    <span v-if="isArchived" class="ribbon">Archiviato</span>

    <router-link class="card-name" :to="{ name: 'profile', params: { id: char.id } }">
      {{ char.name }} <span class="goto">↪</span>
    </router-link>

    <div class="card-score" :style="scoreStyle">
      {{ score === null ? '–' : score }}
    </div>

    <div class="card-actions">
      <button v-if="!isArchived" @click="onArchive">Archivia</button>
      <template v-else>
        <button @click="onRestore">Ripristina</button>
        <button @click="onHardDelete">Elimina definitivo</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from '../useStore.js';
import { scoreColor } from '../scoreColor.js';
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter } from '../../model/reputation.js';

const props = defineProps({
  char: { type: Object, required: true },
  score: { type: [Number, null], default: null },
});

const { dispatch } = useStore();

const isArchived = computed(() => props.char.deletedAt !== null);

const scoreStyle = computed(() => {
  if (props.score === null) {
    return 'background:#eee';
  }
  const style = `background:${scoreColor(props.score)}`;
  return style;
});

function onArchive() {
  dispatch((s) => softDeleteCharacter(s, props.char.id));
}

function onRestore() {
  dispatch((s) => restoreCharacter(s, props.char.id));
}

function onHardDelete() {
  if (window.confirm('Eliminazione DEFINITIVA e irreversibile. Confermi?')) {
    dispatch((s) => hardDeleteCharacter(s, props.char.id));
  }
}
</script>
```

- [ ] **Step 2: Implementa `GalleryView.vue`**

```vue
<template>
  <div class="gallery">
    <p v-if="items.length === 0" class="empty">Nessun personaggio.</p>
    <CharacterCard
      v-for="item in items"
      :key="item.char.id"
      :char="item.char"
      :score="item.score"
    />
  </div>
</template>

<script setup>
import CharacterCard from './CharacterCard.vue';

defineProps({
  items: { type: Array, required: true },
});
</script>
```

- [ ] **Step 3: Verifica manuale**

Run: `npm run dev`, vista Gallery.
Expected: una card per pg con nome (link + `↪`), punteggio sintetico colorato (`–` se nessuna reputazione in entrata), bottone Archivia. Con "Mostra archiviati" attivo: card archiviate mostrano ribbon + Ripristina/Elimina definitivo. Ricerca e ordinamento filtrano/riordinano le card.

- [ ] **Step 4: Commit**

```bash
git add src/view/components/GalleryView.vue src/view/components/CharacterCard.vue
git commit -m "[FEAT] VIEW: GalleryView + CharacterCard"
```

---

## Task 8: ListView + MatrixView

**Files:**
- Modify: `src/view/components/ListView.vue`, `src/view/components/MatrixView.vue`

- [ ] **Step 1: Implementa `ListView.vue`**

```vue
<template>
  <table class="list-view">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Punteggio</th>
        <th>Azioni</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="items.length === 0">
        <td colspan="3" class="empty">Nessun personaggio.</td>
      </tr>
      <tr v-for="item in items" :key="item.char.id" :class="{ archived: item.char.deletedAt !== null }">
        <td>
          <router-link :to="{ name: 'profile', params: { id: item.char.id } }">
            {{ item.char.name }} ↪
          </router-link>
          <span v-if="item.char.deletedAt !== null" class="ribbon-inline">(archiviato)</span>
        </td>
        <td :style="scoreStyle(item.score)">{{ item.score === null ? '–' : item.score }}</td>
        <td>
          <button v-if="item.char.deletedAt === null" @click="onArchive(item.char.id)">Archivia</button>
          <template v-else>
            <button @click="onRestore(item.char.id)">Ripristina</button>
            <button @click="onHardDelete(item.char.id)">Elimina definitivo</button>
          </template>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { useStore } from '../useStore.js';
import { scoreColor } from '../scoreColor.js';
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter } from '../../model/reputation.js';

defineProps({
  items: { type: Array, required: true },
});

const { dispatch } = useStore();

function scoreStyle(score) {
  if (score === null) {
    return 'background:#eee';
  }
  const style = `background:${scoreColor(score)}`;
  return style;
}

function onArchive(id) {
  dispatch((s) => softDeleteCharacter(s, id));
}

function onRestore(id) {
  dispatch((s) => restoreCharacter(s, id));
}

function onHardDelete(id) {
  if (window.confirm('Eliminazione DEFINITIVA e irreversibile. Confermi?')) {
    dispatch((s) => hardDeleteCharacter(s, id));
  }
}
</script>
```

Nota: l'ordinamento è gestito a monte da `useDisplayedCharacters` (controlli nella toolbar di `CharactersView`); la tabella mostra `items` già ordinati.

- [ ] **Step 2: Implementa `MatrixView.vue` (porting di matrix.js)**

La matrice rispetta `showArchived`: include gli archiviati solo se attivo. Click su cella → modale transazioni (gestita da un evento verso un contenitore locale). Per semplicità la modale transazioni della matrice è la stessa `TransactionModal` (Task 11): qui la montiamo localmente.

```vue
<template>
  <div class="matrix-view">
    <p v-if="chars.length < 2" class="empty">Aggiungi almeno due personaggi.</p>
    <table v-else class="matrix">
      <thead>
        <tr>
          <th>da \ a</th>
          <th v-for="c in chars" :key="c.id">
            <router-link :to="{ name: 'profile', params: { id: c.id } }">{{ c.name }} ↪</router-link>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="from in chars" :key="from.id">
          <th class="row-head">
            <router-link :to="{ name: 'profile', params: { id: from.id } }">{{ from.name }} ↪</router-link>
          </th>
          <td
            v-for="to in chars"
            :key="to.id"
            :class="from.id === to.id ? 'diagonal' : 'score-cell'"
            :style="from.id === to.id ? '' : cellStyle(from.id, to.id)"
            @click="from.id === to.id ? null : openTx(from.id, to.id)"
          >
            {{ from.id === to.id ? '—' : computeScore(state, from.id, to.id) }}
          </td>
        </tr>
      </tbody>
    </table>

    <TransactionModal
      v-if="tx"
      :from-id="tx.fromId"
      :to-id="tx.toId"
      @close="tx = null"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { listActiveCharacters, computeScore } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import TransactionModal from './TransactionModal.vue';

const { state } = useStore();
const ui = useUiState();
const tx = ref(null);

const chars = computed(() => {
  const list = ui.showArchived ? state.value.characters : listActiveCharacters(state.value);
  return list;
});

function cellStyle(fromId, toId) {
  const score = computeScore(state.value, fromId, toId);
  const style = `background:${scoreColor(score)}`;
  return style;
}

function openTx(fromId, toId) {
  tx.value = { fromId, toId };
}
</script>
```

Nota: nel template, `computeScore(state, ...)` riceve `state` (il `ref`); poiché in `<script setup>` il template auto-unwrappa i ref, usa `computeScore(state, from.id, to.id)` funziona solo se `state` è unwrappato — per sicurezza definisci un wrapper. **Correzione:** sostituisci nel template `computeScore(state, from.id, to.id)` con `score(from.id, to.id)` e aggiungi nello script:

```js
function score(fromId, toId) {
  const value = computeScore(state.value, fromId, toId);
  return value;
}
```
e nel template usa `{{ from.id === to.id ? '—' : score(from.id, to.id) }}`.

- [ ] **Step 3: Verifica manuale**

Run: `npm run dev`.
- Vista Lista: tabella con nome (link+↪), punteggio colorato, azioni archivio. Ordinamento dai controlli toolbar riordina le righe.
- Vista Matrice: griglia come prima; click cella apre la modale transazioni; click nome (header riga/colonna) va al profilo. Toggle archiviati include/esclude righe/colonne.

- [ ] **Step 4: Commit**

```bash
git add src/view/components/ListView.vue src/view/components/MatrixView.vue
git commit -m "[FEAT] VIEW: ListView + MatrixView"
```

---

## Task 9: ProfileView + tab + back

**Files:**
- Modify: `src/view/components/ProfileView.vue`

- [ ] **Step 1: Implementa `ProfileView.vue`**

```vue
<template>
  <section v-if="character" class="profile-view">
    <span v-if="isArchived" class="ribbon">Archiviato</span>

    <nav class="breadcrumb">
      <router-link to="/personaggi">Personaggi</router-link>
      <span> / {{ character.name }}</span>
    </nav>

    <button class="back" @click="goBack">← Indietro</button>

    <header class="profile-header">
      <h2>{{ character.name }}</h2>
      <span class="synthetic" :style="syntheticStyle">
        {{ synthetic === null ? '–' : synthetic }}
      </span>
    </header>

    <div class="tabs">
      <button :class="{ active: tab === 'in' }" @click="tab = 'in'">Di lui pensano</button>
      <button :class="{ active: tab === 'out' }" @click="tab = 'out'">Lui pensa</button>
    </div>

    <RelationList
      :current-id="character.id"
      :direction="tab"
      @open-tx="openTx"
    />

    <TransactionModal
      v-if="tx"
      :from-id="tx.fromId"
      :to-id="tx.toId"
      @close="tx = null"
    />
  </section>

  <NotFound v-else />
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { averageIncomingScore } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import RelationList from './RelationList.vue';
import TransactionModal from './TransactionModal.vue';
import NotFound from './NotFound.vue';

const props = defineProps({
  id: { type: String, required: true },
});

const { state } = useStore();
const ui = useUiState();
const router = useRouter();

const tab = ref('in'); // 'in' = entrata (default) ; 'out' = uscita
const tx = ref(null);

const character = computed(() => {
  const found = state.value.characters.find((c) => c.id === props.id);
  return found || null;
});

const isArchived = computed(() => character.value !== null && character.value.deletedAt !== null);

const synthetic = computed(() => {
  if (character.value === null) {
    return null;
  }
  const value = averageIncomingScore(state.value, character.value.id, ui.showArchived);
  return value;
});

const syntheticStyle = computed(() => {
  if (synthetic.value === null) {
    return 'background:#eee';
  }
  const style = `background:${scoreColor(synthetic.value)}`;
  return style;
});

function goBack() {
  router.push('/personaggi');
}

function openTx(pair) {
  tx.value = pair;
}
</script>
```

- [ ] **Step 2: Verifica manuale (parziale, dipende dal Task 10 per le righe)**

Run: `npm run dev`, clicca un pg dall'elenco.
Expected: header profilo con nome + punteggio sintetico, breadcrumb `Personaggi / Nome`, bottone Indietro, logo — tutti tornano all'elenco. Tab "Di lui pensano" (attivo di default) / "Lui pensa". Le righe relazioni arrivano col Task 10. Aprendo un id inesistente (`/personaggio/zzz`) → NotFound.

- [ ] **Step 3: Commit**

```bash
git add src/view/components/ProfileView.vue
git commit -m "[FEAT] VIEW: ProfileView (header, breadcrumb, back, tab)"
```

---

## Task 10: RelationList (gesto doppio nome/riga)

**Files:**
- Create: `src/view/components/RelationList.vue`

- [ ] **Step 1: Implementa `RelationList.vue`**

```vue
<template>
  <div class="relation-list">
    <div class="relation-sort">
      <button @click="setSort('name')">Nome {{ sortArrow('name') }}</button>
      <button @click="setSort('score')">Punteggio {{ sortArrow('score') }}</button>
    </div>

    <p v-if="rows.length === 0" class="empty">Nessuna relazione.</p>

    <ul v-else>
      <li v-for="row in rows" :key="row.other.id" class="relation-row">
        <router-link
          class="relation-name"
          :to="{ name: 'profile', params: { id: row.other.id } }"
          @click.stop
        >
          {{ row.other.name }} <span class="goto">↪</span>
        </router-link>
        <span class="relation-score" :style="scoreStyle(row.score)" @click="emitTx(row.other.id)">
          {{ row.score }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { listActiveCharacters, computeScore } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';

const props = defineProps({
  currentId: { type: String, required: true },
  direction: { type: String, required: true }, // 'in' | 'out'
});

const emit = defineEmits(['open-tx']);

const { state } = useStore();
const ui = useUiState();
const sort = ref({ key: 'name', dir: 'asc' });

const others = computed(() => {
  const pool = ui.showArchived ? state.value.characters : listActiveCharacters(state.value);
  const list = pool.filter((c) => c.id !== props.currentId);
  return list;
});

const rows = computed(() => {
  const mapped = others.value.map((other) => {
    // entrata: other -> current ; uscita: current -> other
    const score = props.direction === 'in'
      ? computeScore(state.value, other.id, props.currentId)
      : computeScore(state.value, props.currentId, other.id);
    const row = { other, score };
    return row;
  });
  const dirMul = sort.value.dir === 'asc' ? 1 : -1;
  const sorted = [...mapped].sort((a, b) => {
    if (sort.value.key === 'name') {
      const cmp = a.other.name.localeCompare(b.other.name);
      return cmp * dirMul;
    }
    const cmp = a.score - b.score;
    return cmp * dirMul;
  });
  return sorted;
});

function setSort(key) {
  if (sort.value.key === key) {
    sort.value.dir = sort.value.dir === 'asc' ? 'desc' : 'asc';
    return;
  }
  sort.value = { key, dir: 'asc' };
}

function sortArrow(key) {
  if (sort.value.key !== key) {
    return '';
  }
  const arrow = sort.value.dir === 'asc' ? '▲' : '▼';
  return arrow;
}

function scoreStyle(score) {
  const style = `background:${scoreColor(score)}; cursor:pointer`;
  return style;
}

function emitTx(otherId) {
  // direzione coerente con la tab: entrata = other->current ; uscita = current->other
  const pair = props.direction === 'in'
    ? { fromId: otherId, toId: props.currentId }
    : { fromId: props.currentId, toId: otherId };
  emit('open-tx', pair);
}
</script>
```

- [ ] **Step 2: Verifica manuale**

Run: `npm run dev`, apri un profilo con relazioni.
Expected:
- Tab "Di lui pensano": righe = altri pg con punteggio `other → current`.
- Tab "Lui pensa": punteggio `current → other`.
- **Click sul nome (`↪`)** → vai al profilo di quel pg (non apre la modale).
- **Click sul punteggio/riga** → apre la modale transazioni della coppia nella direzione giusta.
- Ordinamento per nome/punteggio funziona.
- Con archiviati nascosti, i pg archiviati non compaiono tra le relazioni.

- [ ] **Step 3: Commit**

```bash
git add src/view/components/RelationList.vue
git commit -m "[FEAT] VIEW: RelationList (nome->profilo, riga->transazioni)"
```

---

## Task 11: TransactionModal

**Files:**
- Create: `src/view/components/TransactionModal.vue`

- [ ] **Step 1: Implementa `TransactionModal.vue` (porting di transactionPanel.js)**

```vue
<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <header class="modal-head">
        <h3>{{ fromName }} → {{ toName }} : {{ score }}</h3>
        <button @click="emit('close')">Chiudi</button>
      </header>

      <ul class="tx-list">
        <li v-for="t in transactions" :key="t.id">
          <input type="number" v-model.number="edits[t.id].delta" />
          <input type="text" v-model="edits[t.id].name" />
          <button @click="onSave(t.id)">Salva</button>
          <button @click="onDelete(t.id)">Elimina</button>
        </li>
      </ul>

      <form class="tx-add" @submit.prevent="onAdd">
        <input type="number" v-model.number="newDelta" placeholder="Delta (es. -5)" />
        <input type="text" v-model="newName" placeholder="Motivo" />
        <button type="submit">Aggiungi transazione</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watchEffect } from 'vue';
import { useStore } from '../useStore.js';
import {
  computeScore, listTransactions, addTransaction, editTransaction, deleteTransaction,
} from '../../model/reputation.js';

const props = defineProps({
  fromId: { type: String, required: true },
  toId: { type: String, required: true },
});

const emit = defineEmits(['close']);

const { state, dispatch } = useStore();

const newDelta = ref(0);
const newName = ref('');
const edits = reactive({});

function charName(id) {
  const found = state.value.characters.find((c) => c.id === id);
  const name = found ? found.name : '???';
  return name;
}

const fromName = computed(() => charName(props.fromId));
const toName = computed(() => charName(props.toId));
const score = computed(() => computeScore(state.value, props.fromId, props.toId));
const transactions = computed(() => listTransactions(state.value, props.fromId, props.toId));

// mantieni un buffer di edit per ogni transazione visibile
watchEffect(() => {
  for (const t of transactions.value) {
    if (!edits[t.id]) {
      edits[t.id] = { delta: t.delta, name: t.name };
    }
  }
});

function onSave(txId) {
  const buf = edits[txId];
  const name = buf.name.trim();
  if (Number.isNaN(buf.delta) || name.length === 0) {
    return;
  }
  dispatch((s) => editTransaction(s, txId, { delta: Number(buf.delta), name }));
}

function onDelete(txId) {
  dispatch((s) => deleteTransaction(s, txId));
  delete edits[txId];
}

function onAdd() {
  const delta = Number(newDelta.value);
  const name = newName.value.trim();
  if (Number.isNaN(delta) || name.length === 0) {
    return;
  }
  dispatch((s) => addTransaction(s, props.fromId, props.toId, delta, name));
  newDelta.value = 0;
  newName.value = '';
}
</script>
```

- [ ] **Step 2: Verifica manuale**

Run: `npm run dev`.
Expected: dalla matrice (click cella) e dal profilo (click punteggio relazione) si apre la modale overlay. Lista transazioni con modifica (delta+nome+Salva), Elimina, e form aggiunta. Aggiunta/modifica/eliminazione aggiornano subito il punteggio nel titolo. "Chiudi" o click sull'overlay chiude.

- [ ] **Step 3: Commit**

```bash
git add src/view/components/TransactionModal.vue
git commit -m "[FEAT] VIEW: TransactionModal (lista/aggiungi/modifica/elimina)"
```

---

## Task 12: Stili minimi

**Files:**
- Modify: `styles/main.css`

- [ ] **Step 1: Aggiungi stili funzionali in coda a `styles/main.css`**

Stili minimi per rendere l'app usabile (l'estetica fine si cura con la skill `frontend-design` in un secondo momento):

```css
/* --- Feature 003: viste + profilo --- */
.app-header { display:flex; justify-content:space-between; align-items:center; padding:.5rem 1rem; border-bottom:1px solid #ccc; }
.app-header .logo { font-weight:bold; text-decoration:none; color:inherit; }
.app-main { padding:1rem; }

.controls { display:flex; flex-wrap:wrap; gap:.75rem; align-items:center; margin-bottom:1rem; }
.view-switcher button.active, .tabs button.active, .sort-controls button.active { font-weight:bold; }

.gallery { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:.75rem; }
.character-card { position:relative; border:1px solid #ddd; border-radius:8px; padding:.75rem; display:flex; flex-direction:column; gap:.5rem; }
.character-card.archived { opacity:.6; }
.card-name { font-weight:bold; text-decoration:none; color:inherit; }
.card-score { text-align:center; border-radius:6px; padding:.25rem; font-variant-numeric:tabular-nums; }
.ribbon { position:absolute; top:0; right:0; background:#b00; color:#fff; font-size:.7rem; padding:.1rem .4rem; border-bottom-left-radius:6px; }

.list-view { border-collapse:collapse; width:100%; }
.list-view th, .list-view td { border:1px solid #ddd; padding:.4rem .6rem; text-align:left; }
.list-view tr.archived { opacity:.6; }

.matrix { border-collapse:collapse; }
.matrix th, .matrix td { border:1px solid #ddd; padding:.4rem .6rem; text-align:center; }
.matrix .score-cell { cursor:pointer; }
.matrix .diagonal { background:#f3f3f3; }

.profile-view { position:relative; }
.breadcrumb { margin-bottom:.5rem; }
.profile-header { display:flex; align-items:center; gap:.75rem; }
.synthetic { padding:.25rem .5rem; border-radius:6px; font-variant-numeric:tabular-nums; }
.tabs { display:flex; gap:.5rem; margin:.75rem 0; }

.relation-list ul { list-style:none; padding:0; }
.relation-row { display:flex; justify-content:space-between; align-items:center; gap:.5rem; padding:.3rem 0; border-bottom:1px solid #eee; }
.relation-name { text-decoration:none; color:inherit; }
.relation-score { padding:.2rem .6rem; border-radius:6px; min-width:2.5rem; text-align:center; }

.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; }
.modal { background:#fff; border-radius:8px; padding:1rem; max-width:520px; width:90%; max-height:80vh; overflow:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; }
.tx-list { list-style:none; padding:0; }
.tx-list li { display:flex; gap:.4rem; margin:.3rem 0; }
```

- [ ] **Step 2: Verifica manuale**

Run: `npm run dev`. Naviga tutte le viste e il profilo.
Expected: layout leggibile, gallery a griglia, modale centrata con overlay, ribbon "Archiviato" visibile.

- [ ] **Step 3: Commit**

```bash
git add styles/main.css
git commit -m "[STYLE] VIEW: stili minimi viste 003"
```

---

## Task 13: Rimozione VIEW vanilla

**Files:**
- Delete: `src/view/app.js`, `src/view/dom.js`, `src/view/matrix.js`, `src/view/toolbar.js`, `src/view/transactionPanel.js`

- [ ] **Step 1: Verifica che non siano più importati**

Run: `git grep -nE "view/(app|dom|matrix|toolbar|transactionPanel)" -- src index.html`
Expected: nessun risultato (i nuovi componenti non li referenziano; `scoreColor` è stato estratto).

- [ ] **Step 2: Elimina i file**

```bash
git rm src/view/app.js src/view/dom.js src/view/matrix.js src/view/toolbar.js src/view/transactionPanel.js
```

- [ ] **Step 3: Verifica build + test**

Run: `npm run build`
Expected: build OK, generati `dist/index.html` e `dist/404.html` (via postbuild).

Run: `node --test`
Expected: tutti i test MODEL/STORE/IO passano.

- [ ] **Step 4: Commit**

```bash
git commit -m "[CHORE] Rimuove la VIEW vanilla sostituita da Vue"
```

---

## Task 14: Deploy GitHub Pages (Actions) + aggiorna CLAUDE.md

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Crea `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Nota: in GitHub → Settings → Pages, impostare "Source: GitHub Actions" (azione manuale dell'utente, una tantum).

- [ ] **Step 2: Aggiorna `CLAUDE.md`**

Nella sezione **Comandi**, sostituisci la riga di avvio app:

```markdown
- Avvio app (dev): `npm run dev` (Vite dev server). Build di produzione: `npm run build`
  (genera `dist/` + `404.html` per il routing SPA su Pages); anteprima: `npm run preview`.
```

Nella sezione **Progetto**, la nota "Dalla feature 003 la VIEW usa un framework frontend"
può citare lo stack deciso: Vue 3 + Vite + vue-router (history mode + 404.html).

Aggiorna l'header schema (prima riga): bump `Versione` e `Aggiornato:` con l'ora reale
(`Get-Date -Format "yyyy-MM-dd HH:mm"`).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml CLAUDE.md
git commit -m "[CHORE] CI: deploy Vite su GitHub Pages + aggiorna CLAUDE.md"
```

---

## Task 15: ADR 0003 + tracker docs

**Files:**
- Create: `docs/adr/0003-stack-frontend-vue.md`
- Modify: `docs/README.md` (tracker prossimo ID ADR → 0004)

- [ ] **Step 1: Scrivi `docs/adr/0003-stack-frontend-vue.md`**

Contenuto (ADR sintetica, immutabile):

```markdown
# 0003 — Stack frontend della VIEW: Vue 3 + Vite + vue-router

Stato: accettata
Data: 2026-06-07
Contesto: feature 003 (viste-e-profilo). Vedi spec e [[03-scelta-framework-frontend]].

## Decisione

La VIEW usa **Vue 3 + Vite + vue-router**. Routing in **history mode**
(`createWebHistory`) con trucco **`404.html`** (copia di `index.html`) e `base` path per
GitHub Pages. Bridge sottile store→ref (no Pinia): MODEL/STORE restano proprietari dello
stato e framework-agnostici.

## Alternative scartate

- **No-build (van.js / lit-html / Preact+htm)**: scalano peggio con la crescita di feature.
- **Nuxt**: meta-framework SSR, overkill per app statica locale.
- **React / Svelte**: validi; scelta Vue per equilibrio facilità/scala/ecosistema.
- **Pinia**: duplicherebbe il layer STORE esistente.
- **Hash routing**: scartato a favore di URL puliti (history + 404.html).

## Conseguenze

- Build step (Vite) + GitHub Actions per pubblicare `dist/`.
- Migrazione Python del MODEL resta intatta (VIEW isolata).
```

- [ ] **Step 2: Aggiorna il tracker in `docs/README.md`**

Cambia `Tracker prossimo ID ADR: **0003**` → `Tracker prossimo ID ADR: **0004**`.

- [ ] **Step 3: Commit**

```bash
git add docs/adr/0003-stack-frontend-vue.md docs/README.md
git commit -m "[DOCS] ADR 0003: stack frontend Vue 3 + Vite + vue-router"
```

---

## Self-Review (eseguito durante la stesura)

**Spec coverage:**
- 3 viste gallery/list/matrix → Task 6,7,8 ✓
- Profilo tab entrata(default)/uscita → Task 9 ✓
- Gesto doppio nome→profilo / riga→modale → Task 10 ✓
- Modale transazioni (riuso) → Task 11 ✓
- Punteggio sintetico `averageIncomingScore` + null → Task 1 ✓
- Ricerca + ordinamento (nome/punteggio) → Task 6 (+ RelationList Task 10) ✓
- Toggle `showArchived` + effetto su calcolo → Task 1 (param) + Task 6/8/10 (uso) ✓
- Archivio azioni (archivia/ripristina/elimina) nelle viste → Task 7,8 ✓
- Routing 4 rotte + redirect + NotFound → Task 4 ✓
- Bridge sottile → Task 3 ✓
- Back triplo (logo/bottone/breadcrumb) → Task 5 (logo) + Task 9 (bottone, breadcrumb) ✓
- history mode + 404.html + base path → Task 2,14 ✓
- Rimozione vanilla → Task 13 ✓
- ADR 0003 → Task 15 ✓

**Type consistency:** `averageIncomingScore(state, id, includeArchived)`, `computeScore(state, from, to)`, evento `open-tx` con `{ fromId, toId }`, prop `items` = `[{ char, score }]`, `ui.activeView/search/sort/showArchived` — usati in modo coerente tra i task.

**Note operative:** alcuni task creano stub di componenti referenziati prima della loro implementazione (router → CharactersView/ProfileView; CharactersView → Gallery/List/Matrix) per non rompere il dev server. Gli stub sono sovrascritti nei task dedicati.
```
