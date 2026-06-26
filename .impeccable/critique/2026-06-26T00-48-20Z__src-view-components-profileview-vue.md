---
target: src/view/components/ProfileView.vue
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-06-26T00-48-20Z
slug: src-view-components-profileview-vue
---
# Critique — ProfileView.vue (+ RelationList.vue)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Aggiunta/rimozione gruppo: dispatch silenzioso, nessuna conferma visibile |
| 2 | Match System / Real World | 4 | "Di lui pensano" / "Lui pensa": linguaggio naturale per asimmetria, eccellente |
| 3 | User Control and Freedom | 3 | Sgancia gruppo immediato, nessun undo |
| 4 | Consistency and Standards | 2 | Due icone "sliders" identiche con funzioni diverse; inline style vs token; 22px vs rem |
| 5 | Error Prevention | 2 | Sgancia distruttivo senza conferma |
| 6 | Recognition Rather Than Recall | 3 | Quale "sliders" filtra righe vs colonne va ricordato |
| 7 | Flexibility and Efficiency | 3 | Sort/filtri/ricerca/pager/record-pager + keyboard nav; no bulk |
| 8 | Aesthetic and Minimalist | 3 | Tripla navigazione (breadcrumb + Indietro + pager) ridondante |
| 9 | Error Recovery | 2 | Nessun recupero da sgancio accidentale |
| 10 | Help and Documentation | 3 | HoverTip contestuale, ma hover-only: irraggiungibile da touch |
| **Total** | | **28/40** | **Good (fascia bassa)** |

## Anti-Patterns Verdict

Non sembra AI-generato. Identità "Atlante" forte e custom, linguaggio di dominio, sistema componenti reale, pattern Odoo-style dichiarati. Passa il product slop test: familiarità guadagnata. Detector deterministico: 0 finding su ProfileView.vue. Browser overlay non disponibile in sessione (fallback sequenziale, nessun overlay nel browser).

## What's Working
- Asimmetria espressa col linguaggio: "Di lui pensano" / "Lui pensa" è la traduzione UX più chiara possibile del modello A→B.
- A11y baseline solida: righe/header `role="button"` + `tabindex` + handler `keydown` (Enter/Space), `aria-label` ovunque, `aria-expanded` sui dropdown.
- Score chip colorato + numero tabellare: non affida il significato al solo colore (numero presente).

## Priority Issues

### [P1] Direzione A→B non rinforzata per-riga nella lista relazioni
La direzione si capisce solo dal tab attivo. La freccia direzionale (`rep-rel-arrow`) esiste in CSS ed è usata nel TransactionModal, ma NON nelle righe di RelationList. Cambiando tab su mobile si perde il contesto.
**Why:** Contraddice il design principle #2 di PRODUCT.md ("Asimmetria leggibile: la direzione deve essere sempre esplicita e immediata"). Casey (mobile) e Jordan non hanno ancoraggio direzionale nella riga.
**Fix:** Indicatore direzionale persistente nell'intestazione della tabella o accanto al punteggio (es. micro-freccia "→ lui" / "lui →" coerente col glyph esistente).
**Suggested command:** /impeccable clarify

### [P1] Due dropdown con icona "sliders" identica, funzioni diverse
Una accanto alla ricerca ("Filtri righe": nascondi vuote/personaggi/gruppi), una in coda all'header ("Colonne opzionali": Tipo). Stessa icona, due menu, due comportamenti.
**Why:** Consistency (H4) e Recognition (H6): l'utente deve ricordare quale icona fa cosa. Riley e Jordan le confondono.
**Fix:** Differenziare le icone (es. filtro vs colonne) o unificare in un solo menu "Vista" con sezioni Filtri/Colonne.
**Suggested command:** /impeccable clarify

### [P2] Sgancia gruppo distruttivo senza conferma né undo
`onUnlink` → `removeMember` immediato. Nessuna conferma, nessun ripristino.
**Why:** Error Prevention (H5) + Recovery (H9). Click accidentale = membership persa silenziosamente.
**Fix:** Conferma inline leggera o toast con "Annulla" (preferibile a un modal, da product.md "modal as last thought").
**Suggested command:** /impeccable harden

### [P2] HoverTip hover-only: spiegazione punteggio irraggiungibile da touch
Il punteggio sintetico spiega sé stesso via HoverTip (`SCORE_TIP`), e su mobile la label "Reputazione Complessiva" è nascosta via CSS. Resta solo il badge, e il tip è hover/focus → su touch nessuna spiegazione.
**Why:** Casey (mobile, utente secondario chiave per PRODUCT.md) perde la legenda del dato centrale.
**Fix:** Rendere HoverTip attivabile su tap (toggle), o mostrare una legenda/affordance "?" tappabile su mobile.
**Suggested command:** /impeccable adapt

### [P2] Inline style fuori dal sistema di token
`style="margin-bottom:1rem"`, `style="padding:1.5rem 1.75rem 1.75rem"`, `style="margin:1.1rem 0 1rem"`, `style="margin-top:22px"` (22px arbitrario, fuori scala). Bypassa la scala `--space-*`.
**Why:** Design principle #5 ("Coerenza sistema Atlante: tutto passa dai token"). Spaziatura incoerente e non manutenibile.
**Fix:** Spostare in classi/utility con `var(--space-*)`; eliminare 22px.
**Suggested command:** /impeccable layout

## Persona Red Flags

**Alex (Power User, data-heavy):** sort + filtri + ricerca + pager + record-pager prev/next + keyboard nav: ottimo. Manca bulk (sgancio multiplo, aggiunta multipla a gruppo). Basso rischio.

**Sam (A11y):** keyboard nav e aria-label solidi. Ma: punteggio sintetico spiegato solo via hover/focus tooltip (screen reader può leggere il testo, ma touch no); sgancio senza conferma rischioso per chi naviga veloce a tastiera. Dropdown `position:absolute` dentro `.rep-table-wrap` (`overflow-x:auto`): rischio clipping del menu colonne su viewport stretto.

**Casey (Mobile, giocatore al tavolo — persona di progetto):** label "Reputazione Complessiva" nascosta + tip hover-only = dato centrale senza legenda. Tre affordance di navigazione in cima (breadcrumb, Indietro, pager) occupano spazio prezioso above-the-fold sul telefono. Tap target dei dropdown OK (38px) ma sotto i 44px raccomandati.

## Minor Observations
- Tripla navigazione (breadcrumb + "← Indietro" + RecordPager): valutare di ridurre la ridondanza.
- Colonne ordinabili: l'affordance "sortable" appare solo come cursor:pointer finché non si ordina (icona up/down solo su colonna attiva).
- "Membro di" usa un pattern di aggiunta (select in tfoot) diverso dal resto; coerente internamente ma isolato.

## Questions to Consider
- La direzione A→B meriterebbe un glyph persistente in ogni riga, non solo nel tab?
- I due menu "sliders" sono davvero due concetti distinti per l'utente, o un solo "configura vista"?
- Lo sgancio da gruppo è abbastanza raro/grave da meritare un undo invece di una conferma?
