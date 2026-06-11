# Gruppi e reputazione — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introdurre l'entità `Gruppo` (contenitore generico di personaggi) come nodo di reputazione diretto + aggregato derivato dai membri, con persistenza e migrazione v1→v2.

**Architecture:** Tre layer, dipendenze solo verso il basso. Logica di reputazione SOLO nel MODEL (`src/model/`, funzionale e framework-agnostico). Lo STORE è generico (`dispatch(modelFn)`): non serve API per-entità, basta passare le nuove funzioni MODEL. IO gestisce serializzazione, migrazione e validazione. La VIEW (Vue 3) parla solo con lo store e si verifica a mano.

**Tech Stack:** Vue 3 + Vite + vue-router (solo VIEW). MODEL/STORE/IO vanilla JS ESM. Test: `node:test` (`npm test`).

---

## File Structure

- `src/model/schema.js` — MODIFICA: `SCHEMA_VERSION` → 2, `groups: []` in `createState`, factory `createGroup`.
- `src/model/reputation.js` — MODIFICA: esporta `hasTransaction`; aggiunge CRUD gruppi, membership, `resolveNode`, `groupDerivedIncoming`, `groupDerivedOutgoing`; aggiorna `hardDeleteCharacter`.
- `src/store/io.js` — MODIFICA: `serializeState` include `groups`; `migrate` v1→v2; `validateState` valida `groups` + integrità tx con id gruppo; `parseImport` propaga `groups`.
- `scripts/tests/reputation.test.js` — MODIFICA: test CRUD gruppi, membership, aggregati, `resolveNode`, `hardDeleteCharacter`.
- `scripts/tests/io.test.js` — MODIFICA: test serializzazione gruppi, migrazione v1→v2, round-trip, validazione integrità con gruppi.
- `scripts/tests/store.test.js` — MODIFICA: round-trip dispatch su gruppo.
- VIEW (verifica manuale, no TDD): nuova `src/view/components/GroupsView.vue` + `GroupProfileView.vue`, rotte in `src/view/router.js`, voci in `src/view/components/AppDrawer.vue`, integrazione in `ProfileView.vue`.

---

## Task 1: Schema gruppi

**Files:**
- Modify: `src/model/schema.js`
- Test: `scripts/tests/reputation.test.js`

- [ ] **Step 1: Scrivi il test che fallisce** (in `reputation.test.js`, aggiungi import `createGroup`, `createState`, `SCHEMA_VERSION` da `../../src/model/schema.js`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createGroup, SCHEMA_VERSION } from '../../src/model/schema.js';

test('SCHEMA_VERSION è 2', () => {
  assert.equal(SCHEMA_VERSION, 2);
});

test('createState include groups vuoto', () => {
  const state = createState();
  assert.deepEqual(state.groups, []);
  assert.equal(state.version, 2);
});

test('createGroup crea gruppo con campi attesi', () => {
  const g = createGroup('Ladri', 'gilda');
  assert.equal(typeof g.id, 'string');
  assert.equal(g.name, 'Ladri');
  assert.equal(g.type, 'gilda');
  assert.deepEqual(g.memberIds, []);
  assert.equal(g.deletedAt, null);
});

