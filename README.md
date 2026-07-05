# TTRPG Core — Sistema di Reputazione

**App live:** https://cyberfolk.github.io/ttrpg-core/

Web app **locale** (gira nel browser, nessun server) per gestire tool da TTRPG.
Prima feature: **sistema di reputazione tra entità** per Dungeons & Dragons.

La VIEW usa **Vue 3 + Vite + vue-router** (dalla feature 003, vedi ADR 0003). I layer
MODEL e STORE/IO restano **framework-agnostici**: dati puri e funzioni pure, pensati per
una futura migrazione a Python a costo quasi nullo. Il framework tocca solo la VIEW.

---

## Cos'è

Traccia quanto le entità di una campagna si stimano a vicenda. Un'**entità** è un **personaggio** oppure un **gruppo** (fazione, città, gilda…).  
Ogni relazione è **asimmetrica**: quanto A pensa di B è indipendente da quanto B pensa di A (faide unilaterali, cotte non corrisposte…).

Il punteggio non si modifica a mano: si registrano **transazioni** (eventi con un valore positivo o negativo e un motivo). Il punteggio è sempre *derivato*:

```
punteggio(A→B) = clampView( 50 + somma dei delta delle transazioni A→B )
```

- Ogni entità nasce a **50** (`BASE`) verso tutte (somma vuota = 50).
- `clampView` limita il valore mostrato (definizione unica in `src/model/reputation.js`).
- Lo storico delle transazioni è l'unica fonte di verità: il punteggio non è mai salvato, niente disallineamenti.

### Gruppi

Un gruppo ha una lista di **membri** (personaggi) e partecipa alla reputazione in due modi affiancati:

- **nodo diretto** — riceve/dà transazioni come un personaggio;
- **aggregato derivato** — media dei punteggi dei membri *con almeno una transazione* nella direzione considerata (`null` se nessun membro qualificato).

Le transazioni sono **polimorfe**: `fromId`/`toId` può essere un personaggio o un gruppo (UUID globalmente unici; `resolveNode` disambigua).

---

## Come si usa

La navigazione passa dal **drawer** laterale (shell multi-tool; la funzione attiva è **Reputazione**). Dentro Reputazione:

- **Faccia a faccia** (schermata iniziale) — confronta due entità testa a testa: come si considerano reciprocamente, in diretto e in aggregato.
- **Personaggi** — elenco con 2 modi di lettura: **galleria**, **lista**;
- **Profilo personaggio** — storico relazioni in entrata/uscita e gruppi di appartenenza.
- **Gruppi** — elenco gruppi: crea, rinomina, gestisci membri, archivia/ripristina.
- **Profilo gruppo** — membri + i punteggi diretto/aggregato per ogni coppia.

Per registrare un evento: dal punteggio di una relazione si apre il **modale transazioni**
(aggiungi / modifica / elimina delta + motivo); il punteggio si ricalcola al volo.

Cancellazioni: **archiviazione** (soft delete, reversibile) oppure **eliminazione definitiva** (hard delete a cascata sulle transazioni; per un personaggio ripulisce anche
i `memberIds` dei gruppi). Toggle **Mostra archiviati** per *Ripristina* / *Elimina definitivamente* (con conferma).

### Salvataggio e backup

- **Auto-save**: ogni modifica è salvata nel `localStorage` del browser. Ricaricando la pagina i dati restano.
- **Scarica**: esporta tutto in un file JSON (`reputation-AAAAMMGG-hhmm.json`).
- **Carica**: reimporta un file JSON (sostituisce i dati correnti, previa conferma).
  L'import valida il file: JSON malformato o con riferimenti rotti viene rifiutato senza toccare i dati attuali.

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
npm test          # = node --test (auto-discovery di tests/**/*.test.js)
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
| `src/model/schema.js` | Costanti (`BASE`, `SCHEMA_VERSION`) e costruttori dei dati (personaggi, gruppi, transazioni) |
| `src/model/reputation.js` | Logica: `computeScore`, `clampView`, aggregati di gruppo, CRUD entità/transazioni |
| `src/store/storage.js` | Adattatori storage (localStorage / in-memory per i test) |
| `src/store/io.js` | Serializzazione, validazione, migrazione, parsing import |
| `src/store/store.js` | Stato, `dispatch`, `subscribe`, persistenza |
| `src/view/main.js` | Bootstrap Vue: monta l'app e registra il router |
| `src/view/router.js` | Definizione rotte (vue-router, history mode) |
| `src/view/App.vue` | Layout radice, drawer e navigazione |
| `src/view/components/*.vue` | Viste e componenti: faccia-a-faccia, galleria, lista, profili, modale transazioni |
| `src/view/use*.js` | Composables: accesso allo STORE, stato UI, entità visualizzate |

### Formato dati (export/import)

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

Il campo `version` consente migrazioni di schema (`migrate()` in `io.js`).

Decisioni architetturali e note di ricerca: `docs/adr/` e `docs/research/` (indice in
`docs/README.md`).
