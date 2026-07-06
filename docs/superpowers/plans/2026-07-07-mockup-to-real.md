# Da mockup a reale — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere reali (persistiti in MODEL/STORE) i campi anagrafici delle testate profilo e le note, sostituendo i due componenti mockup con componenti veri collegati allo store.

**Architecture:** Due fasi, dati-prima. P1 costruisce e testa MODEL/STORE (schema v3, 4 entità-vocabolario come lookup leggeri, campi su personaggio e gruppo, migrazione v2→v3, validazione). P2 e P3 collegano la VIEW ai setter dello store, verificate a mano nel browser.

**Tech Stack:** JS ES modules, Vue 3 (SFC script setup), Vite, `node:test`. Nessuna dipendenza nuova.

## Global Constraints

- Schema target: **`SCHEMA_VERSION = 3`**. Nodi del grafo reputazione: **solo** personaggi e gruppi (`resolveNode` invariato).
- Layer: `VIEW → STORE → MODEL`, dipendenze solo verso il basso. MODEL/STORE **framework-agnostici** (nessun `window`/`document`/`localStorage`; port Python intatto). `localStorage` solo nello STORE. Logica di reputazione solo nel MODEL.
- **Stile codice (regola utente):** mai `return <espressione>` calcolata diretta; prima assegna a variabile con nome, poi ritorna la variabile. `return false`/`return null`/`return state` secchi restano OK.
- Funzioni MODEL **pure e immutabili**: ritornano `next` state, non mutano l'argomento (pattern esistente in `reputation.js`).
- Test: un singolo file con `node --test tests/<nome>.test.js` (la forma directory è rotta su Windows). Suite intera: `npm test`.
- Commit: `[TAG] Titolo` (tag da `git-commit-tags-list`), `git add` di file specifici, niente `Co-Authored-By`. Messaggio multi-riga tool Bash → heredoc `git commit -F - <<'EOF' … EOF`.
- Requisiti funzionali: allineare `docs/requisiti-funzionali/` nello stesso lavoro che cambia comportamento (tripwire su commit).

## File Structure

**P1 — dati**
- Modify `src/model/schema.js` — costanti, `createState`, `createCharacter`, `createGroup`, nuovo `createLookup`.
- Modify `src/model/reputation.js` — pool lookup, setter personaggio/gruppo, cascata guida, `characterLevel`.
- Modify `src/store/io.js` — `migrate` v2→v3, `serializeState`, `validateState`.
- Create `tests/lookups.test.js` — pool lookup.
- Create `tests/character-fields.test.js` — setter personaggio + livello derivato.
- Create `tests/group-fields.test.js` — setter gruppo + cascata guida.
- Create `tests/io-v3.test.js` — migrazione/serializzazione/validazione v3.
- Modify `tests/reputation.test.js`, `tests/io.test.js` (+ altri che asseriscono `version === 2`).
- Modify `docs/requisiti-funzionali/01-entita.md`, `05-dati-e-persistenza.md`, ritocco `03`/`04`.

**P2 — testata reale**
- Modify `src/view/components/InlineSelect.vue` — modalità pool-backed (create → id del parent).
- Modify `src/view/components/Many2ManyField.vue` — creazione delegata al parent.
- Create `src/view/components/EntitySheet.vue` (da `EntitySheetMock.vue`) — wiring reale.
- Modify `src/view/components/ProfileView.vue`, `GroupProfileView.vue` — import + props.
- Delete `src/view/components/EntitySheetMock.vue`.

**P3 — note reali**
- Create `src/view/components/Notes.vue` (da `NotesMock.vue`) — wiring reale.
- Modify `ProfileView.vue`, `GroupProfileView.vue` — import + props.
- Delete `src/view/components/NotesMock.vue`.

---

## Task 1: Schema v3 — costanti e costruttori

**Files:**
- Modify: `src/model/schema.js`
- Modify: `tests/reputation.test.js` (asserzioni `version`)
- Test: `tests/reputation.test.js`

**Interfaces:**
- Produces: `SCHEMA_VERSION = 3`; `createState()` con `tags/players/races/classes: []`; `createCharacter(name)` con `{isPg:false, raceId:null, classLevels:[], alignment:'', playerId:null, tagIds:[], notes:''}`; `createGroup(name, type='')` con `{seat:'', guideId:null, motto:'', tagIds:[], notes:''}`; `createLookup(name) → {id, name}`.

- [ ] **Step 1: Aggiorna i test esistenti che asseriscono la versione**

In `tests/reputation.test.js` cambia l'asserzione dentro `test('createState produce stato vuoto valido', …)`:

```javascript
  assert.equal(s.version, 3);
```

- [ ] **Step 2: Scrivi i test dei nuovi costruttori (falliranno)**

Aggiungi in fondo a `tests/reputation.test.js`:

```javascript
test('createState v3 include i quattro pool vuoti', () => {
  const s = createState();
  assert.equal(s.version, 3);
  assert.deepEqual(s.tags, []);
  assert.deepEqual(s.players, []);
  assert.deepEqual(s.races, []);
  assert.deepEqual(s.classes, []);
});

test('createCharacter inizializza i campi anagrafici ai default', () => {
  const c = createCharacter('Aragorn');
  assert.equal(c.isPg, false);
  assert.equal(c.raceId, null);
  assert.deepEqual(c.classLevels, []);
  assert.equal(c.alignment, '');
  assert.equal(c.playerId, null);
  assert.deepEqual(c.tagIds, []);
  assert.equal(c.notes, '');
});

test('createGroup inizializza i nuovi campi ai default', () => {
  const g = createGroup('La Compagnia', 'fazione');
  assert.equal(g.seat, '');
  assert.equal(g.guideId, null);
  assert.equal(g.motto, '');
  assert.deepEqual(g.tagIds, []);
  assert.equal(g.notes, '');
});

test('createLookup genera id e name', () => {
  const it = createLookup('mercenario');
  assert.equal(typeof it.id, 'string');
  assert.ok(it.id.length > 0);
  assert.equal(it.name, 'mercenario');
});
```

Aggiungi `createLookup` all'import in cima al file:

```javascript
import { BASE, SCHEMA_VERSION, createState, createCharacter, createTransaction, createGroup, createLookup } from '../src/model/schema.js';
```

- [ ] **Step 3: Esegui i test per vederli fallire**

Run: `node --test tests/reputation.test.js`
Expected: FAIL (`createLookup` non esportata; default mancanti; `version` 2≠3).

- [ ] **Step 4: Implementa lo schema v3**

Sostituisci in `src/model/schema.js`:

```javascript
export const BASE = 50;
export const SCHEMA_VERSION = 3;

export function newId() {
  const id = crypto.randomUUID();
  return id;
}

export function createState() {
  const state = {
    version: SCHEMA_VERSION,
    characters: [],
    transactions: [],
    groups: [],
    tags: [],
    players: [],
    races: [],
    classes: [],
  };
  return state;
}

export function createGroup(name, type = '') {
  const group = {
    id: newId(),
    name,
    type,
    memberIds: [],
    deletedAt: null,
    seat: '',
    guideId: null,
    motto: '',
    tagIds: [],
    notes: '',
  };
  return group;
}

export function createCharacter(name) {
  const character = {
    id: newId(),
    name,
    deletedAt: null,
    isPg: false,
    raceId: null,
    classLevels: [],
    alignment: '',
    playerId: null,
    tagIds: [],
    notes: '',
  };
  return character;
}

export function createLookup(name) {
  const item = { id: newId(), name };
  return item;
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

- [ ] **Step 5: Esegui i test per vederli passare**

Run: `node --test tests/reputation.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/model/schema.js tests/reputation.test.js
git commit -F - <<'EOF'
[FEAT] Schema v3: pool lookup e campi anagrafici nei costruttori
EOF
```

---

## Task 2: Pool lookup generici

**Files:**
- Modify: `src/model/reputation.js`
- Test: `tests/lookups.test.js`

**Interfaces:**
- Consumes: `createState`, `createLookup` (Task 1).
- Produces: `addLookupItem(state, coll, item) → next` (no-op se id già presente); `renameLookupItem(state, coll, id, name) → next`; `listLookup(state, coll) → array`.

- [ ] **Step 1: Scrivi il test (fallirà)**

Create `tests/lookups.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createLookup } from '../src/model/schema.js';
import { addLookupItem, renameLookupItem, listLookup } from '../src/model/reputation.js';

