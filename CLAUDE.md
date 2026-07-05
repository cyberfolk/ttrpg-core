# CLAUDE.md

@~/.claude/shared/git-commit-tags-list.md
@~/.claude/shared/todo-conventions.md

---

## Progetto

Web app **locale** (browser, no server) di tool per TTRPG. Feature centrale: sistema di
reputazione asimmetrica tra **entità** (personaggi e gruppi). Feature consegnate: reputazione,
deploy/distribuzione, viste e profilo, drawer di navigazione, gruppi.

Stack: VIEW in **Vue 3 + Vite + vue-router** (routing history mode con `404.html` per GitHub Pages; vedi ADR 0003). `MODEL`/`STORE`/`IO` sono framework-agnostici: il framework tocca **solo la VIEW**.

**Riferimenti (leggi al bisogno, non caricati di default):**
- Lavoro VIEW → `DESIGN.md`: design system "Atlante" (token, componenti `ds-*`, `<ScoreChip>`, matrice).
- Brand, utenti, principi di prodotto → `PRODUCT.md`.
- Perché di una scelta architetturale → `docs/adr/` (invarianti già distillati qui sotto).

## Architettura (vincolo forte)

Tre layer, dipendenze solo verso il basso:

- `src/model/` — dati puri + funzioni pure. **Nessuna dipendenza dal browser** (no
  `window`/`document`/`localStorage`): traducibile 1:1 in Python (migrazione futura).
- `src/store/` — stato in memoria + persistenza. **Unico layer che tocca localStorage.**
- `src/view/` — rendering UI (componenti Vue 3). Parla solo con lo store. Layer isolato:
  cambiarlo non tocca MODEL/STORE/IO.

La logica di reputazione vive **solo nel MODEL**: view e store non calcolano punteggi.

Asset statici (immagini, ecc.) in `assets/` alla radice del progetto, non in `src/`.

## Invarianti dati

- Punteggio **derivato, mai salvato**: `clampView(50 + somma delta transazioni A→B)`.
- Relazioni **asimmetriche**: `A→B` indipendente da `B→A`.
- Nodi di reputazione **polimorfi**: `from`/`to` di una transazione può essere un
  personaggio *o* un gruppo. UUID globalmente unici → nessun campo `type` sulla
  transazione; `resolveNode(state, id)` disambigua (personaggio | gruppo | `null`).
- `BASE` (50) e `clampView` isolati in `src/model/` → cambiarli è una riga sola.
- Export/import: unico formato JSON con campo `version` (vedi `src/store/io.js`).
- Aggregato gruppo: media (arrotondata) dei `computeScore` dei membri con ≥1 transazione
  nella direzione considerata; `null` se nessun membro qualificato. Nodo diretto e
  aggregato si mostrano **separati**, mai fusi in un numero unico.

## Comandi

- Test: `npm test` (= `node --test`, auto-discovery di `tests/**/*.test.js`).
  **Non** usare `node --test tests/` (forma directory rotta su Windows): per un
  singolo file usa `node --test tests/<nome>.test.js`.
- Avvio app (dev): `npm run dev` (Vite dev server). Build di produzione: `npm run build` (genera `dist/` + `404.html` per il routing SPA su Pages); anteprima: `npm run preview`.

## Test

MODEL/STORE/IO coperti da `node:test` (TDD). La VIEW si verifica a mano nel browser.

## Docs

Solo due tipi di documento, indice in `docs/README.md`:

- `docs/adr/NNNN-slug.md` — **Architecture Decision Record**: una decisione architetturale
  per file, immutabile. Struttura: Contesto / Decisione / Conseguenze / Alternative /
  Quando rivedere. Nuovo ADR → prossimo `NNNN` (tracker in `docs/README.md`).
- `docs/research/<slug>.md` — note di ricerca **trasversali** (reference, non decisioni).

Gli invarianti già distillati sono qui sopra; il *perché* di una scelta sta nel suo ADR.
