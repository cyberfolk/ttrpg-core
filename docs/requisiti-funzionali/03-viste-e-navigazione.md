# 03 · Viste e navigazione

L'app è una **shell multi-tool**: la navigazione principale passa da un **drawer** laterale.
La funzione attiva è **Reputazione**; altre funzioni sono predisposte come "soon".

## Viste (rotte)

- **Faccia a faccia** (`/faccia-a-faccia`, schermata iniziale) — confronta due entità testa a testa: come si considerano reciprocamente, in diretto e in aggregato. I due selettori mostrano al massimo **5 risultati** per rilevanza (prefisso prima), più le azioni in coda: **Aggiungi personaggio** / **Aggiungi gruppo** (creano e selezionano subito la nuova entità, pre-compilate col testo cercato) e, quando i match superano 5, **Vedi tutti (N)** che apre l'elenco completo ricercabile.
- **Personaggi** (`/personaggi`) — elenco dei personaggi, leggibile in **galleria** (card) o **lista** (tabella ordinabile). Toolbar per aggiungere/cercare.
- **Profilo personaggio** (`/personaggio/:id`) — testata **scheda anagrafica con editing inline per campo** (razza, classe/livelli, allineamento, giocatore, gruppi, tag; livello e reputazione derivati, sola lettura), con il **ritratto** (avatar) come medaglione quando impostato, seguito da storico delle relazioni in **entrata** e **uscita**, più i gruppi di appartenenza. Le **note** (markdown) si modificano nel tab *Note*, non nella testata; le foto nel tab *Galleria*.
- **Gruppi** (`/gruppi`) — elenco dei gruppi: creazione, rinomina, modifica `type`, gestione membri, archivia/ripristina.
- **Profilo gruppo** (`/gruppo/:id`) — testata **scheda anagrafica con editing inline per campo** (tipo, sede, guida, motto, tag; reputazione derivata, sola lettura), con il **ritratto** (avatar) come medaglione quando impostato, seguito da membri + i punteggi diretto/aggregato per ogni coppia rilevante; reciprocamente un gruppo appare nel profilo dei suoi membri. Le **note** (markdown) si modificano nel tab *Note*; le foto nel tab *Galleria*.

Il tab **Galleria** (personaggio e gruppo) mostra le foto dell'entità come griglia di
tavole: caricamento (file picker + drag&drop), didascalia inline, e apertura di una foto in
un **dettaglio** dove si modificano descrizione (markdown) e tag e si sceglie **«Imposta come
profilo»** / **«Rimuovi dal profilo»** o si elimina la foto. La tavola-profilo è marcata; il
ritratto in testata riflette la scelta.

La rotta `/` reindirizza a **faccia a faccia**. Rotte sconosciute → pagina *not found*.
