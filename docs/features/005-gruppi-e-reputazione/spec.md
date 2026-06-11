# Spec — Feature 005: Gruppi e reputazione

Data: 2026-06-10
Stato: IMPLEMENTATA — plan in `plan.md`; MODEL/STORE/IO completi e testati (`node:test`); VIEW da verificare a mano nel browser.

## Obiettivo

Introdurre una nuova entità **Gruppo**: un contenitore generico che rappresenta sia fazioni
sia centri abitati di qualsiasi dimensione (dal paesino di 3 case alla megalopoli). Un Gruppo
ha una **lista di personaggi membri** e partecipa al sistema di reputazione in due modi
distinti e affiancati: come **nodo diretto** (può ricevere/dare transazioni come un
personaggio) e come **aggregato derivato** dai suoi membri.

Permette di leggere, per ogni coppia (personaggio X, Gruppo G):

- **come X considera G** — sia in modo diretto sia come media di come X considera i membri;
- **come G considera X** — sia in modo diretto sia come media di come i membri considerano X.

## Decisioni di design (dal brainstorm)

- **Tipo unico generico.** Un solo tipo `Gruppo` con un campo `type` libero (etichetta:
  "fazione", "città", "villaggio", "gilda"…). Paesino, megalopoli e fazione condividono la
  stessa struttura: differiscono solo per l'etichetta. Nessun campo specializzato per tipo
  (YAGNI; se domani serve, si aggiunge).
- **Entità come nodo + aggregato (ibrido), mostrati separati.** Il Gruppo è un nodo di
  reputazione (transazioni dirette `from`/`to`) **e** ha membri che generano un aggregato.
  I due punteggi **non si fondono** in un numero unico: la UI mostra entrambi affiancati.
- **Aggregato = media, membri neutri esclusi.** L'aggregato è la media (arrotondata
  all'intero) dei `computeScore` dei membri *che hanno almeno una transazione* nella
  direzione considerata. I membri senza alcuna relazione sono **esclusi**; se nessun membro
  ha relazioni, l'aggregato è `null` (n/d). Coerente con `averageIncomingScore` esistente.
- **Niente classi / niente OOP.** Si mantiene il MODEL funzionale (dati puri + funzioni pure).
  Motivazione completa in `research/funzionale-vs-classi.md`.
- **Niente nesting.** I membri di un Gruppo sono solo personaggi, mai altri gruppi (YAGNI).
- **No ADR** per questa feature.

## Scope

**Dentro:**

- MODEL: schema `Gruppo`, CRUD gruppi e membri, funzioni pure per i punteggi derivati.
- STORE: persistenza e API per gruppi/membri.
- IO: bump `SCHEMA_VERSION` → 2 + migrazione dei salvataggi v1 (aggiunta `groups: []`).
- VIEW: schermate per gestire i gruppi e leggere i 4 punteggi per coppia (dettaglio in §VIEW).
- Test `node:test` (TDD) su tutte le nuove funzioni MODEL/STORE/IO.

**Fuori (YAGNI):**

- Nessun campo specializzato per tipo (popolazione, dimensione, coordinate…).
- Nessun gruppo annidato in un gruppo.
- Nessun fondere i due punteggi in uno; nessun peso configurabile.
- Nessun server / DB / backend Python (discusso in `research/funzionale-vs-classi.md`, è
  esplicitamente futuro).

## Vincolo architetturale

Si rispettano i tre layer. La **logica di reputazione vive solo nel MODEL**: STORE e VIEW non
calcolano punteggi. Il MODEL resta **framework-agnostico** (nessun `window`/`document`/
`localStorage`) e funzionale (nessuna classe con comportamento). Lo STORE resta l'unico layer
che tocca `localStorage`.

## Modello dati

### Stato

Nuovo array `groups` in `createState()`:

```js
{
  version: SCHEMA_VERSION,   // → 2
  characters: [],
  transactions: [],
  groups: [],
}
```

### Gruppo

```js
{
  id,                 // UUID (newId)
  name,               // string
  type,               // string libero: etichetta ("fazione", "città", …); default '' o 'gruppo'
  memberIds: [],      // id di personaggi; un personaggio può stare in più gruppi
  deletedAt: null,    // soft-delete, come i personaggi
}
```

Factory `createGroup(name, type)` in `schema.js`, sullo stesso pattern di `createCharacter`.

### Transazioni

**Struttura invariata.** `fromId` / `toId` ora possono essere id di personaggio *o* di gruppo.
Gli UUID sono globalmente unici, quindi non serve un campo `type` sulla transazione: un helper
`resolveNode(state, id)` risolve se l'id è un personaggio o un gruppo (o `null`). Le transazioni
dirette su un gruppo sono semplicemente transazioni il cui `from`/`to` è l'id del gruppo, e
riusano `addTransaction` / `editTransaction` / `deleteTransaction` senza modifiche.

## Punteggi (funzioni pure nuove nel MODEL)

