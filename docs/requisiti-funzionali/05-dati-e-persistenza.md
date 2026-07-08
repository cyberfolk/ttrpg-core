# 05 · Dati e persistenza

## Auto-save

Ogni modifica è salvata nel `localStorage` del browser: ricaricando la pagina i dati restano.
(L'architettura dei layer — chi tocca `localStorage` — sta in `CLAUDE.md` §Architettura.)

I **byte delle foto** non stanno in `localStorage` (inadatto ai binari e limitato a ~5 MB):
vivono in **IndexedDB**, dietro l'interfaccia `PhotoBlobStore` dello STORE. Solo i **metadati**
foto (`photos[]`, `avatarPhotoId`) stanno nello stato JSON. Vedi
[ADR 0005](../ADR/0005-persistenza-binaria-photoblobstore.md).

## Export / import

- **Scarica** — esporta l'intero stato in un file JSON (`reputation-AAAAMMGG-hhmm.json`).
- **Carica** — reimporta un JSON, **sostituendo** i dati correnti previa conferma. L'import **valida** il file: JSON malformato o con riferimenti rotti viene rifiutato senza toccare i dati attuali. La validazione copre anche le foto: ogni `photo.entityId` deve riferire un nodo esistente, e ogni `avatarPhotoId` una foto di **quella stessa** entità.
- I **byte** delle foto non sono nell'export JSON (restano in IndexedDB locale). Un import su un altro browser porta i metadati foto ma non i byte: l'avatar mostra un placeholder finché i byte non sono presenti. Un export dedicato dei byte (`.zip`) è previsto ma differito.

## Dati d'esempio

Il drawer offre **«Carica dati d'esempio»**: sostituisce (previa conferma) lo stato con
un dataset dimostrativo versionato in `datas/`. A differenza di un import JSON generico,
per questo dataset i **byte** dei ritratti sono disponibili come asset in
`assets/personaggi/` e vengono **seminati** in IndexedDB al caricamento
(`seedSamplePhotos`, best-effort: un file mancante non blocca il resto). Così gli avatar
del dataset d'esempio compaiono davvero, pur restando i byte fuori dall'export JSON.

## Formato (schema v5)

```json
{
  "version": 5,
  "exportedAt": 1749200000000,
  "characters": [
    { "id": "c1", "name": "Aragorn", "deletedAt": null,
      "isPg": true, "raceId": "r1", "classLevels": [{ "classId": "k1", "level": 5 }],
      "alignment": "Legale Buono", "playerId": "p1", "tagIds": ["tg1"], "notes": "",
      "avatarPhotoId": "ph1", "confirmedEmpty": [] }
  ],
  "groups": [
    { "id": "g1", "name": "La Compagnia", "type": "fazione",
      "memberIds": ["c1"], "deletedAt": null,
      "seat": "Valdûr", "guideId": "c1", "motto": "", "tagIds": [], "notes": "",
      "avatarPhotoId": null, "confirmedEmpty": ["motto"] }
  ],
  "transactions": [
    { "id": "t1", "fromId": "c1", "toId": "g1", "delta": 10,
      "name": "salvato in battaglia", "createdAt": 1749100000000 }
  ],
  "photos": [
    { "id": "ph1", "entityId": "c1", "caption": "Ritratto",
      "description": "", "tagIds": ["tg1"], "createdAt": 1749150000000 }
  ],
  "tags": [{ "id": "tg1", "name": "ricercato" }],
  "players": [{ "id": "p1", "name": "Giulia" }],
  "races": [{ "id": "r1", "name": "Mezzelfo" }],
  "classes": [{ "id": "k1", "name": "Barbaro" }]
}
```

Il campo `version` consente migrazioni di schema (`migrate()` in `src/store/io.js`);
la v1→v2 aggiunge `groups`, la v2→v3 aggiunge i quattro pool lookup
(`tags`/`players`/`races`/`classes`) e fa il backfill dei campi anagrafici, la v3→v4
aggiunge `photos[]` e fa il backfill di `avatarPhotoId: null` su personaggi e gruppi,
la v4→v5 fa il backfill di `confirmedEmpty: []` (tri-stato dei campi opzionali, vedi
[01](01-entita.md#tri-stato-dei-campi-opzionali)) su personaggi e gruppi.