test('createGroup senza type usa stringa vuota', () => {
  const g = createGroup('Senza tipo');
  assert.equal(g.type, '');
});
```

- [ ] **Step 2: Esegui i test, verifica fallimento**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (`SCHEMA_VERSION` ≠ 2, `createGroup` non definita).

- [ ] **Step 3: Implementa in `schema.js`**

Cambia `export const SCHEMA_VERSION = 1;` in `= 2;`. Aggiungi `groups: []` a `createState`. Aggiungi factory:

```js
export function createGroup(name, type = '') {
  const group = {
    id: newId(),
    name,
    type,
    memberIds: [],
    deletedAt: null,
  };
  return group;
}
```

E in `createState`:

```js
export function createState() {
  const state = {
    version: SCHEMA_VERSION,
    characters: [],
    transactions: [],
    groups: [],
  };
  return state;
}
```

- [ ] **Step 4: Esegui i test, verifica successo**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS i 4 nuovi test. (Possibili FAIL altrove in io/store: attesi, sistemati nei task successivi.)

- [ ] **Step 5: Commit**

```bash
git add src/model/schema.js scripts/tests/reputation.test.js
git commit -m "[MODEL] Schema Gruppo: createGroup, groups in state, SCHEMA_VERSION 2"
```

---

## Task 2: Esporta hasTransaction

**Files:**
- Modify: `src/model/reputation.js`

`groupDerivedIncoming/Outgoing` (Task 4) e la VIEW usano `hasTransaction`, oggi privata.

- [ ] **Step 1: Scrivi il test che fallisce** (in `reputation.test.js`)

```js
import { hasTransaction, addCharacter, addTransaction } from '../../src/model/reputation.js';

test('hasTransaction è esportata e rileva una transazione', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  const [a, b] = s.characters;
  assert.equal(hasTransaction(s, a.id, b.id), false);
  s = addTransaction(s, a.id, b.id, 5, 't');
  assert.equal(hasTransaction(s, a.id, b.id), true);
});
```

- [ ] **Step 2: Esegui, verifica fallimento**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (`hasTransaction` non esportata).

- [ ] **Step 3: Implementa**

In `reputation.js` cambia `function hasTransaction(...)` in `export function hasTransaction(...)`. Nessun'altra modifica.

- [ ] **Step 4: Esegui, verifica successo**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js scripts/tests/reputation.test.js
git commit -m "[MODEL] Esporta hasTransaction per riuso aggregati gruppo"
```

---

## Task 3: CRUD gruppi e membership

**Files:**
- Modify: `src/model/reputation.js`
- Test: `scripts/tests/reputation.test.js`

- [ ] **Step 1: Scrivi i test che falliscono**

```js
import {
  addGroup, listActiveGroups, listArchivedGroups,
  softDeleteGroup, restoreGroup, hardDeleteGroup,
  addMember, removeMember,
} from '../../src/model/reputation.js';

test('addGroup aggiunge un gruppo attivo', () => {
  let s = createState();
  s = addGroup(s, 'Guardie', 'fazione');
  assert.equal(s.groups.length, 1);
  assert.equal(s.groups[0].name, 'Guardie');
  assert.equal(s.groups[0].type, 'fazione');
  assert.deepEqual(listActiveGroups(s).map((g) => g.name), ['Guardie']);
});

test('soft delete e restore gruppo', () => {
  let s = createState();
  s = addGroup(s, 'G', '');
  const id = s.groups[0].id;
  s = softDeleteGroup(s, id);
  assert.equal(listActiveGroups(s).length, 0);
  assert.equal(listArchivedGroups(s).length, 1);
  s = restoreGroup(s, id);
  assert.equal(listActiveGroups(s).length, 1);
  assert.equal(listArchivedGroups(s).length, 0);
});

test('addMember è idempotente e non duplica', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const charId = s.characters[0].id;
  const groupId = s.groups[0].id;
  s = addMember(s, groupId, charId);
  s = addMember(s, groupId, charId);
  assert.deepEqual(s.groups[0].memberIds, [charId]);
});

test('addMember ignora personaggio inesistente', () => {
  let s = createState();
  s = addGroup(s, 'G', '');
  const groupId = s.groups[0].id;
  s = addMember(s, groupId, 'id-fantasma');
  assert.deepEqual(s.groups[0].memberIds, []);
});

test('removeMember toglie il membro ed è idempotente', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const charId = s.characters[0].id;
  const groupId = s.groups[0].id;
  s = addMember(s, groupId, charId);
  s = removeMember(s, groupId, charId);
  assert.deepEqual(s.groups[0].memberIds, []);
  s = removeMember(s, groupId, charId);
  assert.deepEqual(s.groups[0].memberIds, []);
});

test('hardDeleteGroup rimuove gruppo e sue transazioni dirette, non i membri', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const charId = s.characters[0].id;
  const groupId = s.groups[0].id;
  s = addMember(s, groupId, charId);
  s = addTransaction(s, charId, groupId, 10, 'verso gruppo'); // diretta
  s = addTransaction(s, groupId, charId, -5, 'dal gruppo');    // diretta
  s = hardDeleteGroup(s, groupId);
  assert.equal(s.groups.length, 0);
  assert.equal(s.transactions.length, 0); // tx dirette del gruppo rimosse
  assert.equal(s.characters.length, 1);   // membro intatto
});
```

