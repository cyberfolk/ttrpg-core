# TODO

Tracker prossimo ID: **T003**

---

### [T001] | Verifica manuale browser della VIEW 003
La VIEW Vue non ha test automatici (solo MODEL/STORE/IO via `node:test`). Verificare a mano
nel browser: 3 viste (gallery/list/matrix), profilo (tab entrata/uscita, gesto doppio
nome→profilo / riga→modale), ricerca, ordinamento, toggle archiviati, import/export,
routing deep-link + refresh (history mode + 404.html).

### [T002] | TransactionModal: ripulire edit orfani su hard-delete
Concern dalla review finale (non bloccante): se un personaggio viene eliminato
definitivamente mentre la modale transazioni è aperta, il buffer `edits` può conservare
chiavi orfane. Valutare un cleanup/guard. Caso d'uso raro (single-user locale).
