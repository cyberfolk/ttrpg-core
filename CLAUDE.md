# CLAUDE.md

Versione: 2.5 | Inizializzato: 2026-06-06 00:46 | Aggiornato: 2026-06-07 16:28

@~/.claude/shared/timestamp-header.md
@~/.claude/shared/project-layout.md
@~/.claude/shared/git-rules.md
@~/.claude/shared/git-commit-tags.md
@~/.claude/shared/todo-conventions.md

---

## Progetto

Web app **locale** (browser, no server) di tool per TTRPG. Prima feature: sistema di reputazione tra personaggi D&D. 
- Prima implementazione: Stack: JS (ES modules) / HTML / CSS; 
- Dalla feature 003 la VIEW usa **Vue 3 + Vite + vue-router** (routing in history mode con `404.html` per GitHub Pages; vedi ADR 0003). `MODEL`/`STORE`/`IO` restano framework-agnostici e invariati: il framework tocca **solo la VIEW**.

## Architettura (vincolo forte)

Tre layer, dipendenze solo verso il basso:

- `src/model/` — dati puri + funzioni pure. **Nessuna dipendenza dal browser** (no
  `window`/`document`/`localStorage`): traducibile 1:1 in Python (migrazione futura).
- `src/store/` — stato in memoria + persistenza. **Unico layer che tocca localStorage.**
- `src/view/` — rendering UI (prima DOM vanilla; dalla 003 un framework frontend). Parla solo
  con lo store. Layer isolato: cambiarlo non tocca MODEL/STORE/IO.

La logica di reputazione vive **solo nel MODEL**: view e store non calcolano punteggi.

## Invarianti dati

- Punteggio **derivato, mai salvato**: `clampView(50 + somma delta transazioni A→B)`.
- Relazioni **asimmetriche**: `A→B` indipendente da `B→A`.
- `BASE` (50) e `clampView` isolati in `src/model/` → cambiarli è una riga sola.
- Export/import: unico formato JSON con campo `version` (vedi `src/store/io.js`).

## Comandi

- Test: `npm test` (= `node --test`, auto-discovery di `scripts/tests/**/*.test.js`).
  **Non** usare `node --test scripts/tests/` (forma directory rotta su Windows): per un
  singolo file usa `node --test scripts/tests/<nome>.test.js`.
- Avvio app (dev): `npm run dev` (Vite dev server). Build di produzione: `npm run build` (genera `dist/` + `404.html` per il routing SPA su Pages); anteprima: `npm run preview`.

## Test

MODEL/STORE/IO coperti da `node:test` (TDD). La VIEW (DOM) si verifica a mano nel browser.

## Docs

Mappa e tracker ID in `docs/README.md`. Workflow a 5 stadi:

1. **Indagine** — ricerca/note. Specifica di una feature → `docs/features/NNN-slug/research/<slug>.md`;
   trasversale → `docs/research/<slug>.md`.
2. **Requisiti** — nuova feature → `docs/features/NNN-slug/requisiti.md` (bozza seed dell'utente).
3. **Spec** — output brainstorm → `docs/features/NNN-slug/spec.md`.
4. **Plan** — output writing-plans → `docs/features/NNN-slug/plan.md`.
5. **Decisione** — scelta architetturale → `docs/adr/NNNN-slug.md`.

Override dei path di default di superpowers: spec e plan vanno nella cartella della feature,
non in `docs/superpowers/`. Tracker prossimi ID (feature, ADR) in `docs/README.md`, non qui.
