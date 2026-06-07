# Mappa docs

Tracker prossimo ID feature: **003**
Tracker prossimo ID ADR: **0003**

## Cosa sta dove

| Cartella | Contenuto | Numerazione |
|----------|-----------|-------------|
| `features/NNN-slug/` | Ciclo di vita di una feature: `requisiti.md` (bozza seed) → `spec.md` (brainstorm) → `plan.md` (writing-plans) | `NNN` per feature, 3 cifre, mai riusato |
| `adr/NNNN-slug.md` | Architecture Decision Record: una decisione architetturale, immutabile | `NNNN` 4 cifre, mai riusato |
| `research/slug.md` | Indagini **specifiche del progetto** (note su codice/scelte di questo repo) | per topic, niente numero |

Indagini **generiche** (riusabili fuori dal progetto) → non qui, vanno in `llm-wiki/raw`.

## Feature

| ID | Feature | Stato |
|----|---------|-------|
| 001 | [Sistema di reputazione](features/001-sistema-reputazione/) | implementata |
| 002 | [Deploy / distribuzione](features/002-deploy-distribuzione/) | implementata |

## ADR

| ID | Decisione |
|----|-----------|
| 0001 | [Modello dati: oggetti piani + funzioni pure](adr/0001-modello-dati-oggetti-piani-funzioni-pure.md) |
| 0002 | [Non anticipare il backend](adr/0002-no-anticipare-backend.md) |

## Workflow (5 stadi)

```
1. INDAGINE   generica → llm-wiki/raw   |   specifica progetto → docs/research/<slug>.md
2. REQUISITI  nuova feature → docs/features/NNN-slug/requisiti.md
3. SPEC       brainstorm → spec.md (stessa cartella)
4. PLAN       writing-plans → plan.md (stessa cartella)
5. DECISIONE  scelta architetturale → docs/adr/NNNN-slug.md
```

Regola indagine: serve **anche fuori** da questo progetto → llm-wiki; parla **di questo**
codice/scelte → `docs/research/`.

Ad ogni nuova feature/ADR: incrementa il tracker qui sopra (ID mai riusato, gap normali).
