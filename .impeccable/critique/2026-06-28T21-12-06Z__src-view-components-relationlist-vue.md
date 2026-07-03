---
target: RelationList.vue
total_score: 35
p0_count: 0
p1_count: 0
timestamp: 2026-06-28T21-12-06Z
slug: src-view-components-relationlist-vue
---
# Re-Critique — RelationList.vue

## Design Health Score

| # | Euristica | Prima | Ora | Nota |
|---|-----------|:--:|:--:|------|
| 1 | Visibility of System Status | 2 | 3 | Dot + aria su filtri/colonne: stato visibile a tendina chiusa |
| 2 | Match System / Real World | 4 | 4 | — |
| 3 | User Control & Freedom | 2 | 4 | Esc chiude + ritorno focus + focusout; ricerca clearabile |
| 4 | Consistency & Standards | 4 | 4 | — |
| 5 | Error Prevention | 3 | 3 | — |
| 6 | Recognition vs Recall | 3 | 4 | Stato filtro non più da ricordare; kind sempre leggibile (glifo) |
| 7 | Flexibility & Efficiency | 3 | 3 | Manca reset/bulk; sort+search+tastiera solidi |
| 8 | Aesthetic & Minimalist | 3 | 4 | Dropdown colonne ora ha scopo (toggle = colonna<->glifo) |
| 9 | Error Recovery | 3 | 3 | Empty state distinto; manca "pulisci ricerca" |
| 10 | Help & Documentation | 3 | 3 | — |
| Totale | | 30 | 35/40 | Good, sfiora Excellent |

## Anti-Patterns Verdict
PASS. detect.mjs -> []. Nessun tell AI. Glifo kind feather coerente, dot oro tokenizzato, zero literal.

## Cosa è migliorato
- I 3 P1 a11y chiusi: profilo navigabile da tastiera (link reale), niente interattivi annidati (button score), menu Teleport con focus/Esc/focusout. Più aria-sort/aria-controls.
- Mobile non mutila più: tipo personaggio/gruppo resta come glifo quando la colonna sparisce.
- Stato visibile: dot + label "(attivi)" -> niente più filtro silenzioso.
- Contrasto AA su placeholder e indice; touch 44px sull'input.

## Issue residui (tutti P3, nessun blocco)
- [P3] Nessun "pulisci ricerca"/"azzera filtri" — "Nessun risultato" resta un mini vicolo cieco. -> clarify/polish.
- [P3] Focus-trap parziale — il Tab può uscire dal menu (poi focusout lo chiude); trap completo nice-to-have.
- [P3] Verifica browser — punteggio da statica/build/test; dot, contrasto reale e 44px su device non visti.

## Domande
- "Pulisci ricerca" come icona X nell'input, o azzeramento filtri come voce nel menu filtri?
- Serve un riepilogo "N risultati" accanto al pager?