- [ ] **Step 2: Esegui, verifica fallimento**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (funzioni non definite).

- [ ] **Step 3: Implementa in `reputation.js`** (stesso pattern stato→stato dei personaggi)

```js
export function addGroup(state, name, type) {
  const group = createGroup(name, type);
  const next = { ...state, groups: [...state.groups, group] };
  return next;
}

export function listActiveGroups(state) {
  const active = state.groups.filter((g) => g.deletedAt === null);
  return active;
}

export function listArchivedGroups(state) {
  const archived = state.groups.filter((g) => g.deletedAt !== null);
  return archived;
}

export function softDeleteGroup(state, id) {
  const groups = state.groups.map((g) => {
    if (g.id !== id) {
      return g;
    }
    const updated = { ...g, deletedAt: Date.now() };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}

export function restoreGroup(state, id) {
  const groups = state.groups.map((g) => {
    if (g.id !== id) {
      return g;
    }
    const updated = { ...g, deletedAt: null };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}

export function hardDeleteGroup(state, id) {
  const groups = state.groups.filter((g) => g.id !== id);
  const transactions = state.transactions.filter(
    (tx) => tx.fromId !== id && tx.toId !== id,
  );
  const next = { ...state, groups, transactions };
  return next;
}

export function addMember(state, groupId, charId) {
  const charExists = state.characters.some((c) => c.id === charId);
  if (!charExists) {
    return state;
  }
  const groups = state.groups.map((g) => {
    if (g.id !== groupId) {
      return g;
    }
    if (g.memberIds.includes(charId)) {
      return g;
    }
    const updated = { ...g, memberIds: [...g.memberIds, charId] };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}

export function removeMember(state, groupId, charId) {
  const groups = state.groups.map((g) => {
    if (g.id !== groupId) {
      return g;
    }
    const memberIds = g.memberIds.filter((mid) => mid !== charId);
    const updated = { ...g, memberIds };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}
```

Aggiungi `createGroup` all'import da `./schema.js` in cima a `reputation.js`.

- [ ] **Step 4: Esegui, verifica successo**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS tutti.

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js scripts/tests/reputation.test.js
git commit -m "[MODEL] CRUD gruppi e membership"
```

---

## Task 4: resolveNode + aggregati derivati

**Files:**
- Modify: `src/model/reputation.js`
- Test: `scripts/tests/reputation.test.js`

- [ ] **Step 1: Scrivi i test che falliscono**

```js
import {
  resolveNode, groupDerivedIncoming, groupDerivedOutgoing, computeScore,
} from '../../src/model/reputation.js';

test('resolveNode distingue personaggio, gruppo e id ignoto', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const charId = s.characters[0].id;
  const groupId = s.groups[0].id;
  assert.equal(resolveNode(s, charId).kind, 'character');
  assert.equal(resolveNode(s, groupId).kind, 'group');
  assert.equal(resolveNode(s, 'ignoto'), null);
});

