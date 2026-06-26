# Product

## Register

product

## Users

Dungeon Master e giocatori allo stesso tavolo. Il DM è l'utente primario e tipicamente
lavora **da PC** (schermo ampio, tastiera): traccia la reputazione asimmetrica tra personaggi
(PG e PNG) durante preparazione e gioco, dove la prep avviene da scrivania. I giocatori sono
utenti secondari di consultazione e di norma guardano l'app **da mobile**: leggono lo schermo
del telefono insieme, nel mezzo di una sessione dal vivo. Il contesto d'uso è quindi a metà
tra strumento di studio (DM, desktop, lavoro denso) e riferimento rapido al tavolo (giocatori,
schermo piccolo, lookup veloce, luce ambientale variabile). Web app locale nel browser, nessun
server.

## Product Purpose

Modellare e mostrare le relazioni di reputazione tra personaggi di una campagna TTRPG.
Il punteggio è derivato (`clampView(50 + somma delta transazioni A→B)`), le relazioni sono
asimmetriche (A→B indipendente da B→A). Successo = il DM legge a colpo d'occhio chi si fida
di chi, registra una transazione in pochi secondi, e i giocatori al tavolo capiscono lo stato
di una relazione senza spiegazioni. La chiarezza del dato vince sempre sull'ornamento.

## Brand Personality

Pulito, preciso, funzionale. Voce sobria e competente, mai chiassosa. L'estetica "Atlante"
(tomo da studioso: oro antico su avorio caldo, display serif Cinzel, corpo Source Sans 3) dà
carattere e calore evocativo, ma è al servizio della leggibilità: il fantasy è la cornice, il
dato è il contenuto. Tono da riferimento autorevole più che da racconto immersivo.

## Anti-references

- **Dashboard SaaS generica.** No grigi piatti, look corporate/fintech neutro, griglie di
  card identiche icona+titolo+testo, hero-metric template.
- **Videogioco fantasy chiassoso.** No texture pergamena finte, font gotici illeggibili,
  ornamenti decorativi eccessivi, bagliori/glow gratuiti. L'oro è un accento, non un tema drenched.
- **App mobile consumer giocosa.** No look bubbly, emoji, gradienti pop, micro-interazioni
  ammiccanti. Mobile deve restare denso e serio, non infantilizzato.

## Design Principles

- **Il dato prima dell'ornamento.** Ogni elemento decorativo (filetto oro, ornamento, ribbon)
  deve cedere il passo a leggibilità e densità informativa. Se compete col dato, va tagliato.
- **Asimmetria leggibile.** La direzione della relazione (A→B ≠ B→A) deve essere sempre
  esplicita e immediata: frecce, etichette, orientamento non lasciano dubbi su chi giudica chi.
- **Lookup in pochi secondi.** Il percorso "trova personaggio → leggi relazione → registra
  transazione" è il flusso caldo; ottimizza per velocità e pochi click, non per scoperta.
- **Mobile è un cittadino di prima classe.** Si usa al tavolo dal telefono. Tabelle, matrice e
  profili restano usabili e densi su schermo piccolo, mai versioni mutilate del desktop.
- **Coerenza del sistema "Atlante".** Tutto passa dai token e dai componenti `ds-*` esistenti;
  l'identità oro/avorio è committata, si estende non si reinventa.

## Accessibility & Inclusion

Nessuno standard formale richiesto. Linea guida di buon senso, allineata a quanto già nel
codice: contrasto di lettura adeguato (testo corpo verso l'estremo "ink" della rampa, evitare
grigi slavati su avorio), focus-visible su tutti gli elementi interattivi, rispetto di
`prefers-reduced-motion` (già presente). Target touch adeguati per l'uso da mobile al tavolo.
