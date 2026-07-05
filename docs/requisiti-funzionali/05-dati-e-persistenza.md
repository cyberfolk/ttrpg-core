# 05 · Dati e persistenza

## Auto-save

Ogni modifica è salvata nel `localStorage` del browser: ricaricando la pagina i dati restano.
Lo STORE è l'**unico layer** che tocca `localStorage` (il MODEL resta framework-agnostico).

## Export / import

- **Scarica** — esporta l'intero stato in un file JSON (`reputation-AAAAMMGG-hhmm.json`).
- **Carica** — reimporta un JSON, **sostituendo** i dati correnti previa conferma. L'import **valida** il file: JSON malformato o con riferimenti rotti viene rifiutato senza toccare i dati attuali.

## Formato (schema v2)

```json
{
  "version": 2,
  "exportedAt": 1749200000000,
  "characters": [
    { "id": "c1", "name": "Aragorn", "deletedAt": null }
  ],
  "groups": [
    { "id": "g1", "name": "La Compagnia", "type": "fazione",
      "memberIds": ["c1"], "deletedAt": null }
  ],
  "transactions": [
    { "id": "t1", "fromId": "c1", "toId": "g1",
      "delta": 10, "name": "salvato in battaglia", "createdAt": 1749100000000 }
  ]
}
```

Il campo `version` consente migrazioni di schema (`migrate()` in `src/store/io.js`); la
migrazione v1→v2 aggiunge l'array `groups`.