test('groupDerivedIncoming: media membri qualificati, neutri esclusi', () => {
  // X considera il gruppo = media di come X considera i membri con tx X->m
  let s = createState();
  s = addCharacter(s, 'X');
  s = addCharacter(s, 'M1');
  s = addCharacter(s, 'M2');
  s = addCharacter(s, 'M3');
  s = addGroup(s, 'G', '');
  const [x, m1, m2, m3] = s.characters;
  const g = s.groups[0];
  s = addMember(s, g.id, m1.id);
  s = addMember(s, g.id, m2.id);
  s = addMember(s, g.id, m3.id);
  s = addTransaction(s, x.id, m1.id, 20, 't'); // score 70
  s = addTransaction(s, x.id, m2.id, -10, 't'); // score 40
  // m3 senza transazione X->m3 => escluso
  const expected = Math.round((computeScore(s, x.id, m1.id) + computeScore(s, x.id, m2.id)) / 2);
  assert.equal(groupDerivedIncoming(s, x.id, g.id), expected); // 55
});

test('groupDerivedIncoming è null se nessun membro qualificato', () => {
  let s = createState();
  s = addCharacter(s, 'X');
  s = addCharacter(s, 'M1');
  s = addGroup(s, 'G', '');
  const [x, m1] = s.characters;
  const g = s.groups[0];
  s = addMember(s, g.id, m1.id);
  assert.equal(groupDerivedIncoming(s, x.id, g.id), null);
});

test('groupDerivedOutgoing: media di come i membri considerano X', () => {
  let s = createState();
  s = addCharacter(s, 'X');
  s = addCharacter(s, 'M1');
  s = addCharacter(s, 'M2');
  s = addGroup(s, 'G', '');
  const [x, m1, m2] = s.characters;
  const g = s.groups[0];
  s = addMember(s, g.id, m1.id);
  s = addMember(s, g.id, m2.id);
  s = addTransaction(s, m1.id, x.id, 30, 't'); // 80
  // m2 senza tx m2->X => escluso
  assert.equal(groupDerivedOutgoing(s, g.id, x.id), computeScore(s, m1.id, x.id)); // 80
});

test('groupDerivedOutgoing è null se nessun membro qualificato', () => {
  let s = createState();
  s = addCharacter(s, 'X');
  s = addCharacter(s, 'M1');
  s = addGroup(s, 'G', '');
  const [x, m1] = s.characters;
  const g = s.groups[0];
  s = addMember(s, g.id, m1.id);
  assert.equal(groupDerivedOutgoing(s, g.id, x.id), null);
});
```

- [ ] **Step 2: Esegui, verifica fallimento**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (funzioni non definite).

- [ ] **Step 3: Implementa in `reputation.js`**

```js
export function resolveNode(state, id) {
  const character = state.characters.find((c) => c.id === id);
  if (character) {
    const node = { kind: 'character', entity: character };
    return node;
  }
  const group = state.groups.find((g) => g.id === id);
  if (group) {
    const node = { kind: 'group', entity: group };
    return node;
  }
  return null;
}

function averageQualifiedScores(state, memberIds, scoreFn) {
  const qualified = memberIds.filter((mid) => scoreFn.has(state, mid));
  if (qualified.length === 0) {
    return null;
  }
  const total = qualified.reduce((acc, mid) => acc + scoreFn.score(state, mid), 0);
  const average = Math.round(total / qualified.length);
  return average;
}

export function groupDerivedIncoming(state, sourceId, groupId) {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) {
    return null;
  }
  const average = averageQualifiedScores(state, group.memberIds, {
    has: (s, mid) => hasTransaction(s, sourceId, mid),
    score: (s, mid) => computeScore(s, sourceId, mid),
  });
  return average;
}

export function groupDerivedOutgoing(state, groupId, targetId) {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) {
    return null;
  }
  const average = averageQualifiedScores(state, group.memberIds, {
    has: (s, mid) => hasTransaction(s, mid, targetId),
    score: (s, mid) => computeScore(s, mid, targetId),
  });
  return average;
}
```

- [ ] **Step 4: Esegui, verifica successo**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS tutti.

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js scripts/tests/reputation.test.js
git commit -m "[MODEL] resolveNode e aggregati derivati gruppo"
```

