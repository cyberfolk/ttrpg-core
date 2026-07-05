# Requisiti funzionali

Cosa fa l'app, in forma distillata (fonte unica; il README è la versione estesa
user-facing). La matematica dell'invariante sta in `CLAUDE.md` §Invarianti dati.

## Entità

- **Personaggio** — PG o PNG.
- **Gruppo** — contenitore generico (fazione, città, gilda…) con una lista di **membri**
  (personaggi). Nesting non ammesso (un gruppo non contiene gruppi).

Un'**entità** è un personaggio o un gruppo. Le transazioni sono **polimorfe**: `from`/`to`
può essere l'uno o l'altro (`resolveNode` disambigua).

## Modello di reputazione

- Relazione **A→B asimmetrica**: indipendente da B→A.
- Punteggio **derivato, mai salvato**: si modifica solo registrando **transazioni** (delta +
  motivo + data). Lo storico è l'unica fonte di verità.
- Ogni entità parte da **50** (`BASE`) verso tutte.
- **Gruppo** — due punteggi affiancati, **mai fusi**:
  - **diretto** — transazioni verso il gruppo come nodo;
  - **aggregato** — media dei membri *con almeno una transazione* nella direzione (`null`
    se nessuno).

## Viste e navigazione

Shell multi-tool con **drawer** laterale (funzione attiva: Reputazione). Viste:

- **Faccia a faccia** (home) — due entità confrontate testa a testa: come si considerano
  reciprocamente, in diretto e in aggregato.
- **Personaggi** — elenco in **galleria** o **lista**.
- **Profilo personaggio** — relazioni in entrata/uscita + gruppi di appartenenza.
- **Gruppi** — elenco: crea, rinomina, tipo, gestione membri, archivia/ripristina.
- **Profilo gruppo** — membri + punteggi diretto/aggregato per coppia.

## Flussi chiave

- **Registra transazione** — dal punteggio di una relazione si apre un modale
  (aggiungi / modifica / elimina delta + motivo); il punteggio si ricalcola al volo.
- **Cancellazione** — archiviazione (soft delete, reversibile) o eliminazione definitiva
  (hard delete a cascata sulle transazioni; per un personaggio ripulisce anche i `memberIds`
  dei gruppi).
- **Persistenza** — auto-save in `localStorage`; export/import JSON (schema versionato, v2
  con `groups`). L'import valida e rifiuta file rotti senza toccare i dati correnti.
