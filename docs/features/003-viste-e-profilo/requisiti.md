# Requisiti (bozza seed) — Vista lista + profilo personaggio

## Stack

La feature si fa su un **framework frontend** (non vanilla): lo scope multi-vista lo
richiede. Quale framework (con build o no-build) e se usare rotte vere o stato UI in memoria
si decidono nel brainstorm. Si tocca **solo la VIEW**: `MODEL`/`STORE`/`IO` restano invariati.
Contesto: [[01-presentazione-dati]], [[02-domande-pre-brainstorm]].  
Useremo Vue 3 + Vite + vue-router.

## Obiettivo

Migliorare la presentazione dei dati. Oggi c'è solo la matrice: poco leggibile.

## Cosa voglio  

- **Vista primaria = lista personaggi.** Vedo l'elenco dei personaggi attivi.
  - Posso decidere se vederli visualizzai con una griglia di card una per ogni personaggio, oppure
  - posso decidere se visualizzarli con una lista uno sotto l'altro.
- **Click su un personaggio → entro nel suo "profilo".** Nel profilo voglio vedere due cose:
  - **cosa gli altri pensano di lui** (reputazione in entrata: gli altri su → lui)
  - **cosa lui pensa degli altri** (reputazione in uscita: lui su → gli altri)
  - su ogno singolo personaggio rapprensentta qui posso cliccre il suo nome (o card o blocco), e vado sul profilo di quel personaggio.
- Da una voce del profilo voglio poter aprire le transazioni di quella relazione
  (riuso del pannello transazioni che esiste già).
- **La matrice resta**, ma diventa vista **secondaria** (toggle/switcher in toolbar), magari anche qui posso switchare nella visualizzazione tra le 3 opzioni, lista/griglia-card/matrice con una puslantiera
- da ognuna di queste visualizzszioni, cliccando sul nome di un pg vado nel suo profilo.
- magari metterci in altro nella prima pagina wuella dove posso scegliere la visualizzszione, una barra di ricerca.

## Aperto / da decidere in brainstorm

- Che "punteggio sintetico" mostrare accanto a ogni personaggio nella lista? (la media di come viene percepito dagli altri)
- Layout profilo: tab ("Di lui pensano" / "Lui pensa"), di default apre cosa la gente pensa di lui
- Ordinamento delle relazioni nel profilo (per punteggio? per nome?). selezionabile, magari sopra la colonna nome mettici il bottone per ordinarli in un verso o in un altro, e soprs la colonna punteggio medio di percezione mettilo ordinabile anche wuello in un verso o in un altro.
- Come si torna indietro (lista ← profilo): pulsante, breadcrumb, click logo?, tutte e 3 le opzioni.
- Dove vivono soft-delete/archivio in questa nuova navigazione. non lo so
- Vista di default all'avvio: lista o matrice? vists griglia-card
- la vista griglia-card la chiamerei gallery