# Mappa docs

Tracker prossimo ID feature: **003**
Tracker prossimo ID ADR: **0003**

## Cosa sta dove

| Cartella | Contenuto | Numerazione |
|----------|-----------|-------------|
| `features/NNN-slug/` | Ciclo di vita di una feature: `requisiti.md` (bozza seed) → `spec.md` (brainstorm) → `plan.md` (writing-plans) | `NNN` per feature, 3 cifre, mai riusato |
| `adr/NNNN-slug.md` | Architecture Decision Record: una decisione architetturale, immutabile | `NNNN` 4 cifre, mai riusato |
| `research/slug.md` | Indagini e note di ricerca (tecniche, valutazioni, approfondimenti) | per topic, niente numero |

## Workflow (5 stadi)

```
1. INDAGINE   ricerca/note → docs/research/<slug>.md
2. REQUISITI  nuova feature → docs/features/NNN-slug/requisiti.md
3. SPEC       brainstorm → spec.md (stessa cartella)
4. PLAN       writing-plans → plan.md (stessa cartella)
5. DECISIONE  scelta architetturale → docs/adr/NNNN-slug.md
```

Ad ogni nuova feature/ADR: incrementa il tracker qui sopra (ID mai riusato, gap normali).
