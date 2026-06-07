# Ricerca — Migliorare la presentazione dati + vista per-personaggio

Data: 2026-06-07
Stato: ricerca / pre-brainstorm 003

## Domanda

Migliorare la presentazione dei dati. La matrice resta, ma come vista **secondaria**.
Vista primaria desiderata: lista personaggi → click su personaggio → profilo dove vedo
"cosa gli altri pensano di lui" e "cosa lui pensa degli altri". Domande collaterali:
esiste una skill per UX? Conviene progettarla ora o dopo? Vanilla JS o framework?

## 1. Esistono skill per farlo?

Sì, due, in momenti diversi del workflow:

- **`brainstorming`** — progettare la feature in dialogo prima di scrivere codice (intento,
  vincoli, approcci). È lo stadio SPEC del nostro workflow.
- **`frontend-design`** — genera interfacce frontend curate, production-grade, evitando
  l'estetica "AI generica". Si usa in fase di **implementazione** (stadio PLAN→codice),
  non per la ricerca.

Non esiste una skill "UX research" dedicata oltre a queste. Il percorso resta:
`brainstorming` → `spec.md` → `writing-plans` → implementazione (con `frontend-design` per
la resa visiva).

## 2. La feature: cosa serve davvero

Buona notizia: **il MODEL ha già tutto**. La vista per-personaggio è puro lavoro di VIEW,
zero modifiche a model/store/io.

Funzioni già disponibili in `src/model/reputation.js`:

- `listActiveCharacters(state)` → la lista personaggi.
- `computeScore(state, from, to)` → punteggio direzionale (asimmetrico).
- `listTransactions(state, from, to)` → transazioni di una direzione.

Il profilo personaggio X si compone così:

- **"Cosa pensano di lui"** (in entrata): per ogni altro Y → `computeScore(state, Y, X)`.
- **"Cosa pensa lui"** (in uscita): per ogni altro Y → `computeScore(state, X, Y)`.

Due liste, stesso codice colore già usato nella matrice. Click su una voce → apre le
transazioni di quella relazione (la logica esiste già, accetta `fromId, toId`).

### Navigazione

La navigazione lista ↔ profilo ↔ matrice può seguire due modelli, da scegliere nel
brainstorm (vedi §4):

- **Stato UI in memoria** (`ui.view`, `ui.selectedChar`): semplice, nessun URL, nessun
  problema di routing su Pages.
- **Rotte vere**: URL profondi condivisibili (es. `/personaggio/aragorn`), refresh e
  bookmark funzionano; richiedono un router e il fix 404 di GitHub Pages
  ([[spa-routing-github-pages-404]]).

### Presentazione: idee concrete

- **Vista primaria**: lista personaggi (lista o griglia di card) con un punteggio sintetico
  (es. reputazione media in entrata) e colore.
- **Profilo**: "Di lui pensano" / "Lui pensa" (tab o colonne), ordinabili per punteggio.
- **Matrice**: vista secondaria/avanzata.
- **Switcher di vista** in toolbar: Lista | Griglia | Matrice.

## 3. Progettare ora o dopo?

**Ora, come feature a sé (003).**

- Allineata all'obiettivo reale: l'app serve agli amici (vedi
  `features/002-deploy-distribuzione/requisiti.md`); lista/profilo è più leggibile della
  matrice per chi ha poca dimestichezza.
- Isolata: tocca solo la VIEW, il MODEL regge senza modifiche.

Percorso: workflow standard — `brainstorming` per la `spec.md`, poi `writing-plans`, poi
implementazione.

## 4. Vanilla JS o framework?

**Framework, adesso.** Lo scope della 003 (3 viste + switcher + ricerca + ordinamento + tab +
navigazione profilo) è esattamente ciò che il vanilla rende doloroso e un framework rende
semplice. Farla in vanilla e migrarla dopo significherebbe riscrivere la VIEW due volte.

Perché conviene ora ed è a basso rischio:

- Il valore (MODEL puro, IO versionato) è **già framework-agnostico**: il framework tocca
  **solo la VIEW**.
- La VIEW oggi è **piccola** (V1): riscriverla ora costa poco; dopo la 003 costerebbe il
  doppio. Si migra quando la VIEW è minima, cioè adesso.
- [[0002-no-anticipare-backend]] (non anticipare) riguarda il *backend*, dove il bisogno è
  vago/futuro. Qui il bisogno è *concreto e presente* → si affronta subito.

### Opzioni di framework (scelta nel brainstorm)

- **No-build via ESM** (es. Preact+htm, van.js, lit-html): componenti e reattività senza
  bundler né CI; Pages serve i sorgenti come oggi. Più leggero, ecosistema minore.
- **Framework pieno + build** (Vue/React + Vite): miglior DX, router ufficiale per rotte
  vere, ecosistema. Richiede bundler + GitHub Actions per pubblicare `dist/` e `base` path
  corretto ([[vue-react-su-github-pages]]).
- Se si scelgono rotte vere: router + fix 404 di Pages (hash-routing o `404.html` copia di
  `index.html`, [[spa-routing-github-pages-404]]).

## Conclusione operativa

1. **Feature 003** = vista lista + profilo personaggio, matrice come secondaria.
2. Su **framework frontend**, solo layer VIEW (MODEL invariato).
3. Workflow: `brainstorming` → `spec.md` → `writing-plans` → codice (con `frontend-design`).
4. Framework specifico (no-build vs build) e navigazione (rotte vere vs stato UI in memoria):
   decisi nel brainstorm, sanciti in una ADR.
