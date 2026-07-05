# 01 · Entità

Il sistema di reputazione ha due tipi di entità, che condividono il ruolo di **nodo** nel grafo delle relazioni.

## Personaggio

Un PG o PNG della campagna.

- Campi: `id` (UUID), `name`, `deletedAt` (soft-delete, `null` se attivo).
- Non possiede punteggi propri: la sua reputazione verso/da altri è sempre **derivata** dalle transazioni (vedi [02](02-modello-reputazione.md)).

## Gruppo

Contenitore generico che rappresenta fazioni e centri abitati di **qualsiasi scala** (dal villaggio di tre case alla megalopoli).

- Campi: `id`, `name`, `type` (etichetta libera: "fazione", "città", "gilda"…), `memberIds` (lista di id di personaggi), `deletedAt`.
- **Tipo unico generico.** Paesino, megalopoli e fazione condividono la stessa struttura: cambia solo l'etichetta `type`. Nessun campo specializzato per tipo (YAGNI; se domani serve, si aggiunge come campo opzionale).
- **Niente nesting.** I membri di un gruppo sono solo personaggi, mai altri gruppi.
- Un personaggio può appartenere a **più gruppi**.
- Un gruppo partecipa alla reputazione in due modi affiancati (nodo diretto + aggregato):
  vedi [02](02-modello-reputazione.md).

## Nodo polimorfo

Una transazione collega due **nodi**: `fromId`/`toId` possono essere un personaggio **o** un gruppo. Gli UUID sono globalmente unici, quindi non serve un campo `type` sulla transazione: l'helper `resolveNode(state, id)` risolve se un id è un personaggio, un gruppo, o `null`.
