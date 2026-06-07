# Sistema di Reputazione V1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app locale (browser, no server) per tracciare la reputazione asimmetrica tra personaggi D&D, con punteggio derivato da transazioni e export/import JSON.

**Architecture:** Tre layer con dipendenze verso il basso — MODEL (dati puri + funzioni pure, no browser), STORE (stato in memoria + persistenza localStorage, unico a toccare il browser storage), VIEW (DOM vanilla). MODEL è traducibile 1:1 in Python. Persistenza astratta dietro interfaccia `storage` iniettabile per testabilità.

**Tech Stack:** JavaScript vanilla (ES modules), HTML, CSS. Test con `node:test` + `node:assert` (built-in Node 22, nessun framework). `crypto.randomUUID` per gli id.

**Spec di riferimento:** `docs/features/001-sistema-reputazione/spec.md`

---

## File Structure

```
ttrpg-core/
  package.json                // { "type": "module" } → ESM in Node E browser
  index.html                  // entry point, <script type=module src=src/view/app.js>
  src/
    model/
      schema.js               // BASE, version, factory createState/character/transaction, newId
      reputation.js           // funzioni pure: clampView, computeScore, CRUD char/tx, list*
    store/
      storage.js              // localStorageAdapter + memoryStorageAdapter (interfaccia get/set)
      store.js                // createStore: getState, dispatch, subscribe, persistenza
      io.js                   // exportToFile, validateState, migrate, parseImport
    view/
      dom.js                  // helper: el(), clear()
      toolbar.js              // renderToolbar
      matrix.js               // renderMatrix
      transactionPanel.js     // renderTransactionPanel
      app.js                  // bootstrap: collega store + view, sottoscrizione render
  styles/
    main.css
  scripts/tests/
    reputation.test.js        // test MODEL
    store.test.js             // test STORE
    io.test.js                // test IO
```

**Responsabilità per file:**
- `schema.js`: forma dei dati e costruttori. Nessuna logica di dominio oltre i default.
- `reputation.js`: tutta la logica di reputazione (calcolo, mutazioni immutabili).
- `storage.js`: adattatori storage intercambiabili (browser vs in-memory per test).
- `store.js`: orchestrazione stato↔persistenza↔notifica. Non calcola punteggi.
- `io.js`: serializzazione, validazione, migrazione, parsing import. Pura (riceve testo/oggetti).
- `view/*`: rendering DOM. Nessuna logica di dominio.

**Convenzione test:** ogni funzione MODEL/STORE/IO è pura o iniettata → testabile in Node senza DOM. La VIEW non ha test automatici in V1 (verifica manuale nel browser, vedi Task 16).

---

## Task 0: Skeleton di progetto

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `styles/main.css`

- [ ] **Step 1: Crea `package.json`**

```json
{
  "name": "ttrpg-core",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test scripts/tests/"
  }
}
```

- [ ] **Step 2: Crea `index.html` minimale**

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TTRPG — Reputazione</title>
  <link rel="stylesheet" href="styles/main.css">
</head>
<body>
  <div id="toolbar"></div>
  <div id="matrix"></div>
  <div id="panel"></div>
  <script type="module" src="src/view/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Crea `styles/main.css` con placeholder valido**

```css
:root { font-family: system-ui, sans-serif; }
body { margin: 1rem; }
```

- [ ] **Step 4: Verifica che `npm test` parta (nessun test ancora → exit 0 o "no tests")**

Run: `npm test`
Expected: comando eseguito senza crash (può dire che non trova test file — ok).

- [ ] **Step 5: Commit**

```bash
git add package.json index.html styles/main.css
git commit -m "[FEAT] Skeleton progetto reputazione"
```

---

## Task 1: Schema e costruttori (MODEL)

**Files:**
- Create: `src/model/schema.js`
- Test: `scripts/tests/reputation.test.js`

- [ ] **Step 1: Scrivi il test fallente**

```js
// scripts/tests/reputation.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, SCHEMA_VERSION, createState, createCharacter, createTransaction } from '../../src/model/schema.js';

test('BASE è 50 e SCHEMA_VERSION è 1', () => {
  assert.equal(BASE, 50);
  assert.equal(SCHEMA_VERSION, 1);
});

test('createState produce stato vuoto valido', () => {
  const s = createState();
  assert.deepEqual(s.characters, []);
  assert.deepEqual(s.transactions, []);
  assert.equal(s.version, 1);
});

test('createCharacter genera id, name e deletedAt null', () => {
  const c = createCharacter('Aragorn');
  assert.equal(typeof c.id, 'string');
  assert.ok(c.id.length > 0);
  assert.equal(c.name, 'Aragorn');
  assert.equal(c.deletedAt, null);
});

test('createTransaction popola i campi e createdAt numerico', () => {
  const tx = createTransaction('c1', 'c2', 10, 'salvato in battaglia');
  assert.equal(typeof tx.id, 'string');
  assert.equal(tx.fromId, 'c1');
  assert.equal(tx.toId, 'c2');
  assert.equal(tx.delta, 10);
  assert.equal(tx.name, 'salvato in battaglia');
  assert.equal(typeof tx.createdAt, 'number');
});
```

