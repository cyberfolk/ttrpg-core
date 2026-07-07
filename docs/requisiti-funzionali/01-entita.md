# 01 · Entità

Il sistema di reputazione ha due tipi di entità, che condividono il ruolo di **nodo** nel grafo delle relazioni.

## Personaggio

Un PG o PNG della campagna.

- Campi: `id` (UUID), `name`, `deletedAt` (soft-delete), `isPg` (ruolo PG/PNG,
  default PNG), `raceId` (→ pool razze | null), `classLevels`
  (`[{classId, level}]`, la multiclasse), `alignment` (stringa libera),
  `playerId` (→ pool giocatori | null, significativo solo se PG),
  `tagIds` (→ pool tag), `notes` (markdown),
  `avatarPhotoId` (→ una foto della galleria | null, la foto di profilo).
- **Livello** = somma dei `level` di `classLevels`: derivato, mai salvato.
- La reputazione resta derivata dalle transazioni (vedi [02](02-modello-reputazione.md)).

## Gruppo

Contenitore generico che rappresenta fazioni e centri abitati di **qualsiasi scala** (dal villaggio di tre case alla megalopoli).

- Campi: `id`, `name`, `type` (etichetta libera), `memberIds`, `deletedAt`,
  `seat` (sede, stringa libera), `guideId` (→ un `charId` ∈ `memberIds` | null),
  `motto`, `tagIds` (→ pool tag), `notes` (markdown),
  `avatarPhotoId` (→ una foto della galleria | null, la foto di profilo).
- La **guida** è sempre uno dei membri: rimuovere quel membro (o eliminarlo)
  azzera la guida.
- **Tipo unico generico.** Paesino, megalopoli e fazione condividono la stessa struttura: cambia solo l'etichetta `type`. Nessun campo specializzato per tipo (YAGNI; se domani serve, si aggiunge come campo opzionale).
- **Niente nesting.** I membri di un gruppo sono solo personaggi, mai altri gruppi.
- Un personaggio può appartenere a **più gruppi**.
- Un gruppo partecipa alla reputazione in due modi affiancati (nodo diretto + aggregato):
  vedi [02](02-modello-reputazione.md).

## Entità-vocabolario (lookup)

Quattro pool condivisi `{id, name}`, referenziati per id: **tag**, **giocatori**,
**razze**, **classi**. Sono *lookup leggeri*: si creano al volo dai picker (nessuna
vista di gestione, nessun soft-delete). Rinominare una voce cambia ovunque; niente
duplicati. **Non sono nodi** del grafo di reputazione: solo personaggi e gruppi lo
sono, e `resolveNode` resta invariato.

## Foto (galleria)

Ogni personaggio e gruppo ha una **galleria** di foto. Una foto è
`{id, entityId, caption, description, tagIds, createdAt}`:

- **Metadati** (didascalia, descrizione markdown, tag dal pool esistente, data) sono dati
  piani nello stato, in un array top-level `photos` (come `transactions`); `entityId` fa da
  FK verso il nodo proprietario (personaggio **o** gruppo, id polimorfo).
- I **byte** dell'immagine non stanno nello stato: vivono in IndexedDB dietro l'interfaccia
  `PhotoBlobStore` dello STORE (ridimensionati lato client prima del salvataggio). Vedi
  [05](05-dati-e-persistenza.md) e [ADR 0005](../ADR/0005-persistenza-binaria-photoblobstore.md).
- **Avatar = puntatore.** `avatarPhotoId` dell'entità riferisce una foto della sua galleria,
  mai una copia. Conseguenze:
  - Impostare una foto come profilo = setta `avatarPhotoId`.
  - Rimuovere l'avatar = azzera `avatarPhotoId`; la foto **resta** in galleria.
  - Eliminare la foto puntata dall'avatar azzera `avatarPhotoId` **a cascata**.

## Nodo polimorfo

Una transazione collega due **nodi**: `fromId`/`toId` possono essere un personaggio **o** un gruppo. Gli UUID sono globalmente unici, quindi non serve un campo `type` sulla transazione: l'helper `resolveNode(state, id)` risolve se un id è un personaggio, un gruppo, o `null`.
