# Architettura

Vincolo forte del progetto: **3 layer con dipendenze solo verso il basso**.  
Il framework (Vue) tocca **solo la `VIEW`**; `MODEL` e `STORE` restano framework-agnostici, pensati per un futuro port a Python a costo quasi nullo.

```
VIEW   (src/view/)   componenti Vue 3 — rendering e input. Parla solo con lo STORE.
  │
  ▼
STORE  (src/store/)  stato in memoria + persistenza. Unico layer che tocca localStorage.
  │
  ▼
MODEL  (src/model/)  dati puri + funzioni pure. Nessuna dipendenza dal browser.
```

Dipendenze **solo verso il basso**: `VIEW → STORE → MODEL`, mai il contrario.

## I layer

### MODEL — `src/model/`

Dati puri (oggetti piani) + funzioni pure. **Nessun** `window`/`document`/`localStorage`:
traducibile 1:1 in Python (migrazione futura). È l'**unico** posto dove vive la logica di reputazione — VIEW e STORE non calcolano punteggi, li leggono. La verità è lo stato intero:
`computeScore` opera sull'array delle transazioni, non su un singolo oggetto. → *Perché oggetti piani e non classi:* ADR 0001.

### STORE — `src/store/`

Stato in memoria + persistenza. **Unico layer che tocca `localStorage`.** Orchestra le mutazioni con un ciclo unidirezionale:

```
dispatch → muta via MODEL → salva → notifica i subscriber
```

Tiene i *seam* per un eventuale backend futuro senza anticiparlo (niente async né azioni nominali finché non servono). → ADR 0002.

### VIEW — `src/view/`

Rendering UI con componenti Vue 3. Parla **solo** con lo STORE (mai col MODEL direttamente). Layer **isolato**: riscriverlo non tocca MODEL/STORE/IO. Stack Vue 3 + Vite + vue-router in history mode, con `404.html` (copia di `index.html`) per il routing SPA su GitHub Pages. → ADR 0003.

## Vincoli invarianti

- Dipendenze **solo verso il basso** (`VIEW → STORE → MODEL`).
- Logica di reputazione **solo nel MODEL**; VIEW e STORE non calcolano punteggi.
- `localStorage` toccato **solo dallo STORE**.
- MODEL e STORE **framework-agnostici** (nessuna dipendenza da Vue/browser: port Python intatto).
- Asset statici (immagini, ecc.) in `assets/` alla radice del progetto, non in `src/`.

## Mappa file

| File                                         | Responsabilità                                                                               |
|----------------------------------------------|----------------------------------------------------------------------------------------------|
| `src/model/schema.js`                        | Costanti (`BASE`, `SCHEMA_VERSION`) e costruttori dei dati (personaggi con campi anagrafici, gruppi, transazioni, voci lookup, foto) |
| `src/model/reputation.js`                    | Logica: `computeScore`, `clampView`, aggregati di gruppo, CRUD entità/transazioni, pool lookup e setter dei campi anagrafici (hard-delete cascata anche su foto) |
| `src/model/photos.js`                        | Funzioni pure su foto e avatar: `addPhoto`/`removePhoto` (cascata avatar)/`setAvatar`/`clearAvatar`/`updatePhotoMeta`/`listPhotos` |
| `src/store/storage.js`                       | Adattatori storage (localStorage / in-memory per i test)                                     |
| `src/store/photoBlobStore.js`                | Blob store foto (byte): impl IndexedDB + in-memory per i test. Seam per un futuro server (ADR 0005) |
| `src/store/prepareImage.js`                  | Ridimensionamento immagine lato client (`computeResizeDims` puro + `prepareImage` via canvas) |
| `src/store/io.js`                            | Serializzazione, validazione, migrazione, parsing import                                     |
| `src/store/store.js`                         | Stato, `dispatch`, `subscribe`, persistenza                                                  |
| `src/view/main.js` · `router.js` · `App.vue` | Bootstrap Vue, rotte (history mode), layout + drawer                                         |
| `src/view/components/*.vue`                  | Viste e componenti (faccia-a-faccia, galleria, lista, profili, modale)                       |
| `src/view/use*.js`                           | Composables: accesso allo STORE, stato UI, entità visualizzate                               |

## Il perché delle scelte (ADR)

Questo file descrive **com'è** l'architettura; il **perché** di ogni scelta sta negli ADR:

- **ADR 0001** — modello dati a oggetti piani + funzioni pure (no classi).
- **ADR 0002** — non anticipare il backend: tenere i seam, niente async ora.
- **ADR 0003** — stack frontend della VIEW: Vue 3 + Vite + vue-router.
- **ADR 0004** — distribuzione: hosting su GitHub Pages, solo-link.
- **ADR 0005** — persistenza binaria: metadati foto nello stato, byte in IndexedDB dietro `PhotoBlobStore` (seam server).