- [ ] **Step 2: Esegui il test → deve fallire**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (modulo `schema.js` inesistente / export mancanti).

- [ ] **Step 3: Implementa `src/model/schema.js`**

```js
// src/model/schema.js
export const BASE = 50;
export const SCHEMA_VERSION = 1;

export function newId() {
  const id = crypto.randomUUID();
  return id;
}

export function createState() {
  const state = { version: SCHEMA_VERSION, characters: [], transactions: [] };
  return state;
}

export function createCharacter(name) {
  const character = { id: newId(), name, deletedAt: null };
  return character;
}

export function createTransaction(fromId, toId, delta, name) {
  const transaction = {
    id: newId(),
    fromId,
    toId,
    delta,
    name,
    createdAt: Date.now(),
  };
  return transaction;
}
```

- [ ] **Step 4: Esegui il test → deve passare**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/model/schema.js scripts/tests/reputation.test.js
git commit -m "[FEAT] Schema dati e costruttori MODEL"
```

---

## Task 2: clampView e computeScore (MODEL)

**Files:**
- Create: `src/model/reputation.js`
- Modify: `scripts/tests/reputation.test.js` (aggiungi test)

- [ ] **Step 1: Aggiungi i test fallenti in `scripts/tests/reputation.test.js`**

```js
import { clampView, computeScore } from '../../src/model/reputation.js';

test('clampView blocca tra 1 e 100', () => {
  assert.equal(clampView(50), 50);
  assert.equal(clampView(0), 1);
  assert.equal(clampView(-5), 1);
  assert.equal(clampView(150), 100);
});

test('computeScore di relazione senza transazioni è 50', () => {
  const state = createState();
  state.characters.push(createCharacter('A'), createCharacter('B'));
  const [a, b] = state.characters;
  assert.equal(computeScore(state, a.id, b.id), 50);
});

test('computeScore somma i delta della direzione corretta', () => {
  const state = createState();
  const a = createCharacter('A');
  const b = createCharacter('B');
  state.characters.push(a, b);
  state.transactions.push(
    createTransaction(a.id, b.id, 10, 'x'),
    createTransaction(a.id, b.id, 5, 'y'),
    createTransaction(b.id, a.id, -30, 'z'), // direzione opposta: non conta per A→B
  );
  assert.equal(computeScore(state, a.id, b.id), 65);
  assert.equal(computeScore(state, b.id, a.id), 20);
});

test('computeScore clampa solo in vista, somma interna libera', () => {
  const state = createState();
  const a = createCharacter('A');
  const b = createCharacter('B');
  state.characters.push(a, b);
  state.transactions.push(
    createTransaction(a.id, b.id, 60, 'su'),   // 110 interno
    createTransaction(a.id, b.id, -20, 'giu'), // 90 interno
  );
  assert.equal(computeScore(state, a.id, b.id), 90); // non 80
});
```

- [ ] **Step 2: Esegui → deve fallire**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (`reputation.js` inesistente).

- [ ] **Step 3: Implementa `src/model/reputation.js`**

```js
// src/model/reputation.js
import { BASE } from './schema.js';

export function clampView(value) {
  const clamped = Math.max(1, Math.min(100, value));
  return clamped;
}

export function sumDelta(state, fromId, toId) {
  const total = state.transactions
    .filter((tx) => tx.fromId === fromId && tx.toId === toId)
    .reduce((acc, tx) => acc + tx.delta, 0);
  return total;
}

export function computeScore(state, fromId, toId) {
  const raw = BASE + sumDelta(state, fromId, toId);
  const score = clampView(raw);
  return score;
}
```

- [ ] **Step 4: Esegui → deve passare**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js scripts/tests/reputation.test.js
git commit -m "[FEAT] computeScore e clampView"
```

---

## Task 3: createCharacter immutabile e listActiveCharacters (MODEL)

**Files:**
- Modify: `src/model/reputation.js`
- Modify: `scripts/tests/reputation.test.js`

- [ ] **Step 1: Aggiungi i test fallenti**

```js
import { addCharacter, listActiveCharacters } from '../../src/model/reputation.js';

test('addCharacter ritorna nuovo stato senza mutare il precedente', () => {
  const s0 = createState();
  const s1 = addCharacter(s0, 'Aragorn');
  assert.equal(s0.characters.length, 0);     // originale intatto
  assert.equal(s1.characters.length, 1);
  assert.equal(s1.characters[0].name, 'Aragorn');
});

test('nuovo personaggio nasce a 50 verso tutti gli esistenti e viceversa', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  const [a, b] = s.characters;
  assert.equal(computeScore(s, a.id, b.id), 50);
  assert.equal(computeScore(s, b.id, a.id), 50);
});

test('listActiveCharacters esclude i soft-deleted', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s.characters[0].deletedAt = 123; // simulazione soft delete
  const active = listActiveCharacters(s);
  assert.equal(active.length, 0);
});
```

- [ ] **Step 2: Esegui → deve fallire**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (`addCharacter`/`listActiveCharacters` non definiti).

- [ ] **Step 3: Implementa in `src/model/reputation.js`**