test('addLookupItem aggiunge un elemento al pool', () => {
  const s0 = createState();
  const tag = createLookup('mercenario');
  const s1 = addLookupItem(s0, 'tags', tag);
  assert.equal(s1.tags.length, 1);
  assert.equal(s1.tags[0].name, 'mercenario');
  assert.equal(s0.tags.length, 0, 'stato originale non mutato');
});

test('addLookupItem è idempotente sullo stesso id', () => {
  const s0 = createState();
  const tag = createLookup('nobile');
  const s1 = addLookupItem(s0, 'tags', tag);
  const s2 = addLookupItem(s1, 'tags', tag);
  assert.equal(s2.tags.length, 1);
});

test('addLookupItem funziona su ogni collezione', () => {
  let s = createState();
  s = addLookupItem(s, 'players', createLookup('Giulia'));
  s = addLookupItem(s, 'races', createLookup('Elfo'));
  s = addLookupItem(s, 'classes', createLookup('Ladro'));
  assert.equal(s.players[0].name, 'Giulia');
  assert.equal(s.races[0].name, 'Elfo');
  assert.equal(s.classes[0].name, 'Ladro');
});

test('renameLookupItem cambia il nome per id', () => {
  const s0 = createState();
  const race = createLookup('Elf');
  const s1 = addLookupItem(s0, 'races', race);
  const s2 = renameLookupItem(s1, 'races', race.id, 'Elfo');
  assert.equal(s2.races[0].name, 'Elfo');
});

test('listLookup ritorna il pool', () => {
  const s0 = createState();
  const s1 = addLookupItem(s0, 'tags', createLookup('mago'));
  assert.deepEqual(listLookup(s1, 'tags').map((t) => t.name), ['mago']);
});
```

- [ ] **Step 2: Esegui per vederlo fallire**

Run: `node --test tests/lookups.test.js`
Expected: FAIL (funzioni non esportate).

- [ ] **Step 3: Implementa le funzioni pool**

Aggiungi in `src/model/reputation.js` (in fondo, prima di `resolveNode` va bene):

```javascript
export function addLookupItem(state, coll, item) {
  const exists = state[coll].some((x) => x.id === item.id);
  if (exists) {
    return state;
  }
  const next = { ...state, [coll]: [...state[coll], item] };
  return next;
}

export function renameLookupItem(state, coll, id, name) {
  const list = state[coll].map((x) => {
    if (x.id !== id) {
      return x;
    }
    const updated = { ...x, name };
    return updated;
  });
  const next = { ...state, [coll]: list };
  return next;
}

export function listLookup(state, coll) {
  const list = state[coll];
  return list;
}
```

- [ ] **Step 4: Esegui per vederlo passare**

Run: `node --test tests/lookups.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js tests/lookups.test.js
git commit -F - <<'EOF'
[FEAT] Pool lookup generici: addLookupItem/renameLookupItem/listLookup
EOF
```

---

## Task 3: Setter personaggio + livello derivato

**Files:**
- Modify: `src/model/reputation.js`
- Test: `tests/character-fields.test.js`

**Interfaces:**
- Consumes: `createState`, `createCharacter` (Task 1).
- Produces: `setRole(state,id,isPg)`, `setRace(state,id,raceId)`, `setAlignment(state,id,alignment)`, `setPlayer(state,id,playerId)`, `setClassLevels(state,id,classLevels)`, `setCharacterTags(state,id,tagIds)`, `setCharacterNotes(state,id,notes)`, `characterLevel(character) → number`. Tutti i setter ritornano `next`.

- [ ] **Step 1: Scrivi il test (fallirà)**

Create `tests/character-fields.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createCharacter } from '../src/model/schema.js';
import {
  setRole, setRace, setAlignment, setPlayer, setClassLevels,
  setCharacterTags, setCharacterNotes, characterLevel,
} from '../src/model/reputation.js';

function withChar() {
  const s0 = createState();
  const c = createCharacter('Aragorn');
  const s1 = { ...s0, characters: [c] };
  return { state: s1, id: c.id };
}

test('setRole cambia isPg senza mutare l originale', () => {
  const { state, id } = withChar();
  const next = setRole(state, id, true);
  assert.equal(next.characters[0].isPg, true);
  assert.equal(state.characters[0].isPg, false);
});

test('setRace, setAlignment, setPlayer aggiornano i riferimenti', () => {
  const { state, id } = withChar();
  let s = setRace(state, id, 'r1');
  s = setAlignment(s, id, 'Caotico Neutrale');
  s = setPlayer(s, id, 'p1');
  assert.equal(s.characters[0].raceId, 'r1');
  assert.equal(s.characters[0].alignment, 'Caotico Neutrale');
  assert.equal(s.characters[0].playerId, 'p1');
});

test('setClassLevels sostituisce l array e characterLevel ne somma i livelli', () => {
  const { state, id } = withChar();
  const levels = [{ classId: 'c1', level: 3 }, { classId: 'c2', level: 2 }];
  const next = setClassLevels(state, id, levels);
  assert.deepEqual(next.characters[0].classLevels, levels);
  assert.equal(characterLevel(next.characters[0]), 5);
});

test('characterLevel di zero classi è 0', () => {
  const c = createCharacter('X');
  assert.equal(characterLevel(c), 0);
});

test('setCharacterTags e setCharacterNotes aggiornano', () => {
  const { state, id } = withChar();
  let s = setCharacterTags(state, id, ['t1', 't2']);
  s = setCharacterNotes(s, id, 'nota **md**');
  assert.deepEqual(s.characters[0].tagIds, ['t1', 't2']);
  assert.equal(s.characters[0].notes, 'nota **md**');
});
```

- [ ] **Step 2: Esegui per vederlo fallire**

Run: `node --test tests/character-fields.test.js`
Expected: FAIL (setter non esportati).

- [ ] **Step 3: Implementa i setter personaggio**

Aggiungi in `src/model/reputation.js`. Un helper interno per non ripetere il map:

```javascript
function updateCharacter(state, id, patch) {
  const characters = state.characters.map((c) => {
    if (c.id !== id) {
      return c;
    }
    const updated = { ...c, ...patch };
    return updated;
  });
  const next = { ...state, characters };
  return next;
}

export function setRole(state, id, isPg) {
  const next = updateCharacter(state, id, { isPg });
  return next;
}

export function setRace(state, id, raceId) {
  const next = updateCharacter(state, id, { raceId });
  return next;
}

export function setAlignment(state, id, alignment) {
  const next = updateCharacter(state, id, { alignment });
  return next;
}

export function setPlayer(state, id, playerId) {
  const next = updateCharacter(state, id, { playerId });
  return next;
}

export function setClassLevels(state, id, classLevels) {
  const next = updateCharacter(state, id, { classLevels });
  return next;
}

export function setCharacterTags(state, id, tagIds) {
  const next = updateCharacter(state, id, { tagIds });
  return next;
}

export function setCharacterNotes(state, id, notes) {
  const next = updateCharacter(state, id, { notes });
  return next;
}

