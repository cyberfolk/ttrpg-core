# Design — Sistema di Reputazione tra Personaggi (V1)

> ⚠️ **Snapshot storico (feature 001).** Lo stack VIEW descritto qui (vanilla JS, una
> pagina, niente framework/rotte) era quello di V1. Dalla feature 003 la VIEW è **Vue 3 +
> Vite + vue-router** (ADR 0003); MODEL/STORE/IO restano invariati.

Data: 2026-06-06 Stato: approvato (design), in attesa di piano implementativo Progetto: ttrpg-core — web app locale per gestione TTRPG (prima feature: D&D, reputazione)

---

## 1. Obiettivo

Web app **locale** (gira nel browser, nessun server) per tracciare la reputazione tra personaggi di una campagna D&D. Prima feature di una piattaforma TTRPG pensata per crescere in modo modulare.

Vincoli guida (dalla spec):

- Struttura semplice, veloce da implementare, basso debito tecnico.
- Estensibile/modulare per feature future.
- **Separazione netta** tra logica/dati (backend) e visualizzazione (frontend).
- Focus iniziale sul backend.
- Solo **JS/CSS/HTML vanilla**, nessun framework in V1 (vedi §9 per quando rivalutare).
- Sistema di **export/import dati** come area di primaria importanza.
- Modelli dati pensati per **futura migrazione a Python** a costo quasi nullo.

---

## 2. Decisioni chiave (esito brainstorming)

| Tema                | Decisione                                                                       | Note                                                            |
|---------------------|---------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Simmetria relazione | **Asimmetrica** (A→B e B→A indipendenti)                                        | Estende la spec ("biunivoco"); modella faide/cotte unilaterali  |
| Calcolo punteggio   | **Derivato**: `BASE + somma delta`, non salvato                                 | Storico = unica fonte di verità                                 |
| Clamp 1-100         | **Solo in vista**, somma interna libera                                         | Reversibile. `clampView` isolata → switch a clamp duro = 1 riga |
| Persistenza         | **localStorage** (auto-save JSON)                                               | Stesso formato dell'export                                      |
| Python-ready        | **Confini puliti**, no over-engineering                                         | MODEL puro traducibile 1:1                                      |
| Delete personaggio  | **Soft delete** reversibile + popup per **hard delete** irreversibile (cascata) |                                                                 |
| Import              | **Replace** in V1, funzione isolata per **merge** futuro                        |                                                                 |
| UI                  | **Matrice** N×N + pannello transazioni                                          | Vanilla JS, una pagina                                          |

---

## 3. Architettura a layer

Tre layer, dipendenze solo verso il basso. Separazione dati/vista + confini Python-ready.

```
┌─────────────────────────────────────────┐
│  VIEW  (DOM, HTML/CSS, event handler)    │  ← solo JS, tocca il DOM
├─────────────────────────────────────────┤
│  STORE (orchestratore: stato + persist)  │  ← unico a toccare localStorage
├─────────────────────────────────────────┤
│  MODEL (dati puri + funzioni pure)       │  ← no DOM, no browser → migra a Python
└─────────────────────────────────────────┘
```

- **MODEL**: oggetti dati puri + funzioni pure. Zero dipendenze browser. È il pezzo che domani migra a Python (dataclass + funzioni).
- **STORE**: stato in memoria, muta via MODEL, serializza a localStorage. Unico punto che conosce localStorage → domani diventa "chiama API Python" senza toccare MODEL/VIEW.
- **VIEW**: rendering + input. Parla solo con STORE. Mai logica di dominio.

**Regola d'oro**: la logica di reputazione vive *solo* in MODEL. VIEW e STORE non calcolano punteggi.

---

## 4. Modello dati

Con punteggio derivato + relazioni asimmetriche, la "relazione" **non si salva**: è calcolata. Servono solo **due** entità.

