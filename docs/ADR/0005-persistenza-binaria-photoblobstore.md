# ADR 0005 — Persistenza binaria delle foto: metadati nello stato, byte dietro `PhotoBlobStore`

Data: 2026-07-08
Stato: Accettato
Ambito: STORE/persistenza. La VIEW consuma il seam; il MODEL resta puro.

## Contesto

La galleria (vedi requisiti [01](../requisiti-funzionali/01-entita.md),
[03](../requisiti-funzionali/03-viste-e-navigazione.md)) introduce foto con metadati su
personaggi e gruppi, e una di esse eleggibile ad avatar. Le foto sono **byte** (immagini),
non dati piani come il resto dello stato. Vincoli:

- **Niente server** (web app locale): i byte vivono nel browser.
- `localStorage` è la sola persistenza esistente ma è inadatta ai byte: limite ~5 MB
  totali per origine e nessun tipo binario (base64 gonfia +33%, poche foto lo saturano).
- Direzione futura possibile: byte su un backend. Non va anticipata (coerenza con
  [ADR 0002](0002-no-anticipare-backend.md)), ma il seam va lasciato pulito.

## Decisione

**Separare metadati da byte.**

1. **Metadati** (`Photo = {id, entityId, caption, description, tagIds, createdAt}` e
   `avatarPhotoId` sull'entità) sono oggetti piani nel MODEL, dentro lo stato serializzato
   (schema v4). Viaggiano nell'export JSON come tutto il resto.
2. **Byte** stanno dietro un'interfaccia stretta e asincrona nello STORE:

   ```
   PhotoBlobStore.put(photoId, blob) -> Promise<void>
   PhotoBlobStore.get(photoId)       -> Promise<Blob|null>
   PhotoBlobStore.delete(photoId)    -> Promise<void>
   ```

   Impl v1 = **IndexedDB** (`indexedDbBlobStore`), più `memoryBlobStore` per i test.
3. Le immagini sono **ridimensionate lato client** (`prepareImage`: canvas → ~1600px lato
   lungo → WebP) prima del `put`, per contenere quota e peso di un futuro upload.
4. L'**avatar è un puntatore** (`avatarPhotoId` → id di una foto), mai una copia dei byte:
   fonte unica, reciprocità automatica.

`localStorage` resta per il JSON di stato; IndexedDB è un secondo canale di persistenza ma
sempre confinato allo STORE (il vincolo "solo lo STORE tocca la persistenza" regge).

## Conseguenze

**Positive:**
- Export JSON resta leggero (solo metadati); nessun base64 mostruoso.
- Il salto a server tocca **un solo file**: si sostituisce l'impl di `PhotoBlobStore` con
  una `fetch`-based (`put`→POST, `get`→GET, `delete`→DELETE). MODEL, VIEW e il resto dello
  STORE non cambiano. È lo stesso spirito di seam di [ADR 0002](0002-no-anticipare-backend.md).
- La logica di reciprocità/cascata (avatar) vive nel MODEL puro → riciclabile al 100%.

**Negative / trade-off:**
- L'interfaccia del blob store è **async** mentre lo STORE dati è sync: la VIEW gestisce
  `await` sui soli byte (upload, thumbnail, delete). Accettato: i byte sono intrinsecamente
  async (IndexedDB/rete), i metadati no.
- Backup completo = due artefatti (JSON metadati + byte). L'export foto in `.zip` è previsto
  ma differito (non blocca la feature). Finché non c'è, i byte restano solo locali.
- Un blob può restare **orfano** (metadato cancellato, delete del byte fallito) o **mancante**
  (metadato importato senza byte): tollerato per progetto — l'avatar mostra un placeholder,
  nessun crash; i metadati sono la fonte di verità della struttura.

## Alternative

- **Base64 nel JSON/localStorage.** Formato di export invariato, ma file enorme e fragile,
  quota `localStorage` saturata in fretta. Scartata (non scala oltre pochi scatti).
- **Byte annidati nell'entità (MODEL).** Sporcherebbe il MODEL puro con dati binari e romperebbe
  la traducibilità 1:1 in Python. Scartata.
- **Un unico export `.zip` (JSON + cartella foto) subito.** Un solo file da gestire, ma cambia
  il formato di export attuale e serve una lib zip: rimandato come opzione, non blocca.

## Quando rivedere

Quando il backend diventa deciso: si scrive l'impl `fetch` di `PhotoBlobStore` e, se serve
condivisione tra dispositivi, si sposta lo storage byte sul server. Oppure quando la quota
IndexedDB locale non basta più all'uso reale (molte foto ad alta risoluzione), rivedendo la
soglia di `prepareImage` o introducendo l'export/import foto `.zip`.
