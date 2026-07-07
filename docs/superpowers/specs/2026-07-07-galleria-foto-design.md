# Galleria foto per entità — Design

**Data:** 2026-07-07
**Stato:** approvato (brainstorming), pronto per il piano di implementazione

## Obiettivo

Aggiungere a personaggi e gruppi una tab **Galleria** che raccoglie foto con
metadati (caption, descrizione markdown, tag, data). Una foto della galleria può
essere eletta a **foto di profilo** (avatar). Le operazioni sono reciproche e
coerenti. Tutto client-side (nessun server), ma progettato perché il passaggio a
un backend futuro sostituisca **un solo componente** senza toccare il resto.

## Vincolo architetturale

Rispetta i 3 layer con dipendenze solo verso il basso (`VIEW → STORE → MODEL`).
Il MODEL resta puro e framework-agnostico (traducibile 1:1 in Python). La
persistenza binaria vive **solo** nello STORE, dietro un'interfaccia stretta che è
il seam per il server.

Separazione portante: **metadati** (oggetti piani, MODEL, riciclabili al 100% verso
server) contro **byte** (Blob, dietro interfaccia, l'unico pezzo che cambia col
server).

## Modello dati (MODEL)

### Nuovo tipo `Photo`

Solo metadati, nessun byte:

```
Photo = {
  id,            // UUID
  entityId,      // FK → Character.id | Group.id (polimorfo, UUID globali)
  caption,       // stringa breve, una riga
  description,   // markdown (stesso render delle Note)
  tagIds,        // → pool tag esistente (nessun pool nuovo)
  createdAt      // timestamp, per ordinamento cronologico
}
```

Le foto stanno in un **array top-level** `photos: []` nello stato (come
`transactions`), non annidate nell'entità. `entityId` fa da FK; il polimorfo resta
uniforme (personaggio o gruppo indistintamente).

### Campo su entità

Su `Character` e su `Group`: nuovo campo `avatarPhotoId` (→ `Photo.id` | `null`).

**L'avatar è un puntatore**, non una copia. Fonte byte unica: zero disallineamento,
zero doppio spazio. Le regole di reciprocità diventano conseguenze del modello, non
codice aggiuntivo.

## Funzioni pure (MODEL)

Nuovo modulo `src/model/photos.js` (o dentro `reputation.js` se preferito in fase di
piano). Tutte pure, operano sullo stato intero:

- `addPhoto(state, entityId, meta)` → crea e inserisce una `Photo`.
- `removePhoto(state, photoId)` → rimuove la `Photo`; **cascata**: se era l'avatar di
  un'entità, azzera `avatarPhotoId`.
- `setAvatar(state, entityId, photoId)` → punta l'avatar a una foto esistente.
- `clearAvatar(state, entityId)` → azzera `avatarPhotoId`; la foto **resta** in
  galleria.
- `updatePhotoMeta(state, photoId, patch)` → aggiorna caption/description/tagIds.

### Reciprocità (derivata dalle funzioni sopra)

- **Aggiungi foto dal profilo → va in galleria:** `addPhoto` + `setAvatar` (una foto,
  un oggetto).
- **Elimina foto dalla galleria → via anche dal profilo:** cascata in `removePhoto`.
- **Togli avatar dal profilo → foto resta in galleria:** `clearAvatar`
  (de-referenzia, non elimina).

