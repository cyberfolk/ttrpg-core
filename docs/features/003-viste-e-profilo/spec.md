# Spec — Feature 003: Viste personaggi + profilo

Data: 2026-06-07
Stato: COMPLETATA — implementata via `plan.md`, mergiata in `main`, live su GitHub Pages (2026-06-08). ADR 0003 sancisce lo stack.
Riferimenti: `requisiti.md`, [[01-presentazione-dati]], [[02-domande-pre-brainstorm]],
[[03-scelta-framework-frontend]], [[0002-no-anticipare-backend]]

## Obiettivo

Migliorare la presentazione dei dati di reputazione. Oggi esiste solo la matrice, poco
leggibile. Si introducono un **elenco personaggi con tre viste** (gallery / list /
matrix) e un **profilo per-personaggio** che mostra reputazione in entrata e in uscita.
La feature tocca **solo la VIEW**: `MODEL` e `STORE` restano framework-agnostici e
invariati, con un'unica aggiunta pura al MODEL (`averageIncomingScore`).

## Stack (deciso, da sancire in ADR)

- **Vue 3 + Vite + vue-router** (vedi [[03-scelta-framework-frontend]]).
- **Routing: history mode** (`createWebHistory`) con **URL puliti** (es.
  `/repo/personaggio/abc`, niente `#`). Su GitHub Pages, statico e senza riscritture
  server, un refresh/link diretto a una rotta profonda darebbe 404: si risolve col
  **trucco `404.html`** — un `404.html` copia di `index.html` (o con redirect) così Pages,
  invece dell'errore, serve l'app, che poi instrada client-side. Richiede `base` path
  corretto in `vite.config.js` (es. `/repo/`) perché i bundle JS si risolvano sotto il
  sottopercorso del progetto Pages ([[spa-routing-github-pages-404]],
  [[vue-react-su-github-pages]]).
- Avvio dev: `npm run dev` (sostituisce `py -m http.server`). Build: `npm run build`,
  anteprima `npm run preview`. La pubblicazione su Pages (GitHub Actions che builda `dist/`,
  `base` path, generazione/copia `404.html`) va dettagliata nel plan. Aggiornare CLAUDE.md
  (comando avvio) in fase di plan/impl.

## Architettura: vincolo dei tre layer

Invariato il vincolo forte del progetto (`CLAUDE.md`):

- `src/model/` — dati puri + funzioni pure, nessuna dipendenza dal browser. Aggiunta:
  `averageIncomingScore`.
- `src/store/` — stato + persistenza localStorage. **Invariato.**
- `src/view/` — riscritto in Vue. È l'unico layer che cambia.

### Bridge stato (Approccio A — bridge sottile)

`createStore` resta identico. Un composable `useStore()` fa da ponte verso la reattività Vue:

- `const state = ref(store.getState())`
- `store.subscribe((s) => { state.value = s })`
- letture: i componenti leggono `state.value` (reattivo)
- scritture: `store.dispatch(modelFn)` con le funzioni pure del MODEL

Nessuna dipendenza extra (no Pinia). STORE/MODEL intatti, migrazione Python futura intatta.

## MODEL: nuova funzione pura

`averageIncomingScore(state, charId, includeArchived)` in `src/model/reputation.js`:

- `others` = `includeArchived ? (tutti i personaggi tranne charId) : (attivi tranne charId)`
- `mittenti` = gli `others` con **almeno una** transazione verso `charId`
- se `mittenti` è vuoto → ritorna `null` (la VIEW mostra `–` / `n.d.`)
- altrimenti → media di `computeScore(state, Y, charId)` su tutti i `mittenti`

`computeScore` (punteggio pairwise direzionale) resta **invariato**: il filtro
archiviati vale solo sull'**aggregato**, non sul punteggio di una singola coppia.

Coperta da `node:test` (TDD). Casi: nessun mittente → `null`; con/senza archiviati;
esclusione dei mittenti archiviati quando `includeArchived = false`.

## Routing

History mode (`createWebHistory`) con `base` path del progetto Pages, quattro rotte:

