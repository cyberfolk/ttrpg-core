---
name: TTRPG Core — Atlante
description: Sistema di reputazione tra personaggi TTRPG; tomo da archivista in oro antico su avorio caldo.
colors:
  paper-0: "#ffffff"
  paper-50: "#faf7f1"
  paper-100: "#f4efe5"
  paper-200: "#ece5d6"
  paper-300: "#e3dac8"
  ink-900: "#221d16"
  ink-700: "#3c3429"
  ink-500: "#6c6253"
  ink-400: "#8c8273"
  ink-300: "#b6ab98"
  gold-700: "#7a5c1f"
  gold-600: "#9a7628"
  gold-500: "#b8893a"
  gold-400: "#c9a24b"
  gold-300: "#e0c074"
  gold-200: "#e9d4a1"
  gold-100: "#f3e9cf"
  ember-700: "#8f3315"
  ember-600: "#b4471f"
  ember-500: "#d9663a"
  ember-300: "#ecc6b3"
  ember-200: "#f1d2c2"
  ember-100: "#f7e3d7"
  green-600: "#2f7d48"
  on-accent: "#2c220e"
typography:
  display:
    fontFamily: "Cinzel, Georgia, 'Times New Roman', serif"
    fontSize: "2.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
components:
  button-primary:
    backgroundColor: "{colors.gold-400}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "0.6rem 0.95rem"
  button-primary-hover:
    backgroundColor: "{colors.gold-300}"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "{colors.paper-100}"
    textColor: "{colors.ink-500}"
    rounded: "{rounded.md}"
    padding: "0.6rem 0.95rem"
  button-ghost:
    backgroundColor: "{colors.paper-0}"
    textColor: "{colors.ink-500}"
    rounded: "{rounded.md}"
  button-danger:
    backgroundColor: "{colors.ember-100}"
    textColor: "{colors.ember-700}"
    rounded: "{rounded.md}"
  score-chip:
    textColor: "#2a2114"
    rounded: "{rounded.pill}"
    padding: "0.28rem 0.66rem"
  badge-gold:
    backgroundColor: "{colors.gold-100}"
    textColor: "{colors.gold-700}"
    rounded: "{rounded.pill}"
    typography: "{typography.label}"
    padding: "0.22rem 0.55rem"
  card:
    backgroundColor: "{colors.paper-0}"
    textColor: "{colors.ink-700}"
    rounded: "{rounded.lg}"
    padding: "{spacing.5}"
  input:
    backgroundColor: "{colors.paper-0}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.md}"
    padding: "0.55rem 0.75rem"
  segmented-active:
    backgroundColor: "{colors.gold-400}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.sm}"
    padding: "0.45rem 0.8rem"
  switch-track-on:
    backgroundColor: "{colors.gold-400}"
    rounded: "{rounded.pill}"
  dialog:
    backgroundColor: "{colors.paper-0}"
    rounded: "{rounded.lg}"
    padding: "{spacing.5}"
  menu-item:
    textColor: "{colors.ink-700}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.6rem"
---

# Design System: TTRPG Core — Atlante

## 1. Overview

**Creative North Star: "Il Registro dell'Archivista"**

