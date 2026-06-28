# Migrazione `cf_ded_campaign` → ttrpg-core + scelta backend

> Sorgente: `C:\Users\andre\cyberfolk\odoo_ded\cf_ded_campaign`
> Target: app locale `ttrpg-core` (Vue 3 + Vite, MODEL/STORE/IO framework-agnostici, no server).
> Obiettivo: replicare le feature + decidere come gestire il backend.

---

## 1. Cosa fa davvero il modulo (anatomia)

Sotto l'apparenza Odoo, il modulo è **un grafo relazionale + aritmetica pura D&D 5e**.

### Modello dati (grafo)

```
res.partner (rpg_type: master|player)
   │  pg_ids
   ▼
campaign.pg ──────► campaign.campaign ◄──── (master_id, player_ids)
 (exp, level,           │  session_ids
  race, class)          ▼
                  campaign.session ──────► quest.quest, creature.encounter
                        │  session_pg_ids        (da cf_ded_base)
                        ▼
                  campaign.session.pg   ← riga d'appoggio: calcola l'exp
                  (exp_start/end, ruolo,   guadagnata dal singolo PG nella
                   rp, help, role_exp...)  sessione
```

| Modello                 | Ruolo                                                                       | Note migrazione                       |
|-------------------------|-----------------------------------------------------------------------------|---------------------------------------|
| `campaign.campaign`     | Campagna: nome, descrizione, immagine, master, players, PG, stato, date     | Entità pura. Banale.                  |
| `campaign.pg`           | Personaggio: exp, livello (derivato), razza, classe                         | `level` = funzione pura di `exp`.     |
| `campaign.session`      | Sessione: ~50 campi quasi tutti **computed** (budget exp, scontri, soglia…) | Cuore del calcolo. Vedi §2.           |
| `campaign.session.pg`   | Riga PG↔sessione: exp guadagnata (ruolo/RP/aiuto + comune)                  | Logica per-PG.                        |
| `res.partner` (inherit) | Aggiunge `rpg_type` + `pg_ids`                                              | Diventa una semplice entità `Player`. |

### Logica di calcolo

Tutta in `cf_ded_base/utility/exp.py` — **Python puro, zero dipendenze Odoo**:

- `get_level_by_exp(exp)` — livello da exp (tabella `MAP_LEVEL_EXP_PG`)
- `get_exp_bar(livello)` — exp per salire di livello
- `get_exp_next_level(exp)`
- `get_budget_exp(level_list)` — budget scontri Easy/Medium/Hard/Deadly/Daily del party
- Tabelle dati: `MAP_CR_EXP`, `MAP_QTY_MOD`, `MAP_LEVEL_EXP`, `MAP_LEVEL_EXP_PG`

> **Questo file porta 1:1 nel MODEL di ttrpg-core** (in JS ora, in Python domani — è esattamente lo scenario "traducibile 1:1" del tuo CLAUDE.md).

### Cosa fornisce Odoo (e che dovrai sostituire)

1. **ORM + persistenza Postgres** — salvataggio/query dei record.
2. **Campi computed reattivi** (`@api.depends`) — ricalcolo automatico a cascata. Es. cambi `exp_start` → si ricalcola tutta la catena fino a `liv_end`.
3. **CRUD UI automatica** — form/list/tree generati dalle viste XML. *Questo è il vero regalo di Odoo: zero codice UI.*
4. **`onchange`** — logica UI (es. precompila master dalla campagna).
5. **ACL** (`ir.model.access.csv`) — permessi per gruppo.
6. **`action_confirm`/`action_return_to_draft`** — workflow: conferma sessione → scrive l'exp guadagnata sui PG.

### Widget JS (`FieldPxWidget`)

Banale: formatta un intero come `"<n> px"`. Cosmetico, ignorabile nella migrazione.

---

## 2. La parte tosta: campi computed a cascata

`campaign.session` + `campaign.session.pg` sono una **spreadsheet reattiva**: ~50 valori derivati in catena. In Odoo è gratis (`@api.depends`). Fuori da Odoo hai due strade:

- **A. Compute-on-read (consigliato):** non salvi i derivati. Li calcoli con funzioni pure quando servono (`computeSession(session, pgs)`). Combacia con l'invariante di ttrpg-core
  ("punteggio derivato, mai salvato"). Salvi solo gli input: `exp_start`, percentuali ruolo/rp/aiuto,
  `n_hex_crossed`, difficoltà quest/tesori, encounter scelti.
- **B. Reattività esplicita:** se vuoi viste live, usa il sistema reattivo di Vue (`computed`) nella VIEW, alimentato dalle funzioni pure del MODEL. Niente storage dei derivati.

Solo `action_confirm` ha un **effetto collaterale persistente** (scrive `exp` sul PG): quello sì va salvato, è una transazione di dominio.

---

## 3. La domanda vera: come gestire il backend?

### Premessa — ti serve davvero un server?

Decidi **prima** questo, perché cambia tutto:

| Scenario d'uso                                              | Serve backend?                |
|-------------------------------------------------------------|-------------------------------|
| Solo tu (master), su un PC, dati locali                     | ❌ No                          |
| Tu su più dispositivi (PC + tablet al tavolo)               | ⚠️ Sync, non per forza server |
| I player accedono ai propri PG da remoto, multi-utente live | ✅ Sì                          |

