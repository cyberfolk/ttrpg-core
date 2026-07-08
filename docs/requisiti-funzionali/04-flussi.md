# 04 · Flussi chiave

## Primo accesso (campagna vuota)

Con dati assenti, ogni punto morto instrada al passo successivo lungo la catena
**campagna vuota → prima relazione**; nessuna schermata è un vicolo cieco.

- **Faccia a faccia** (schermata iniziale) è consapevole dello stato: con **0
  personaggi** mostra uno stato vuoto che spiega l'app e porta a crearne uno
  (apre l'elenco personaggi con il dialog "aggiungi" già aperto); con **1
  personaggio** invita ad aggiungere il secondo; con **≥2** i selettori
  funzionano e torna il suggerimento "scegli due nomi".
- **Elenco personaggi / Elenco gruppi** vuoti mostrano uno stato che insegna cosa
  sono le entità e offre la creazione del primo elemento. La **ricerca senza
  risultati** è uno stato distinto e più leggero (non è primo accesso).
- **Elenco personaggi con un solo nome** (dove il flusso guidato deposita l'utente
  dopo aver creato il primo) non è un vicolo cieco. Al posto della galleria uno stato
  di guida arioso (stessa resa degli altri stati vuoti: glifo, titolo, corpo — non
  una card) spiega perché serve un secondo nome e chiude con una **CTA** che rimanda
  ai controlli pulsanti (*«Lasciati guidare dai suggerimenti.»*). A **segnalare dove
  cliccare** ci pensano dei coach-mark (alone dorato che pulsa verso l'esterno, senza
  toccare il bordo del controllo, + etichetta) ancorati ai controlli reali finché i
  personaggi restano uno — sul bottone «+» della toolbar (*«Aggiungi qui il
  personaggio»*) e sulla navigazione fra sezioni (*«Le sezioni sono qui»*: la voce
  «Faccia a faccia» su desktop, il menu ☰ su telefono). Stato di guida e coach-mark
  spariscono da soli quando i personaggi diventano due.
- **Elenco gruppi con un solo gruppo** ha lo stesso trattamento: stato di guida
  arioso + CTA e coach-mark sul «+» (*«Aggiungi qui il gruppo»*) e sulla navigazione.
- In entrambe le viste (Personaggi e Gruppi) la **barra di ricerca è disabilitata**
  finché le entità non sono almeno due: con zero o una non c'è nulla da filtrare.
- Scelte due entità ma **senza transazioni tra loro**, il registro invita a
  registrare la prima: è l'ultimo passo prima che il punteggio si muova da 50.

## Registrare una transazione

Dal punteggio di una relazione (in una vista o in un profilo) si apre il **modale transazioni**: si aggiunge / modifica / elimina una transazione (delta + motivo). Il punteggio si **ricalcola al volo** dopo ogni operazione.

## Gestire le foto (galleria e avatar)

Dal tab **Galleria** di un profilo (personaggio o gruppo):

- **Aggiungere** una o più foto via file picker o **drag&drop**. Ogni immagine è
  ridimensionata lato client prima di essere salvata (byte in IndexedDB, metadati nello
  stato). Un file non valido non interrompe il resto del caricamento.
- **Modificare** i metadati: didascalia inline nella griglia; descrizione (markdown) e tag
  nel **dettaglio** della foto.
- **Reinquadrare**: il controllo «reinquadra» su una tavola attiva la scelta del **punto
  focale** (clic/trascina sull'anteprima); corregge i ritagli `object-fit: cover` senza
  toccare i byte. L'avatar in testata segue.
- **Eleggere ad avatar**: nel dettaglio, «Imposta come profilo» punta `avatarPhotoId` a quella
  foto (il ritratto compare in testata). «Rimuovi dal profilo» azzera l'avatar, la foto resta.
- **Eliminare** una foto: sparisce dalla galleria; se era l'avatar, l'avatar si azzera a
  cascata (il byte è rimosso da IndexedDB best-effort).

Aggiungere una foto la deposita sempre in galleria; l'avatar è un puntatore a una di esse,
mai una copia: le due operazioni restano coerenti per costruzione (vedi
[01](01-entita.md) e [ADR 0005](../ADR/0005-persistenza-binaria-photoblobstore.md)).

## Modifica della scheda anagrafica

Dalla testata del profilo ogni campo si modifica **inline** (clic sul valore).
I riferimenti a entità-vocabolario (razza, classe, giocatore, tag) si scelgono da
un picker che permette anche di **creare** al volo una voce nuova nel pool. Livello
e reputazione sono derivati (sola lettura).

## Cancellazione

- **Archiviazione (soft delete)** — reversibile. L'entità sparisce dalle liste attive; con il toggle **Mostra archiviati** si può *Ripristinare*.
- **Eliminazione definitiva (hard delete)** — irreversibile, con conferma. Rimuove l'entità e, a cascata, le transazioni dirette da/verso di essa **e le sue foto** (metadati dallo stato, byte da IndexedDB best-effort). Per un **personaggio** ripulisce anche i `memberIds` dei gruppi che lo contenevano. L'eliminazione di un **gruppo** non tocca i suoi membri né le loro transazioni.

## Persistenza

Auto-save e export/import: vedi [05 · Dati e persistenza](05-dati-e-persistenza.md).