```
Character {
  id:        string         // univoco
  name:      string
  deletedAt: number | null  // null = attivo; timestamp = soft-deleted
}

Transaction {
  id:        string
  fromId:    string         // chi cambia opinione
  toId:      string         // su chi
  delta:     number         // signed (+/-): la "transazione relazionale" della spec
  name:      string         // motivo ("salvato in battaglia", "rubato oro")
  createdAt: number         // timestamp, per ordinare lo storico
}
```

La relazione è **derivata**, non è un record:

```
BASE = 50                                   // costante configurabile
sumDelta(A→B) = Σ delta dove fromId=A ∧ toId=B
clampView(x)  = max(1, min(100, x))         // strategia isolata
score(A→B)    = clampView(BASE + sumDelta(A→B))
```

Conseguenze gratuite:

- **Nuovo char nasce a 50 con tutti** → automatico (nessuna tx = somma 0 = 50).
- **Asimmetria** → `A→B` e `B→A` sono filtri diversi, indipendenti.
- **Storico = verità unica** → add/edit/delete tx → ricalcolo, nessun disallineamento.
- **Soft delete** → filtra `deletedAt != null` dalla vista.
- **Hard delete** → rimuovi char + cascata transazioni con quel `fromId`/`toId`.

`BASE` e `clampView` isolati → cambiare base o passare a clamp duro = una riga.

---

## 5. Persistenza + Export/Import

Un solo formato per tutto: lo **stato serializzato**. Stesso JSON in localStorage, export e import. Nessuna conversione.

```json
{
  "version": 1,
  "exportedAt": 1749200000000,
  "characters": [
    {
      "id": "c1",
      "name": "Aragorn",
      "deletedAt": null
    }
  ],
  "transactions": [
    {
      "id": "t1",
      "fromId": "c1",
      "toId": "c2",
      "delta": 10,
      "name": "salvato in battaglia",
      "createdAt": 1749100000000
    }
  ]
}
```

- **Auto-save**: ogni mutazione → STORE serializza → `localStorage.setItem`. Sincrono.
- **Export** (bottone "Scarica"): `JSON.stringify` indentato → `Blob` → download file
  `reputation-YYYYMMDD-HHmm.json` (timestamp → mai sovrascrive backup).
- **Import** (bottone "Carica"): `<input type=file>` → leggi → `JSON.parse` →
  **valida** (`version`, struttura, integrità referenziale: ogni `fromId`/`toId` esiste)
  → popup conferma (sovrascrive) → **replace** stato + auto-save. File rotto → errore, stato corrente intatto.
- **`version`**: cambio schema in V2 → `migrate(data)` v1→v2 al load. Import di file vecchi continua a funzionare.
- **Merge futuro**: la funzione che applica l'import è isolata; aggiungere modalità merge in V2 non tocca il resto.

Bonus Python-ready: questo JSON è esattamente ciò che un futuro backend Python legge/scrive. Il contratto dati è già definito qui.

---

## 6. Operazioni (API dei layer)

**MODEL** (funzioni pure: input stato → nuovo stato o valore; immutabili, testabili, traducibili in Python):

```
createCharacter(state, name)                  → state'
softDeleteCharacter(state, id)                → state'   // set deletedAt
restoreCharacter(state, id)                   → state'   // deletedAt = null
hardDeleteCharacter(state, id)                → state'   // rimuove char + cascata tx
addTransaction(state, fromId, toId, delta, name) → state'
editTransaction(state, txId, { delta?, name? })  → state'
deleteTransaction(state, txId)                → state'
computeScore(state, fromId, toId)             → number   // BASE + sum, clampView
listTransactions(state, fromId, toId)         → Transaction[]  // ordinate per createdAt
listActiveCharacters(state)                   → Character[]
```

**STORE** (stato in memoria + persistenza; chiama MODEL):

```
getState()           → stato corrente
dispatch(action)     → applica funzione MODEL, salva localStorage, notifica VIEW
exportToFile()       → download JSON
importFromFile(file) → valida, replace, salva
subscribe(listener)  → VIEW si registra per re-render
```