```js
import { BASE, createCharacter } from './schema.js';
// (sostituisci l'import esistente di BASE con questo che include createCharacter)

export function addCharacter(state, name) {
  const character = createCharacter(name);
  const next = {
    ...state,
    characters: [...state.characters, character],
  };
  return next;
}

export function listActiveCharacters(state) {
  const active = state.characters.filter((c) => c.deletedAt === null);
  return active;
}
```

- [ ] **Step 4: Esegui → deve passare**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js scripts/tests/reputation.test.js
git commit -m "[FEAT] addCharacter immutabile e listActiveCharacters"
```

---

## Task 4: Transazioni add/edit/delete (MODEL)

**Files:**
- Modify: `src/model/reputation.js`
- Modify: `scripts/tests/reputation.test.js`

- [ ] **Step 1: Aggiungi i test fallenti**

```js
import { addTransaction, editTransaction, deleteTransaction, listTransactions } from '../../src/model/reputation.js';

function twoChars() {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  return s;
}

test('addTransaction modifica il punteggio e non muta lo stato originale', () => {
  const s0 = twoChars();
  const [a, b] = s0.characters;
  const s1 = addTransaction(s0, a.id, b.id, 10, 'aiuto');
  assert.equal(s0.transactions.length, 0);
  assert.equal(computeScore(s1, a.id, b.id), 60);
});

test('listTransactions filtra per direzione e ordina per createdAt', () => {
  let s = twoChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'primo');
  s = addTransaction(s, b.id, a.id, -5, 'opposto');
  s = addTransaction(s, a.id, b.id, 3, 'secondo');
  const list = listTransactions(s, a.id, b.id);
  assert.equal(list.length, 2);
  assert.equal(list[0].name, 'primo');
  assert.equal(list[1].name, 'secondo');
});

test('editTransaction cambia delta e name e ricalcola il punteggio', () => {
  let s = twoChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'x');
  const tx = s.transactions[0];
  s = editTransaction(s, tx.id, { delta: 25, name: 'y' });
  assert.equal(s.transactions[0].delta, 25);
  assert.equal(s.transactions[0].name, 'y');
  assert.equal(computeScore(s, a.id, b.id), 75);
});

test('deleteTransaction rimuove la transazione e ricalcola', () => {
  let s = twoChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'x');
  const tx = s.transactions[0];
  s = deleteTransaction(s, tx.id);
  assert.equal(s.transactions.length, 0);
  assert.equal(computeScore(s, a.id, b.id), 50);
});
```

- [ ] **Step 2: Esegui → deve fallire**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (funzioni transazione non definite).

- [ ] **Step 3: Implementa in `src/model/reputation.js`**

```js
import { BASE, createCharacter, createTransaction } from './schema.js';
// (estendi l'import con createTransaction)

export function addTransaction(state, fromId, toId, delta, name) {
  const transaction = createTransaction(fromId, toId, delta, name);
  const next = {
    ...state,
    transactions: [...state.transactions, transaction],
  };
  return next;
}

export function editTransaction(state, txId, changes) {
  const transactions = state.transactions.map((tx) => {
    if (tx.id !== txId) {
      return tx;
    }
    const updated = { ...tx, ...changes };
    return updated;
  });
  const next = { ...state, transactions };
  return next;
}

export function deleteTransaction(state, txId) {
  const transactions = state.transactions.filter((tx) => tx.id !== txId);
  const next = { ...state, transactions };
  return next;
}

export function listTransactions(state, fromId, toId) {
  const list = state.transactions
    .filter((tx) => tx.fromId === fromId && tx.toId === toId)
    .sort((x, y) => x.createdAt - y.createdAt);
  return list;
}
```

- [ ] **Step 4: Esegui → deve passare**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js scripts/tests/reputation.test.js
git commit -m "[FEAT] CRUD transazioni MODEL"
```

---

## Task 5: Soft delete, restore, hard delete (MODEL)

**Files:**
- Modify: `src/model/reputation.js`
- Modify: `scripts/tests/reputation.test.js`

- [ ] **Step 1: Aggiungi i test fallenti**

```js
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter, listArchivedCharacters } from '../../src/model/reputation.js';

test('softDeleteCharacter imposta deletedAt e lo toglie dagli attivi', () => {
  let s = twoChars();
  const a = s.characters[0];
  s = softDeleteCharacter(s, a.id);
  assert.equal(typeof s.characters.find((c) => c.id === a.id).deletedAt, 'number');
  assert.equal(listActiveCharacters(s).length, 1);
  assert.equal(listArchivedCharacters(s).length, 1);
});

test('restoreCharacter riporta deletedAt a null', () => {
  let s = twoChars();
  const a = s.characters[0];
  s = softDeleteCharacter(s, a.id);
  s = restoreCharacter(s, a.id);
  assert.equal(s.characters.find((c) => c.id === a.id).deletedAt, null);
  assert.equal(listActiveCharacters(s).length, 2);
});

test('hardDeleteCharacter rimuove il char e le sue transazioni in entrambe le direzioni', () => {
  let s = twoChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'out');
  s = addTransaction(s, b.id, a.id, -5, 'in');
  s = hardDeleteCharacter(s, a.id);
  assert.equal(s.characters.length, 1);
  assert.equal(s.transactions.length, 0);
});
```

