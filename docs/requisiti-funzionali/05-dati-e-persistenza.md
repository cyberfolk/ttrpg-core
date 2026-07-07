# 05 · Dati e persistenza

## Auto-save

Ogni modifica è salvata nel `localStorage` del browser: ricaricando la pagina i dati restano.
(L'architettura dei layer — chi tocca `localStorage` — sta in `CLAUDE.md` §Architettura.)

## Export / import

- **Scarica** — esporta l'intero stato in un file JSON (`reputation-AAAAMMGG-hhmm.json`).
- **Carica** — reimporta un JSON, **sostituendo** i dati correnti previa conferma. L'import **valida** il file: JSON malformato o con riferimenti rotti viene rifiutato senza toccare i dati attuali.

## Formato (schema v3)

```json
{
  "version": 3,
  "exportedAt": 1749200000000,
  "characters": [
    { "id": "c1", "name": "Aragorn", "deletedAt": null,
      "isPg": true, "raceId": "r1", "classLevels": [{ "classId": "k1", "level": 5 }],
      "alignment": "Legale Buono", "playerId": "p1", "tagIds": ["tg1"], "notes": "" }
  ],
  "groups": [
    { "id": "g1", "name": "La Compagnia", "type": "fazione",
      "memberIds": ["c1"], "deletedAt": null,
      "seat": "Valdûr", "guideId": "c1", "motto": "", "tagIds": [], "notes": "" }
  ],
  "transactions": [
    { "id": "t1", "fromId": "c1", "toId": "g1", "delta": 10,
      "name": "salvato in battaglia", "createdAt": 1749100000000 }
  ],
  "tags": [{ "id": "tg1", "name": "ricercato" }],
  "players": [{ "id": "p1", "name": "Giulia" }],
  "races": [{ "id": "r1", "name": "Mezzelfo" }],
  "classes": [{ "id": "k1", "name": "Barbaro" }]
}
```

Il campo `version` consente migrazioni di schema (`migrate()` in `src/store/io.js`);
la v1→v2 aggiunge `groups`, la v2→v3 aggiunge i quattro pool lookup
(`tags`/`players`/`races`/`classes`) e fa il backfill dei nuovi campi anagrafici
su personaggi e gruppi.