**Flusso unidirezionale**: VIEW chiama `store.dispatch(...)` → STORE muta via MODEL → salva → notifica → VIEW ri-renderizza. Niente framework.

---

## 7. Frontend minimale

UI sobria ma funzionale (focus su backend). Vanilla JS, una pagina.

**Layout: matrice di reputazione** (vista naturale per relazioni asimmetriche)

```
            →  Aragorn   Legolas   Gimli
  Aragorn      —          70        45
  Legolas      55         —         80
  Gimli        62         50        —
```

- Riga = `from`, colonna = `to`. Cella `[A][B]` = `score(A→B)`. Asimmetria visibile
  (cella A→B ≠ B→A). Diagonale vuota.
- Click su cella → pannello/modal transazioni della relazione direzionale: lista
  (nome, delta, data) + add/edit/delete. Ricalcolo live.
- Colore cella per valore (rosso basso → verde alto). CSS puro.

**Toolbar**:

- `+ Personaggio` (input nome)
- `Scarica` (export JSON)
- `Carica` (import JSON)
- Toggle `Mostra archiviati` → restore o elimina definitivo (popup irreversibile)

**Moduli render** focalizzati: `renderMatrix()`, `renderTransactionPanel()`,
`renderToolbar()`. Ognuno legge stato → produce DOM. Re-render su `store.subscribe`.

**Scalabilità**: matrice N×N ottima fino a ~20-30 char. Oltre → V2 "scheda per personaggio". Per una campagna D&D (pochi PNG rilevanti) la matrice è perfetta.

---

## 8. Struttura file proposta

```
ttrpg-core/
  index.html                  // entry point, carica i moduli
  src/
    model/
      schema.js               // costanti (BASE), forma dati, version
      reputation.js           // funzioni pure: score, clamp, CRUD char/tx
    store/
      store.js                // stato in memoria, dispatch, subscribe
      persistence.js          // localStorage load/save
      io.js                   // export file, import+validazione+migrate
    view/
      matrix.js               // renderMatrix
      transactionPanel.js     // renderTransactionPanel
      toolbar.js              // renderToolbar
      app.js                  // bootstrap: collega store + view
  styles/
    main.css
  scripts/tests/              // test funzioni MODEL (vedi §10)
```

Moduli ES (`<script type="module">`) → import nativi, nessun bundler in V1.

---

## 9. Nota framework

V1 vanilla è adeguato: poche viste, stato piccolo, re-render semplice. **Rivalutare un framework** (es. Lit per web components leggeri, o React/Svelte) quando si presenta uno di questi segnali:

- Le viste si moltiplicano e il re-render manuale diventa fragile/ripetitivo.
- Servono componenti riusabili complessi con stato locale.
- La matrice lascia spazio a più schermate con routing.

Il layer MODEL/STORE è indipendente dalla VIEW → un eventuale framework tocca solo la VIEW.

---

## 10. Testing

MODEL è fatto di funzioni pure → test diretti, senza DOM né browser. Coprire almeno:

- `computeScore`: base 50 senza tx; somma delta; clamp a 1 e 100; somma interna che sfora.
- `createCharacter`: nasce a 50 verso tutti gli esistenti (e viceversa).
- `addTransaction` / `editTransaction` / `deleteTransaction`: effetto sul punteggio.
- `softDeleteCharacter` / `restoreCharacter` / `hardDeleteCharacter` (cascata tx).
- `io`: round-trip export → import = stato identico; import file invalido → rifiutato.

Posizione: `scripts/tests/` (convenzione progetto).

---

## 11. Fuori scope V1 (YAGNI)

- Relazioni di gruppo/fazioni, eventi temporali, decadimento punteggio nel tempo.
- Import in modalità merge (predisposto, non implementato).
- Altri sistemi TTRPG oltre D&D; multi-campagna.
- Backend Python (solo confini predisposti).
- Autenticazione, multi-utente, sync cloud.