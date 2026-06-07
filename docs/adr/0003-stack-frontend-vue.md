# 0003 — Stack frontend della VIEW: Vue 3 + Vite + vue-router

Stato: accettata  
Data: 2026-06-07  
Contesto: feature 003 (viste-e-profilo). Vedi spec e [[03-scelta-framework-frontend]].

## Decisione

La VIEW usa **Vue 3 + Vite + vue-router**. Routing in **history mode** (`createWebHistory`) con trucco **`404.html`** (copia di `index.html`) e `base` path per GitHub Pages. Bridge sottile store→ref (no Pinia): MODEL/STORE restano proprietari dello stato e framework-agnostici.

## Alternative scartate

- **No-build (van.js / lit-html / Preact+htm)**: scalano peggio con la crescita di feature.
- **Nuxt**: meta-framework SSR, overkill per app statica locale.
- **React / Svelte**: validi; scelta Vue per equilibrio facilità/scala/ecosistema.
- **Pinia**: duplicherebbe il layer STORE esistente.
- **Hash routing**: scartato a favore di URL puliti (history + 404.html).

## Conseguenze

- Build step (Vite) + GitHub Actions per pubblicare `dist/`.
- Migrazione Python del MODEL resta intatta (VIEW isolata).
