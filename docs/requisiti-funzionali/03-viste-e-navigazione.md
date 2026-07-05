# 03 · Viste e navigazione

L'app è una **shell multi-tool**: la navigazione principale passa da un **drawer** laterale.
La funzione attiva è **Reputazione**; altre funzioni sono predisposte come "soon".

## Viste (rotte)

- **Faccia a faccia** (`/faccia-a-faccia`, schermata iniziale) — confronta due entità testa a testa: come si considerano reciprocamente, in diretto e in aggregato.
- **Personaggi** (`/personaggi`) — elenco dei personaggi, leggibile in **galleria** (card) o **lista** (tabella ordinabile). Toolbar per aggiungere/cercare.
- **Profilo personaggio** (`/personaggio/:id`) — storico delle relazioni in **entrata** e **uscita**, più i gruppi di appartenenza.
- **Gruppi** (`/gruppi`) — elenco dei gruppi: creazione, rinomina, modifica `type`, gestione membri, archivia/ripristina.
- **Profilo gruppo** (`/gruppo/:id`) — membri + i punteggi diretto/aggregato per ogni coppia rilevante; reciprocamente un gruppo appare nel profilo dei suoi membri.

La rotta `/` reindirizza a **faccia a faccia**. Rotte sconosciute → pagina *not found*.
