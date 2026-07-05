# CLAUDE.md

@~/.claude/shared/git-commit-tags-list.md  
@~/.claude/shared/todo-conventions.md

---

## Progetto

Web app **locale** (browser, no server) di tool per TTRPG.   
La funzione attiva è un sistema di **reputazione** tra le entità di una campagna (cosa fa: Requisiti funzionali qui sotto).

## Requisiti funzionali

@docs/requisiti-funzionali/01-entita.md  
@docs/requisiti-funzionali/02-modello-reputazione.md  
@docs/requisiti-funzionali/03-viste-e-navigazione.md  
@docs/requisiti-funzionali/04-flussi.md  
@docs/requisiti-funzionali/05-dati-e-persistenza.md

**Responsabilità di manutenzione (Claude):** tieni `docs/requisiti-funzionali/` allineato. Quando una modifica al codice cambia un comportamento funzionale (entità, modello di reputazione, viste/navigazione, flussi, dati/persistenza) — o quando decidiamo qualcosa di funzionale — aggiorna il pezzo pertinente **nello stesso lavoro**, senza aspettare che te lo chieda. È la fonte unica caricata in contesto: se diverge dal codice, il contesto mente. Se una modifica non ha impatto funzionale (refactor interno, stile, test), non toccarla.

## Direttive grafiche

@DESIGN.md  
@PRODUCT.md

## Architettura

@docs/architettura.md

## Comandi

- Test: `npm test` (= `node --test`, auto-discovery di `tests/**/*.test.js`).
- **Non** usare `node --test tests/` (forma directory rotta su Windows): per un singolo file usa `node --test tests/<nome>.test.js`.
- Avvio app (dev): `npm run dev` (Vite dev server).
- Build di produzione: `npm run build` (genera `dist/` + `404.html` per il routing SPA su Pages);
- Anteprima: `npm run preview`.

## Tests

MODEL/STORE/IO coperti da `node:test` (TDD). La VIEW si verifica a mano nel browser.

## Docs

Tre tipi di documento, indice in `docs/README.md`:

- `docs/ADR/NNNN-slug.md` — **Architecture Decision Record**: una decisione architetturale per file, immutabile. Struttura: Contesto / Decisione / Conseguenze / Alternative / Quando rivedere. Nuovo ADR → prossimo `NNNN` (tracker in `docs/README.md`).
- `docs/research/<slug>.md` — note di ricerca **trasversali** (reference, non decisioni).
- `docs/requisiti-funzionali/NN-slug.md` — cosa fa l'app, in dettaglio.