- [ ] **Step 2: Esegui → deve fallire**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (funzioni delete non definite).

- [ ] **Step 3: Implementa in `src/model/reputation.js`**

```js
export function softDeleteCharacter(state, id) {
  const characters = state.characters.map((c) => {
    if (c.id !== id) {
      return c;
    }
    const updated = { ...c, deletedAt: Date.now() };
    return updated;
  });
  const next = { ...state, characters };
  return next;
}

export function restoreCharacter(state, id) {
  const characters = state.characters.map((c) => {
    if (c.id !== id) {
      return c;
    }
    const updated = { ...c, deletedAt: null };
    return updated;
  });
  const next = { ...state, characters };
  return next;
}

export function hardDeleteCharacter(state, id) {
  const characters = state.characters.filter((c) => c.id !== id);
  const transactions = state.transactions.filter(
    (tx) => tx.fromId !== id && tx.toId !== id,
  );
  const next = { ...state, characters, transactions };
  return next;
}

export function listArchivedCharacters(state) {
  const archived = state.characters.filter((c) => c.deletedAt !== null);
  return archived;
}
```

- [ ] **Step 4: Esegui → deve passare**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS (tutti i test MODEL).

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js scripts/tests/reputation.test.js
git commit -m "[FEAT] Soft/restore/hard delete personaggi"
```

---

## Task 6: Adattatori storage (STORE)

**Files:**
- Create: `src/store/storage.js`
- Test: `scripts/tests/store.test.js`

- [ ] **Step 1: Scrivi il test fallente**

```js
// scripts/tests/store.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorageAdapter } from '../../src/store/storage.js';

test('memoryStorageAdapter fa round-trip get/set', () => {
  const storage = memoryStorageAdapter();
  assert.equal(storage.getItem('k'), null);
  storage.setItem('k', 'v');
  assert.equal(storage.getItem('k'), 'v');
});
```

- [ ] **Step 2: Esegui → deve fallire**

Run: `node --test scripts/tests/store.test.js`
Expected: FAIL (`storage.js` inesistente).

- [ ] **Step 3: Implementa `src/store/storage.js`**

```js
// src/store/storage.js
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
```

- [ ] **Step 4: Esegui → deve passare**

Run: `node --test scripts/tests/store.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/storage.js scripts/tests/store.test.js
git commit -m "[FEAT] Adattatori storage memory/localStorage"
```

---

## Task 7: io — serializza, valida, migra, parsa import (STORE)

**Files:**
- Create: `src/store/io.js`
- Test: `scripts/tests/io.test.js`

- [ ] **Step 1: Scrivi il test fallente**

```js
// scripts/tests/io.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../../src/model/schema.js';
import { addCharacter, addTransaction } from '../../src/model/reputation.js';
import { serializeState, parseImport, validateState, migrate } from '../../src/store/io.js';

function sample() {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'x');
  return s;
}

test('round-trip serialize → parseImport ricostruisce stato identico', () => {
  const s = sample();
  const json = serializeState(s);
  const back = parseImport(json);
  assert.deepEqual(back.characters, s.characters);
  assert.deepEqual(back.transactions, s.transactions);
});

test('validateState rifiuta transazione che punta a char inesistente', () => {
  const s = createState();
  s.transactions.push({ id: 't', fromId: 'ghost', toId: 'ghost2', delta: 1, name: 'n', createdAt: 1 });
  assert.throws(() => validateState(s), /integrità referenziale|fromId|toId/i);
});

test('parseImport rifiuta JSON malformato', () => {
  assert.throws(() => parseImport('{ not json'), /JSON|parse/i);
});

test('migrate lascia invariato uno stato già alla versione corrente', () => {
  const s = sample();
  const migrated = migrate(s);
  assert.equal(migrated.version, s.version);
});
```

- [ ] **Step 2: Esegui → deve fallire**

Run: `node --test scripts/tests/io.test.js`
Expected: FAIL (`io.js` inesistente).

- [ ] **Step 3: Implementa `src/store/io.js`**

```js
// src/store/io.js
import { SCHEMA_VERSION } from '../model/schema.js';

export function serializeState(state) {
  const payload = {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    characters: state.characters,
    transactions: state.transactions,
  };
  const json = JSON.stringify(payload, null, 2);
  return json;
}

export function migrate(data) {
  // V1: nessuna migrazione. Hook per versioni future: if (data.version < 2) {...}
  const migrated = { ...data, version: SCHEMA_VERSION };
  return migrated;
}

export function validateState(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Stato non valido: non è un oggetto');
  }
  if (!Array.isArray(data.characters) || !Array.isArray(data.transactions)) {
    throw new Error('Stato non valido: characters/transactions mancanti');
  }
  const ids = new Set(data.characters.map((c) => c.id));
  for (const tx of data.transactions) {
    if (!ids.has(tx.fromId) || !ids.has(tx.toId)) {
      throw new Error(`Integrità referenziale rotta: transazione ${tx.id} punta a un personaggio inesistente`);
    }
  }
  return true;
}

