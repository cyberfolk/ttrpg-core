# Mockup → reale: campi anagrafici, entità-vocabolario, componenti reali

Data: 2026-07-07
Stato: approvato (design), pronto per il piano d'implementazione.

## Contesto

Le testate profilo (personaggio e gruppo) e il tab Note usano due componenti
**mockup** con dati hardcodati non persistiti:

- `EntitySheetMock.vue` — testata con tutti i campi anagrafici.
- `NotesMock.vue` — note markdown.

Obiettivo: rendere reali i campi mockati (persistiti in MODEL/STORE) e
trasformare i mockup in componenti veri collegati allo store. L'unico dato già
reale nelle testate è la **Reputazione** (derivata dalle transazioni).

Vincolo architetturale invariato: `VIEW → STORE → MODEL`, MODEL/STORE
framework-agnostici (port Python futuro), `localStorage` solo nello STORE,
logica di reputazione solo nel MODEL.

## Decisioni prese (brainstorming)

1. **Tag = entità condivisa** (pool `{id,name}` + riferimenti per id), stile Odoo:
   rinomina-una-volta, niente duplicati, integrità referenziale come `memberIds`.
2. **Razza, Classe, Giocatore = entità-vocabolario condivise** (stesso meccanismo
   dei Tag). **Allineamento = stringa libera** con 9 suggerimenti in VIEW (insieme
   chiuso e canonico, non merita un'entità).
3. **Ciclo di vita dei pool = lookup leggeri**: creazione inline dal picker,
   nessuna vista di gestione dedicata, nessun archivia/elimina, nessun
   `deletedAt`. Restano nel pool. (YAGNI: gestione solo se domani serve.)
4. **Strategia = due fasi, dati-prima** (A): prima MODEL/STORE completo e testato,
   poi la VIEW. Schema/migrazione toccati una volta sola.

## Forma dati (schema v3)

```
state = {
  version: 3,
  characters: [...],
  groups: [...],
  transactions: [...],
  tags: [],      // {id, name}
  players: [],   // {id, name}
  races: [],     // {id, name}
  classes: [],   // {id, name}  — vocabolario delle classi
}
```

Nomenclatura anti-collisione: `state.classes` è il **pool vocabolario**; il
personaggio ha `classLevels: [{classId, level}]` (la multiclasse).

**Personaggio** (campi esistenti `id, name, deletedAt` + nuovi):

```
isPg: false,          // ruolo PG/PNG, default PNG (i PNG sono la maggioranza)
raceId: null,         // → races | null
classLevels: [],      // [{classId, level}], level intero 1..20
alignment: '',        // stringa libera (9 suggerimenti in VIEW)
playerId: null,       // → players | null (significativo solo se isPg)
tagIds: [],           // ⊆ tags
notes: '',            // markdown
```

Livello = Σ `classLevels[].level` — **derivato**, mai salvato. Helper
`characterLevel(character)`.

**Gruppo** (campi esistenti `id, name, type, memberIds, deletedAt` + nuovi):

```
seat: '',        // sede, stringa libera
guideId: null,   // → un charId ∈ memberIds | null
motto: '',       // stringa libera
tagIds: [],      // ⊆ tags
notes: '',       // markdown
```

**Nodi del grafo reputazione: solo personaggi e gruppi.** I pool
(tags/players/races/classes) non sono nodi; `resolveNode` resta invariato.

## API MODEL (`src/model/`)

### `schema.js`
- `SCHEMA_VERSION = 3`.
- `createState` aggiunge i 4 pool (`[]`).
- `createCharacter` / `createGroup` inizializzano i nuovi campi ai default sopra.
- `createLookup(name)` → `{ id: newId(), name }` (costruttore generico dei pool).
- (Opzionale) `createClassLevel(classId, level)` → `{ classId, level }`.

### `reputation.js`
Pool (generico, parametrizzato sulla chiave di collezione
`'tags' | 'players' | 'races' | 'classes'`):
- `addLookupItem(state, coll, item)` — aggiunge se l'id non è già presente.
- `renameLookupItem(state, coll, id, name)` — presente per il futuro (nessuna UI ora).
- `listLookup(state, coll)` — comodità di lettura per la VIEW.
- Nessun delete ora.

Setter personaggio (ognuno ritorna il next state, stile immutabile esistente):
- `setRole(state, id, isPg)`
- `setRace(state, id, raceId)`
- `setAlignment(state, id, alignment)`
- `setPlayer(state, id, playerId)`
- `setClassLevels(state, id, classLevels)` — sostituisce l'intero array.
- `setCharacterTags(state, id, tagIds)`
- `setCharacterNotes(state, id, notes)`
- `characterLevel(character)` — derivato (somma dei level).

Setter gruppo:
- `setGroupSeat(state, id, seat)`
- `setGroupGuide(state, id, guideId)` — valida `guideId ∈ memberIds | null`; se
  non valido ritorna lo stato **invariato** (nessuna scrittura silenziosa).
- `setGroupMotto(state, id, motto)`
- `setGroupTags(state, id, tagIds)`
- `setGroupNotes(state, id, notes)`
- (`setGroupType` esiste già.)

Integrità della guida (cascata):
- `removeMember(state, groupId, charId)` — se `guideId === charId`, azzera `guideId`.
- `hardDeleteCharacter(state, id)` — in ogni gruppo dove `guideId === id`, azzera
  `guideId` (oltre alla pulizia già esistente di `memberIds`).

## Migrazione + validazione (`src/store/io.js`)

- `migrate(data)`: se `version < 3` → aggiunge i 4 pool (`[]` se assenti) e fa il
  **backfill** dei nuovi campi su ogni personaggio/gruppo con i default. `type`
  resta. Idempotente e tollerante ai campi già presenti.
- `serializeState(state)`: include `tags, players, races, classes`.
- `validateState(data)`:
  - ogni pool: array di `{ id: string non vuoto, name: string }`.
  - personaggio: `isPg` bool; `raceId ∈ races | null`; `playerId ∈ players | null`;
    `classLevels` array di `{ classId ∈ classes, level intero 1..20 }`;
    `alignment` string; `tagIds ⊆ tags`; `notes` string.
  - gruppo: `seat/motto/notes` string; `guideId ∈ (quel gruppo).memberIds | null`;
    `tagIds ⊆ tags`.
  - transazioni: invariato.

Test `node:test` (TDD): MODEL (setter, derivati, cascata guida) + io (migrate
v2→v3, serialize round-trip, validate accetta/rifiuta con i nuovi vincoli). La
VIEW si verifica a mano nel browser.

## Aggiornamento requisiti funzionali (parte di P1)

- `docs/requisiti-funzionali/01-entita.md`: personaggio con campi anagrafici
  (ruolo PG/PNG, razza, classi/livello derivato, allineamento, giocatore, tag,
  note); gruppo con sede, guida (un membro), motto, tag, note; nuove
  entità-vocabolario (tags/players/races/classes) come lookup leggeri; nodi del
  grafo restano solo char/gruppo.
- `docs/requisiti-funzionali/05-dati-e-persistenza.md`: schema v3, esempio JSON
  aggiornato, migrazione v2→v3.
- Ritocco minimo a `03-viste-e-navigazione.md` / `04-flussi.md`: la testata
  profilo è una scheda con editing inline per campo.

## VIEW

### P2 — `EntitySheet.vue` (da `EntitySheetMock.vue`)
Wiring allo store: ogni campo modificato → `dispatch(setter)`. Reputazione e
Livello restano derivati (sola lettura).

- **Ruolo** → `setRole`. **Razza/Classe/Giocatore** → `InlineSelect` sul pool
  corrispondente; "Crea «X»" → il **parent** crea l'entità nel pool (id proprio
  via `createLookup`), dispatch `addLookupItem`, poi dispatch del setter con il
  nuovo id. **Allineamento** → stringa libera (create = setta la stringa, nessun
  pool). **Gruppi** → `addMember/removeMember`. **Tag** → pool `tags`.