| Rotta                 | Componente        | Note                                                  |
|-----------------------|-------------------|-------------------------------------------------------|
| `/`                   | — (redirect)      | redirect → `/personaggi`; segnaposto per futura home  |
| `/personaggi`         | `CharactersView`  | switcher viste + ricerca + ordinamento + elenco pg    |
| `/personaggio/:id`    | `ProfileView`     | `:id` = **UUID** del personaggio (stabile)            |
| `/:pathMatch(.*)*`    | `NotFound`        | catch-all: rotta sconosciuta o pg inesistente         |

`/` non ha una vista propria: fa **redirect** a `/personaggi` (l'elenco). Scelta voluta
per disaccoppiare la home dall'elenco: in futuro si potrà sostituire il redirect con una
vera schermata home senza toccare l'elenco.

`:id` è l'UUID, non uno slug del nome: stabile a rinomine, niente collisioni su omonimi.
`ProfileView` se non trova il personaggio con quell'id mostra `NotFound` (o stato
equivalente "personaggio non trovato" con link alla home).

Refresh/link diretto su rotta profonda: gestito col `404.html` copia di `index.html`
(vedi sezione Stack). La rotta catch-all `NotFound` resta la pagina "non trovato"
applicativa (rotta sconosciuta o pg inesistente), indipendente dal meccanismo 404.html.

Stati **fuori URL** (solo in memoria): vista attiva (gallery/list/matrix), ricerca,
ordinamento, toggle archiviati. Nell'URL vivono solo le schermate (`/personaggi`,
`/personaggio/:id`), non gli stati interni dell'elenco.

## Stato UI in memoria (`useUiState`)

Composable reattivo, non persistito, non nell'URL:

- `activeView`: `'gallery' | 'list' | 'matrix'` — default **`'gallery'`**
- `search`: stringa — filtra i personaggi per nome (gallery + list)
- `sort`: `{ key: 'name' | 'score', dir: 'asc' | 'desc' }` — ordina gallery + list
  (la matrice ha ordine fisso)
- `showArchived`: bool — default **`false`**

### Semantica `showArchived`

- `false` (default): i personaggi archiviati sono **nascosti** in tutte le viste e nei
  profili; il calcolo di `averageIncomingScore` **esclude** i mittenti archiviati.
- `true`: gli archiviati sono **visibili** nelle viste; si può aprire il loro profilo
  (con banner/ribbon "Archiviato"); `averageIncomingScore` **include** gli archiviati.
- Conseguenza voluta: il punteggio sintetico mostrato **cambia** col toggle.

Non esiste una rotta o una schermata `/archivio` separata: la gestione dell'archivio si
fonde nelle viste tramite il toggle e le azioni per-personaggio (sotto).

## Componenti VIEW

Struttura sotto `src/view/`:

```
main.js              createApp + router + mount
router.js            le 3 rotte (history mode + base path)
useStore.js          bridge store → ref Vue
useUiState.js        activeView, search, sort, showArchived
scoreColor.js        estratto da matrix.js (helper colore, presentazione)
App.vue              layout: header persistente + <router-view>
components/
  CharactersView.vue   /personaggi: switcher + ricerca + ordinamento + vista attiva + add pg
  GalleryView.vue      griglia di card (CharacterCard)
  CharacterCard.vue    card singola: nome (link profilo), punteggio sintetico + colore, azioni
  ListView.vue         tabella ordinabile (colonne nome, punteggio sintetico)
  MatrixView.vue       matrice (ex matrix.js), click cella → modale tx, click nome → profilo
  ProfileView.vue      header pg + back + tab entrata/uscita; banner se archiviato
  RelationList.vue     lista relazioni del profilo, ordinabile
  TransactionModal.vue modale transazioni di una coppia (ex transactionPanel.js)
  NotFound.vue         rotta non trovata / pg inesistente
```

