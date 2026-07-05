# 02 · Modello di reputazione

## Asimmetria

Ogni relazione ha una **direzione**. Quanto A pensa di B (`A→B`) è **indipendente** da quanto B pensa di A (`B→A`). Modella faide unilaterali, cotte non corrisposte, fiducia a senso unico.

## Punteggio derivato, mai salvato

Il punteggio non si imposta a mano e non è persistito: è sempre **calcolato al volo**.

```
punteggio(A→B) = clampView( BASE + Σ delta delle transazioni A→B )
```

- `BASE` = **50**: ogni entità parte da 50 verso tutte (somma vuota = 50).
- `clampView` limita il valore mostrato (definizione unica in `src/model/reputation.js`).
- Lo storico delle transazioni è l'**unica fonte di verità**: impossibile un disallineamento tra un punteggio salvato e le sue cause, perché il punteggio salvato non esiste.

## Transazioni

Si modifica la reputazione registrando **transazioni**: un evento con `delta` (valore positivo o negativo), un `name` (motivo) e `createdAt` (data). Ogni transazione ha un `fromId` e un `toId` (nodi — personaggio o gruppo).

## Gruppo: due punteggi affiancati

Per la coppia (personaggio X, Gruppo G) ci sono **due letture per direzione**, **mai fuse** in un unico numero:

- **diretto** — transazioni verso il gruppo come nodo (`computeScore` su X→G). Significativo solo se esistono transazioni dirette; altrimenti n/d.
- **aggregato (derivato)** — media (arrotondata) dei punteggi dei membri *con almeno una transazione* nella direzione considerata; `null` se nessun membro qualificato. I membri senza relazione sono **esclusi** dalla media.

Le due direzioni (X→G e G→X), ciascuna con diretto + aggregato, danno **4 valori** per coppia.