Per la coppia (personaggio X, Gruppo G) si calcolano **4 valori**, due per direzione:

### X → G (come X considera il gruppo)

- **diretto** = `computeScore(state, X, G)` — significativo solo se esistono transazioni
  X→G; se non esistono, la UI mostra n/d (usare `hasTransaction(state, X, G)` per decidere).
- **derivato** = media di `computeScore(state, X, m)` sui membri `m` di G con almeno una
  transazione X→m; `null` se nessuno.

### G → X (come il gruppo considera X)

- **diretto** = `computeScore(state, G, X)` — significativo solo se esistono transazioni G→X.
- **derivato** = media di `computeScore(state, m, X)` sui membri `m` di G con almeno una
  transazione m→X; `null` se nessuno.

### Funzioni proposte

- `groupDerivedIncoming(state, sourceId, groupId)` → "come `source` considera il gruppo"
  (media dei `computeScore(source, m)` sui membri qualificati). `null` se nessun membro
  qualificato.
- `groupDerivedOutgoing(state, groupId, targetId)` → "come il gruppo considera `target`"
  (media dei `computeScore(m, target)` sui membri qualificati). `null` se nessuno.
- I punteggi **diretti** riusano `computeScore` esistente; la decisione "mostrare o n/d" si
  basa su `hasTransaction`.
- Media: stessa logica di `averageIncomingScore` (membri senza transazione esclusi,
  `Math.round`).

Tutto **derivato, mai salvato** (invariante di progetto).

## CRUD gruppi e membri (MODEL + STORE)

MODEL (funzioni pure stato→stato, sul pattern dei personaggi):

- `addGroup(state, name, type)`
- `listActiveGroups(state)` / `listArchivedGroups(state)`
- `softDeleteGroup(state, id)` / `restoreGroup(state, id)`
- `hardDeleteGroup(state, id)` — rimuove il gruppo, le transazioni dirette da/verso il gruppo,
  e ripulisce eventuali riferimenti. **Non** tocca i personaggi membri né le loro transazioni.
- `addMember(state, groupId, charId)` / `removeMember(state, groupId, charId)` — idempotenti;
  niente duplicati in `memberIds`.

STORE: API corrispondenti + persistenza, sullo stile dell'attuale gestione personaggi.

### Integrità referenziale

- `hardDeleteCharacter` deve anche rimuovere l'id del personaggio da `memberIds` di tutti i
  gruppi (oltre alle transazioni, già gestite). Aggiornare la funzione esistente.
- `memberIds` può contenere solo id di personaggi esistenti; le funzioni di membership lo
  garantiscono.

## IO / migrazione

- `SCHEMA_VERSION` → **2**.
- In `io.js`, l'import/caricamento di uno stato `version: 1` aggiunge `groups: []` e porta
  `version` a 2. Stato già a 2 invariato. Mantenere il singolo formato JSON con campo `version`.

## VIEW (linee guida, dettaglio in fase di plan)

- **Lista gruppi**: nuova vista (analoga a `CharactersView`) con creazione, rinomina, modifica
  `type`, soft-delete/restore, gestione membri (aggiungi/rimuovi personaggi).
- **Dettaglio gruppo**: lista membri + per ogni personaggio rilevante i punteggi; reciprocamente
  un gruppo va mostrato anche nel profilo del personaggio.
- **4 numeri per coppia (X, G)**: presentati come due direzioni (X→G e G→X), ognuna con
  diretto + derivato, e n/d quando non applicabile. Etichette chiare (es. "verso il gruppo
  (diretto)" / "verso il gruppo (membri)").
- Integrazione con il drawer / navigazione esistente da valutare nel plan.
- La VIEW si verifica a mano nel browser (convenzione di progetto).

## Testing

- `node:test` (TDD) su tutte le nuove funzioni MODEL: `createGroup`, CRUD, membership,
  `groupDerivedIncoming`, `groupDerivedOutgoing`, `resolveNode`, e l'aggiornamento di
  `hardDeleteCharacter`.
- Casi chiave da coprire:
  - aggregato con membri misti (alcuni con transazione, altri senza → esclusi);
  - aggregato `null` quando nessun membro qualificato;
  - transazioni dirette su un gruppo (diretto presente vs n/d);
  - `hardDeleteGroup` non intacca personaggi/transazioni dei membri;
  - `hardDeleteCharacter` ripulisce `memberIds`;
  - migrazione v1 → v2.
- IO: round-trip export/import con gruppi; migrazione da uno stato v1.
- La VIEW: checklist di verifica manuale (da dettagliare nel plan).

## Estensibilità (note, non da implementare ora)

- Campi specializzati per tipo (popolazione, mappa) si aggiungono come campi opzionali nullable
  senza rompere lo schema.
- Gruppi annidati richiederebbero di estendere `memberIds` ad accettare id di gruppo e di
  rendere ricorsivo l'aggregato — fuori scope ora.
- Un eventuale backend Python/OOP è discusso e rimandato in `research/funzionale-vs-classi.md`.