- La creazione inline di un **gruppo** dal campo Gruppi (convenienza già nel mock)
  → `addGroup` + `addMember`.

### P3 — `Notes.vue` (da `NotesMock.vue`)
Stesso mini-renderer markdown (nessuna dipendenza). `notes` persistito via
`setCharacterNotes` / `setGroupNotes` (dispatch su "Fatto"/blur).

### Componenti di supporto
- `Many2ManyField`: la creazione **delega al parent** (emette il nome digitato; il
  parent crea l'entità nel pool con id proprio e collega). Si rimuove la logica
  mock dell'`extraPool` interno per l'uso reale.
- `InlineSelect`: per i campi pool-backed la creazione deve portare all'id del
  nuovo elemento (il parent lo crea e setta il riferimento), non alla stringa.

## Ordine di consegna

1. **P1 — Dati.** schema.js, reputation.js, io.js, test, requisiti funzionali.
   Nessun impatto visivo; il MODEL si prova coi test.
2. **P2 — Testata reale.** `EntitySheet.vue` + adattamento `Many2ManyField` /
   `InlineSelect`, wiring nei due profili.
3. **P3 — Note reali.** `Notes.vue`, wiring nei due profili.

Tre parti/commit separati.

## Non in scope (YAGNI)

- Viste di gestione dei pool (rinomina/elimina/merge), soft-delete dei pool.
- Attributi propri di player/race/class oltre al nome.
- Allineamento come entità.
- Enum vincolati per razza/classe (restano stringhe con suggerimenti in VIEW).