---

## Task 5: Integrità referenziale su hardDeleteCharacter

**Files:**
- Modify: `src/model/reputation.js`
- Test: `scripts/tests/reputation.test.js`

- [ ] **Step 1: Scrivi il test che fallisce**

```js
import { hardDeleteCharacter } from '../../src/model/reputation.js';

test('hardDeleteCharacter ripulisce memberIds dei gruppi', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  s = addGroup(s, 'G', '');
  const [a, b] = s.characters;
  const g = s.groups[0];
  s = addMember(s, g.id, a.id);
  s = addMember(s, g.id, b.id);
  s = hardDeleteCharacter(s, a.id);
  assert.deepEqual(s.groups[0].memberIds, [b.id]);
  assert.equal(s.characters.length, 1);
});
```

- [ ] **Step 2: Esegui, verifica fallimento**

Run: `node --test scripts/tests/reputation.test.js`
Expected: FAIL (memberIds contiene ancora a.id).

- [ ] **Step 3: Implementa** — aggiorna `hardDeleteCharacter` per ripulire anche `groups`:

```js
export function hardDeleteCharacter(state, id) {
  const characters = state.characters.filter((c) => c.id !== id);
  const transactions = state.transactions.filter(
    (tx) => tx.fromId !== id && tx.toId !== id,
  );
  const groups = state.groups.map((g) => {
    if (!g.memberIds.includes(id)) {
      return g;
    }
    const memberIds = g.memberIds.filter((mid) => mid !== id);
    const updated = { ...g, memberIds };
    return updated;
  });
  const next = { ...state, characters, transactions, groups };
  return next;
}
```

- [ ] **Step 4: Esegui, verifica successo**

Run: `node --test scripts/tests/reputation.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js scripts/tests/reputation.test.js
git commit -m "[MODEL] hardDeleteCharacter ripulisce memberIds dei gruppi"
```

---

## Task 6: IO — serializzazione, migrazione v1→v2, validazione

**Files:**
- Modify: `src/store/io.js`
- Test: `scripts/tests/io.test.js`

Nota: `migrate` usa `data.version`; nello schema v1 i salvataggi non hanno `groups`. `validateState` deve accettare `groups` e considerare gli id gruppo validi come endpoint delle transazioni.

- [ ] **Step 1: Scrivi i test che falliscono** (in `io.test.js`)

```js
import { serializeState, parseImport, migrate, validateState } from '../../src/store/io.js';
import { createState, createGroup } from '../../src/model/schema.js';
import { addCharacter, addGroup, addMember, addTransaction } from '../../src/model/reputation.js';

test('serializeState include groups', () => {
  let s = createState();
  s = addGroup(s, 'G', 'fazione');
  const json = serializeState(s);
  const parsed = JSON.parse(json);
  assert.equal(parsed.version, 2);
  assert.equal(parsed.groups.length, 1);
  assert.equal(parsed.groups[0].name, 'G');
});

test('migrate v1 aggiunge groups vuoto e porta version a 2', () => {
  const v1 = { version: 1, characters: [], transactions: [] };
  const migrated = migrate(v1);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.groups, []);
});

test('migrate non sovrascrive groups già presenti', () => {
  const v2 = { version: 2, characters: [], transactions: [], groups: [createGroup('G', '')] };
  const migrated = migrate(v2);
  assert.equal(migrated.groups.length, 1);
});

test('parseImport migra uno stato v1 senza groups', () => {
  const v1json = JSON.stringify({ version: 1, characters: [], transactions: [] });
  const state = parseImport(v1json);
  assert.equal(state.version, 2);
  assert.deepEqual(state.groups, []);
});

test('round-trip export/import con gruppi e transazione diretta su gruppo', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const a = s.characters[0];
  const g = s.groups[0];
  s = addMember(s, g.id, a.id);
  s = addTransaction(s, a.id, g.id, 10, 'verso gruppo'); // endpoint = gruppo
  const restored = parseImport(serializeState(s));
  assert.equal(restored.groups.length, 1);
  assert.equal(restored.transactions.length, 1);
  assert.deepEqual(restored.groups[0].memberIds, [a.id]);
});

test('validateState accetta transazione il cui endpoint è un gruppo', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const a = s.characters[0];
  const g = s.groups[0];
  s = addTransaction(s, a.id, g.id, 5, 't');
  assert.equal(validateState(s), true);
});

test('validateState rifiuta transazione verso id inesistente', () => {
  const bad = {
    version: 2,
    characters: [{ id: 'c1', name: 'A', deletedAt: null }],
    transactions: [{ id: 't1', fromId: 'c1', toId: 'fantasma', delta: 1, name: 'x', createdAt: 1 }],
    groups: [],
  };
  assert.throws(() => validateState(bad));
});
```