export function parseImport(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new Error(`JSON non valido: ${err.message}`);
  }
  const migrated = migrate(data);
  validateState(migrated);
  const state = {
    version: migrated.version,
    characters: migrated.characters,
    transactions: migrated.transactions,
  };
  return state;
}
```

- [ ] **Step 4: Esegui → deve passare**

Run: `node --test scripts/tests/io.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/io.js scripts/tests/io.test.js
git commit -m "[FEAT] IO: serialize, validate, migrate, parseImport"
```

---

## Task 8: createStore — stato, dispatch, subscribe, persistenza (STORE)

**Files:**
- Create: `src/store/store.js`
- Modify: `scripts/tests/store.test.js`

- [ ] **Step 1: Aggiungi i test fallenti in `scripts/tests/store.test.js`**

```js
import { memoryStorageAdapter } from '../../src/store/storage.js';
import { createStore } from '../../src/store/store.js';
import { addCharacter } from '../../src/model/reputation.js';

test('createStore parte da stato vuoto se storage vuoto', () => {
  const store = createStore({ storage: memoryStorageAdapter() });
  assert.deepEqual(store.getState().characters, []);
});

test('dispatch applica una funzione MODEL e aggiorna lo stato', () => {
  const store = createStore({ storage: memoryStorageAdapter() });
  store.dispatch((s) => addCharacter(s, 'A'));
  assert.equal(store.getState().characters.length, 1);
});

test('dispatch persiste su storage (ricaricando si ritrova lo stato)', () => {
  const storage = memoryStorageAdapter();
  const store1 = createStore({ storage });
  store1.dispatch((s) => addCharacter(s, 'A'));
  const store2 = createStore({ storage });
  assert.equal(store2.getState().characters.length, 1);
  assert.equal(store2.getState().characters[0].name, 'A');
});

test('subscribe notifica i listener a ogni dispatch', () => {
  const store = createStore({ storage: memoryStorageAdapter() });
  let calls = 0;
  store.subscribe(() => { calls += 1; });
  store.dispatch((s) => addCharacter(s, 'A'));
  store.dispatch((s) => addCharacter(s, 'B'));
  assert.equal(calls, 2);
});

test('replaceState sostituisce lo stato e persiste', () => {
  const storage = memoryStorageAdapter();
  const store = createStore({ storage });
  store.dispatch((s) => addCharacter(s, 'A'));
  store.replaceState({ version: 1, characters: [], transactions: [] });
  assert.equal(store.getState().characters.length, 0);
  const reloaded = createStore({ storage });
  assert.equal(reloaded.getState().characters.length, 0);
});
```

- [ ] **Step 2: Esegui → deve fallire**

Run: `node --test scripts/tests/store.test.js`
Expected: FAIL (`store.js` inesistente).

- [ ] **Step 3: Implementa `src/store/store.js`**

```js
// src/store/store.js
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
```

- [ ] **Step 4: Esegui → deve passare**

Run: `node --test scripts/tests/store.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/store.js scripts/tests/store.test.js
git commit -m "[FEAT] createStore con dispatch/subscribe/persistenza"
```

---

## Task 9: Helper DOM (VIEW)

**Files:**
- Create: `src/view/dom.js`

- [ ] **Step 1: Implementa `src/view/dom.js`** (utility di rendering, niente logica di dominio)

```js
// src/view/dom.js
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') {
      node.className = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'text') {
      node.textContent = value;
    } else {
      node.setAttribute(key, value);
    }
  }
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined) {
      continue;
    }
    const appended = typeof child === 'string' ? document.createTextNode(child) : child;
    node.appendChild(appended);
  }
  return node;
}

export function clear(container) {
  container.replaceChildren();
}
```

- [ ] **Step 2: Commit** (nessun test automatico per la VIEW — verifica nel browser al Task 16)

```bash
git add src/view/dom.js
git commit -m "[FEAT] Helper DOM per la VIEW"
```

---

## Task 10: renderToolbar (VIEW)

**Files:**
- Create: `src/view/toolbar.js`

- [ ] **Step 1: Implementa `src/view/toolbar.js`**

```js
// src/view/toolbar.js
import { el, clear } from './dom.js';

