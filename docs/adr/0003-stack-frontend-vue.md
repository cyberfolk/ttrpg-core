# ADR 0003 — Stack frontend della VIEW: Vue 3 + Vite + vue-router

Data: 2026-06-07
Stato: Accettato
Ambito: VIEW. Non tocca MODEL/STORE/IO.

## Contesto

La feature 003 (viste-e-profilo) riscrive la VIEW: elenco personaggi con più viste e
profilo per-personaggio. La VIEW vanilla di V1 non scala con la crescita di feature.
Andava scelto lo stack frontend. Vincoli rilevanti (vedi
`docs/features/003-viste-e-profilo/spec.md` e la ricerca
`docs/features/003-viste-e-profilo/research/03-scelta-framework-frontend.md`):

- La VIEW è un layer isolato: cambiarlo non deve toccare MODEL/STORE/IO.
- MODEL/STORE restano proprietari dello stato e framework-agnostici (porting Python del
  MODEL intatto).
- App **statica locale** pubblicata su GitHub Pages (nessun server).

## Decisione

La VIEW usa **Vue 3 + Vite + vue-router**. Routing in **history mode**
(`createWebHistory`) con trucco **`404.html`** (copia di `index.html`) e `base` path per
GitHub Pages. Bridge sottile store→ref (no Pinia): MODEL/STORE restano proprietari dello
stato e framework-agnostici.

## Conseguenze

**Positive:**
- VIEW isolata: la migrazione Python del MODEL resta intatta.
- URL puliti (history mode) invece di hash routing.

**Negative / trade-off:**
- Build step (Vite) + GitHub Actions per pubblicare `dist/`.
- `404.html` da mantenere allineato a `index.html`.

## Alternative considerate

- **No-build (van.js / lit-html / Preact+htm):** scartate, scalano peggio con la crescita
  di feature.
- **Nuxt:** scartato, meta-framework SSR overkill per app statica locale.
- **React / Svelte:** validi; scelta Vue per equilibrio facilità/scala/ecosistema.
- **Pinia:** scartata, duplicherebbe il layer STORE esistente.
- **Hash routing:** scartato a favore di URL puliti (history + 404.html).

## Quando rivedere

Se l'app smettesse di essere statica (backend deciso → SSR sensato) o se il costo del
build step non fosse più giustificato dalla dimensione della VIEW.
