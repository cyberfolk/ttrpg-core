# TTRPG Core — Sistema di Reputazione

**App live:** https://cyberfolk.github.io/ttrpg-core/

Web app **locale** (gira nel browser, nessun server) per gestire tool da TTRPG.
Prima feature: **sistema di reputazione tra personaggi** per Dungeons & Dragons.

La VIEW usa **Vue 3 + Vite + vue-router** (dalla feature 003, vedi ADR 0003). I layer
MODEL e STORE/IO restano **framework-agnostici**: dati puri e funzioni pure, pensati per
una futura migrazione a Python a costo quasi nullo. Il framework tocca solo la VIEW.

---

## Cos'è

Traccia quanto i personaggi di una campagna si stimano a vicenda. Ogni relazione ha
un punteggio **1-100** ed è **asimmetrica**: quanto A pensa di B è indipendente da
quanto B pensa di A (faide unilaterali, cotte non corrisposte...).

Il punteggio non si modifica a mano: si registrano **transazioni** (eventi con un
valore positivo o negativo e un motivo). Il punteggio è sempre *derivato*:

```
punteggio(A→B) = clamp1-100( 50 + somma dei delta delle transazioni A→B )
```

- Ogni nuovo personaggio nasce a **50** verso tutti (somma vuota = 50).
- Lo storico delle transazioni è l'unica fonte di verità: niente disallineamenti.

---

## Come si usa

1. Apri l'app (vedi *Avvio*).
2. **Aggiungi personaggi** dalla toolbar (`+ Personaggio`).
3. Appare una **matrice** N×N: riga = chi giudica (`da`), colonna = chi è giudicato (`a`).
   La cella `A→B` mostra il punteggio, colorato da rosso (basso) a verde (alto).
4. **Click su una cella** → pannello con lo storico di quella relazione:
   - aggiungi una transazione (delta + motivo),
   - modifica o elimina transazioni esistenti.
   Il punteggio si ricalcola al volo.
5. **🗑 su un personaggio** → archiviazione (soft delete, reversibile).
   Toggle **Mostra archiviati** → da lì *Ripristina* oppure *Elimina definitivamente*
   (irreversibile, con conferma: rimuove il personaggio e tutte le sue transazioni).

### Salvataggio e backup

- **Auto-save**: ogni modifica è salvata nel `localStorage` del browser. Ricaricando
  la pagina i dati restano.
- **Scarica**: esporta tutto in un file JSON (`reputation-AAAAMMGG-hhmm.json`).
- **Carica**: reimporta un file JSON (sostituisce i dati correnti, previa conferma).
  L'import valida il file: JSON malformato o con riferimenti rotti viene rifiutato
  senza toccare i dati attuali.

---

## Avvio

L'app è gestita da **Vite**. Prima volta (o dopo un clone) installa le dipendenze:

```bash
npm install
```

Dev server con hot-reload:

```bash
npm run dev
# poi apri l'URL stampato da Vite (es. http://localhost:5173)
```

Tieni la finestra del terminale aperta finché usi l'app (`Ctrl+C` per fermare il server).

### Build di produzione

```bash
npm run build      # genera dist/ (+ copia 404.html per il routing SPA su GitHub Pages)
npm run preview    # serve in locale la build di produzione, per verifica finale
```

---

## Sviluppo

### Test

Suite con il runner integrato di Node (nessuna dipendenza esterna):

```bash
npm test          # = node --test (auto-discovery di scripts/tests/**/*.test.js)
```

Coperti MODEL, STORE e IO. La VIEW (DOM) si verifica manualmente nel browser.

### Architettura

Tre layer, dipendenze solo verso il basso:

```
VIEW   (src/view/)   componenti Vue 3, rendering, input — parla solo con lo STORE
STORE  (src/store/)  stato in memoria + persistenza — unico a toccare localStorage
MODEL  (src/model/)  dati puri + funzioni pure — nessuna dipendenza dal browser
```

La logica di reputazione vive **solo** nel MODEL. Lo STORE orchestra
(`dispatch → muta via MODEL → salva → notifica`), la VIEW si limita a disegnare.

| File | Responsabilità |
|------|----------------|
| `src/model/schema.js` | Costanti (`BASE`, `SCHEMA_VERSION`) e costruttori dei dati |
| `src/model/reputation.js` | Logica: `computeScore`, `clampView`, CRUD personaggi/transazioni |
| `src/store/storage.js` | Adattatori storage (localStorage / in-memory per i test) |
| `src/store/io.js` | Serializzazione, validazione, migrazione, parsing import |
| `src/store/store.js` | Stato, `dispatch`, `subscribe`, persistenza |
| `src/view/main.js` | Bootstrap Vue: monta l'app e registra il router |
| `src/view/router.js` | Definizione rotte (vue-router, history mode) |
| `src/view/App.vue` | Layout radice e navigazione |
| `src/view/components/*.vue` | Viste e componenti: matrice, galleria, lista, profilo, modale transazioni |
| `src/view/use*.js` | Composables: accesso allo STORE, stato UI, personaggi visualizzati |

### Formato dati (export/import)

```json
{
  "version": 1,
  "exportedAt": 1749200000000,
  "characters": [
    { "id": "c1", "name": "Aragorn", "deletedAt": null }
  ],
  "transactions": [
    { "id": "t1", "fromId": "c1", "toId": "c2",
      "delta": 10, "name": "salvato in battaglia", "createdAt": 1749100000000 }
  ]
}
```

Il campo `version` consente migrazioni di schema future (`migrate()` in `io.js`).

Documentazione di design e piano implementativo: `docs/features/<NNN-slug>/` (vedi `docs/README.md`).
```
