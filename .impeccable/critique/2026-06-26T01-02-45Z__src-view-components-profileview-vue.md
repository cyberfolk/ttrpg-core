---
target: src/view/components/ProfileView.vue
total_score: 35
p0_count: 0
p1_count: 0
timestamp: 2026-06-26T01-02-45Z
slug: src-view-components-profileview-vue
---
# Critique (run 2) — ProfileView.vue (+ RelationList.vue)

Dopo i fix dei 5 issue prioritari (commit c4b4d56).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Aggiunta gruppo ancora senza conferma esplicita (sgancio ora confermato) |
| 2 | Match System / Real World | 4 | Caption direzionale rinforza "Di lui pensano"/"Lui pensa" |
| 3 | User Control and Freedom | 4 | Sgancio ora con Annulla; manca undo post-conferma |
| 4 | Consistency and Standards | 3 | Icone distinte + inline rimossi, ma CSS dropdown ancora con radius/colori hardcoded (drift) |
| 5 | Error Prevention | 4 | Sgancio distruttivo ora a due passi |
| 6 | Recognition Rather Than Recall | 4 | Icone filter/columns distinte + title + direzione esplicita |
| 7 | Flexibility and Efficiency | 3 | Nessuna azione bulk |
| 8 | Aesthetic and Minimalist | 3 | Tripla navigazione ancora ridondante |
| 9 | Error Recovery | 3 | Conferma previene, ma nessun undo dopo lo sgancio |
| 10 | Help and Documentation | 4 | HoverTip ora raggiungibile su tap |
| **Total** | | **35/40** | **Good (top fascia)** |

## Anti-Patterns Verdict
Non AI-generato. Detector deterministico ora confrontato con DESIGN.md: 0 finding bloccanti, 5 **advisory** di drift token, tutti nella CSS scoped del dropdown Odoo-style di RelationList (pre-esistenti):
- `border-radius: 0.5rem` / `0.3rem` (fuori dalla scala rounded sm/md/lg)
- `#0000000f`, `rgba(0,0,0,0.15)`, `rgba(0,0,0,0.18)` (fuori palette/ombre)
Browser overlay non disponibile (fallback sequenziale).

## Fix verificati (run 1 → run 2)
- [P1] Direzione A→B: risolto (caption persistente).
- [P1] Dropdown ambigui: risolto (icone filter/columns).
- [P2] Inline style/token: risolto in ProfileView (+ token --space-7).
- [P2] HoverTip su touch: risolto.
- [P2] Sgancio distruttivo: risolto (conferma inline).

## Remaining (P3, advisory)
- Drift token nel dropdown di RelationList: radius `0.5rem`/`0.3rem` → `var(--radius-sm/md)`; colori `#0000000f`/`rgba(0,0,0,.15/.18)` → `var(--line-gold)`, hover su token, ombra su `--shadow-md`.
- Tripla navigazione (breadcrumb + Indietro + pager): valutare riduzione.
- Affordance "sortable" debole (icona solo su colonna attiva).
- Aggiunta gruppo: nessuna conferma di successo.

## Questions to Consider
- Allineare la CSS del dropdown ai token (polish) o lasciarla com'è?
- La tripla navigazione serve davvero tutta, o breadcrumb basta col pager?
