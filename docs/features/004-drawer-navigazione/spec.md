# Spec — Feature 004: Drawer di navigazione e contesto app

Data: 2026-06-09
Stato: COMPLETATA — implementata via `plan.md` (subagent-driven), 41/41 test verdi, build pulita, mergiata in `main` (2026-06-09).

> ⚠️ **Snapshot storico (feature 004).** Il design del drawer (shell di contesto, selettore
> funzioni, spiegazione Reputazione, comportamento/a11y/responsive) è **tuttora valido**.
> È invece **superato** il "per ora placeholder" delle impostazioni: in coda alla feature
> sono state rese **reali** — **Scarica/Carica dati** (export/import) spostati qui
> dall'header e toggle **"Mostra archiviati"** spostato dalla toolbar. Dove il corpo dice
> "placeholder" (§Obiettivo, §Scope, checklist §Testing, §Estensibilità), leggi **"reali"**.

## Obiettivo

Dare all'app una **shell di contesto**: un drawer laterale a scomparsa che comunica
"TTRPG-Core è l'app base e stai usando la funzione Reputazione", spiega in breve come
funziona la reputazione, e ospita le impostazioni (per ora placeholder).

Il drawer introduce anche il concetto — solo visivo — che TTRPG-Core conterrà più funzioni
in futuro, tramite un selettore di funzioni con la voce attiva (Reputazione) e una voce
generica "Altro · in arrivo" disabilitata.

## Scope

**Dentro:**

- Nuovo componente drawer a scomparsa da sinistra, sopra il contenuto (overlay + scrim).
- Bottone hamburger nell'header esistente per aprirlo.
- Cinque sezioni nel drawer: identità app, selettore funzioni, spiegazione Reputazione,
  impostazioni generali (app-level), impostazioni Reputazione.
- **Impostazioni generali:** Scarica/Carica dati (export/import dell'intero stato app),
  spostati qui dall'header.
- **Impostazioni Reputazione:** toggle "Mostra archiviati", spostato qui dalla toolbar.
- Comportamento di apertura/chiusura, responsive, accessibilità di base.

**Fuori (YAGNI):**

- Nessuna seconda funzione reale (solo la voce segnaposto "Altro").
- Nessuna pagina/route docs dedicata: la spiegazione è breve e inline.
- Nessuna persistenza dello stato aperto/chiuso del drawer.
- Nessuna modifica a MODEL / STORE / IO.

## Vincolo architetturale

Lavoro **interamente nel layer VIEW**: nessuna modifica ai file di `src/model/`, `src/store/`
(incluso `src/store/io.js`). Il drawer consuma le API pubbliche esistenti — router
(navigazione/evidenziazione funzione attiva), store (`useStore`, `useUiState`) e
`serializeState`/`parseImport` di `io.js` per export/import — esattamente come faceva prima
l'header. Coerente col vincolo dei tre layer del progetto.

## Architettura

### Componenti

- **`src/view/components/AppDrawer.vue`** (nuovo) — il drawer completo: scrim, pannello,
  quattro sezioni. Riceve `open` (Boolean) via prop ed emette `close`. Non possiede lo stato:
  lo stato vive nel genitore.
- **`src/view/App.vue`** (modificato) — possiede `drawerOpen = ref(false)`. Aggiunge il
  bottone hamburger nell'header (a sinistra del logo) che fa `drawerOpen = true`. Rende
  `<AppDrawer :open="drawerOpen" @close="drawerOpen = false" />`.

### Dati / configurazione

- **Lista funzioni** — modulo dedicato **`src/view/appFunctions.js`** che esporta l'array
  statico di configurazione (isolato dal componente per essere testabile). Ogni voce:
  `{ id, label, routeName | null, status: 'active' | 'soon' }`.
  Contenuto iniziale:
  - `{ id: 'reputazione', label: 'Reputazione', routeName: 'characters', status: 'active' }`
  - `{ id: 'altro', label: 'Altro', routeName: null, status: 'soon' }`
  Il modulo espone anche una funzione pura per determinare la funzione attiva data la route
  corrente (es. `activeFunctionId(routeName)`); la voce `soon` è disabilitata (non cliccabile).
- **Testo "come funziona"** — nuova costante in `src/view/uiCopy.js` (stesso pattern di
  `SCORE_TIP`, estensibile). Es. `REPUTATION_HELP`, testo breve (2-4 frasi): opinione 1-100,
  base 50, asimmetria A→B / B→A, transazioni, punteggio sintetico = media voti ricevuti.

### Stile

- Nuove classi in `styles/main.css` (es. prefisso `ds-drawer` / `rep-drawer`), riusando i
  token esistenti: gradiente oro della segmented active per la funzione attiva, `--radius-pill`
  per i badge "in arrivo", scrim semitrasparente, `--dur-fast` per le transizioni.
- Riuso del componente `ds-overlay`/scrim già presente se adatto, altrimenti scrim dedicato.

## Comportamento

- **Apertura:** click sull'hamburger → drawer scivola da sinistra (transform), scrim appare.
- **Chiusura:** click su X nel drawer, click sullo scrim, tasto **Esc**.
- **Larghezza:** ~300px su desktop; su mobile `min(300px, 85vw)` per non coprire tutto.
- **Navigazione funzioni:** click sulla funzione attiva → naviga alla sua route (se non già lì)
  e chiude il drawer. La voce `soon` è inerte.
- **Stato:** locale ad `App.vue`, non persistito, non legato al router (il drawer è un overlay,
  non una route).

## Accessibilità

- Hamburger: `<button>` con `aria-label` (es. "Apri menu").
- Drawer: `role="dialog"`, `aria-modal="true"`, etichetta accessibile.
- **Esc** chiude. All'apertura il focus va al primo elemento focusabile del drawer; alla
  chiusura torna all'hamburger.
- Scrim non focusabile; click su scrim chiude.
- Animazioni rispettano `prefers-reduced-motion` (media query già esistente in `main.css`).

## Responsive

- Coerente col lavoro responsive già fatto: drawer e scrim coprono il viewport, pannello
  a larghezza limitata su mobile, contenuto a tutta larghezza quando il drawer è chiuso.

## Testing

Per convenzione di progetto la VIEW si verifica a mano nel browser (MODEL/STORE/IO restano
l'unico ambito con `node:test`). Checklist di verifica manuale:

1. Hamburger apre il drawer; X / scrim / Esc lo chiudono.
2. "Reputazione" risulta evidenziata come attiva; "Altro" è disabilitata.
3. La spiegazione mostra il testo da `uiCopy.js`.
4. La sezione impostazioni mostra il placeholder.
5. Su mobile (320/375/425px) il drawer non sfora e il contenuto sottostante resta usabile.
6. Focus va nel drawer all'apertura e torna all'hamburger alla chiusura.

`src/view/appFunctions.js` è un modulo puro (nessuna dipendenza da Vue/browser): la sua
funzione `activeFunctionId(routeName)` va coperta con `node:test` come MODEL/STORE/IO.

## Estensibilità (note, non da implementare ora)

- Aggiungere una funzione reale = una voce nell'array con `status: 'active'` e la sua route.
- Le impostazioni di Reputazione diventeranno reali sostituendo il placeholder.
- Eventuali docs più lunghi potranno diventare una route dedicata senza toccare il drawer
  (che mostrerebbe solo un riassunto + link).
