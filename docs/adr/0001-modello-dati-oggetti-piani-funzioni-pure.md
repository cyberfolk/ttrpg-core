# ADR 0001 — Modello dati: oggetti piani + funzioni pure (no classi)

Data: 2026-06-06
Stato: Accettato

## Contesto

Il modello dati del sistema di reputazione (`src/model/schema.js`,
`src/model/reputation.js`) descrive `Character` e `Transaction` e la logica di
reputazione. Andava scelto come rappresentarli: **classi JS** (istanze con metodi)
oppure **oggetti dati piani + funzioni pure**.

Vincoli rilevanti dal design (vedi
`docs/superpowers/specs/2026-06-06-sistema-reputazione-design.md`):

- Il modello deve essere **traducibile 1:1 in Python** in una fase futura, a costo quasi
  nullo.
- Lo stato è **serializzato in JSON** per `localStorage` e per export/import.
- Update **immutabili**; punteggio **derivato, mai salvato**.
- La logica di reputazione vive **solo nel MODEL** (la VIEW e lo STORE non calcolano).

## Decisione

Modellare con **oggetti dati piani** (struct anemiche: solo campi) e **funzioni pure**
nel MODEL. Costruttori leggeri (`createCharacter`, `createTransaction`) al posto di
costruttori di classe. Nessuna classe JS.

## Motivazioni

1. **Python-ready.** Oggetti piani + funzioni pure mappano dritti su `dataclass` +
   funzioni. Le classi JS (metodi, `this`, ereditarietà) non traducono pulito e
   spingerebbero logica dentro gli oggetti.
2. **Serializzazione.** `JSON.stringify`/`parse` su oggetti piani fa round-trip alla
   stessa forma. Le istanze di classe **perdono il prototipo** nel round-trip JSON →
   servirebbe logica di reidratazione. Con oggetti piani `parseImport` funziona diretto.
3. **Immutabilità + punteggio derivato.** Le funzioni pure ritornano nuovo stato e
   calcolano il punteggio da `state`. Le classi inviterebbero a metodi mutabili
   (`this.score = ...`), contro il design. Un `Character` non possiede il punteggio:
   è derivato dalle transazioni.
4. **La verità è lo stato intero.** `computeScore` opera sull'array transazioni, non su
   un singolo oggetto. Pattern "functional core": dati separati dal comportamento.

## Conseguenze

**Positive:**
- Test banali (input→output, già coperti in `scripts/tests/`).
- Persistenza/export/import senza reidratazione.
- Porting a Python lineare.

**Negative / trade-off:**
- Niente incapsulamento forte: nulla impedisce di costruire un oggetto malformato a mano
  → mitigato da `validateState` all'import (`src/store/io.js`).
- I metodi non sono "scopribili" da un'istanza (IDE autocomplete su `character.`); si
  scoprono via le funzioni del MODEL.

## Alternative considerate

- **Classi JS con metodi:** scartate per serializzazione (perdita prototipo) e attrito
  sul porting Python.
- **Classi + libreria di (de)serializzazione:** scartata, complessità non giustificata
  per il dominio.

## Quando rivedere

Se il dominio crescesse con invarianti complesse da incapsulare e il porting Python
venisse abbandonato, valutare classi o un livello di tipi più ricco (es. TypeScript).
