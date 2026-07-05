# 04 · Flussi chiave

## Registrare una transazione

Dal punteggio di una relazione (in una vista o in un profilo) si apre il **modale transazioni**: si aggiunge / modifica / elimina una transazione (delta + motivo). Il punteggio si **ricalcola al volo** dopo ogni operazione.

## Cancellazione

- **Archiviazione (soft delete)** — reversibile. L'entità sparisce dalle liste attive; con il toggle **Mostra archiviati** si può *Ripristinare*.
- **Eliminazione definitiva (hard delete)** — irreversibile, con conferma. Rimuove l'entità e, a cascata, le transazioni dirette da/verso di essa. Per un **personaggio** ripulisce anche i `memberIds` dei gruppi che lo contenevano. L'eliminazione di un **gruppo** non tocca i suoi membri né le loro transazioni.

## Persistenza

Auto-save e export/import: vedi [05 · Dati e persistenza](05-dati-e-persistenza.md).