`ttrpg-core` oggi è **locale, single-user, no server, persistenza localStorage + export/import JSON**.
`cf_ded_campaign` è usato di fatto da una persona (il master che fa i conti). **Nel 90% dei casi non ti serve un backend.**

### Le tre opzioni

**Opzione 1 — Nessun backend (porta tutto nel MODEL/STORE locale). ✅ Consigliata per iniziare.**

- `exp.py` → `src/model/exp.js` (funzioni pure, 1:1).
- Entità campaign/pg/session → MODEL + STORE (localStorage), come la reputazione.
- UI: la fai in Vue (è il lavoro che Odoo ti dava gratis — qui lo scrivi tu, ma è UI semplice: form + tabelle).
- Sync multi-device: export/import JSON (già nel tuo `io.js`), o più avanti un file su cloud drive.
- **Pro:** coerente col progetto, zero infra, zero costi, offline, dati tuoi. **Contro:** UI da scrivere, no accesso concorrente.

**Opzione 2 — Odoo come server (quello che hai su AWS).**

- Tieni Odoo, esponi i modelli via JSON-RPC/XML-RPC, la Vue chiama l'API.
- **Pro:** ce l'hai già funzionante; ORM, Postgres, back-office, ACL, report gratis; i computed restano in Python dove sono ora.
- **Contro:** **enorme** per quello che è (poche tabelle + aritmetica); vincola ttrpg-core a un monolite Odoo (contraddice il design "VIEW isolata, MODEL portabile"); costo AWS sempre acceso; upgrade-treadmill Odoo; JSON-RPC di Odoo è verboso e poco web-friendly.

**Opzione 3 — Backend custom tuo (es. FastAPI + SQLite/Postgres).**

- API REST/JSON sottile. **Riusi `exp.py` Python tale e quale** lato server.
- **Pro:** leggero, tu controlli la forma dell'API, fila col piano "MODEL migra a Python" (stesso codice client-proto e server); deployabile ovunque (anche un container piccolo su AWS). **Contro:** infra da mantenere; auth/ACL da scrivere; ha senso solo se serve davvero il multi-utente.

### "Ma un server custom mio non è meglio di Odoo?"

**Sì, se hai deciso che ti serve un server.** Per *questo* dominio:

- Odoo conviene solo se vuoi il **back-office gratis** (gestione utenti, permessi, report PDF, Studio) e non ti pesa il monolite. Qui non sfrutti quasi nulla di Odoo: niente contabilità, niente CRM, niente workflow complessi.
- Un FastAPI sottile vince su **peso, costo, controllo e coerenza architetturale** (il tuo MODEL è già pensato per diventare Python: il server custom riusa le stesse funzioni pure).
- Odoo ti è servito benissimo come **prototipo**: ti ha dato la CRUD UI per modellare il dominio senza scrivere frontend. Ha fatto il suo lavoro. Per il prodotto, non è la scelta naturale.

---

## 4. Raccomandazione

**Percorso a fasi:**

1. **Ora — porta nel locale (Opzione 1).** Migra `exp.py` → MODEL (pure, testabile con `node:test`, TDD come il resto). Modella le entità nello STORE. UI Vue. Niente server. Sync via export/import JSON. Spegni l'esigenza-Odoo per questo modulo.
2. **Solo se/quando serve multiplayer remoto (Opzione 3).** Tira su un FastAPI che **importa lo stesso
   `exp.py` Python** e serve REST. Il MODEL JS del client diventa client dell'API, oppure resta calcolo locale con persistenza remota.
3. **Odoo (Opzione 2): tienilo come back-office/prototipo, non come backend del prodotto.** Lo spegni da AWS quando il dominio è migrato (risparmi il costo dell'istanza sempre accesa).

**In una riga:** non vincolarti a Odoo come server — la logica è banale e già portabile; parti locale, e se un giorno ti serve il server fattelo custom (FastAPI che riusa lo stesso Python), non Odoo.

---

## 5. Checklist migrazione feature (quando passi all'implementazione)

- [ ] `exp.py` → `src/model/exp.js` + test (`get_level_by_exp`, `get_exp_bar`, `get_exp_next_level`, `get_budget_exp` + le 4 tabelle)
- [ ] Entità MODEL: `Campaign`, `Pg`, `Session`, `SessionPg`, `Player`
- [ ] Calcolo sessione = funzioni pure compute-on-read (NON salvare i derivati)
- [ ] Workflow `action_confirm` → transazione che scrive `exp` sui PG (unico stato persistito derivato)
- [ ] STORE: persistenza localStorage + export/import JSON con `version`
- [ ] VIEW Vue: form campagna, form sessione (la "spreadsheet" reattiva), lista PG
- [ ] Ignora: `FieldPxWidget` (cosmetico), `res.partner` inherit → entità `Player` semplice

> Nota: dipende da `quest.quest` e `creature.encounter` (da `cf_ded_base`). Se migri solo le campagne,
> servono almeno stub di quelle entità (o ne rimandi l'integrazione).