Due gesti distinti e intenzionali: *de-referenziare* l'avatar (`clearAvatar`) vs
*eliminare* la foto (`removePhoto`, che azzera l'avatar a cascata).

## Persistenza binaria (STORE)

### Interfaccia `PhotoBlobStore` — il seam per il server

```
PhotoBlobStore.put(photoId, blob)
PhotoBlobStore.get(photoId) -> blob
PhotoBlobStore.delete(photoId)
```

- **Impl v1:** IndexedDB (stesso browser, no server, decine/centinaia di MB, salva
  `Blob` nativi senza base64).
- **Impl futura server:** `fetch()` verso `/photos/:id`. È l'**unico** file che cambia
  nel salto a server; MODEL, VIEW e il resto dello STORE non se ne accorgono. Stesso
  spirito dei seam di ADR 0002.

localStorage resta per il JSON di stato. IndexedDB è nuovo ma sempre dentro lo STORE:
il vincolo "solo lo STORE tocca la persistenza" regge.

### Preparazione immagine

`prepareImage(file)`: `<canvas>` → ridimensiona a max ~1600px sul lato lungo →
ricomprime in WebP (fallback JPEG) → restituisce un `Blob`. Gira **prima** di
`PhotoBlobStore.put`. Un solo posto, riusato anche dal seeder. Tiene IndexedDB
leggero ed evita che una foto ad alta risoluzione saturi la quota o faccia fallire il
salvataggio; rende leggero anche l'upload futuro al server.

## VIEW (`src/view/`)

- Tab **Galleria** in `ProfileView.vue` e `GroupProfileView.vue` (stesso pattern dei
  tab Note/in/out/groups).
- Componente condiviso **`Gallery.vue`** (prop `kind` character/group, come
  `Notes.vue`): griglia di miniature; upload via file picker + drag/drop; per ogni
  foto → caption inline, descrizione markdown, tag (picker sul pool esistente),
  azione **«Imposta come profilo»**, elimina (con conferma).
- **Testata profilo:** mostra l'avatar risolto da `avatarPhotoId`; placeholder quando
  `null`.
- Composable **`usePhotoUrl(photoId)`**: risolve il blob via `PhotoBlobStore` →
  `URL.createObjectURL`, e **revoca** l'object URL su unmount (niente memory leak).

## Export / import (`io.js`)

- **Export JSON (schema v4):** `photos[]` (solo metadati) e `avatarPhotoId` entrano
  nello stato serializzato. `migrate()` v3→v4 fa il backfill di `photos: []` sullo
  stato e `avatarPhotoId: null` su ogni personaggio/gruppo. **I byte restano fuori.**
- **Esporta foto (fase 2, opzionale):** pulsante separato → `.zip` con i blob indicizzati
  per `photoId`. Backup dati e backup foto disaccoppiati.
- **Validazione import:** ogni `avatarPhotoId` deve esistere in `photos`; ogni
  `photo.entityId` deve riferire un'entità esistente. Byte assenti in IndexedDB →
  avatar mostra placeholder, nessun crash (i metadati sono la fonte di verità della
  struttura; il blob è opzionale a runtime).
- **Seed dati d'esempio con foto:** le foto demo vivono come **asset statici** in
  `assets/` (shippate col build). Il seeder le `fetch()` dal loro path, le passa per
  `prepareImage`, e le mette in IndexedDB via `PhotoBlobStore.put`. Il JSON demo
  referenzia solo un path-asset in un campo usato **esclusivamente** al seed, mai
  presente negli export utente.

## Test (node:test, TDD su MODEL/STORE/IO)

- MODEL: `addPhoto`/`removePhoto` (cascata avatar)/`setAvatar`/`clearAvatar`/
  `updatePhotoMeta` sullo stato.
- IO: `migrate()` v3→v4 (backfill), validazione import (FK avatar rotto, entityId
  rotto → rifiuto senza toccare i dati).
- STORE: `PhotoBlobStore` su adapter in-memory per i test (come storage.js già fa).
- VIEW: verifica manuale nel browser.

## Docs da aggiornare (stesso lavoro)

- `docs/requisiti-funzionali/01-entita.md`: campo `avatarPhotoId`, tipo `Photo`.
- `docs/requisiti-funzionali/03-viste-e-navigazione.md`: tab Galleria nei profili.
- `docs/requisiti-funzionali/04-flussi.md`: flussi foto (aggiungi/elimina/imposta
  avatar/reciprocità).
- `docs/requisiti-funzionali/05-dati-e-persistenza.md`: schema v4, IndexedDB per i
  byte, export foto separato.
- `docs/architettura.md`: mappa file (`src/model/photos.js`, blob store nello STORE).
- Nuovo **ADR 0005** — persistenza binaria: IndexedDB dietro `PhotoBlobStore`, seam
  per il server; perché metadati e byte sono separati.

## Nota grafica

Tab Galleria, griglia miniature e avatar nella testata sono task **grafici**. Prima
dell'implementazione della VIEW va invocata la skill `impeccable` (direttiva grafica
di progetto).

## Fasi (indicative, il piano le dettaglierà)

1. MODEL: tipo `Photo`, funzioni pure, test.
2. STORE: `PhotoBlobStore` su IndexedDB + adapter in-memory, `prepareImage`.
3. IO: migrazione v4, serializzazione `photos`, validazione import, test.
4. VIEW: `Gallery.vue`, tab nei due profili, avatar in testata, `usePhotoUrl`
   (con `impeccable`).
5. Export foto `.zip` + seed demo (opzionale/coda).
6. Docs + ADR 0005.

## Cosa si ricicla verso il server

- Metadati `Photo` e `avatarPhotoId`: 100% (stesso JSON → tabella server).
- Logica di reciprocità (funzioni pure MODEL): 100%.
- Solo l'impl di `PhotoBlobStore` viene sostituita (IndexedDB → `fetch`).

Conclusione: costruire client-first **non** produce lavoro buttato.