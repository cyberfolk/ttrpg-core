# ADR 0002 — Non anticipare il backend: tenere i seam, niente async ora

Data: 2026-06-07
Stato: Accettato
Ambito: backend/persistenza. Non si applica alla VIEW.

## Contesto

Oggi l'app è tutta frontend con responsabilità separate (MODEL / STORE / VIEW). Direzione
futura possibile: dati su un backend, frontend che fa `fetch`. Domanda: conviene
modificare ora lo sviluppo per facilitare quella migrazione?

I "seam" corretti esistono già:

- **MODEL puro** (`src/model/`): nessuna dipendenza dal browser, traducibile 1:1 in Python
  → può diventare il backend.
- **IO versionato** (`src/store/io.js`): `serializeState`/`parseImport` con campo `version`
  = contratto wire.
- **VIEW parla solo allo STORE**: il punto di cambio resta isolato nello STORE.

Migrazione = cambiare l'adapter dello STORE + bootstrap. MODEL e VIEW non cambiano.

## Decisione

**Non anticipare** la migrazione backend. Tenere i seam attuali. NON introdurre ora:

1. STORE async (`getState`/`dispatch` → Promise)
2. Azioni nominali (`store.addTransaction`) al posto di `dispatch(modelFn)` generico
3. Validazione server-side duplicata

Queste mosse si faranno **quando il backend sarà deciso**, non prima.

## Motivazioni

- **YAGNI.** Async + gestione loading/errori complicano codice che funziona, per una
  migrazione forse mai. localStorage non fallisce e non attende: lo stato async sarebbe
  finto.
- **Async forse inutile pure dopo.** Dati piccoli (pochi PG + transazioni) → si può
  caricare lo stato al bootstrap, lavorare in memoria sync, push periodico. Niente async
  necessario manco col backend.
- **Azioni nominali = perdita di flessibilità.** `dispatch(modelFn)` generico è agnostico;
  spezzarlo accoppia lo STORE alle operazioni concrete + la mappatura REST è speculativa.
- **Validazione duplicata** (JS + Python) = due fonti di verità, drift garantito.

## Conseguenze

**Positive:**
- Nessun costo anticipato. Il codice resta semplice.
- I tre seam (MODEL puro, IO versionato, VIEW→STORE) rendono la migrazione già facile:
  ~una sessione di lavoro quando servirà.

**Negative / trade-off:**
- Al momento della migrazione il refactor sync→async va fatto in blocco sui callsite VIEW.
  Accettato: meglio che pagare complessità ora a vuoto.

## Quando rivedere

Quando il backend diventa deciso (orizzonte < ~3 mesi) o i dati crescono al punto che il
blob unico non scala in rete. Allora: STORE async + adapter HTTP + azioni nominali +
validazione server-side.

| Mossa | Fai ora se... | Rimanda se... |
|-------|---------------|---------------|
| MODEL puro | già fatto | — |
| IO/version | già fatto | — |
| STORE async | backend < ~3 mesi, dati cresceranno | backend vago, dati piccoli |
| Azioni nominali | endpoint già noti | API incerta |