- [ ] **Step 2: Esegui, verifica fallimento**

Run: `node --test scripts/tests/io.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementa in `io.js`**

`serializeState` — aggiungi `groups`:

```js
export function serializeState(state) {
  const payload = {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    characters: state.characters,
    transactions: state.transactions,
    groups: state.groups,
  };
  const json = JSON.stringify(payload, null, 2);
  return json;
}
```

`migrate` — porta v1 a v2 aggiungendo `groups` se mancante:

```js
export function migrate(data) {
  const groups = Array.isArray(data.groups) ? data.groups : [];
  const migrated = { ...data, groups, version: SCHEMA_VERSION };
  return migrated;
}
```

`validateState` — valida `groups` e includi gli id gruppo tra gli endpoint validi. Sostituisci il blocco transazioni:

```js
  if (!Array.isArray(data.characters) || !Array.isArray(data.transactions)) {
    throw new Error('Stato non valido: characters/transactions mancanti');
  }
  if (!Array.isArray(data.groups)) {
    throw new Error('Stato non valido: groups mancante');
  }
  for (const c of data.characters) {
    const validId = typeof c.id === 'string' && c.id.length > 0;
    const validName = typeof c.name === 'string';
    const validDeletedAt = c.deletedAt === null || typeof c.deletedAt === 'number';
    if (!validId || !validName || !validDeletedAt) {
      throw new Error(`Personaggio non valido: campi mancanti o errati (${JSON.stringify(c)})`);
    }
  }
  const charIds = new Set(data.characters.map((c) => c.id));
  for (const g of data.groups) {
    const validId = typeof g.id === 'string' && g.id.length > 0;
    const validName = typeof g.name === 'string';
    const validType = typeof g.type === 'string';
    const validMembers = Array.isArray(g.memberIds) && g.memberIds.every((mid) => charIds.has(mid));
    const validDeletedAt = g.deletedAt === null || typeof g.deletedAt === 'number';
    if (!validId || !validName || !validType || !validMembers || !validDeletedAt) {
      throw new Error(`Gruppo non valido: campi mancanti o errati (${JSON.stringify(g)})`);
    }
  }
  const nodeIds = new Set([...charIds, ...data.groups.map((g) => g.id)]);
  for (const tx of data.transactions) {
    const validId = typeof tx.id === 'string' && tx.id.length > 0;
    const validFrom = typeof tx.fromId === 'string';
    const validTo = typeof tx.toId === 'string';
    const validDelta = typeof tx.delta === 'number' && Number.isFinite(tx.delta);
    const validTxName = typeof tx.name === 'string';
    const validCreatedAt = typeof tx.createdAt === 'number';
    if (!validId || !validFrom || !validTo || !validDelta || !validTxName || !validCreatedAt) {
      throw new Error(`Transazione non valida: campi mancanti o errati (${tx.id})`);
    }
    if (!nodeIds.has(tx.fromId) || !nodeIds.has(tx.toId)) {
      throw new Error(`Integrità referenziale rotta: transazione ${tx.id} punta a un nodo inesistente`);
    }
  }
