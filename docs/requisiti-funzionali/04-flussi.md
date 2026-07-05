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
- Scelte due entità ma **senza transazioni tra loro**, il registro invita a
  registrare la prima: è l'ultimo passo prima che il punteggio si muova da 50.

## Registrare una transazione

Dal punteggio di una relazione (in una vista o in un profilo) si apre il **modale transazioni**: si aggiunge / modifica / elimina una transazione (delta + motivo). Il punteggio si **ricalcola al volo** dopo ogni operazione.

## Cancellazione

- **Archiviazione (soft delete)** — reversibile. L'entità sparisce dalle liste attive; con il toggle **Mostra archiviati** si può *Ripristinare*.
- **Eliminazione definitiva (hard delete)** — irreversibile, con conferma. Rimuove l'entità e, a cascata, le transazioni dirette da/verso di essa. Per un **personaggio** ripulisce anche i `memberIds` dei gruppi che lo contenevano. L'eliminazione di un **gruppo** non tocca i suoi membri né le loro transazioni.

## Persistenza

Auto-save e export/import: vedi [05 · Dati e persistenza](05-dati-e-persistenza.md).
