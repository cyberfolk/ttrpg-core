# Ricerca — MODEL funzionale vs classi OOP (e migrazione Python)

Data: 2026-06-10
Stato: ricerca / pre-brainstorm 005

## Domanda

Introducendo i Gruppi (fazioni / centri abitati) come nuove entità, ha senso passare a un
MODEL a oggetti (classi JS)? E in una futura migrazione a un backend Python conviene l'OOP,
l'ereditarietà multipla, le interfacce? Un DB relazionale o non relazionale?

Il `CLAUDE.md` di progetto impone il MODEL come "dati puri + funzioni pure, traducibile 1:1
in Python". Questa nota verifica quella scelta invece di darla per scontata.

## 1. "Traducibile 1:1 in Python": cosa significa davvero

La frase, presa alla lettera, è fuorviante: un port reale non è mai riga-per-riga. È un
**obiettivo pratico**, non una promessa: tenere la logica in una forma che si porta in modo
**meccanico** invece di richiedere un redesign.

Ciò che è davvero difficile da portare è il **comportamento specifico del linguaggio**:
getter/setter, prototipi, binding di `this`, le stranezze delle classi JS. Dati semplici
(`{ id, name, ... }`) + funzioni che prendono lo stato e ne restituiscono uno nuovo non hanno
quasi nulla di tutto ciò: `computeScore(state, a, b)` → `compute_score(state, a, b)`, stessa
forma. Una classe JS con metodi ed ereditarietà, invece, in Python la **ridisegni**, non la
traduci.

Punto chiave: **JS funzionale ora NON obbliga Python funzionale dopo.** Sono indipendenti.
Un futuro backend Python può essere tranquillamente OOP avvolgendo gli stessi dati in
`@dataclass` / classi ricche. Lo stile funzionale di oggi tiene semplice il codice attuale e
lascia aperte entrambe le strade.

## 2. Vantaggi reali che le classi darebbero (qui)

1. **Ergonomia di lettura.** `gruppo.punteggioVerso(x)` si legge meglio di
   `groupDerivedOutgoing(state, gruppo, x)`; metodi attaccati ai dati, autocomplete.
2. **Polimorfismo sul nodo.** Personaggio e Gruppo sono entrambi "nodi di reputazione":
   con le classi `nodo.versoChi(x)` si dispatcha da solo invece di `if (è gruppo) … else …`.
   È l'**unico** punto dove le classi pulirebbero qualcosa di concreto in questo modello
   (gestione `from/to` che può essere personaggio o gruppo).
3. **Invarianti al costruttore.** Una classe può rifiutare di costruire oggetti invalidi —
   ma qui lo fai già con le factory (`createTransaction`, `createCharacter`): stesso risultato
   senza classi.
4. **Familiarità per un eventuale backend OOP** futuro.

## 3. Costi delle classi (in questo progetto)

- **Invitano alla mutazione.** I metodi spingono a modificare l'oggetto sul posto; il modello
  attuale restituisce **nuovo stato** a ogni modifica, e questo tiene in piedi undo/export/import.
- **Minacciano l'invariante "punteggio derivato, mai salvato".** Con un oggetto con stato è
  facile cachare un punteggio in un campo e farlo divergere. Con funzioni pure non c'è proprio
  dove salvarlo.
- **Serializzazione.** Oggetti semplici → JSON diretto (già così con localStorage). Le classi
  vogliono `toJSON` + reidratazione al caricamento.
- **Test più pesanti.** Funzione pura = input→output, niente setup. Oggetto = costruisci,
  porta nello stato giusto, poi verifica.
- **Stile misto.** Il resto del MODEL è funzionale; introdurre classi crea due dialetti.

## 4. Ereditarietà multipla e interfacce (Python futuro)

- **Ereditarietà multipla: non serve.** L'unico polimorfismo richiesto è "personaggio e gruppo
  sono entrambi nodi di reputazione (hanno `id`, possono essere `from`/`to`)". È **una sola
  interfaccia**, non una gerarchia.
- **Interfacce: una sola e leggera.** In Python: `typing.Protocol` (structural) o `ABC`, es.
  `ReputationNode { id }`. Personaggio e Gruppo la soddisfano per **composizione**, non per
  catene di ereditarietà.

## 5. DB relazionale vs non relazionale (Python futuro)

Il dato è un **grafo**: nodi (personaggi, gruppi) + archi (transazioni) + appartenenze.

- **Non relazionale / documento:** salvi lo stato come un JSON, come adesso. Zero attrito,
  continuità totale. Limite: query/aggregati lato-DB scomodi — ma i punteggi si calcolano in
  codice, non nel DB, quindi non è un problema qui.
- **Relazionale:** 4 tabelle — `characters`, `groups`, `transactions`, `group_members` (join).
  Unica complicazione: `fromId`/`toId` puntano a personaggio *o* gruppo → FK polimorfica.

Verdetto: dato piccolo, punteggi derivati in codice → **il non relazionale facilita** (= ciò
che fai già). Il relazionale conviene solo con multi-utente, query complesse o integrità
referenziale forte. YAGNI → JSON.

## 6. Conclusione (decisione presa)

Si **tiene la convenzione funzionale** del MODEL anche per la feature 005.

- Il vantaggio reale e unico delle classi sarebbe il polimorfismo del nodo (§2.2), che si
  risolve con un helper da poche righe (`resolveNode(state, id)`) senza pagarne i costi.
- I motivi per restare funzionali — testabilità e protezione dell'invariante
  "derivato-mai-salvato" — valgono **a prescindere** da qualunque port.
- Un futuro backend Python OOP resta possibile: la scelta non lo preclude.

Se e quando arriverà un backend con stato e logica vera, la scelta OOP si rivaluta allora —
trattandola come cambio di convenzione di progetto (tocca `CLAUDE.md`), non di nascosto.