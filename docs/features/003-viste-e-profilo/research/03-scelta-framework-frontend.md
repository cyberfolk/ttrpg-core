# Ricerca — Scelta framework frontend per la VIEW (feature 003)

Data: 2026-06-07
Stato: ricerca / pre-brainstorm 003 (decisione da sancire in ADR)
Riferimenti: [[01-presentazione-dati]], [[02-domande-pre-brainstorm]],
`features/003-viste-e-profilo/requisiti.md`, [[0002-no-anticipare-backend]]

## Domanda

Quale framework frontend per la VIEW della 003? Candidati valutati: React, Svelte,
Vue/Nuxt. Angular escluso a priori (troppo pesante per lo scope). Il framework tocca
**solo la VIEW**: MODEL/STORE/IO restano framework-agnostici e invariati.

## Vincolo di contesto emerso

L'app **oggi è piccola** (poche feature, V1) ma l'intento è aggiungere **molte feature**
nel tempo → diventerà più complessa, pur **senza arrivare al livello che giustifica
Angular**. Questo sposta i pesi della scelta verso framework che **scalano bene** senza
imporre cerimonia eccessiva. Conseguenza diretta:

- Le **micro-librerie no-build** (van.js, lit-html, Preact+htm) sono ottime *ora* ma
  **scalano peggio** con molte feature → **scartate** dato il piano di crescita.
- Serve un **framework vero con build step** (DX, componenti, code-splitting, lazy-load).

## Nuxt: perché scartato

Nuxt è un **meta-framework Vue orientato a SSR / SEO / server routes** (nitro). L'app è
**statica, locale, per pochi amici**: niente SEO, niente server. Nuxt porterebbe peso e
concetti inutili. Se si voleva Vue → **Vue puro + Vite**, non Nuxt.

## Confronto React vs Vue vs Svelte

Lente: "app hobby che cresce di feature, ma non Angular-level".

| Criterio              | React                              | Vue                          | Svelte                         |
|-----------------------|------------------------------------|------------------------------|--------------------------------|
| Boilerplate           | Alto (hooks, re-render manuali)    | Medio (SFC `.vue`)           | Basso                          |
| Reattività            | Manuale (hooks, deps, memo)        | Automatica (`ref`/`reactive`)| Automatica (compiler, `$state`)|
| Curva apprendimento   | Media-ripida                       | Dolce                        | Dolcissima                     |
| Ecosistema            | Enorme                             | Grande                       | Medio (maturo)                 |
| Spendibilità lavoro   | Massima                            | Alta                         | Media                          |
| Router ufficiale      | react-router                       | vue-router                   | SvelteKit                      |
| Bundle / perf         | Buono                              | Buono                        | Migliore (no runtime)          |
| Scala a molte feature | Sì                                 | Sì                           | Sì                             |

`DX` = Developer Experience: quanto è piacevole/veloce scrivere codice (meno boilerplate,
errori chiari, hot-reload, doc buone, meno cerimonia per cose semplici).

## Decisioni prese (in chat, 2026-06-07)

1. **Build step: SÌ.** Vite come bundler + GitHub Actions che pubblica `dist/` su Pages
   ([[vue-react-su-github-pages]]). Necessario per HMR, code-splitting, lazy-load per
   feature — abilitanti della crescita prevista.
2. **Rotte: URL veri.** Router ufficiale + fix 404 di GitHub Pages (hash-routing oppure
   `404.html` copia di `index.html`, [[spa-routing-github-pages-404]]). Con molte viste/
   feature i deep-link condivisibili (es. `/personaggio/aragorn`, refresh/bookmark ok)
   diventano preziosi.
3. **Framework: Vue 3.** Scelto come miglior equilibrio facilità + scalabilità +
   ecosistema solido per un hobby project che cresce. Niente vincolo di spendibilità
   lavorativa che avrebbe spinto verso React; niente bisogno di minimo-attrito assoluto
   che avrebbe spinto verso Svelte. Vue sta nel mezzo: SFC chiari, reattività automatica,
   `vue-router` ufficiale.

### Stack risultante

- **Vue 3** + **Vite** (build) + **vue-router** (rotte vere).
- Pubblicazione: **GitHub Actions** builda e pubblica `dist/`; attenzione al `base` path
  corretto per Pages ([[vue-react-su-github-pages]]) e al fix 404 SPA
  ([[spa-routing-github-pages-404]]).
- **Solo la VIEW** cambia: MODEL/STORE/IO invariati e framework-agnostici.

## Da fare dopo

- Sancire questa scelta in una **ADR** (Vue 3 + Vite + vue-router; Nuxt e no-build
  scartati, con motivazioni).
- Dettagli di layout/navigazione/UX → nel **brainstorm 003** → `spec.md`.
- Resa visiva dei componenti → skill `frontend-design` in **implementazione**, non ora.

## TL;DR

Crescita prevista molte-feature (non Angular-level) → serve framework vero con build.
No-build e Nuxt scartati. Tra React/Vue/Svelte scelto **Vue 3** (equilibrio).
Stack: **Vue 3 + Vite + vue-router**, build via GitHub Actions, rotte URL vere con fix
404 Pages. Tocca solo la VIEW. Sancire in ADR.