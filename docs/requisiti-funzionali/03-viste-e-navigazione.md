# 03 · Viste e navigazione

L'app è una **shell multi-tool**: la navigazione principale passa da un **drawer** laterale.
La funzione attiva è **Reputazione**; altre funzioni sono predisposte come "soon".

## Viste (rotte)

- **Faccia a faccia** (`/faccia-a-faccia`, schermata iniziale) — confronta due entità testa a testa: come si considerano reciprocamente, in diretto e in aggregato. I due selettori mostrano al massimo **5 risultati** per rilevanza (prefisso prima), più le azioni in coda: **Aggiungi personaggio** / **Aggiungi gruppo** (creano e selezionano subito la nuova entità, pre-compilate col testo cercato) e, quando i match superano 5, **Vedi tutti (N)** che apre l'elenco completo ricercabile.
- **Personaggi** (`/personaggi`) — elenco dei personaggi, leggibile in **galleria** (card) o **lista** (tabella ordinabile). Toolbar per aggiungere/cercare.
- **Profilo personaggio** (`/personaggio/:id`) — testata **scheda anagrafica con editing inline per campo** (ruolo PG/PNG come primo campo, razza, classe/livelli, allineamento, giocatore, gruppi, tag; livello e reputazione derivati, sola lettura), seguita da storico delle relazioni in **entrata** e **uscita**, più i gruppi di appartenenza. Le **note** (markdown) si modificano nel tab *Note*, non nella testata; le foto nel tab *Galleria*.
- **Gruppi** (`/gruppi`) — elenco dei gruppi: creazione, rinomina, modifica `type`, gestione membri, archivia/ripristina.
- **Profilo gruppo** (`/gruppo/:id`) — testata **scheda anagrafica con editing inline per campo** (tipo, sede, guida, motto, tag; reputazione derivata, sola lettura), seguita da membri + i punteggi diretto/aggregato per ogni coppia rilevante; reciprocamente un gruppo appare nel profilo dei suoi membri. Le **note** (markdown) si modificano nel tab *Note*; le foto nel tab *Galleria*.

Nella **scheda anagrafica** (testata di entrambi i profili) i campi opzionali
distinguono tre stati (vedi [01 · Tri-stato](01-entita.md#tri-stato-dei-campi-opzionali)):
un campo **da definire** appare come trattino oro `––` con sottolineatura punteggiata
(un invito a compilare), un campo **confermato vuoto** come parola faint in corsivo
(«nessuno/a», stato chiuso), un campo **valorizzato** col suo valore forte. Aprendo
l'editor inline di un campo opzionale compaiono le azioni **«vuoto»** (azzera →
«da definire») e **«nessuno»** (marca «confermato vuoto»). Per la **classe/livelli**
si rimuove ogni riga con la **×** (anche l'unica): a zero classi il campo torna
«da definire».

La testata **non** mostra il ritratto: la scheda anagrafica è una riga di registro, i campi
prendono tutta la larghezza. L'avatar (`avatarPhotoId`) resta un dato dell'entità, e si vede
nel tab *Galleria*, dove la tavola eletta a profilo è marcata.

Su **schermo stretto** (telefono) la scheda anagrafica passa a **una colonna**: i campi si
impilano nello stesso ordine in cui la scheda li dichiara (per il personaggio: ruolo, razza,
classe, allineamento, livello, reputazione, giocatore), non concatenando le due colonne del
desktop. Il telefono è un cittadino di prima classe: nessuna vista perde funzioni, solo densità
di layout.

Il tab **Galleria** (personaggio e gruppo) mostra le foto dell'entità come griglia di
tavole: caricamento (file picker + drag&drop), didascalia inline, e apertura di una foto in
un **dettaglio** dove si modificano descrizione (markdown) e tag e si sceglie **«Imposta come
profilo»** / **«Rimuovi dal profilo»** o si elimina la foto. La tavola-profilo è marcata.
Ogni tavola ha un controllo **«reinquadra»**: attivo, clic o trascinamento sull'anteprima
sposta il **punto focale** (evita, ad es., la testa tagliata di un ritratto alto), che governa
l'inquadratura `object-fit: cover` delle anteprime.

La rotta `/` reindirizza a **faccia a faccia**. Rotte sconosciute → pagina *not found*.