export function characterLevel(character) {
  const total = character.classLevels.reduce((sum, cl) => sum + cl.level, 0);
  return total;
}
```

- [ ] **Step 4: Esegui per vederlo passare**

Run: `node --test tests/character-fields.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js tests/character-fields.test.js
git commit -F - <<'EOF'
[FEAT] Setter campi personaggio + livello derivato
EOF
```

---

## Task 4: Setter gruppo + integrità guida (cascata)

**Files:**
- Modify: `src/model/reputation.js` (nuovi setter; ritocco `removeMember`, `hardDeleteCharacter`)
- Test: `tests/group-fields.test.js`

**Interfaces:**
- Consumes: `createState`, `createCharacter`, `createGroup` (Task 1); `addMember`, `removeMember`, `hardDeleteCharacter` (esistenti).
- Produces: `setGroupSeat(state,id,seat)`, `setGroupGuide(state,id,guideId)` (valida `guideId ∈ memberIds | null`; se non valido ritorna lo stato invariato), `setGroupMotto(state,id,motto)`, `setGroupTags(state,id,tagIds)`, `setGroupNotes(state,id,notes)`. `removeMember` e `hardDeleteCharacter` azzerano `guideId` quando puntava al membro rimosso.

- [ ] **Step 1: Scrivi il test (fallirà)**

Create `tests/group-fields.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createCharacter, createGroup } from '../src/model/schema.js';
import {
  setGroupSeat, setGroupGuide, setGroupMotto, setGroupTags, setGroupNotes,
  addMember, removeMember, hardDeleteCharacter,
} from '../src/model/reputation.js';

function withGroupAndMember() {
  const c = createCharacter('Gorim');
  const g = createGroup('La Compagnia', 'fazione');
  const s0 = { ...createState(), characters: [c], groups: [g] };
  const s1 = addMember(s0, g.id, c.id);
  return { state: s1, groupId: g.id, charId: c.id };
}

test('setGroupSeat/Motto/Tags/Notes aggiornano il gruppo', () => {
  const { state, groupId } = withGroupAndMember();
  let s = setGroupSeat(state, groupId, 'Valdûr');
  s = setGroupMotto(s, groupId, "L'ombra ricorda.");
  s = setGroupTags(s, groupId, ['t1']);
  s = setGroupNotes(s, groupId, 'nota');
  const g = s.groups[0];
  assert.equal(g.seat, 'Valdûr');
  assert.equal(g.motto, "L'ombra ricorda.");
  assert.deepEqual(g.tagIds, ['t1']);
  assert.equal(g.notes, 'nota');
});

test('setGroupGuide accetta un membro', () => {
  const { state, groupId, charId } = withGroupAndMember();
  const s = setGroupGuide(state, groupId, charId);
  assert.equal(s.groups[0].guideId, charId);
});

test('setGroupGuide accetta null', () => {
  const { state, groupId, charId } = withGroupAndMember();
  let s = setGroupGuide(state, groupId, charId);
  s = setGroupGuide(s, groupId, null);
  assert.equal(s.groups[0].guideId, null);
});

test('setGroupGuide rifiuta un non-membro (stato invariato)', () => {
  const { state, groupId } = withGroupAndMember();
  const s = setGroupGuide(state, groupId, 'estraneo');
  assert.equal(s.groups[0].guideId, null);
});

test('removeMember azzera la guida se era quel membro', () => {
  const { state, groupId, charId } = withGroupAndMember();
  let s = setGroupGuide(state, groupId, charId);
  s = removeMember(s, groupId, charId);
  assert.equal(s.groups[0].guideId, null);
  assert.deepEqual(s.groups[0].memberIds, []);
});