File vanilla rimossi: `app.js`, `dom.js`, `matrix.js`, `toolbar.js`,
`transactionPanel.js` e il vecchio `index.html` (sostituito dall'entry Vite).
`scoreColor` viene estratto in `scoreColor.js` (resta concern di VIEW, non MODEL).

### Header (`App.vue`, persistente)

- **Logo** — click → `/` (che fa redirect a `/personaggi`).
- **Export / Import** dei dati (riuso logica esistente: serialize/parseImport, conferma su
  import, download file).
- Lo switcher viste, la ricerca, l'add personaggio e l'ordinamento vivono in
  `CharactersView` (hanno senso solo lì), non nell'header globale.

### Elenco personaggi (`/personaggi`)

- **Switcher viste**: Gallery | List | Matrix (setta `activeView`).
- **Barra di ricerca**: filtra per nome (gallery + list).
- **Toggle "Mostra archiviati"**: setta `showArchived`.
- **Aggiungi personaggio**: input nome + bottone (riuso `addCharacter`).
- **Controlli ordinamento**: per gallery/list, su nome e su punteggio sintetico, entrambe
  le direzioni (frecce/bottoni sopra le colonne nella list; controllo equivalente per la
  gallery).
- In ogni vista, ogni personaggio mostra **nome + punteggio sintetico in entrata + colore**.
  - Click sul **nome** → profilo del personaggio.
  - Azioni per-personaggio: se attivo → **Archivia** (`softDeleteCharacter`); se archiviato
    (visibile solo con `showArchived=true`) → **Ripristina** (`restoreCharacter`) /
    **Elimina definitivo** (`hardDeleteCharacter`, con conferma).

### Profilo (`/personaggio/:id`)

- **Header**: nome del personaggio, punteggio sintetico in entrata + colore. Se il pg è
  archiviato → **banner/ribbon "Archiviato"**.
- **Ritorno all'elenco** (`/personaggi`) con tre affordance (tutte): logo (header),
  **bottone Indietro**, **breadcrumb** `Personaggi / Nome`.
- **Tab**:
  - **"Di lui pensano"** (in entrata, **default**): per ogni altro pg `Y` →
    `computeScore(state, Y, X)`.
  - **"Lui pensa"** (in uscita): per ogni altro pg `Y` → `computeScore(state, X, Y)`.
- L'insieme degli "altri pg" elencati rispetta `showArchived` (gli archiviati compaiono
  solo se `true`).
- Ogni tab è una **`RelationList`** ordinabile per nome o per punteggio (entrambe le
  direzioni).

#### Riga di relazione (in `RelationList`) — due gesti distinti

Ogni riga ha **due bersagli di click**:

- **Nome + icona `↪`** → naviga al **profilo** di quel personaggio.
- **Resto della riga / punteggio** → apre la **modale transazioni** (`TransactionModal`)
  della coppia direzionale:
  - tab entrata: transazioni `Y → X`
  - tab uscita: transazioni `X → Y`

### Modale transazioni (`TransactionModal`)

Overlay sopra il profilo. Riuso della logica di `transactionPanel.js`: lista transazioni
della coppia, aggiungi / modifica / elimina, chiusura torna al profilo. Dispatch via
`addTransaction` / `editTransaction` / `deleteTransaction`.

## Riuso confermato dal MODEL/VIEW esistenti

- `listActiveCharacters`, `listArchivedCharacters`, `computeScore`, `listTransactions`,
  `addCharacter`, `addTransaction`, `editTransaction`, `deleteTransaction`,
  `softDeleteCharacter`, `restoreCharacter`, `hardDeleteCharacter` — tutti già presenti.
- `serializeState` / `parseImport` per export/import.
- `scoreColor` — estratto da `matrix.js` a `scoreColor.js`.
- Unica aggiunta: `averageIncomingScore` (MODEL).

## Test

- **MODEL**: `averageIncomingScore` con `node:test` (TDD), inclusi i casi `null` e
  l'inclusione/esclusione archiviati.
- **VIEW**: verifica manuale nel browser (come da convenzione progetto).

## Fuori scope (YAGNI)

- Rotte per vista/ricerca/ordinamento/archivio (restano in memoria).
- Slug nome nell'URL (si usa l'UUID).
- Drag/colonne per fascia di reputazione (eventuale "kanban" futuro, vedi
  [[02-domande-pre-brainstorm]]).
- Estetica fine dei componenti: si cura in implementazione con la skill `frontend-design`.

## Decisioni da sancire in ADR (0003)

- Vue 3 + Vite + vue-router come stack della VIEW (Nuxt e no-build scartati).
- Routing **history mode** (`createWebHistory`) con **trucco `404.html`** e `base` path
  su GitHub Pages (URL puliti).
- Bridge sottile (no Pinia): il MODEL/STORE restano i proprietari dello stato.
```