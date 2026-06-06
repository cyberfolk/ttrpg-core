# CLAUDE.md

Versione: 2.0 | Inizializzato: 2026-06-06 00:46 | Aggiornato: 2026-06-06 02:36

@~/.claude/shared/timestamp-header.md
@~/.claude/shared/project-layout.md
@~/.claude/shared/git-rules.md
@~/.claude/shared/git-commit-tags.md
@~/.claude/shared/todo-conventions.md

---

## Progetto

Web app **locale** (browser, no server) di tool per TTRPG. Prima feature: sistema di
reputazione tra personaggi D&D. Solo JS (ES modules) / HTML / CSS, nessun framework.

## Architettura (vincolo forte)

Tre layer, dipendenze solo verso il basso:

- `src/model/` — dati puri + funzioni pure. **Nessuna dipendenza dal browser** (no
  `window`/`document`/`localStorage`): traducibile 1:1 in Python (migrazione futura).
- `src/store/` — stato in memoria + persistenza. **Unico layer che tocca localStorage.**
- `src/view/` — DOM/rendering. Parla solo con lo store.

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
- Avvio app: servire via HTTP — `py -m http.server 8000`. Con `file://` i browser
  bloccano gli ES module (CORS).

## Test

MODEL/STORE/IO coperti da `node:test` (TDD). La VIEW (DOM) si verifica a mano nel browser.

## Docs

Design e piano implementativo in `docs/superpowers/` (specs/ e plans/).