```

`parseImport` — propaga `groups`:

```js
  const state = {
    version: migrated.version,
    characters: migrated.characters,
    transactions: migrated.transactions,
    groups: migrated.groups,
  };
```

- [ ] **Step 4: Esegui, verifica successo**

Run: `node --test scripts/tests/io.test.js`
Expected: PASS tutti.

- [ ] **Step 5: Commit**

```bash
git add src/store/io.js scripts/tests/io.test.js
git commit -m "[IO] groups: serializzazione, migrazione v1->v2, validazione integrità"
```

---

## Task 7: Store — round-trip dispatch su gruppo

**Files:**
- Modify: `scripts/tests/store.test.js`

Lo store è generico (`dispatch(modelFn)`): nessuna modifica al codice store. Aggiorna il `replaceState` test che costruisce uno stato manuale senza `groups`, e aggiungi un round-trip su gruppo.

- [ ] **Step 1: Scrivi/aggiorna i test**

Nel test `replaceState sostituisce lo stato e persiste`, cambia:

```js
  store.replaceState({ version: 2, characters: [], transactions: [], groups: [] });
```

Aggiungi:

```js
import { addGroup } from '../../src/model/reputation.js';

test('dispatch crea un gruppo e lo persiste', () => {
  const storage = memoryStorageAdapter();
  const store1 = createStore({ storage });
  store1.dispatch((s) => addGroup(s, 'G', 'fazione'));
  const store2 = createStore({ storage });
  assert.equal(store2.getState().groups.length, 1);
  assert.equal(store2.getState().groups[0].name, 'G');
});
```

- [ ] **Step 2: Esegui, verifica**

Run: `node --test scripts/tests/store.test.js`
Expected: PASS (il nuovo test passa; `replaceState` resta verde).

- [ ] **Step 3: Suite completa**

Run: `npm test`
Expected: PASS tutta la suite (model, io, store, appFunctions).

- [ ] **Step 4: Commit**

```bash
git add scripts/tests/store.test.js
git commit -m "[STORE] Test round-trip dispatch su gruppo"
```

---

## Task 8: VIEW — gestione gruppi (verifica manuale)

> VIEW non in TDD: si verifica a mano nel browser (convenzione di progetto). Segui i pattern dei componenti esistenti (`CharactersView.vue`, `ProfileView.vue`, `useStore.js`, `router.js`). Niente logica di reputazione nella VIEW: usa solo le funzioni MODEL via store.

**Files:**
- Create: `src/view/components/GroupsView.vue`
- Create: `src/view/components/GroupProfileView.vue`
- Modify: `src/view/router.js`
- Modify: `src/view/components/AppDrawer.vue`
- Modify: `src/view/components/ProfileView.vue`
- Modify: `src/view/appFunctions.js`

- [ ] **Step 1: Rotte** — in `router.js` importa i due nuovi componenti e aggiungi:

```js
{ path: '/gruppi', name: 'groups', component: GroupsView },
{ path: '/gruppo/:id', name: 'groupProfile', component: GroupProfileView, props: true },
```

(prima della catch-all `notfound`).

- [ ] **Step 2: appFunctions** — aggiungi `'groups'` e `'groupProfile'` a `REPUTATION_ROUTES` in `appFunctions.js` perché contino come funzione "reputazione" attiva.

- [ ] **Step 3: GroupsView** — clona la struttura di `CharactersView.vue`. Deve permettere: creare gruppo (nome + type), rinominare, modificare `type`, soft-delete/restore, e link al dettaglio. Azioni via store: `dispatch((s) => addGroup(s, name, type))`, `softDeleteGroup`, `restoreGroup`, `hardDeleteGroup`. Liste da `listActiveGroups` / `listArchivedGroups`.

- [ ] **Step 4: GroupProfileView** — per il gruppo `:id`:
  - gestione membri: lista personaggi membri + aggiungi/rimuovi (`addMember`/`removeMember`, scelta da `listActiveCharacters`);
  - transazioni dirette sul gruppo: riusa il flusso transazioni esistente (`TransactionModal.vue` / `addTransaction`) con `fromId`/`toId` = id gruppo;
  - per ogni personaggio rilevante mostra i **4 numeri** della coppia (X, G):
    - X→G diretto: `computeScore(s, X, groupId)` se `hasTransaction(s, X, groupId)`, altrimenti "n/d";
    - X→G membri: `groupDerivedIncoming(s, X, groupId)` (null → "n/d");
    - G→X diretto: `computeScore(s, groupId, X)` se `hasTransaction(s, groupId, X)`, altrimenti "n/d";
    - G→X membri: `groupDerivedOutgoing(s, groupId, X)` (null → "n/d").
  - Etichette chiare: "verso il gruppo (diretto)" / "verso il gruppo (membri)" / "dal gruppo (diretto)" / "dal gruppo (membri)".

- [ ] **Step 5: ProfileView** — nel profilo personaggio, mostra i gruppi di cui è membro (filtra `listActiveGroups` per `memberIds.includes(charId)`) con link a `GroupProfileView`.

- [ ] **Step 6: AppDrawer** — aggiungi voce di navigazione "Gruppi" → route `groups`, sullo stile delle voci esistenti.

- [ ] **Step 7: Verifica manuale nel browser**

Run: `npm run dev`
Checklist:
- [ ] Creazione gruppo con nome e type; compare in lista.
- [ ] Aggiunta/rimozione membri; nessun duplicato.
- [ ] Transazione diretta su gruppo: il punteggio "diretto" appare; senza transazione mostra "n/d".
- [ ] Aggregato "membri" = media dei membri qualificati; "n/d" se nessuno.
- [ ] Soft-delete/restore gruppo.
- [ ] hardDelete personaggio membro → sparisce dai memberIds nel dettaglio gruppo.
- [ ] Export → import (round-trip) mantiene gruppi e membri.
- [ ] Caricando un salvataggio v1 esistente, l'app parte e mostra `groups` vuoto (migrazione).

- [ ] **Step 8: Commit**

```bash
git add src/view/components/GroupsView.vue src/view/components/GroupProfileView.vue src/view/router.js src/view/components/AppDrawer.vue src/view/components/ProfileView.vue src/view/appFunctions.js
git commit -m "[VIEW] Gestione gruppi: liste, dettaglio, 4 punteggi per coppia, navigazione"
```

---

## Task 9: Docs

**Files:**
- Modify: `docs/features/005-gruppi-e-reputazione/spec.md` (Stato → COMPLETATA)
- Modify: `docs/README.md` (tracker / mappa)

- [ ] **Step 1:** Aggiorna lo Stato della spec da "BOZZA" a stato di completamento, e aggiorna mappa/tracker in `docs/README.md` (prossimi ID).

- [ ] **Step 2: Commit**

```bash
git add docs/features/005-gruppi-e-reputazione/spec.md docs/README.md
git commit -m "[DOCS] Feature 005: stato completata e tracker"
```

---

## Self-Review (esito)

- **Spec coverage:** schema (T1), CRUD+membership (T3), aggregati+resolveNode (T4), integrità hardDeleteCharacter (T5), IO/migrazione (T6), STORE (T7), VIEW 4-punteggi (T8), testing distribuito in ogni task. `hasTransaction` export (T2) abilita gli aggregati. ✓
- **Type consistency:** `createGroup(name, type='')`, `memberIds`, `resolveNode → {kind, entity}|null`, `groupDerivedIncoming(state, sourceId, groupId)`, `groupDerivedOutgoing(state, groupId, targetId)` usati coerenti tra task. ✓
- **Placeholder scan:** nessun TBD; codice completo in ogni step MODEL/STORE/IO. VIEW volutamente a granularità manuale (convenzione: no TDD sulla VIEW). ✓