test('hardDeleteCharacter azzera la guida nei gruppi che lo indicavano', () => {
  const { state, groupId, charId } = withGroupAndMember();
  let s = setGroupGuide(state, groupId, charId);
  s = hardDeleteCharacter(s, charId);
  assert.equal(s.groups[0].guideId, null);
  assert.deepEqual(s.groups[0].memberIds, []);
});
```

- [ ] **Step 2: Esegui per vederlo fallire**

Run: `node --test tests/group-fields.test.js`
Expected: FAIL (setter non esportati; cascata non implementata).

- [ ] **Step 3: Implementa setter gruppo e cascata**

Aggiungi in `src/model/reputation.js` un helper e i setter:

```javascript
function updateGroup(state, id, patch) {
  const groups = state.groups.map((g) => {
    if (g.id !== id) {
      return g;
    }
    const updated = { ...g, ...patch };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}

export function setGroupSeat(state, id, seat) {
  const next = updateGroup(state, id, { seat });
  return next;
}

export function setGroupGuide(state, id, guideId) {
  const group = state.groups.find((g) => g.id === id);
  if (!group) {
    return state;
  }
  const isValid = guideId === null || group.memberIds.includes(guideId);
  if (!isValid) {
    return state;
  }
  const next = updateGroup(state, id, { guideId });
  return next;
}

export function setGroupMotto(state, id, motto) {
  const next = updateGroup(state, id, { motto });
  return next;
}

export function setGroupTags(state, id, tagIds) {
  const next = updateGroup(state, id, { tagIds });
  return next;
}

export function setGroupNotes(state, id, notes) {
  const next = updateGroup(state, id, { notes });
  return next;
}
```

Modifica `removeMember` per azzerare la guida rimossa. Sostituisci il corpo del `.map`:

```javascript
export function removeMember(state, groupId, charId) {
  const groups = state.groups.map((g) => {
    if (g.id !== groupId) {
      return g;
    }
    const memberIds = g.memberIds.filter((mid) => mid !== charId);
    const guideId = g.guideId === charId ? null : g.guideId;
    const updated = { ...g, memberIds, guideId };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}
```

Modifica `hardDeleteCharacter` per azzerare la guida oltre a pulire `memberIds`. Sostituisci il blocco `groups`:

```javascript
  const groups = state.groups.map((g) => {
    const wasMember = g.memberIds.includes(id);
    const wasGuide = g.guideId === id;
    if (!wasMember && !wasGuide) {
      return g;
    }
    const memberIds = g.memberIds.filter((mid) => mid !== id);
    const guideId = wasGuide ? null : g.guideId;
    const updated = { ...g, memberIds, guideId };
    return updated;
  });
```

- [ ] **Step 4: Esegui i test (nuovi + regressione reputation)**

Run: `node --test tests/group-fields.test.js`
Expected: PASS.
Run: `node --test tests/reputation.test.js`
Expected: PASS (nessuna regressione su `removeMember`/`hardDeleteCharacter`).

- [ ] **Step 5: Commit**

```bash
git add src/model/reputation.js tests/group-fields.test.js
git commit -F - <<'EOF'
[FEAT] Setter campi gruppo + cascata guida su rimozione/eliminazione membro
EOF
```

---

## Task 5: Migrazione v2→v3 e serializzazione

**Files:**
- Modify: `src/store/io.js` (`migrate`, `serializeState`)
- Modify: `tests/io.test.js` (asserzioni `version`)
- Test: `tests/io-v3.test.js`

**Interfaces:**
- Consumes: `SCHEMA_VERSION` (Task 1).
- Produces: `migrate(data)` che porta a v3 aggiungendo i 4 pool e i default dei nuovi campi (backfill), idempotente; `serializeState(state)` che include `tags/players/races/classes`.

- [ ] **Step 1: Aggiorna le asserzioni di versione in `tests/io.test.js`**

Cambia `assert.equal(parsed.version, 2)` → `3` (test «serializeState include groups»), e nel test «migrate v1 aggiunge groups vuoto e porta version a 2» cambia il titolo e le asserzioni:

```javascript
test('migrate v1 aggiunge groups vuoto e porta version a 3', () => {
  const v1 = { version: 1, characters: [], transactions: [] };
  const migrated = migrate(v1);
  assert.equal(migrated.version, 3);
  assert.deepEqual(migrated.groups, []);
});
```

- [ ] **Step 2: Scrivi i test v3 (falliranno)**

Create `tests/io-v3.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createCharacter, createGroup, createLookup } from '../src/model/schema.js';
import { setCharacterTags, setGroupSeat, addLookupItem } from '../src/model/reputation.js';
import { migrate, serializeState, parseImport } from '../src/store/io.js';

test('migrate v2 aggiunge i pool e i default sui campi', () => {
  const v2 = {
    version: 2,
    characters: [{ id: 'c1', name: 'A', deletedAt: null }],
    groups: [{ id: 'g1', name: 'G', type: 'fazione', memberIds: [], deletedAt: null }],
    transactions: [],
  };
  const m = migrate(v2);
  assert.equal(m.version, 3);
  assert.deepEqual(m.tags, []);
  assert.deepEqual(m.players, []);
  assert.deepEqual(m.races, []);
  assert.deepEqual(m.classes, []);
  assert.equal(m.characters[0].isPg, false);
  assert.deepEqual(m.characters[0].classLevels, []);
  assert.equal(m.characters[0].alignment, '');
  assert.equal(m.characters[0].raceId, null);
  assert.equal(m.characters[0].playerId, null);
  assert.deepEqual(m.characters[0].tagIds, []);
  assert.equal(m.characters[0].notes, '');
  assert.equal(m.groups[0].seat, '');
  assert.equal(m.groups[0].guideId, null);
  assert.equal(m.groups[0].motto, '');
  assert.deepEqual(m.groups[0].tagIds, []);
  assert.equal(m.groups[0].notes, '');
});

test('migrate non sovrascrive valori già presenti', () => {
  const partial = {
    version: 2,
    characters: [{ id: 'c1', name: 'A', deletedAt: null, notes: 'esistente' }],
    groups: [],
    transactions: [],
    tags: [{ id: 't1', name: 'mago' }],
  };
  const m = migrate(partial);
  assert.equal(m.characters[0].notes, 'esistente');
  assert.deepEqual(m.tags, [{ id: 't1', name: 'mago' }]);
});

test('serializeState include i quattro pool', () => {
  let s = createState();
  s = addLookupItem(s, 'tags', createLookup('mercenario'));
  const parsed = JSON.parse(serializeState(s));
  assert.equal(parsed.version, 3);
  assert.equal(parsed.tags[0].name, 'mercenario');
  assert.ok(Array.isArray(parsed.players));
  assert.ok(Array.isArray(parsed.races));
  assert.ok(Array.isArray(parsed.classes));
});

test('round-trip v3 con tag e sede', () => {
  let s = createState();
  const c = createCharacter('A');
  const g = createGroup('G', 'fazione');
  s = { ...s, characters: [c], groups: [g] };
  s = addLookupItem(s, 'tags', createLookup('nobile'));
  const tagId = s.tags[0].id;
  s = setCharacterTags(s, c.id, [tagId]);
  s = setGroupSeat(s, g.id, 'Valdûr');
  const back = parseImport(serializeState(s));
  assert.deepEqual(back.characters[0].tagIds, [tagId]);
  assert.equal(back.groups[0].seat, 'Valdûr');
});
```

- [ ] **Step 3: Esegui per vederlo fallire**

Run: `node --test tests/io-v3.test.js`
Expected: FAIL (`migrate` non aggiunge pool/backfill; `serializeState` senza pool). Il round-trip fallirà anche per la validazione (Task 6) — atteso per ora.

- [ ] **Step 4: Implementa migrate e serialize**

In `src/store/io.js` sostituisci `serializeState` e `migrate`:

```javascript
export function serializeState(state) {
  const payload = {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    characters: state.characters,
    transactions: state.transactions,
    groups: state.groups,
    tags: state.tags,
    players: state.players,
    races: state.races,
    classes: state.classes,
  };
  const json = JSON.stringify(payload, null, 2);
  return json;
}

const CHARACTER_DEFAULTS = {
  isPg: false, raceId: null, classLevels: [], alignment: '',
  playerId: null, tagIds: [], notes: '',
};
const GROUP_DEFAULTS = {
  seat: '', guideId: null, motto: '', tagIds: [], notes: '',
};

function withDefaults(obj, defaults) {
  const filled = { ...defaults, ...obj };
  return filled;
}

export function migrate(data) {
  const groups = Array.isArray(data.groups) ? data.groups : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const players = Array.isArray(data.players) ? data.players : [];
  const races = Array.isArray(data.races) ? data.races : [];
  const classes = Array.isArray(data.classes) ? data.classes : [];
  const characters = (data.characters || []).map((c) => withDefaults(c, CHARACTER_DEFAULTS));
  const migratedGroups = groups.map((g) => withDefaults(g, GROUP_DEFAULTS));
  const migrated = {
    ...data,
    characters,
    groups: migratedGroups,
    tags,
    players,
    races,
    classes,
    version: SCHEMA_VERSION,
  };
  return migrated;
}
```

- [ ] **Step 5: Esegui i test di migrazione/serializzazione**

Run: `node --test tests/io-v3.test.js`
Expected: i test `migrate …` e `serializeState …` passano; il `round-trip v3` può ancora fallire finché la validazione (Task 6) non conosce i nuovi campi. Se fallisce solo il round-trip, procedi.
Run: `node --test tests/io.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/store/io.js tests/io.test.js tests/io-v3.test.js
git commit -F - <<'EOF'
[FEAT] Migrazione v2→v3 e serializzazione dei pool lookup
EOF
```

---

## Task 6: Validazione v3 (integrità referenziale)

**Files:**
- Modify: `src/store/io.js` (`validateState`)
- Test: `tests/io-v3.test.js` (aggiunte)

**Interfaces:**
- Consumes: `migrate` (Task 5).
- Produces: `validateState(data)` che valida i 4 pool (`{id,name}`), i campi personaggio (`isPg` bool, `raceId∈races|null`, `playerId∈players|null`, `classLevels` di `{classId∈classes, level intero 1..20}`, `alignment` string, `tagIds⊆tags`, `notes` string) e gruppo (`seat/motto/notes` string, `guideId∈memberIds|null`, `tagIds⊆tags`).

- [ ] **Step 1: Scrivi i test di validazione (falliranno)**

Aggiungi in fondo a `tests/io-v3.test.js`:

```javascript
import { validateState } from '../src/store/io.js';

function baseValid() {
  const s = {
    version: 3,
    characters: [{ id: 'c1', name: 'A', deletedAt: null, isPg: false, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
    groups: [{ id: 'g1', name: 'G', type: 'f', memberIds: ['c1'], deletedAt: null, seat: '', guideId: null, motto: '', tagIds: [], notes: '' }],
    transactions: [],
    tags: [], players: [], races: [], classes: [],
  };
  return s;
}

test('validateState accetta uno stato v3 minimo valido', () => {
  assert.equal(validateState(baseValid()), true);
});

test('validateState rifiuta pool con elemento senza name', () => {
  const s = baseValid();
  s.tags.push({ id: 'x' });
  assert.throws(() => validateState(s), /tag|pool|name/i);
});

test('validateState rifiuta raceId che non esiste nel pool', () => {
  const s = baseValid();
  s.characters[0].raceId = 'ghost';
  assert.throws(() => validateState(s), /razza|race|riferiment/i);
});

test('validateState rifiuta tagIds fuori pool sul personaggio', () => {
  const s = baseValid();
  s.characters[0].tagIds = ['nope'];
  assert.throws(() => validateState(s), /tag/i);
});

test('validateState rifiuta classLevels con classId inesistente', () => {
  const s = baseValid();
  s.characters[0].classLevels = [{ classId: 'ghost', level: 2 }];
  assert.throws(() => validateState(s), /class/i);
});

test('validateState rifiuta level fuori 1..20', () => {
  const s = baseValid();
  s.classes.push({ id: 'k1', name: 'Ladro' });
  s.characters[0].classLevels = [{ classId: 'k1', level: 99 }];
  assert.throws(() => validateState(s), /livello|level/i);
});

test('validateState rifiuta guideId che non è un membro', () => {
  const s = baseValid();
  s.groups[0].guideId = 'c1';
  s.groups[0].memberIds = [];
  assert.throws(() => validateState(s), /guida|guide|membro/i);
});

test('validateState accetta guideId membro valido', () => {
  const s = baseValid();
  s.groups[0].guideId = 'c1';
  assert.equal(validateState(s), true);
});
```

- [ ] **Step 2: Esegui per vederlo fallire**

Run: `node --test tests/io-v3.test.js`
Expected: FAIL (validazione non copre i nuovi campi; i throw attesi non scattano).

- [ ] **Step 3: Implementa la validazione**

In `src/store/io.js`, dentro `validateState`, prima del `const valid = true;` finale aggiungi la validazione dei pool e dei campi. Inserisci un helper in cima al file (dopo l'import):

```javascript
function validatePool(list, label) {
  if (!Array.isArray(list)) {
    throw new Error(`Pool ${label} non valido: non è un array`);
  }
  for (const it of list) {
    const validId = typeof it.id === 'string' && it.id.length > 0;
    const validName = typeof it.name === 'string';
    if (!validId || !validName) {
      throw new Error(`Pool ${label} non valido: elemento con id/name errati (${JSON.stringify(it)})`);
    }
  }
}
```

Poi, dentro `validateState`, dopo la validazione dei gruppi esistente e prima del `const valid = true;`:

```javascript
  validatePool(data.tags, 'tags');
  validatePool(data.players, 'players');
  validatePool(data.races, 'races');
  validatePool(data.classes, 'classes');

  const tagIdSet = new Set(data.tags.map((t) => t.id));
  const playerIdSet = new Set(data.players.map((p) => p.id));
  const raceIdSet = new Set(data.races.map((r) => r.id));
  const classIdSet = new Set(data.classes.map((k) => k.id));

  for (const c of data.characters) {
    if (typeof c.isPg !== 'boolean') {
      throw new Error(`Personaggio ${c.id}: isPg non booleano`);
    }
    if (c.raceId !== null && !raceIdSet.has(c.raceId)) {
      throw new Error(`Personaggio ${c.id}: raceId punta a una razza inesistente`);
    }
    if (c.playerId !== null && !playerIdSet.has(c.playerId)) {
      throw new Error(`Personaggio ${c.id}: playerId punta a un giocatore inesistente`);
    }
    if (typeof c.alignment !== 'string') {
      throw new Error(`Personaggio ${c.id}: alignment non è stringa`);
    }
    if (typeof c.notes !== 'string') {
      throw new Error(`Personaggio ${c.id}: notes non è stringa`);
    }
    if (!Array.isArray(c.tagIds) || !c.tagIds.every((tid) => tagIdSet.has(tid))) {
      throw new Error(`Personaggio ${c.id}: tagIds contiene un tag inesistente`);
    }
    if (!Array.isArray(c.classLevels)) {
      throw new Error(`Personaggio ${c.id}: classLevels non è un array`);
    }
    for (const cl of c.classLevels) {
      const okClass = classIdSet.has(cl.classId);
      const okLevel = Number.isInteger(cl.level) && cl.level >= 1 && cl.level <= 20;
      if (!okClass) {
        throw new Error(`Personaggio ${c.id}: classLevels punta a una classe inesistente`);
      }
      if (!okLevel) {
        throw new Error(`Personaggio ${c.id}: livello di classe fuori 1..20 (${cl.level})`);
      }
    }
  }

  for (const g of data.groups) {
    if (typeof g.seat !== 'string' || typeof g.motto !== 'string' || typeof g.notes !== 'string') {
      throw new Error(`Gruppo ${g.id}: seat/motto/notes non stringa`);
    }
    if (g.guideId !== null && !g.memberIds.includes(g.guideId)) {
      throw new Error(`Gruppo ${g.id}: guideId non è un membro del gruppo`);
    }
    if (!Array.isArray(g.tagIds) || !g.tagIds.every((tid) => tagIdSet.has(tid))) {
      throw new Error(`Gruppo ${g.id}: tagIds contiene un tag inesistente`);
    }
  }
```

Nota: la validazione dei pool assume `data.tags/players/races/classes` presenti. `parseImport` chiama `migrate` prima di `validateState`, quindi i pool esistono sempre. Il test `baseValid` li fornisce già.

- [ ] **Step 4: Esegui i test v3 e la regressione io**

Run: `node --test tests/io-v3.test.js`
Expected: PASS (incluso il round-trip di Task 5).
Run: `node --test tests/io.test.js`
Expected: PASS.

- [ ] **Step 5: Suite intera**

Run: `npm test`
Expected: PASS su tutti i file. Se `tests/store.test.js` o `tests/appFunctions.test.js` asseriscono `version === 2`, aggiornali a `3` (grep `version, 2` e `version: 2` nelle asserzioni di test).

- [ ] **Step 6: Commit**

```bash
git add src/store/io.js tests/io-v3.test.js
git commit -F - <<'EOF'
[FEAT] Validazione v3: pool e integrità referenziale dei campi anagrafici
EOF
```

---

## Task 7: Aggiornamento requisiti funzionali

**Files:**
- Modify: `docs/requisiti-funzionali/01-entita.md`
- Modify: `docs/requisiti-funzionali/05-dati-e-persistenza.md`
- Modify: `docs/requisiti-funzionali/03-viste-e-navigazione.md`, `04-flussi.md` (ritocco)

**Interfaces:** nessuna (documentazione).

- [ ] **Step 1: `01-entita.md` — campi anagrafici e pool**

In `## Personaggio`, sostituisci la riga «Campi:» con l'elenco esteso e aggiungi la nota sui campi derivati:

```markdown
- Campi: `id` (UUID), `name`, `deletedAt` (soft-delete), `isPg` (ruolo PG/PNG,
  default PNG), `raceId` (→ pool razze | null), `classLevels`
  (`[{classId, level}]`, la multiclasse), `alignment` (stringa libera),
  `playerId` (→ pool giocatori | null, significativo solo se PG),
  `tagIds` (→ pool tag), `notes` (markdown).
- **Livello** = somma dei `level` di `classLevels`: derivato, mai salvato.
- La reputazione resta derivata dalle transazioni (vedi [02](02-modello-reputazione.md)).
```

In `## Gruppo`, estendi «Campi:»:

```markdown
- Campi: `id`, `name`, `type` (etichetta libera), `memberIds`, `deletedAt`,
  `seat` (sede, stringa libera), `guideId` (→ un `charId` ∈ `memberIds` | null),
  `motto`, `tagIds` (→ pool tag), `notes` (markdown).
- La **guida** è sempre uno dei membri: rimuovere quel membro (o eliminarlo)
  azzera la guida.
```

Aggiungi una nuova sezione dopo «Gruppo»:

```markdown
## Entità-vocabolario (lookup)

Quattro pool condivisi `{id, name}`, referenziati per id: **tag**, **giocatori**,
**razze**, **classi**. Sono *lookup leggeri*: si creano al volo dai picker (nessuna
vista di gestione, nessun soft-delete). Rinominare una voce cambia ovunque; niente
duplicati. **Non sono nodi** del grafo di reputazione: solo personaggi e gruppi lo
sono, e `resolveNode` resta invariato.
```

- [ ] **Step 2: `05-dati-e-persistenza.md` — schema v3**

Sostituisci l'intestazione `## Formato (schema v2)` con `## Formato (schema v3)` e aggiorna l'esempio JSON aggiungendo i pool e i nuovi campi:

```json
{
  "version": 3,
  "exportedAt": 1749200000000,
  "characters": [
    { "id": "c1", "name": "Aragorn", "deletedAt": null,
      "isPg": true, "raceId": "r1", "classLevels": [{ "classId": "k1", "level": 5 }],
      "alignment": "Legale Buono", "playerId": "p1", "tagIds": ["tg1"], "notes": "" }
  ],
  "groups": [
    { "id": "g1", "name": "La Compagnia", "type": "fazione",
      "memberIds": ["c1"], "deletedAt": null,
      "seat": "Valdûr", "guideId": "c1", "motto": "", "tagIds": [], "notes": "" }
  ],
  "transactions": [
    { "id": "t1", "fromId": "c1", "toId": "g1", "delta": 10,
      "name": "salvato in battaglia", "createdAt": 1749100000000 }
  ],
  "tags": [{ "id": "tg1", "name": "ricercato" }],
  "players": [{ "id": "p1", "name": "Giulia" }],
  "races": [{ "id": "r1", "name": "Mezzelfo" }],
  "classes": [{ "id": "k1", "name": "Barbaro" }]
}
```

Aggiorna la riga finale sulla migrazione:

```markdown
Il campo `version` consente migrazioni di schema (`migrate()` in `src/store/io.js`);
la v1→v2 aggiunge `groups`, la v2→v3 aggiunge i quattro pool lookup
(`tags`/`players`/`races`/`classes`) e fa il backfill dei nuovi campi anagrafici
su personaggi e gruppi.
```

- [ ] **Step 3: Ritocco `03` e `04`**

In `03-viste-e-navigazione.md`, alla voce **Profilo personaggio** e **Profilo gruppo**, aggiungi che la testata è una **scheda anagrafica con editing inline per campo** (razza, classe/livelli, allineamento, giocatore, tag, note per il personaggio; tipo, sede, guida, motto, tag, note per il gruppo).

In `04-flussi.md`, sezione «Registrare una transazione» o adiacente, aggiungi una riga:

```markdown
## Modifica della scheda anagrafica

Dalla testata del profilo ogni campo si modifica **inline** (clic sul valore).
I riferimenti a entità-vocabolario (razza, classe, giocatore, tag) si scelgono da
un picker che permette anche di **creare** al volo una voce nuova nel pool. Livello
e reputazione sono derivati (sola lettura).
```

- [ ] **Step 4: Commit**

```bash
git add docs/requisiti-funzionali/01-entita.md docs/requisiti-funzionali/05-dati-e-persistenza.md docs/requisiti-funzionali/03-viste-e-navigazione.md docs/requisiti-funzionali/04-flussi.md
git commit -F - <<'EOF'
[DOCS] Requisiti: schema v3, campi anagrafici, entità-vocabolario
EOF
```

**Fine P1.** MODEL/STORE reali e testati; nessun impatto visivo (le testate mostrano ancora il mock, che ora convive con i dati reali sottostanti).

---

## Task 8: Widget pool-backed (InlineSelect, Many2ManyField)

**Files:**
- Modify: `src/view/components/InlineSelect.vue`
- Modify: `src/view/components/Many2ManyField.vue`

**Interfaces:**
- Produces: `InlineSelect` accetta opzioni come oggetti `{id,name}` quando `pool`-backed, emette `create(name)` senza auto-selezionare una stringa; `Many2ManyField` emette `create(name)` e non gestisce più un `extraPool` interno (il pool arriva sempre dal parent via prop `pool`).

**Contesto:** oggi `InlineSelect` lavora su opzioni-stringa e in `creatable` emette `update:modelValue` con la stringa digitata. Per i campi pool-backed (razza/classe/giocatore/tag) serve che la creazione produca un **id**: il parent crea l'entità nel pool e setta il riferimento. Teniamo la modalità stringa (per Allineamento e Tipo, che restano stringhe) e aggiungiamo la modalità id.

- [ ] **Step 1: InlineSelect — supporto opzioni `{id,name}` + prop `valueKey`/`labelKey`**

In `InlineSelect.vue`, aggiungi le prop e normalizza le opzioni. Aggiungi alle `defineProps`:

```javascript
  // Quando le opzioni sono oggetti {id,name}: la selezione emette l'id, non la label.
  optionValue: { type: String, default: '' }, // es. 'id' → opzione oggetto
  optionLabel: { type: String, default: '' },  // es. 'name'
```

Aggiungi due helper computed/funzione per leggere valore e label di un'opzione:

```javascript
function optValue(o) {
  const v = props.optionValue ? o[props.optionValue] : o;
  return v;
}
function optLabel(o) {
  const l = props.optionLabel ? o[props.optionLabel] : o;
  return l;
}
```

Sostituisci nel template gli usi diretti dell'opzione: `{{ o }}` → `{{ optLabel(o) }}`, `:key="o"` → `:key="optValue(o)"`, confronto selezione `o === modelValue` → `optValue(o) === modelValue`, e `choose(o)` deve emettere `optValue(o)`:

```javascript
function choose(o) {
  emit('update:modelValue', optValue(o));
  closeMenu();
}
```

Aggiorna il trigger che mostra il valore: quando `optionValue` è impostato, `modelValue` è un id → mostra la label cercando nel pool. Aggiungi:

```javascript
const displayLabel = computed(() => {
  if (!props.optionValue) return props.modelValue;
  const found = props.options.find((o) => optValue(o) === props.modelValue);
  const label = found ? optLabel(found) : '';
  return label;
});
```

e nel template `<span class="isel__val">{{ modelValue }}</span>` → `{{ displayLabel }}`. Il filtro `shown` in modalità `creatable` deve filtrare per label:

```javascript
const filtered = q ? props.options.filter((o) => String(optLabel(o)).toLowerCase().includes(q)) : props.options;
```

e `canCreate` confronta per label:

```javascript
  const exists = props.options.some((o) => String(optLabel(o)).toLowerCase() === q.toLowerCase());
```

- [ ] **Step 2: InlineSelect — `createValue` emette solo `create`, non la stringa, in modalità pool**

```javascript
function createValue() {
  const name = query.value.trim();
  if (!name) return;
  if (props.optionValue) {
    // pool-backed: il parent crea l'entità e setta il riferimento.
    emit('create', name);
  } else {
    emit('update:modelValue', name);
    emit('create', name);
  }
  closeMenu();
}
```

- [ ] **Step 3: Many2ManyField — creazione delegata al parent**

In `Many2ManyField.vue` rimuovi `extraPool`/`createdN`/`allPool` e usa `props.pool` come unica fonte. Sostituisci:

```javascript
const linked = computed(() => props.pool.filter((it) => props.modelValue.includes(it.id)));
const available = computed(() => {
  const q = query.value.trim().toLowerCase();
  const pool = props.pool.filter((it) => !props.modelValue.includes(it.id));
  const filtered = q ? pool.filter((it) => it.name.toLowerCase().includes(q)) : pool;
  return filtered;
});
const canCreate = computed(() => {
  const q = query.value.trim();
  if (!q) return false;
  const exists = props.pool.some((it) => it.name.toLowerCase() === q.toLowerCase());
  return !exists;
});
```

E `createItem` emette solo il nome (il parent crea nel pool e collega):

```javascript
function createItem() {
  const name = query.value.trim();
  if (!name) return;
  emit('create', name);
  query.value = '';
}
```

- [ ] **Step 4: Verifica build**

Run: `npm run build`
Expected: build senza errori (le modifiche sono retro-compatibili: senza `optionValue` il comportamento a stringhe è invariato).

- [ ] **Step 5: Commit**

```bash
git add src/view/components/InlineSelect.vue src/view/components/Many2ManyField.vue
git commit -F - <<'EOF'
[REFACTOR] Widget pool-backed: create delegata al parent, opzioni {id,name}
EOF
```

---

## Task 9: `EntitySheet.vue` reale (personaggio + gruppo)

**Files:**
- Create: `src/view/components/EntitySheet.vue` (da `EntitySheetMock.vue`)
- Modify: `src/view/components/ProfileView.vue`, `GroupProfileView.vue`
- Delete: `src/view/components/EntitySheetMock.vue`

**Interfaces:**
- Consumes: setter MODEL (Task 3, 4), pool (Task 2), widget (Task 8), `useStore`.
- Produces: `<EntitySheet :entity="character|group" kind="character|group" :reputation="n" />` che dispatcha i setter allo store.

**Contesto:** il mock ha stato locale hardcodato. Il componente reale riceve l'entità dallo store e per ogni modifica chiama `dispatch(setter)`. Riusa la struttura del template e gli stili del mock (griglia `led__`, popover classe, m2m). Cambia solo la sorgente dati e i gestori.

- [ ] **Step 1: Copia il mock e cambia props + sorgenti**

Copia `EntitySheetMock.vue` in `EntitySheet.vue`. Cambia le props:

```javascript
const props = defineProps({
  kind: { type: String, required: true },      // 'character' | 'group'
  entity: { type: Object, required: true },     // il personaggio o gruppo reale
  reputation: { type: Number, default: null },
});
```

Sostituisci lo stato locale (`form`, `classes` ref, i pool `GROUP_POOL`/`TAG_POOL`, `groupIds`/`tagIds`) con l'accesso allo store:

```javascript
import { useStore } from '../useStore.js';
import {
  createLookup,
} from '../../model/schema.js';
import {
  addLookupItem, listLookup,
  setRole, setRace, setAlignment, setPlayer, setClassLevels,
  setCharacterTags, setCharacterNotes, characterLevel,
  setGroupType, setGroupSeat, setGroupGuide, setGroupMotto, setGroupTags,
  addMember, removeMember, addGroup, listActiveGroups,
} from '../../model/reputation.js';

const { state, dispatch } = useStore();

// Pool reattivi per i picker
const races = computed(() => listLookup(state.value, 'races'));
const players = computed(() => listLookup(state.value, 'players'));
const classPool = computed(() => listLookup(state.value, 'classes'));
const tagPool = computed(() => listLookup(state.value, 'tags'));
```

- [ ] **Step 2: Gestori pool-backed (create nel pool + set riferimento)**

Aggiungi un helper generico che crea una voce nel pool e ritorna l'id, poi il setter specifico. Poiché `dispatch` applica la mutazione e notifica, creiamo prima la voce, la aggiungiamo, e usiamo il suo id:

```javascript
function createInPool(coll, name) {
  const item = createLookup(name);
  dispatch((s) => addLookupItem(s, coll, item));
  return item.id;
}

// Personaggio
const charId = computed(() => props.entity.id);
function onRace(raceId) { dispatch((s) => setRace(s, charId.value, raceId)); }
function onCreateRace(name) {
  const id = createInPool('races', name);
  dispatch((s) => setRace(s, charId.value, id));
}
function onAlignment(a) { dispatch((s) => setAlignment(s, charId.value, a)); }
function onPlayer(pid) { dispatch((s) => setPlayer(s, charId.value, pid)); }
function onCreatePlayer(name) {
  const id = createInPool('players', name);
  dispatch((s) => setPlayer(s, charId.value, id));
}
function onRole() { dispatch((s) => setRole(s, charId.value, !props.entity.isPg)); }
function onCharTags(ids) { dispatch((s) => setCharacterTags(s, charId.value, ids)); }
function onCreateCharTag(name) {
  const id = createInPool('tags', name);
  const nextIds = [...props.entity.tagIds, id];
  dispatch((s) => setCharacterTags(s, charId.value, nextIds));
}
```

Per la **multiclasse** i valori sono id di classe. `classLevels` vive nello store; l'editor lavora su una copia locale e persiste ad ogni cambiamento:

```javascript
function commitClassLevels(next) {
  dispatch((s) => setClassLevels(s, charId.value, next));
}
function setClassRow(i, patch) {
  const next = props.entity.classLevels.map((cl, idx) => (idx === i ? { ...cl, ...patch } : cl));
  commitClassLevels(next);
}
function addClassRow() {
  const first = classPool.value[0];
  const classId = first ? first.id : createInPool('classes', 'Guerriero');
  commitClassLevels([...props.entity.classLevels, { classId, level: 1 }]);
}
function removeClassRow(i) {
  const next = props.entity.classLevels.filter((_, idx) => idx !== i);
  commitClassLevels(next);
}
function onCreateClass(i, name) {
  const id = createInPool('classes', name);
  setClassRow(i, { classId: id });
}
const totalLevel = computed(() => characterLevel(props.entity));
const classLabel = computed(() => {
  const parts = props.entity.classLevels.map((cl) => {
    const k = classPool.value.find((x) => x.id === cl.classId);
    const name = k ? k.name : '?';
    return `${cl.level} ${name}`;
  });
  const label = parts.length ? parts.join(' / ') : 'nessuna classe';
  return label;
});
```

- [ ] **Step 3: Gestori gruppo**

```javascript
const groupId = computed(() => props.entity.id);
function onType(t) { dispatch((s) => setGroupType(s, groupId.value, t)); }
function onSeat(v) { dispatch((s) => setGroupSeat(s, groupId.value, v)); }
function onGuide(cid) { dispatch((s) => setGroupGuide(s, groupId.value, cid)); }
function onMotto(v) { dispatch((s) => setGroupMotto(s, groupId.value, v)); }
function onGroupTags(ids) { dispatch((s) => setGroupTags(s, groupId.value, ids)); }
function onCreateGroupTag(name) {
  const id = createInPool('tags', name);
  dispatch((s) => setGroupTags(s, groupId.value, [...props.entity.tagIds, id]));
}
// Guida: pool = membri del gruppo (id→nome)
const memberOptions = computed(() => {
  const opts = props.entity.memberIds
    .map((mid) => state.value.characters.find((c) => c.id === mid))
    .filter(Boolean)
    .map((c) => ({ id: c.id, name: c.name }));
  return opts;
});
```

- [ ] **Step 4: Gruppi del personaggio (m2m su membership reale)**

Il campo Gruppi non è un pool ma la membership (lato gruppo). Le opzioni sono i gruppi attivi; il valore sono gli id dei gruppi di cui il personaggio è membro:

```javascript
const allGroups = computed(() => listActiveGroups(state.value).map((g) => ({ id: g.id, name: g.name })));
const charGroupIds = computed(() => {
  const ids = listActiveGroups(state.value).filter((g) => g.memberIds.includes(charId.value)).map((g) => g.id);
  return ids;
});
function onCharGroups(nextIds) {
  const current = charGroupIds.value;
  const added = nextIds.filter((id) => !current.includes(id));
  const removed = current.filter((id) => !nextIds.includes(id));
  for (const gid of added) dispatch((s) => addMember(s, gid, charId.value));
  for (const gid of removed) dispatch((s) => removeMember(s, gid, charId.value));
}
function onCreateGroup(name) {
  // crea gruppo e iscrive subito il personaggio
  dispatch((s) => addGroup(s, name, ''));
  const created = listActiveGroups(state.value).find((g) => g.name === name && !g.memberIds.includes(charId.value));
  if (created) dispatch((s) => addMember(s, created.id, charId.value));
}
```

Nota: `addGroup` genera l'id internamente. Dopo il `dispatch`, `state.value` è aggiornato: si ritrova il gruppo per nome. Se esistono omonimi, iscrive il primo non ancora membro — accettabile per una creazione al volo.

- [ ] **Step 5: Collega il template ai gestori**

Aggiorna il template del componente reale:
- Ruolo: `@click="onRole"`, testo `props.entity.isPg ? 'PG' : 'PNG'`.
- Razza: `InlineSelect` con `:options="races" option-value="id" option-label="name" :model-value="entity.raceId" creatable @update:model-value="onRace" @create="onCreateRace"`.
- Allineamento: `InlineSelect` a stringhe con suggerimenti `ALIGNMENTS` (costante locale mantenuta), `:model-value="entity.alignment" creatable @update:model-value="onAlignment"`.
- Giocatore (solo se `entity.isPg`): come Razza ma pool `players`, `onPlayer`/`onCreatePlayer`.
- Classe: popover con righe che leggono `entity.classLevels`; livello `InlineSelect` su `LEVELS`; classe `InlineSelect` su `classPool` (`option-value="id" option-label="name" creatable`), handler `setClassRow(i,{level})`, `setClassRow(i,{classId})`, `onCreateClass(i,name)`, `addClassRow`, `removeClassRow`. Totale `totalLevel`.
- Livello: readonly `totalLevel`.
- Reputazione: invariato (`ScoreChip :score="reputation"`).
- Gruppi (`Many2ManyField`): `:pool="allGroups" :model-value="charGroupIds" @update:model-value="onCharGroups" @create="onCreateGroup" navigable @navigate="goToGroup"`.
- Tag personaggio: `:pool="tagPool" :model-value="entity.tagIds" @update:model-value="onCharTags" @create="onCreateCharTag"`.
- Gruppo — Tipo: `InlineSelect` stringa `creatable` su `TYPES`, `@update:model-value="onType"`. Sede: input testo `@change`→`onSeat`. Guida: `InlineSelect :options="memberOptions" option-value="id" option-label="name" :model-value="entity.guideId" @update:model-value="onGuide"`. Motto: input testo → `onMotto`. Tag gruppo: `Many2ManyField` pool `tagPool`, `onGroupTags`/`onCreateGroupTag`.

Rendi `goToGroup(id)` reale:

```javascript
function goToGroup(it) {
  router.push({ name: 'groupProfile', params: { id: it.id } });
}
```

- [ ] **Step 6: Aggiorna i due profili**

In `ProfileView.vue`: import `EntitySheet` al posto di `EntitySheetMock` e passa l'entità:

```html
<EntitySheet kind="character" :entity="character" :reputation="synthetic" />
```

```javascript
import EntitySheet from './EntitySheet.vue';
```

In `GroupProfileView.vue`:

```html
<EntitySheet kind="group" :entity="group" :reputation="synthetic" />
```

```javascript
import EntitySheet from './EntitySheet.vue';
```

Elimina `src/view/components/EntitySheetMock.vue`.

- [ ] **Step 7: Verifica nel browser (skill verify)**

Run: `npm run dev`
Guida l'app: apri un profilo personaggio e uno gruppo. Verifica per ognuno:
1. Ogni campo mostra il valore reale (o vuoto) dallo store.
2. Modifica razza/classe/giocatore/tag: la voce creata al volo compare nel pool e resta dopo `F5` (persistenza localStorage).
3. Livello = somma dei livelli di classe; cambia aggiungendo/rimuovendo classi.
4. Guida gruppo: elenco = solo membri; rimuovi il membro-guida dal tab Membri → la guida si azzera.
5. Gruppi del personaggio: aggiungi/rimuovi un gruppo → si riflette nel tab «Membro di» e nel profilo gruppo.

Cattura screenshot di conferma (personaggio + gruppo) in `outputs/verify/`.

- [ ] **Step 8: Commit**

```bash
git add src/view/components/EntitySheet.vue src/view/components/ProfileView.vue src/view/components/GroupProfileView.vue
git rm src/view/components/EntitySheetMock.vue
git commit -F - <<'EOF'
[FEAT] Testata profilo reale: campi anagrafici persistiti nello store
EOF
```

---

## Task 10: `Notes.vue` reale (P3)

**Files:**
- Create: `src/view/components/Notes.vue` (da `NotesMock.vue`)
- Modify: `src/view/components/ProfileView.vue`, `GroupProfileView.vue`
- Delete: `src/view/components/NotesMock.vue`

**Interfaces:**
- Consumes: `setCharacterNotes`/`setGroupNotes` (Task 3, 4), `useStore`.
- Produces: `<Notes :entity="..." kind="..." />` che persiste `notes`.

- [ ] **Step 1: Copia il mock e collega lo store**

Copia `NotesMock.vue` in `Notes.vue`. Cambia props e sorgente:

```javascript
const props = defineProps({
  kind: { type: String, required: true },
  entity: { type: Object, required: true },
});
import { useStore } from '../useStore.js';
import { setCharacterNotes, setGroupNotes } from '../../model/reputation.js';
const { dispatch } = useStore();

const editing = ref(false);
const text = ref(props.entity.notes || '');
```

Mantieni il mini-renderer markdown invariato. Il `rendered` computed continua a leggere `text.value`.

- [ ] **Step 2: Persisti su «Fatto»**

Il bottone «Fatto» chiude l'editing e salva:

```javascript
function done() {
  editing.value = false;
  const id = props.entity.id;
  const value = text.value;
  if (props.kind === 'character') dispatch((s) => setCharacterNotes(s, id, value));
  else dispatch((s) => setGroupNotes(s, id, value));
}
```

Nel template, `@click="editing = false"` del bottone «Fatto» → `@click="done"`. All'apertura dell'editing risincronizza dal dato reale:

```javascript
function edit() {
  text.value = props.entity.notes || '';
  editing.value = true;
}
```

e `@click="editing = true"` → `@click="edit"`.

- [ ] **Step 3: Aggiorna i profili**

In `ProfileView.vue`:

```html
<Notes v-if="tab === 'note'" kind="character" :entity="character" />
```

```javascript
import Notes from './Notes.vue';
```

In `GroupProfileView.vue`:

```html
<Notes v-if="tab === 'note'" kind="group" :entity="group" />
```

```javascript
import Notes from './Notes.vue';
```

Elimina `src/view/components/NotesMock.vue`.

- [ ] **Step 4: Verifica nel browser**

Run: `npm run dev`
Apri il tab Note di un personaggio e di un gruppo: scrivi, premi «Fatto», ricarica (`F5`) → le note restano. Verifica che il markdown renderizzi (grassetto/corsivo/codice/elenco).

- [ ] **Step 5: Commit**

```bash
git add src/view/components/Notes.vue src/view/components/ProfileView.vue src/view/components/GroupProfileView.vue
git rm src/view/components/NotesMock.vue
git commit -F - <<'EOF'
[FEAT] Note reali: markdown persistito nello store per personaggio e gruppo
EOF
```

---

## Self-Review (autore)

**Spec coverage:** Tag entità → Task 1,2,6. Giocatore/Razza/Classe entità → Task 1,2,3,6,9. Allineamento stringa → Task 3,9. Lookup leggeri (no gestione) → nessuna vista, solo create inline (Task 8,9). Campi personaggio/gruppo → Task 3,4. Livello derivato → Task 3,9. Cascata guida → Task 4. Migrazione v2→v3 + validazione → Task 5,6. Requisiti → Task 7. EntitySheet reale → Task 9. Notes reale → Task 10. Widget pool-backed → Task 8. Tutte le sezioni dello spec coperte.

**Placeholder scan:** nessun TBD/TODO; ogni step di codice ha il codice.

**Type consistency:** `addLookupItem(state,coll,item)`, `createLookup(name)→{id,name}`, `setRace(state,id,raceId)`, `characterLevel(character)`, `classLevels:[{classId,level}]`, `setGroupGuide` con validazione membro, `option-value`/`option-label` su InlineSelect — nomi coerenti fra Task 2/3/4/8/9.

## Execution Handoff

Vedi messaggio di chat per la scelta di esecuzione.