// callbacks: { onAddCharacter(name), onExport(), onImport(file), onToggleArchived(visible) }
export function renderToolbar(container, state, callbacks, showArchived) {
  clear(container);

  const nameInput = el('input', { type: 'text', placeholder: 'Nome personaggio' });

  const addBtn = el('button', {
    text: '+ Personaggio',
    onClick: () => {
      const name = nameInput.value.trim();
      if (name.length === 0) {
        return;
      }
      callbacks.onAddCharacter(name);
      nameInput.value = '';
    },
  });

  const exportBtn = el('button', { text: 'Scarica', onClick: () => callbacks.onExport() });

  const importInput = el('input', {
    type: 'file',
    accept: 'application/json',
    onChange: (e) => {
      const file = e.target.files[0];
      if (file) {
        callbacks.onImport(file);
      }
    },
  });

  const archivedToggle = el('label', {}, [
    el('input', {
      type: 'checkbox',
      onChange: (e) => callbacks.onToggleArchived(e.target.checked),
    }),
    ' Mostra archiviati',
  ]);
  if (showArchived) {
    archivedToggle.querySelector('input').checked = true;
  }

  const bar = el('div', { class: 'toolbar' }, [
    nameInput, addBtn, exportBtn,
    el('label', { class: 'import' }, ['Carica', importInput]),
    archivedToggle,
  ]);
  container.appendChild(bar);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/view/toolbar.js
git commit -m "[FEAT] renderToolbar"
```

---

## Task 11: renderMatrix (VIEW)

**Files:**
- Create: `src/view/matrix.js`

- [ ] **Step 1: Implementa `src/view/matrix.js`**

```js
// src/view/matrix.js
import { el, clear } from './dom.js';
import { listActiveCharacters, computeScore } from '../model/reputation.js';

function scoreColor(score) {
  // 1 = rosso (0deg), 100 = verde (120deg)
  const hue = Math.round(((score - 1) / 99) * 120);
  const color = `hsl(${hue}, 70%, 75%)`;
  return color;
}

// onCellClick(fromId, toId)
export function renderMatrix(container, state, onCellClick) {
  clear(container);
  const chars = listActiveCharacters(state);

  if (chars.length < 2) {
    container.appendChild(el('p', { text: 'Aggiungi almeno due personaggi.' }));
    return;
  }

  const headerCells = [el('th', { text: 'da \\ a' })];
  for (const c of chars) {
    headerCells.push(el('th', { text: c.name }));
  }
  const thead = el('thead', {}, [el('tr', {}, headerCells)]);

  const rows = [];
  for (const from of chars) {
    const cells = [el('th', { text: from.name })];
    for (const to of chars) {
      if (from.id === to.id) {
        cells.push(el('td', { class: 'diagonal', text: '—' }));
        continue;
      }
      const score = computeScore(state, from.id, to.id);
      const cell = el('td', {
        class: 'score-cell',
        style: `background:${scoreColor(score)}`,
        text: String(score),
        onClick: () => onCellClick(from.id, to.id),
      });
      cells.push(cell);
    }
    rows.push(el('tr', {}, cells));
  }
  const tbody = el('tbody', {}, rows);

  container.appendChild(el('table', { class: 'matrix' }, [thead, tbody]));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/view/matrix.js
git commit -m "[FEAT] renderMatrix con colore per punteggio"
```

---

## Task 12: renderTransactionPanel (VIEW)

**Files:**
- Create: `src/view/transactionPanel.js`

- [ ] **Step 1: Implementa `src/view/transactionPanel.js`**

```js
// src/view/transactionPanel.js
import { el, clear } from './dom.js';
import { listTransactions, computeScore } from '../model/reputation.js';

function charName(state, id) {
  const found = state.characters.find((c) => c.id === id);
  const name = found ? found.name : '???';
  return name;
}

// callbacks: { onAdd(fromId,toId,delta,name), onEdit(txId,{delta,name}), onDelete(txId), onClose() }
export function renderTransactionPanel(container, state, fromId, toId, callbacks) {
  clear(container);
  if (!fromId || !toId) {
    return;
  }

  const score = computeScore(state, fromId, toId);
  const title = el('h3', {
    text: `${charName(state, fromId)} → ${charName(state, toId)} : ${score}`,
  });
  const closeBtn = el('button', { text: 'Chiudi', onClick: () => callbacks.onClose() });

  const list = listTransactions(state, fromId, toId);
  const rows = list.map((tx) => {
    const deltaInput = el('input', { type: 'number', value: String(tx.delta) });
    const nameInput = el('input', { type: 'text', value: tx.name });
    const saveBtn = el('button', {
      text: 'Salva',
      onClick: () => callbacks.onEdit(tx.id, {
        delta: Number(deltaInput.value),
        name: nameInput.value.trim(),
      }),
    });
    const delBtn = el('button', { text: 'Elimina', onClick: () => callbacks.onDelete(tx.id) });
    const row = el('li', {}, [deltaInput, nameInput, saveBtn, delBtn]);
    return row;
  });
  const listEl = el('ul', { class: 'tx-list' }, rows);

  // form aggiunta
  const newDelta = el('input', { type: 'number', placeholder: 'Delta (es. -5)' });
  const newName = el('input', { type: 'text', placeholder: 'Motivo' });
  const addBtn = el('button', {
    text: 'Aggiungi transazione',
    onClick: () => {
      const delta = Number(newDelta.value);
      const name = newName.value.trim();
      if (Number.isNaN(delta) || name.length === 0) {
        return;
      }
      callbacks.onAdd(fromId, toId, delta, name);
    },
  });
  const addForm = el('div', { class: 'tx-add' }, [newDelta, newName, addBtn]);

  container.appendChild(el('div', { class: 'panel' }, [title, closeBtn, listEl, addForm]));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/view/transactionPanel.js
git commit -m "[FEAT] renderTransactionPanel con CRUD transazioni"
```

---

## Task 13: app.js — bootstrap e cablaggio (VIEW)

**Files:**
- Create: `src/view/app.js`

- [ ] **Step 1: Implementa `src/view/app.js`**

```js
// src/view/app.js
import { localStorageAdapter } from '../store/storage.js';
import { createStore } from '../store/store.js';
import { serializeState, parseImport } from '../store/io.js';
import {
  addCharacter, addTransaction, editTransaction, deleteTransaction,
  softDeleteCharacter, restoreCharacter, hardDeleteCharacter,
} from '../model/reputation.js';
import { renderToolbar } from './toolbar.js';
import { renderMatrix } from './matrix.js';
import { renderTransactionPanel } from './transactionPanel.js';

const store = createStore({ storage: localStorageAdapter() });

const ui = { selected: null, showArchived: false };

const toolbarEl = document.getElementById('toolbar');
const matrixEl = document.getElementById('matrix');
const panelEl = document.getElementById('panel');

function downloadJson(text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `reputation-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const state = parseImport(reader.result);
      if (!window.confirm('Importare sovrascrive i dati correnti. Procedere?')) {
        return;
      }
      store.replaceState(state);
    } catch (err) {
      window.alert(`Import fallito: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

const toolbarCallbacks = {
  onAddCharacter: (name) => store.dispatch((s) => addCharacter(s, name)),
  onExport: () => downloadJson(serializeState(store.getState())),
  onImport: (file) => importFromFile(file),
  onToggleArchived: (visible) => { ui.showArchived = visible; render(); },
};

const panelCallbacks = {
  onAdd: (fromId, toId, delta, name) => store.dispatch((s) => addTransaction(s, fromId, toId, delta, name)),
  onEdit: (txId, changes) => store.dispatch((s) => editTransaction(s, txId, changes)),
  onDelete: (txId) => store.dispatch((s) => deleteTransaction(s, txId)),
  onClose: () => { ui.selected = null; render(); },
};

function onCellClick(fromId, toId) {
  ui.selected = { fromId, toId };
  render();
}

function render() {
  const state = store.getState();
  renderToolbar(toolbarEl, state, toolbarCallbacks, ui.showArchived);
  renderMatrix(matrixEl, state, onCellClick);
  if (ui.selected) {
    renderTransactionPanel(panelEl, state, ui.selected.fromId, ui.selected.toId, panelCallbacks);
  } else {
    panelEl.replaceChildren();
  }
  // espone azioni archivio per uso futuro nella vista archiviati
  ui.archiveActions = {
    soft: (id) => store.dispatch((s) => softDeleteCharacter(s, id)),
    restore: (id) => store.dispatch((s) => restoreCharacter(s, id)),
    hard: (id) => store.dispatch((s) => hardDeleteCharacter(s, id)),
  };
}

store.subscribe(() => render());
render();
```

- [ ] **Step 2: Commit**

```bash
git add src/view/app.js
git commit -m "[FEAT] Bootstrap app e cablaggio store-view"
```

---

## Task 14: Sezione archiviati e azioni delete nella VIEW

**Files:**
- Modify: `src/view/matrix.js` (aggiungi `renderArchived`)
- Modify: `src/view/app.js` (mostra archiviati quando il toggle è attivo)

- [ ] **Step 1: Aggiungi `renderArchived` in `src/view/matrix.js`**

```js
import { listActiveCharacters, listArchivedCharacters, computeScore } from '../model/reputation.js';
// (estendi l'import con listArchivedCharacters)

// callbacks: { onRestore(id), onHardDelete(id) }
export function renderArchived(container, state, callbacks) {
  clear(container);
  const archived = listArchivedCharacters(state);
  if (archived.length === 0) {
    return;
  }
  const items = archived.map((c) => {
    const restoreBtn = el('button', { text: 'Ripristina', onClick: () => callbacks.onRestore(c.id) });
    const hardBtn = el('button', {
      text: 'Elimina definitivamente',
      onClick: () => callbacks.onHardDelete(c.id),
    });
    const row = el('li', {}, [c.name + ' ', restoreBtn, hardBtn]);
    return row;
  });
  const block = el('div', { class: 'archived' }, [
    el('h3', { text: 'Personaggi archiviati' }),
    el('ul', {}, items),
  ]);
  container.appendChild(block);
}
```

- [ ] **Step 2: Aggiungi un contenitore archiviati in `index.html`**

In `index.html`, dopo `<div id="matrix"></div>`, inserisci:

```html
  <div id="archived"></div>
```

- [ ] **Step 3: Cabla archiviati e soft-delete in `src/view/app.js`**

Sostituisci la funzione `render` e aggiungi import/handler:

```js
import { renderMatrix, renderArchived } from './matrix.js';
// (estendi l'import esistente di matrix.js)

const archivedEl = document.getElementById('archived');

const archivedCallbacks = {
  onRestore: (id) => store.dispatch((s) => restoreCharacter(s, id)),
  onHardDelete: (id) => {
    if (window.confirm('Eliminazione DEFINITIVA e irreversibile. Confermi?')) {
      store.dispatch((s) => hardDeleteCharacter(s, id));
    }
  },
};

function onCharSoftDelete(id) {
  store.dispatch((s) => softDeleteCharacter(s, id));
}

function render() {
  const state = store.getState();
  renderToolbar(toolbarEl, state, toolbarCallbacks, ui.showArchived);
  renderMatrix(matrixEl, state, onCellClick, onCharSoftDelete);
  if (ui.showArchived) {
    renderArchived(archivedEl, state, archivedCallbacks);
  } else {
    archivedEl.replaceChildren();
  }
  if (ui.selected) {
    renderTransactionPanel(panelEl, state, ui.selected.fromId, ui.selected.toId, panelCallbacks);
  } else {
    panelEl.replaceChildren();
  }
}
```

Rimuovi il vecchio blocco `ui.archiveActions` (sostituito da `archivedCallbacks`).

- [ ] **Step 4: Aggiungi pulsante archivia su ogni riga in `src/view/matrix.js`**

Estendi la firma di `renderMatrix` e aggiungi un bottone nella prima cella di riga:

```js
// firma: renderMatrix(container, state, onCellClick, onSoftDelete)
// nella costruzione della riga, sostituisci:
//   const cells = [el('th', { text: from.name })];
// con:
const archiveBtn = el('button', {
  text: '🗑',
  title: 'Archivia',
  onClick: () => onSoftDelete(from.id),
});
const cells = [el('th', {}, [from.name + ' ', archiveBtn])];
```

- [ ] **Step 5: Commit**

```bash
git add src/view/matrix.js src/view/app.js index.html
git commit -m "[FEAT] Vista archiviati con restore e hard delete"
```

---

## Task 15: Stili CSS

**Files:**
- Modify: `styles/main.css`

- [ ] **Step 1: Scrivi `styles/main.css` completo**

```css
:root { font-family: system-ui, sans-serif; }
body { margin: 1rem; }

.toolbar { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
.toolbar input[type=file] { display: none; }
.toolbar .import { border: 1px solid #ccc; padding: 0.3rem 0.6rem; cursor: pointer; border-radius: 4px; }

.matrix { border-collapse: collapse; }
.matrix th, .matrix td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: center; }
.matrix th { background: #f3f3f3; }
.matrix .diagonal { background: #eee; color: #999; }
.matrix .score-cell { cursor: pointer; font-weight: 600; }

.panel { margin-top: 1rem; border: 1px solid #ccc; padding: 1rem; border-radius: 6px; }
.tx-list { list-style: none; padding: 0; }
.tx-list li { display: flex; gap: 0.4rem; margin-bottom: 0.4rem; }
.tx-add { display: flex; gap: 0.4rem; margin-top: 0.6rem; }

.archived { margin-top: 1rem; }
.archived ul { list-style: none; padding: 0; }
.archived li { margin-bottom: 0.4rem; }
```

- [ ] **Step 2: Commit**

```bash
git add styles/main.css
git commit -m "[STYLE] CSS matrice, toolbar, pannello, archiviati"
```

---

## Task 16: Verifica manuale nel browser

**Files:** nessuno (verifica end-to-end)

- [ ] **Step 1: Apri l'app**

Apri `index.html` nel browser (doppio click o `file://`). Gli ES module funzionano via `file://` nei browser moderni; se il browser blocca il caricamento, servi la cartella: `python -m http.server` e apri `http://localhost:8000`.

- [ ] **Step 2: Checklist funzionale**

Verifica nell'ordine:
1. Aggiungi 3 personaggi → matrice 3×3 appare, tutte le celle = 50, diagonale `—`.
2. Click su una cella → pannello transazioni si apre con titolo `A → B : 50`.
3. Aggiungi transazione `+10 "aiuto"` → punteggio cella diventa 60, colore più verde.
4. Aggiungi `-30` → 30, più rosso. Verifica che `B → A` resti 50 (asimmetria).
5. Modifica una transazione → punteggio si aggiorna. Elimina → torna a 50.
6. Ricarica la pagina → i dati persistono (localStorage).
7. `Scarica` → scarica file JSON con i dati.
8. Archivia un personaggio (🗑) → sparisce dalla matrice. Toggle `Mostra archiviati` → compare con Ripristina / Elimina definitivamente.
9. Ripristina → torna in matrice. Archivia di nuovo → Elimina definitivamente (conferma popup) → sparisce e le sue transazioni spariscono.
10. `Carica` il file scaricato al punto 7 → popup conferma → stato ripristinato a prima delle modifiche successive.

- [ ] **Step 3: Esegui l'intera suite di test**

Run: `npm test`
Expected: tutti i test MODEL/STORE/IO passano.

- [ ] **Step 4: Commit finale (se servono fix dalla verifica)**

```bash
git add -A
git commit -m "[FIX] Correzioni da verifica manuale"
```

---

## Note di esecuzione

- **Import incrementali in `reputation.js`**: i Task 3/4/5 estendono la riga di import da `./schema.js`. Mantieni una sola riga import che cumula i simboli (`BASE, createCharacter, createTransaction`).
- **Ordine di build**: MODEL (1-5) → STORE (6-8) → VIEW (9-15) → verifica (16). MODEL e STORE sono completamente testati prima di scrivere una riga di VIEW.
- **Estendere a Python (futuro)**: `schema.js` + `reputation.js` mappano 1:1 su dataclass + funzioni Python; `io.js` definisce il contratto JSON; solo `storage.js`/`store.js` cambiano (file/DB invece di localStorage).
```
