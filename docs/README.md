# Mappa docs

Tracker prossimo ID ADR: **0005**

## Struttura

- `adr/NNNN-slug.md` — Architecture Decision Record: una decisione architetturale, immutabile.
  Una decisione per file. Superseding invece di modifica: un ADR che ne rimpiazza un altro
  lo cita (`Supersedes 000X`) e aggiorna lo `Stato` del vecchio a `Superseded by 000Y`.
- `research/<slug>.md` — ricerca **trasversale** (reference riusabile, non una decisione).

Il *cosa/come* corrente vive in `CLAUDE.md` (invarianti, architettura) e nel codice; qui sta
solo il **perché** (ADR) e le **note di ricerca** (research).

## Indice ADR

| ID   | Titolo                                             | Stato     | Data       |
|------|----------------------------------------------------|-----------|------------|
| 0001 | Modello dati: oggetti piani + funzioni pure        | Accettato | 2026-06-06 |
| 0002 | Non anticipare il backend: tenere i seam           | Accettato | 2026-06-07 |
| 0003 | Stack frontend VIEW: Vue 3 + Vite + vue-router     | Accettato | 2026-06-07 |
| 0004 | Distribuzione: hosting GitHub Pages, solo-link     | Accettato | 2026-07-05 |

## Research (reference)

- `research/analisi-importabilita-odoo-ded.md` — inventario moduli `odoo_ded` per una
  migrazione futura.
- `research/migrazione-cf-ded-campaign.md` — piano/checklist per la feature campagne (non
  ancora costruita).
- `research/odoo-pattern-viste-search-list-form.md` — pattern search/list/form riusabili in
  future viste.
