# Mappa docs

Tracker prossimo ID feature: **004**
Tracker prossimo ID ADR: **0003**

## Cosa sta dove

| Cartella             | Contenuto                                                                                                                                                            | Numerazione                             |
|----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| `features/NNN-slug/` | Ciclo di vita di una feature: `requisiti.md` (bozza seed) → `spec.md` (brainstorm) → `plan.md` (writing-plans); + `research/` per la ricerca specifica della feature | `NNN` per feature, 3 cifre, mai riusato |
| `adr/NNNN-slug.md`   | Architecture Decision Record: una decisione architetturale, immutabile                                                                                               | `NNNN` 4 cifre, mai riusato             |
| `research/slug.md`   | Ricerca **trasversale** (vale per più feature / progetto in generale)                                                                                                | per topic, niente numero                |

Ricerca **specifica di una feature** → `features/NNN-slug/research/<slug>.md`. Ricerca
**trasversale** → `docs/research/<slug>.md`.

## Workflow (5 stadi)

```
1. INDAGINE   specifica feature → docs/features/NNN-slug/research/<slug>.md
              trasversale      → docs/research/<slug>.md
2. REQUISITI  nuova feature → docs/features/NNN-slug/requisiti.md
3. SPEC       brainstorm → spec.md (stessa cartella)
4. PLAN       writing-plans → plan.md (stessa cartella)
5. DECISIONE  scelta architetturale → docs/adr/NNNN-slug.md
```

Ad ogni nuova feature/ADR: incrementa il tracker qui sopra (ID mai riusato, gap normali).
