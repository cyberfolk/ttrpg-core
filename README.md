# TTRPG Core — Sistema di Reputazione

**App live:** https://cyberfolk.github.io/ttrpg-core/

Web app **locale** (gira nel browser, nessun server) di tool da TTRPG.  
Feature centrale: un **sistema di reputazione asimmetrica** tra i personaggi e i gruppi di una campagna GDR.

---

## Cos'è

Traccia la **reputazione asimmetrica** tra le entità di una campagna — **personaggi** e **gruppi** (fazioni, città, gilda…).   
Ogni relazione A→B è indipendente da B→A; il punteggio non si imposta a mano, è *derivato* dalle transazioni che registri.

---

## Come si usa

La navigazione passa dal **drawer** laterale (shell multi-tool; la funzione attiva è **Reputazione**). Dentro Reputazione:

- **Faccia a faccia** (schermata iniziale) — confronta due entità testa a testa: come si considerano reciprocamente, in diretto e in aggregato.
- **Personaggi** — elenco in **galleria** o **lista**.
- **Profilo personaggio** — storico relazioni in entrata/uscita e gruppi di appartenenza.
- **Gruppi** — elenco gruppi: crea, rinomina, gestisci membri, archivia/ripristina.
- **Profilo gruppo** — membri + i punteggi diretto/aggregato per ogni coppia.

Per registrare un evento: dal punteggio di una relazione si apre il **modale transazioni** (aggiungi / modifica / elimina delta + motivo); il punteggio si ricalcola al volo.

Cancellazioni: **archiviazione** (soft delete, reversibile) oppure **eliminazione definitiva** (hard delete, con conferma).  
Toggle **Mostra archiviati** per *Ripristina* / *Elimina definitivamente*.

### Salvataggio e backup

- **Auto-save**: ogni modifica è salvata nel browser (`localStorage`). Ricaricando la pagina i dati restano.
- **Scarica** / **Carica**: esporta o reimporta tutto in un file JSON (l'import valida e rifiuta file rotti senza toccare i dati correnti).

---

## Approfondimenti

- **Requisiti funzionali** (modello, entità, gruppi, viste, flussi, formato dati) → [`docs/requisiti-funzionali/`](docs/requisiti-funzionali/)
- **Sviluppo** (avvio, build, test, architettura) → `CLAUDE.md`
- **Decisioni architetturali** e note di ricerca → [`docs/adr/`](docs/adr/) e [`docs/research/`](docs/research/)
