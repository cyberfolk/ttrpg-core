# Ricerca — Domande pre-brainstorm feature 003

Data: 2026-06-07
Stato: ricerca / pre-brainstorm
Riferimenti: `features/003-viste-e-profilo/requisiti.md`,
[[01-presentazione-dati]], [[0002-no-anticipare-backend]]

Risposte alle 5 domande poste prima di avviare il brainstorm di 003.

---

## 1. Vanilla JS o framework?

**Framework, adesso.** Lo scope della 003 — 3 viste (lista / griglia / matrice) + profilo +
switcher + barra di ricerca + colonne ordinabili + tab + navigazione — è proprio ciò che il
vanilla rende doloroso. Farla in vanilla e migrarla dopo significa riscrivere la VIEW due
volte.

Perché conviene ora ed è a basso rischio:

- Il valore (MODEL puro, IO versionato) è **già framework-agnostico**: il framework tocca
  **solo la VIEW**.
- La VIEW oggi è **piccola** (V1): riscriverla ora costa poco, dopo la 003 il doppio. Si
  migra quando la VIEW è minima, cioè adesso.
- [[0002-no-anticipare-backend]] riguarda il *backend* (bisogno vago/futuro); il framework
  frontend è bisogno *concreto/presente* → si affronta subito.

Due opzioni, da scegliere nel brainstorm e sancire in una ADR:

1. **Micro-libreria no-build** via ESM (es. `van.js` ~1KB, `lit-html`, `Preact`+`htm`):
   componenti e reattività senza bundler né CI; Pages serve i sorgenti come oggi. Più
   leggera, ecosistema minore.
2. **Framework pieno + build** (Vue/React + Vite): miglior DX, router per rotte vere,
   ecosistema; richiede bundler + GitHub Actions e `base` path corretto
   ([[vue-react-su-github-pages]]). Se si vogliono rotte vere → router + fix 404 di Pages
   ([[spa-routing-github-pages-404]]).

In ogni caso cambia **solo la VIEW**: MODEL/STORE/IO restano.

## 2. La vista griglia-card si può chiamare "kanban" come in Odoo?

**Fuorviante. Non chiamarla kanban (per ora).**

"Kanban" significa **board a colonne** dove ogni colonna è uno stato/fase e le card si
spostano tra colonne (workflow, WIP). Odoo usa il termine in modo lasco per qualsiasi griglia
di card, ma è gergo Odoo, non significato proprio.

La tua vista è una **griglia di card senza colonne, senza fasi, senza drag** → è una
**"vista a schede" / "griglia card" / "gallery"**, non un kanban. Chiamarla kanban:

- è impreciso (manca il concetto di colonne/flusso);
- è gergo che i tuoi amici (utenti non tecnici) non capiscono.

Nomi adatti: **griglia**, **schede**, **gallery**.

Riservare "kanban" **solo se** in futuro raggruppi i personaggi in colonne per fascia di
reputazione (es. "amati / neutri / odiati") con drag tra colonne: quello sì sarebbe un kanban
legittimo.

## 3. La skill `frontend-design`: prima o dopo il piano?

**Dopo. In fase di implementazione, non nel brainstorm.**

Ordine delle skill (regola di priorità superpowers): prima le skill di **processo**
(`brainstorming`), poi quelle di **implementazione** (`frontend-design`). Il flusso:

```
brainstorming → spec.md → writing-plans → plan.md → IMPLEMENTAZIONE ← qui frontend-design
```

`frontend-design` **genera codice UI** curato (componenti, CSS, estetica non-generica):
ha senso quando scrivi davvero la VIEW, cioè eseguendo il piano.

Sfumatura utile: le decisioni di **layout/UX concettuali** (tab vs colonne, posizione dello
switcher, ricerca in alto) si prendono **nel brainstorm** e finiscono nella `spec.md` — ma
quello è ragionamento di design, non la skill. La skill pesante entra dopo, per la resa.

Quindi: brainstorm = decidi *cosa* e *come si comporta*; `frontend-design` = produce il
*come appare*, in implementazione.

## 4. Dove mettere gli asset?

**Nella cartella `assets/` alla radice (già esiste), NON dentro `src/`.**

Motivi:

- `src/` è **codice** (model = traducibile in Python, store, view). Metterci binari/immagini
  inquina l'albero logico e complica la build.
- L'app è statica servita da Pages con **path relativi**: gli asset in `assets/` vengono
  serviti così come sono, referenziati con URL relativo da `index.html` / CSS / JS.
- È già la convenzione del progetto (`assets/` = immagini, vedi project-layout).

Indicazioni:

- Sottocartelle per tipo: `assets/icons/`, `assets/img/`.
- Riferimento via **path relativo** (`assets/icons/x.svg`), mai `import` come modulo JS.
- Per icone piccole: valuta **SVG inline** nel JS (zero file asset) — es. l'attuale 🗑 è
  un'emoji, non serve asset.

## 5. Conviene fare modifiche preliminari prima del brainstorm?

**No modifiche di codice ora. Il brainstorm potrebbe cambiare direzione: refactorare prima
sarebbe spreco.**

Però ci sono cose **da sapere/decidere** (non da implementare) che renderanno il brainstorm
più rapido:

- **Manca un helper nel MODEL** per il "punteggio sintetico = media della percezione in
  entrata". Oggi `reputation.js` ha solo `computeScore` per coppia. Servirà una nuova
  funzione pura (es. `averageIncomingScore(state, charId)`). Aggiunta **piccola e isolata**
  al MODEL → si progetta nella spec, si implementa nel plan, **non** ora.
- **Superficie di riuso confermata**: `computeScore` (2 direzioni), `listTransactions`,
  `listActiveCharacters`, `renderTransactionPanel(container, state, fromId, toId, cb)`,
  `scoreColor` (oggi dentro `matrix.js` — andrà probabilmente estratta in un punto comune, ma
  è una decisione della spec).
- **Stack frontend da scegliere**: no-build vs build (vedi §1) e rotte sì/no vanno decisi nel
  brainstorm e sanciti in una ADR, non di sfuggita.

Unica "preparazione" sensata: entrare nel brainstorm con queste risposte in testa. Nessun
commit di codice preliminare.

---

## TL;DR

1. **Framework adesso** (i vincoli no-framework/no-rotte non sono più mandatori;
   vanilla-poi-migra = doppio lavoro). Scelta framework (no-build vs build) + rotte nel
   brainstorm, sancite in ADR. Cambia solo la VIEW.
2. **Non "kanban"** → "griglia/schede/gallery". Kanban solo se un giorno aggiungi colonne per
   fascia + drag.
3. `frontend-design` **dopo il piano**, in implementazione. Le scelte UX concettuali stanno
   nel brainstorm/spec.
4. Asset in **`assets/`** alla radice (sottocartelle + path relativi), mai in `src/`.
5. **Nessuna modifica di codice preliminare.** Solo note: servirà `averageIncomingScore` nel
   MODEL e forse estrarre `scoreColor` — entrambe nel plan, non prima.