Atlante è un tomo di consultazione, non un'insegna. La superficie è avorio caldo (`paper-50`,
#faf7f1) come carta di pregio, l'inchiostro è bruno scuro (`ink-900`, #221d16), e l'oro antico
(`gold-500`, #b8893a) compare come segnatura dell'archivista — un filetto in testa a una card,
il bordo di un badge, la riga di un'intestazione — mai come riempimento decorativo. Il display
serif Cinzel dà autorità da frontespizio; Source Sans 3 porta il corpo del testo e i dati con
chiarezza tabellare. La personalità è pulita, precisa, funzionale: il calore evocativo viene
dalla tavolozza e dalla tipografia, la leggibilità del dato vince sempre.

Il sistema rifiuta la dashboard SaaS generica (grigi piatti, griglie di card identiche,
hero-metric template), il videogioco fantasy chiassoso (texture pergamena finte, gotici
illeggibili, glow gratuiti) e l'app consumer giocosa (bubbly, emoji, gradienti pop). L'oro è un
accento da ≤15% di superficie, non un tema drenched.

L'uso è bimodale: il DM lavora denso da desktop (prep, tastiera), i giocatori consultano da
mobile al tavolo (lookup veloce, schermo piccolo, luce variabile). Entrambi i contesti devono
restare seri e densi: il mobile non è una versione mutilata, è un cittadino di prima classe.

**Key Characteristics:**
- Avorio + inchiostro bruno come base; oro antico solo come segnatura.
- Doppio carattere: Cinzel (display, da frontespizio) + Source Sans 3 (corpo, dati).
- Piatto di default, elevazione solo su stato.
- Direzione della relazione (A→B) sempre esplicita: frecce e orientamento.
- Densità informativa prima dell'ornamento, su desktop e mobile.

## 2. Colors

Tavolozza calda a tre famiglie: avorio neutro che porta tutta la superficie, oro antico come
unico accento, ember (terracotta) riservato a delta negativi e azioni distruttive. Un solo
verde di segnale (`green-600`) fuori famiglia, riservato al delta di reputazione positivo.

**Tokenizzazione completa.** Ogni colore vive come custom property in `:root` (`styles/main.css`):
famiglie raw (`--paper-*`, `--ink-*`, `--gold-*`, `--ember-*`, `--green-600`) e semantici che vi
puntano (`--accent`, `--danger`, `--success`, `--on-accent`, `--surface-header`, `--scrim`…).
I componenti e le regole non contengono mai un letterale a-tinta: leggono i token. Conseguenza
operativa: un cambio di tema (o una variante `[data-theme]`) tocca **solo `:root`**, mai il
markup né i corpi delle regole.

### Primary
- **Oro Antico** (`gold-500`, #b8893a): l'accento canonico. Bordi di badge, righe di
  intestazione tabella, filetto delle card, segnatura del marchio. Su sfondi chiari il testo
  oro usa la variante scura (`gold-700`, #7a5c1f) per il contrasto.
- **Oro Brunito** (`gold-700`, #7a5c1f): testo-accento e link; l'estremo scuro della rampa,
  unico oro che regge come testo su avorio.
- **Oro Lume** (`gold-400`, #c9a24b / `gold-300`, #e0c074): superfici attive — gradiente dei
  bottoni primari, stato `active` di segmenti e toggle, angolo "apri scheda" delle card.
- **Velina d'Oro** (`gold-100`, #f3e9cf): tinte tenui — fondo delle intestazioni di tabella,
  fondo dei badge oro, hover dei nomi.

### Secondary
- **Ember** (`ember-600`, #b4471f): il rosso del sistema. Azioni distruttive, ribbon, errore.
- **Brace** (`ember-700`, #8f3315 / `ember-500`, #d9663a): testo ember (su tinta) e varianti
  soft per i bottoni danger "tranquilli".
- **Cenere d'Ember** (`ember-200`/`300`, #f1d2c2/#ecc6b3 → tint hover/active dei bottoni danger;
  `ember-100`, #f7e3d7 → fondo dei badge/bottoni danger a riposo).

### Signal
- **Verde di Segnale** (`green-600`, #2f7d48): unico colore fuori dalle famiglie calde. Solo il
  delta di reputazione **positivo** nel modale transazioni (`--delta-pos`); il negativo usa ember
  (`--delta-neg`). Non è un accento decorativo: è semantica di direzione del punteggio.

### Neutral
- **Avorio** (`paper-50`, #faf7f1): sfondo dell'app. La carta del tomo.
- **Pergamena** (`paper-100`/`200`/`300`): pannelli, superfici sollevate, divisori; la rampa
  con cui si separano i piani senza ricorrere all'ombra.
- **Carta Pura** (`paper-0`, #ffffff): superficie delle card e degli input, per stacco netto
  dall'avorio del fondo.
- **Inchiostro** (`ink-900`, #221d16 strong → `ink-300`, #b6ab98 disabilitato): la scala del
  testo. Il corpo vive sull'estremo scuro (`ink-700`, #3c3429); il grigio chiaro è solo per
  testo davvero secondario.

### Named Rules
**La Regola della Segnatura.** L'oro è una firma, non un colore di riempimento: occupa ≤15% di
qualunque schermata (filetti, bordi, intestazioni, un accento). Se l'oro inizia a coprire
superfici, è diventato tema — e Atlante non è drenched.

**La Regola dell'Inchiostro Pieno.** Il testo di corpo sta su `ink-700` o più scuro. Nessun
grigio slavato su avorio "per eleganza": è la causa numero uno di testo illeggibile.

## 3. Typography

**Display Font:** Cinzel (fallback Georgia, "Times New Roman", serif)
**Body Font:** Source Sans 3 (fallback ui-sans-serif, system-ui, sans-serif)
**Label:** Cinzel maiuscolo (stesso font display, `text-transform: uppercase` +
letter-spacing) — vedi §Gerarchia. Sistema a **due font**: nessun terzo font serif.

**Character:** Cinzel è un'epigrafica romana: maiuscole incise, autorevole, da frontespizio.
Source Sans 3 è una humanist sans neutra e leggibile, perfetta per dati e numeri tabellari
(`font-variant-numeric: tabular-nums`). Coppia su asse di contrasto (serif inciso + sans
umanista), non due famiglie simili.

### Hierarchy
- **Display** (Cinzel 600, 2.5rem, lh 1.15): titoli di vista principali, frontespizio.
- **Headline** (Cinzel 600, 2rem, lh 1.15): titolo del profilo personaggio (`h1`).
- **Title** (Cinzel 600, 1.25rem, lh 1.3): titoli di dialog, nome nelle card (`h3`).
- **Body** (Source Sans 3 400, 1rem, lh 1.5): testo corrente e dati. Riga di prosa 65–75ch.
- **Label** (Cinzel 600, 0.72rem, letter-spacing 0.08em, MAIUSCOLO): intestazioni di tabella,
  badge, etichette di segmenti. La voce "da catalogo".

### Named Rules
**La Regola della Maiuscola Incisa.** Le micro-etichette (intestazioni colonna, badge, segmenti)
sono Cinzel maiuscolo con tracking 0.08em. È la voce ricorrente del catalogo, coerente ovunque.

## 4. Elevation

Piatto di default, elevazione solo su stato. Le superfici a riposo si separano per **tono**
(rampa avorio → pergamena → carta pura) e per hairline, non per ombra. L'ombra è una risposta:
hover di una card cliccabile, sollevamento di un dialog, focus ring. Niente ombre decorative a
riposo: se una card "galleggia" senza motivo, l'ombra è di troppo.

### Shadow Vocabulary
- **xs** (`0 1px 2px rgba(33,28,21,.06)`): stacco minimo, bottoni primari a riposo.
- **sm** (`0 1px 3px rgba(33,28,21,.08), 0 1px 2px rgba(33,28,21,.04)`): card e tabelle.
- **md** (`0 6px 16px rgba(33,28,21,.08)`): superfici di medio rilievo.
- **lg** (`0 16px 36px rgba(33,28,21,.13)`): dialog, hover delle card interattive.
- **focus** (`0 0 0 3px rgba(184,137,58,.38)`): anello di focus oro, su ogni interattivo.

### Named Rules
**La Regola Piatta-di-Default.** Le superfici sono piatte a riposo. L'ombra appare solo come
risposta a uno stato (hover, focus, dialog). Un'ombra a riposo va giustificata o tolta.

## 5. Components

### Buttons
- **Shape:** angoli morbidi (`md`, 10px; `sm`, 6px per i compatti). Pill mai sui bottoni.
- **Primary:** gradiente oro lume (`gold-400`→`gold-500`) su testo bruno #2c220e, bordo
  `gold-500`, padding 0.6rem 0.95rem. La firma dell'azione principale.
- **Secondary:** fondo pergamena `paper-100`, testo `ink-500`, hover che vira a tinta oro
  (`gold-100`) con bordo `gold-500`.
- **Ghost:** trasparente, testo `ink-500`; hover su pannello. Per azioni terziarie.
- **Danger:** tinta `ember-100` su testo `ember-700`; nelle righe transazione esiste una
  variante "tranquilla" ancora più tenue.
- **Hover / Focus:** transizioni 0.15s; `active` con `translateY(1px)` (feedback tattile,
  misurato); focus-visible = anello oro `shadow-focus`.

### Score chip (signature)
- Bollino pill a numeri tabellari, colore di fondo derivato dal punteggio (vedi
  `scoreColor.js`), testo `score-ink` #2a2114, `inset` hairline. Varianti `sm`/`lg`; `lg` passa
  a Cinzel. `empty` = pergamena con testo faint. `interactive` scala 1.06 su hover.
- **Componente `<ScoreChip>`** (`components/ScoreChip.vue`): incapsula classe `.ds-score`,
  variante `size` (`sm`/`md`/`lg`), stato `empty` (score `null`), tinta `scoreColor` e simbolo
  di fallback (`empty`, default `–`). `interactive` lo rende un `<button>` (apre la transazione).
  Da preferire alla ripetizione manuale dello span `.ds-score`. Il reset del `<button>` e il
  focus-ring stanno in `main.css` (globali: lo scope del padre non raggiunge il figlio).

### Relation arrow (signature)
La resa visiva del principio cardine "asimmetria leggibile": la direzione `A→B` non si affida
mai a sole etichette, ha una **freccia disegnata** che la incide sullo schermo.
- **`.rep-rel-arrow`** — colonna verticale (label sopra, glifo sotto), `min-width` fissa (4rem;
  4.5rem nel modale) così i nomi restano allineati anche con label di lunghezza diversa.
- **Label** (`.rep-rel-arrow__label`): Source Sans 3 **corsivo** 400, `fs-xs`, `text-faint`,
  minuscolo (es. *"cosa pensa di"*). È l'unico corsivo del sistema: segnala la relazione, non
  il dato.
- **Glifo** (`.rep-rel-arrow__glyph`): non un carattere `→` ma una **linea oro** (`gold-500`,
  2px, `border-radius` 1px) larga quanto la label, con la punta costruita da due bordi ruotati
  a 45° via `::after`. Segue il testo, non va mai a capo. Su smartphone nel modale il glifo
  sparisce (`display:none`) e restano le sole label per risparmiare larghezza.
- **Vietato:** invertire l'orientamento o rendere la freccia bidirezionale. `A→B` è
  indipendente da `B→A`: due frecce separate, mai una doppia punta.

### Badge
- Cinzel maiuscolo, pill, bordo sottile. `neutral` (pannello), `gold` (velina d'oro su
  `gold-700`), `ember` (cenere su `ember-700`). Mai più di un badge che urla per riga.

### Cards / Containers
- **Corner:** `lg` (14px). **Background:** carta pura `paper-0` su fondo avorio.
- **Shadow:** `sm` a riposo (unica eccezione tollerata alla piattezza, per staccare dalla
  carta), `lg` su hover quando interattiva. **Border:** hairline `#e8e1d4`.
- **Filament:** variante con filetto oro sfumato in testa (2px) — la segnatura. **Padding:** `5`.
- **Vietato:** card annidate; griglie di card identiche icona+titolo+testo.

### Inputs / Fields
- **Style:** fondo carta pura, bordo `#ddd3c2`, radius `md`. Icona opzionale a sinistra.
- **Focus:** bordo `gold-500` + anello `shadow-focus`. Hover = bordo oro.
- **Placeholder:** `text-muted` (`ink-500`, ~5.5:1 su carta pura) — **non** `text-faint`
  (`ink-400`, ~3.6:1, sotto AA). Il placeholder è testo a tutti gli effetti: regge il 4.5:1.
- **Touch:** su puntatore grossolano (`@media (pointer: coarse)`) l'input sale a `min-height: 44px`.

### Segmented control & Switch
- **Segmented** (`.ds-seg`): pillole per cambiare vista/opzione. Etichette Cinzel maiuscolo
  (`ls-caps`), voce `active` a **gradiente oro** (`gold-400`→`gold-500`) su testo bruno #2c220e,
  bordo `gold-500`. Variante **underline** (`.ds-seg--underline`): niente pillola, filetto oro
  2px sotto la voce attiva. Su ≤480px va full-width.
- **Switch** (`.ds-switch`): toggle coerente col gradiente oro — track pergamena a riposo, track
  oro + thumb bruno (#2c220e) traslato quando `:checked`. Focus-visible = anello `gold-400`. È
  l'unico toggle del sistema (es. "Mostra archiviati"): niente checkbox custom altrove.

### Navigation
- **Header** sticky, avorio translucido con `backdrop-filter: blur(10px)`, hairline in basso.
  Da ≥720px la nav primaria vive nell'header come segmented; sotto, sta nel drawer.
- **Drawer** (`.rep-drawer`): su mobile scivola da sinistra (`translateX`), fondo pannello,
  bordo destro oro; voce attiva (`.rep-drawer__fn.is-active`) a gradiente oro. Da ≥720px muta in
  **popover** ancorato in alto a destra sotto l'header (`transform-origin: top right`, scrim
  trasparente). La sezione "Come funziona" è un `<details>` collassato per tenere il menu magro.

### Action menu (kebab / gear)
- **`.ds-menu`** + composable `useAnchoredMenu.js`: trigger **nudo** (niente sfondo/bordo, solo
  il glifo). Nelle card gallery e nelle righe lista il glifo è **attenuato a riposo**
  (`opacity: .45`, `fs 0.9rem`) e si accende solo su hover — l'azione non compete col dato.
- **Popover** (`.ds-menu__pop`): teleportato su `<body>` (fuori da ogni `overflow`), carta pura,
  bordo `line-gold`, `shadow-md`. Voci (`.ds-menu__item`) Source Sans; variante `--danger` in
  `ember-700` con hover a `danger-tint`. Stessa struttura per il popover "Filtri e colonne".

### Dialog / Modal
- **`.ds-overlay`** (z-index 1000): scrim bruno translucido + `backdrop-filter: blur(3px)`.
  **`.ds-dialog`**: carta pura, bordo `line-gold`, `shadow-lg`, **filetto oro** in testa
  (`::before`, 2px), entrata `ds-rise` (translateY + scale, .22s ease-out; annullata da
  `prefers-reduced-motion`). Head/body/foot divisi da hairline. Chiusura come **triangolo
  d'angolo** in alto a destra (affordance "clicca qui per chiudere"), coerente con l'angolo
  "apri scheda" delle card.
- Il modale resta l'eccezione, non il primo pensiero (registrazione transazioni): per il resto
  si preferiscono affordance inline (righe di aggiunta in coda a tabella, editing in loco).

### Tooltip
- **`.rep-tip`** (trigger, `cursor: help`) + **`.rep-hint__bubble`** teleportato, `position:
  fixed`, freccia costruita con doppio `::before`/`::after`. Testo Source Sans regolare
  (annulla maiuscolo/tracking ereditati), `text-body` su carta pura, `shadow-lg`. Solo
  spiegazione contestuale (es. come si calcola un punteggio), mai decorazione.

### Decorative marks (la segnatura dell'archivista)
Elementi d'identità, tenuti al minimo per la Regola della Segnatura (≤15% oro).
- **Logo** (`.ds-logo`): marchio + wordmark Cinzel maiuscolo (`ls-wordmark` 0.16em) in
  `gold-700`, con tagline `fs .66rem`.
- **Ornamento** (`.ds-orn`): motivo centrale tra due linee oro sfumate — divisore da frontespizio,
  usato con parsimonia (chiusura profilo).
- **Ribbon** (`.ds-ribbon`): nastro d'angolo ember maiuscolo per lo stato "archiviato". Unico uso
  dell'ember come superficie piena.
- **Corner-triangle** (`.rep-cc__corner`): angolo oro in alto a destra della card, `clip-path`
  triangolare, freccia "apri scheda". La stessa forma serve da chiusura nei dialog.

### Utilities & composables
- **`.ds-sr-only`** — visually-hidden (etichette compatte, intestazioni tabellari nascoste ma
  leggibili dall'AT). Sempre nascosto; per un nascondere *responsive* usare un `@media` locale.
- **`.ds-idhint`** — coda-id `#n` per omonimi: `fs-xs`, `text-faint`, numeri tabellari. Da
  affiancare a un'eventuale classe locale che porta solo il margine.
- **`.ds-search`** — wrapper campo di ricerca con icona assoluta centrata a sinistra; da usare
  con `.ds-input.ds-input--with-icon`.
- **`entityKind.js`** — helper puri per il `kind` (`kindIcon`, `kindLabel`, `entityRouteTo`):
  unico posto dove vive il ternario personaggio/gruppo.
- **`useAnchoredMenu.js`** — popup teleportato su `<body>` ancorato al bordo destro di un
  trigger (dropdown Filtri, ActionMenu): apertura/chiusura, dismiss su click esterno/scroll/
  resize ed Esc, focus alla prima voce.

## 6. Do's and Don'ts

### Do:
- **Do** tenere il testo di corpo su `ink-700` (#3c3429) o più scuro; placeholder a `text-muted`
  (`ink-500`), non `ink-400` (sotto AA).
- **Do** usare l'oro come segnatura (filetto, bordo, intestazione, un accento): ≤15% di schermata.
- **Do** rendere sempre esplicita la direzione A→B con frecce/etichette (`rep-rel-arrow`).
- **Do** lasciare le superfici piatte a riposo; ombra solo su hover/focus/dialog.
- **Do** trattare il mobile come prima classe: le tabelle scrollano, non si mutilano.
- **Do** usare Cinzel maiuscolo con tracking 0.08em per le micro-etichette ricorrenti.

### Don't:
- **Don't** scadere nella **dashboard SaaS generica**: niente grigi piatti, griglie di card
  identiche icona+titolo+testo, hero-metric template.
- **Don't** virare al **videogioco fantasy chiassoso**: niente texture pergamena finte, font
  gotici illeggibili, ornamenti eccessivi, glow/bagliori gratuiti.
- **Don't** scadere nell'**app consumer giocosa**: niente look bubbly, emoji, gradienti pop.
- **Don't** usare grigi slavati su avorio "per eleganza": uccide la leggibilità.
- **Don't** far diventare l'oro un tema drenched: resta accento, non riempimento.
- **Don't** usare `border-left`/`border-right` colorato >1px come striscia d'accento; usa
  bordo pieno, tinta di fondo, o il filetto oro in testa.
