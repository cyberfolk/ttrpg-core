---
target: RelationList.vue
total_score: 30
p0_count: 0
p1_count: 3
timestamp: 2026-06-28T20-03-05Z
slug: src-view-components-relationlist-vue
---
# Critique — RelationList.vue

## Design Health Score

| # | Euristica | Punteggio | Problema chiave |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Filtri attivi invisibili a dropdown chiuso: righe spariscono senza segnale |
| 2 | Match System / Real World | 4 | Termini e icone chiari (Personaggio/Gruppo, freccia direzione nel parent) |
| 3 | User Control & Freedom | 2 | Menu non chiudibili con Esc; focus non entra/ritorna |
| 4 | Consistency & Standards | 4 | Token ds-* ovunque, due dropdown identici, pattern coerente |
| 5 | Error Prevention | 3 | Poche azioni distruttive qui; ok |
| 6 | Recognition vs Recall | 3 | Stato filtro va ricordato; icone con aria-label+title |
| 7 | Flexibility & Efficiency | 3 | Sort+search+pager+tastiera sulle righe; manca reset |
| 8 | Aesthetic & Minimalist | 3 | Dropdown intero per un solo toggle (Tipo) |
| 9 | Error Recovery | 3 | "Nessun risultato" distinto da "Nessuna relazione", ma vicolo cieco |
| 10 | Help & Documentation | 3 | title sulle icone; non serve altro |
| **Totale** | | **30/40** | **Good** — fondamenta solide, buchi a11y/stato |

## Anti-Patterns Verdict

LLM: NON sa di AI. Niente slop. Palette Atlante rispettata, zero card-grid, zero gradient text, icone coerenti, tap target 44px su pointer:coarse, Teleport per scappare al clipping di overflow:hidden. Lavoro curato.

Scan deterministico: detect.mjs -> [], pulito. Zero drift su questo file (EB Garamond e literal hex stanno in main.css, fuori scope qui).

Overlay visivi: niente — dev server giù, nessuna injection. Fallback su review sorgente.

## Overall Impression

Componente solido e bello. I problemi NON sono estetici: sono buchi su tastiera e stato nascosto. Tre toccano direttamente i principi del PRODUCT.md (mobile cittadino di prima classe, lookup veloce, focus-visible ovunque). La più grave: da tastiera non puoi navigare al profilo di una relazione.

## What's Working

1. Teleport per i menu — risolve davvero il clipping (card overflow:hidden + tabella overflow-x:auto), con posizione fixed ricalcolata dal rect del bottone e chiusura su scroll/resize.
2. Empty state a due voci — "Nessun risultato" (ricerca vuota) vs "Nessuna relazione" (dato vuoto).
3. Sort a default sensati — nome/tipo A→Z, punteggio alto→basso; reset pagina su sort/search.

## Priority Issues

### [P1] Navigazione al profilo è solo-mouse
goToProfile sta su uno <span class="rep-table__name"> con @click.stop, senza tabindex/role/keydown. La riga è role="button" -> Invio apre la transazione (emitTx), mai naviga. Utente da tastiera (Sam) non può aprire il profilo di un correlato. Span cliccabili dentro riga role="button" = interattivi annidati, semantica rotta per screen reader.
Fix: rendere il nome un vero <a>/<button> (router-link) focusabile, separato dal click-riga; oppure togliere role=button dalla riga e usare controlli espliciti.
Comando: /impeccable audit (poi harden).

### [P1] Su mobile sparisce la distinzione personaggio/gruppo
A ≤480px nascondi sia colonna Tipo sia il dropdown colonne -> il giocatore al tavolo (Casey, mobile primario) non sa se una riga è personaggio o gruppo. PRODUCT.md: "mobile non è una versione mutilata". Qui perde informazione.
Fix: su mobile non rimuovere il dato, spostalo. Glifo/icona kind come prefisso del nome, o pallino.
Comando: /impeccable adapt.

### [P1] Menu Teleport: focus non entra, non torna, niente Esc
Menu teleportati su body: (a) focus non va sul primo checkbox; (b) Tab dal bottone non raggiunge il menu (fuori ordine DOM); (c) alla chiusura il focus non torna al trigger; (d) Esc non chiude. Sam non può usare i filtri da tastiera; Alex si aspetta Esc.
Fix: al toggle focus() sul primo input; @keydown.esc per chiudere e ridare focus al bottone.
Comando: /impeccable audit.

### [P2] Filtri attivi invisibili a dropdown chiuso
Applichi un filtro, chiudi il menu -> icona identica a riposo, righe calano e basta. Il DM in prep non vede perché mancano righe. Recall, non recognition.
Fix: dot/badge sull'icona filtro quando ≥1 filtro ≠ default (idem icona colonne se showType off).
Comando: /impeccable polish.

### [P2] Dropdown "colonne" intero per un solo toggle
Tutta la macchina (bottone + Teleport + click-outside + scroll/resize) per una checkbox (Tipo). Costo cognitivo sproporzionato.
Fix: o accettarlo come investimento per colonne future (documentalo), o su desktop inline il toggle.
Comando: /impeccable distill.

## Persona Red Flags

Sam (a11y/tastiera): profilo relazione irraggiungibile da tastiera; filtri/colonne irraggiungibili da Tab; nessun Esc; focus mai gestito.

Casey (mobile, al tavolo): a ≤480px non distingue personaggio da gruppo. Icone-only del filtro senza hover-title su touch.

DM in prep (desktop, persona progetto): applica filtri, li dimentica, legge la tabella come completa -> conclusioni sbagliate su "chi conosce chi".

## Minor Observations

- type="search" dà la X nativa solo su alcuni browser; "Nessun risultato" resta vicolo cieco senza reset esplicito (P3).
- Bottone filtro su mobile resta icona-only senza affordance touch (P3).
- Score chip e riga aprono entrambi la transazione: terzo target dentro la riga-bottone, concorre alla semantica annidata.

## Questions to Consider

- E se il nome fosse il link al profilo (vero <a>) e la transazione partisse da un'azione esplicita?
- Il giocatore mobile ha più o meno bisogno di sapere "è un gruppo?" rispetto al DM desktop?
- Un dropdown per una checkbox: progetti per oggi o per tre colonne che forse non arriveranno?
