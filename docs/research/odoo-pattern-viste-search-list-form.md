# Pattern di visualizzazione record in Odoo 17 — Search / List / Form

> Report didattico. Fonte: codebase reale `C:\Users\andre\odoo-17` (framework in `odoo/addons/web/static/src/`).
> Obiettivo: estrarre i pattern di Search/List/Form per riusarli nel progetto **ttrpg-core** (Vue 3 + MODEL/STORE/VIEW).

---

## 0. Il modello mentale di Odoo (perché è rilevante per te)

Odoo separa **3 responsabilità** che mappano quasi 1:1 sui tuoi layer:

| Odoo                                                             | ttrpg-core                                   | Responsabilità                                                   |
|------------------------------------------------------------------|----------------------------------------------|------------------------------------------------------------------|
| `SearchModel` / `RelationalModel` (JS, framework-agnostic logic) | `src/model/` + `src/store/`                  | compone domini, calcola offset/limit, tiene lo stato della query |
| `web_search_read` (Python ORM)                                   | la tua funzione di query sui dati in memoria | applica dominio + ordina + pagina                                |
| `Controller` + `Renderer` (componenti)                           | `src/view/` (Vue)                            | rendering, eventi, niente logica di business                     |

**Insegnamento chiave**: in Odoo la VIEW non calcola mai un dominio né una pagina. Manda eventi (`onUpdate`, `sortBy`, `selectRecord`) a un model che ritorna dati già filtrati/ordinati/paginati. Identico al tuo vincolo "logica solo nel MODEL".

I tre meccanismi che ti interessano sono **disaccoppiati**:

- **Search** produce un *dominio* (struttura dati pura).
- **List** consuma dominio + produce *offset/limit/order*.
- **Form** consuma una *lista di id* (resIds) + un *indice*.

Nessuno dei tre conosce gli altri. Comunicano solo via strutture dati. Questo è il pattern da copiare.

---

## 1. SEARCH VIEW — dominio componibile

### 1.1 Cos'è un "dominio"

Lista di condizioni in **notazione polacca prefissa**. Operatori logici **davanti** agli operandi:

```python
# AND implicito (lista piatta = tutti AND)
[('state', '=', 'draft'), ('active', '=', True)]

# OR esplicito
['|', ('state', '=', 'draft'), ('state', '=', 'sent')]

# (draft OR sent) AND active
['&', '|', ('state', '=', 'draft'), ('state', '=', 'sent'), ('active', '=', True)]

# NOT (unario)
['!', ('archived', '=', True)]
```

Regola arità: `&`/`|` consumano 2 operandi, `!` ne consuma 1. Un operando è una tripla `(campo, operatore, valore)` **oppure** un altro sotto-dominio. Si valuta con uno stack (vedi `domain.js:matchDomain`).

Operatori di confronto disponibili (`domain.js:332-395`):
`=`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `like`, `ilike` (case-insensitive), `=like`/`=ilike` (regex), `child_of` (gerarchia).

**Perché prefissa e non infissa**: è serializzabile come pura lista JSON, valutabile con uno stack, e combinabile per concatenazione senza parsing. Per te significa: un dominio è un dato salvabile/esportabile, non codice.

### 1.2 La classe `Domain` — l'algebra componibile

`web/static/src/core/domain.js`. API che conta:

```javascript
Domain.and([d1, d2, d3])   // combina con &
Domain.or([d1, d2])        // combina con |
Domain.not(d)              // prepende !
new Domain(d).toList(ctx)  // normalizza a forma prefissa valutabile
```

`combine()` (`domain.js:27-61`) concatena gli AST e inserisce l'operatore: niente parsing di stringhe, solo manipolazione di array. **Questo è il cuore della componibilità.**

### 1.3 Definizione dichiarativa (XML) → struttura dati

L'utente non scrive domini. Scrive una **search view dichiarativa**:

```xml

<search>
    <field name="name"/>                                          <!-- ricerca libera -->
    <field name="partner_id" filter_domain="[('partner_id','!=',False)]"/>
    <filter name="draft" string="Bozze" domain="[('state','=','draft')]"/>
    <filter name="archived" string="Archivio" domain="[('active','=',False)]"/>
    <separator/>
    <filter name="by_month" context="{'group_by':'date:month'}"/> <!-- raggruppa -->
    <searchpanel>
        <field name="category_id" type="category" icon="fa-folder"/>
        <field name="tag_ids" type="filter" select="multi" enable_counters="True"/>
    </searchpanel>
</search>
```

`search_arch_parser.js:38-92` traduce ogni nodo in un "search item" tipizzato: `field`, `filter`, `groupBy`, `dateFilter`. Il `SearchModel` li attiva/disattiva e ricalcola il dominio.

### 1.4 LA regola di composizione (il pezzo importante)

`search_model.js:_getDomain()` (1653-1692):

```
DOMINIO FINALE =
    globalDomain
    AND  (item1_gruppoA  OR  item2_gruppoA)     ← stesso gruppo = OR
    AND  (item3_gruppoB  OR  item4_gruppoB)     ← gruppi diversi = AND
    AND  searchPanelDomain
```

- **Item attivi nello stesso gruppo** (es. due click sullo stesso `<filter>` o più valori dello stesso campo) → **OR**.
- **Gruppi diversi** → **AND**.

Esempio concreto: attivo "Bozze" + "Archivio" (gruppi diversi) + cerco partner "Acme":

```python
['&', '&', ('state', '=', 'draft'), ('active', '=', False), ('partner_id', '=', 10)]
```

Attivo invece "Bozze" e "Inviato" (stesso filtro, stesso gruppo):

```python
['|', ('state', '=', 'draft'), ('state', '=', 'sent')]
```

Implementazione: `Domain.or(domini_del_gruppo)` per ogni gruppo, poi `Domain.and(tutti_i_gruppi)`. Due righe.

### 1.5 Facet — la rappresentazione visiva della query

`_getFacets()` (`search_model.js:1694-1768`) produce i "chip" mostrati nella barra di ricerca. Un facet = un gruppo, con `values` (le etichette) e `separator` (`"or"` tra valori dello stesso facet). Cliccare la X su un facet rimuove il gruppo dal dominio. È **solo una proiezione UI del dominio**, non lo stato sorgente.

### 1.6 SearchPanel — filtri laterali a categorie

`<searchpanel>` carica valori dal DB e li mostra come albero/checkbox laterale:

- `type="category"` → many2one, single-select, `[(campo,'=',valore)]` (o `child_of` se gerarchico).
- `type="filter"` → many2many, multi-select, `[(campo,'in',[ids])]`.
- `enable_counters="True"` → mostra conteggio record per valore.

I due si combinano in AND tra loro e in AND col resto (`_getSearchPanelDomain`).

### 1.7 Default e favoriti

- **Default da context**: chiave `search_default_<nome>` attiva un filtro all'apertura; `searchpanel_default_<campo>` preseleziona una categoria (`search_model.js:1444-1464`).
- **Favoriti salvati** (`ir.filters`): dominio + groupBy + ordinamento + context serializzati come record, riattivabili (`search_model.js:2202-2274`). È il "salva questa ricerca".

---

## 2. LIST VIEW — paginazione e ordinamento

### 2.1 Il widget Pager (riusabile ovunque)

`web/static/src/core/pager/pager.js`. Props minime:

```javascript
{
    offset, limit, total, onUpdate
}   // offset 0-based, limit per pagina, total record nel dominio
```

Calcoli (`pager.js:34-52`):

```javascript
minimum = offset + 1                          // "Da" (1-based per UI)
maximum = Math.min(offset + limit, total)     // "A"
value = `${minimum}-${maximum}`             // es. "81-160"
// UI: "81-160 / 240"
```

Navigazione (`pager.js:64-83`): `navigate(±1)` calcola `offset + limit*direction`, con **looping** (oltre la fine torna a 0; prima dell'inizio con limit=1 va all'ultimo). Il range "81-160" è **cliccabile**: scrivi "20-100" e cambi offset *e* limit insieme (`pager.js:104-110`).

Tutto qui: il pager non sa nulla dei dati. Chiama `onUpdate({offset, limit})` e basta.

### 2.2 Binding pager ↔ dati

`list_controller.js:132-156` collega il pager al model:

```javascript
usePager(() => {
    const {count, limit, offset} = this.model.root;
    return {
        offset, limit, total: count,
        onUpdate: async ({offset, limit}) => {
            if (this.editedRecord && !(await this.editedRecord.save())) return; // salva prima
            await this.model.root.load({limit, offset});   // ricarica la pagina
        },
    };
});
```

### 2.3 Come offset/limit arrivano alla query

`relational_model.js:_loadUngroupedList()` (584-595) costruisce i kwargs e chiama l'ORM:

```javascript
this.orm.webSearchRead(resModel, domain, {
    specification, offset, limit, order, count_limit
});
```

Lato Python `web_search_read` (`web/models/models.py:44-66`):

```python
records = self.search_fetch(domain, fields, offset=offset, limit=limit, order=order)
# SQL: ... WHERE <domain> ORDER BY <order> LIMIT <limit> OFFSET <offset>
length = self.search_count(domain) if limit_reached else current_length
return {'length': length, 'records': records}
```

Default limit lista = **80** (`relational_model.js:113`). Configurabile in XML: `<tree limit="50" default_order="name asc, id desc">`.

### 2.4 Ottimizzazione `count_limit` (idea elegante)

Contare *tutti* i record di un dominio enorme è costoso. Odoo stima: se la pagina riempie il `limit` ma non ha raggiunto `count_limit`, mostra `"1-80 / 10000+"` (il `+` = "almeno"). Solo se l'utente clicca il `+` esegue il `search_count` reale (`list_controller.js:153`). **Lazy counting.** Per il tuo dataset in memoria probabilmente non serve, ma il pattern "non calcolare il totale finché non serve" è buono da conoscere.

### 2.5 Ordinamento per colonna

Click sull'header → `list_renderer.js:onClickSortColumn` (1114) → `dynamic_list.js:sortBy` (173-187):

```javascript
sortBy(fieldName)
{
    let orderBy = [...this.orderBy];
    if (orderBy[0]?.name === fieldName) {
        orderBy[0] = {name: fieldName, asc: !orderBy[0].asc};  // stesso campo → toggle
    } else {
        orderBy = orderBy.filter(o => o.name !== fieldName);
        orderBy.unshift({name: fieldName, asc: true});         // nuovo campo → in testa
    }
    return this._load(this.offset, this.limit, orderBy, this.domain);  // ricarica
}
```

`orderBy` è una **lista** (multi-colonna): il campo cliccato va in testa, gli altri restano come tie-breaker.

---

## 3. FORM VIEW — navigazione prev/next dentro la lista

Questo è il meccanismo che ti interessa di più. Si regge su **un'unica idea**: la form non riceve un singolo id, riceve **l'array di id della lista + l'indice corrente**.

### 3.1 La lista passa i suoi id alla form

`list_controller.js:openRecord` (248-269):

```javascript
async
openRecord(record)
{
    if (await record.isDirty()) await record.save();
    const activeIds = this.model.root.records.map(d => d.resId);  // ← id della PAGINA corrente
    this.props.selectRecord(record.resId, {activeIds});
}
```

⚠️ **Nota cruciale**: `activeIds` = id della **pagina corrente** (max `limit` elementi), non di tutto il dataset. Conseguenza: il prev/next nella form naviga solo dentro la pagina da cui sei entrato. Decisione di design da tenere presente (vedi §4.4).

### 3.2 Lo switch list→form propaga `resIds`

`action_service.js` (495-499, 1309-1354): `selectRecord` chiama `switchView("form", { resId, resIds: activeIds })`. Prima di switchare, `clearUncommittedChanges` fa da guardia sulle modifiche pendenti.

### 3.3 La form costruisce il pager da resIds + indice

`form_controller.js` (222-232):

```javascript
usePager(() => {
    if (this.model.root.isNew) return;            // nessun pager su record nuovo
    const resIds = this.model.root.resIds;
    return {
        offset: resIds.indexOf(this.model.root.resId),  // ← INDICE del record corrente
        limit: 1,                                        // form = 1 record per "pagina"
        total: resIds.length,
        onUpdate: ({offset}) => this.onPagerUpdate({offset, resIds}),
    };
});
```

`offset = resIds.indexOf(resId)`, `total = resIds.length`. Il pager mostra "2 / 15". Stesso identico widget della lista, solo con `limit: 1`.

### 3.4 Prev/next carica il record al nuovo indice

`form_controller.js:onPagerUpdate` (358-368):

```javascript
async
onPagerUpdate({offset, resIds})
{
    const dirty = await this.model.root.isDirty();
    if (dirty) {
        return this.model.root.save({nextId: resIds[offset]});  // salva, poi vai
    }
    return this.model.load({resId: resIds[offset]});          // record pulito → carica
}
```

**Guardia sul dirty**: se il record ha modifiche non salvate, salva *prima* di spostarsi (con `nextId` per il salto diretto); altrimenti carica direttamente. Questo evita la perdita di dati silenziosa.

### 3.5 Ritorno alla lista (breadcrumb) preserva lo stato

`form_controller.js` esporta `getLocalState()` con `resId`; `action_service.js:restore` (1363-1393) ripristina la lista riusando quello stato. Risultato: torni alla lista nello scroll/pagina giusti, col record selezionato. Lo stato lista non è ricalcolato da zero.

### 3.6 Anatomia XML della form (per riferimento)

```xml

<form>
    <header>                          <!-- bottoni azione + statusbar -->
        <button name="action_confirm" type="object" class="btn-primary"/>
        <field name="state" widget="statusbar"/>
    </header>
    <sheet>                           <!-- corpo -->
        <div class="oe_button_box">...</div>   <!-- contatori/stat button -->
        <div class="oe_title">
            <h1>
                <field name="name"/>
            </h1>
        </div>
        <group>                         <!-- layout 2 colonne automatico -->
            <group>
                <field name="partner_id"/>
            </group>
            <group>
                <field name="date_order"/>
            </group>
        </group>
        <notebook>                      <!-- tab -->
            <page string="Righe">
                <field name="order_line"/>
            </page>
        </notebook>
    </sheet>
</form>
```

---

## 4. Come portarlo in ttrpg-core (Vue 3 + MODEL/STORE/VIEW)

### 4.1 MODEL — dominio e query come funzioni pure

Nel tuo `src/model/` (traducibile in Python, niente browser) metti l'algebra:

```javascript
// src/model/domain.js — pure, no Vue, no DOM
export const and = (...ds) => ['&'.repeat...];   // o forma annidata
export const or = (...ds) => [...];

export function matchRecord(record, domain) { /* stack eval, vedi Odoo matchDomain */
}

export function queryRecords(records, {domain, order, offset, limit}) {
    const filtered = records.filter(r => matchRecord(r, domain));
    const sorted = sortBy(filtered, order);          // order = [{name, asc}, ...]
    const page = sorted.slice(offset, offset + limit);
    return {records: page, total: filtered.length};  // come web_search_read
}
```

Questa `queryRecords` **è** il tuo `web_search_read`: filtra + ordina + pagina, ritorna `{records, total}`. Tutto il resto (search/list/form) la consuma.

### 4.2 STORE — stato della query (offset/limit/order/domain attivo)

Lo store tiene lo stato mutabile e chiama il model:

```javascript
// src/store/listStore.js
state: {
    domain: [], order
:
    [{name: 'name', asc: true}], offset
:
    0, limit
:
    80
}
get
page()
{
    return queryRecords(allRecords, this.state);
}   // derivato, mai salvato
setPage(offset)
{
    this.state.offset = offset;
}
sortBy(field)
{ /* toggle/unshift come dynamic_list.js */
}
```

Coerente col tuo invariante "punteggio derivato mai salvato": qui la *pagina* è derivata, lo stato sorgente è solo `{domain, order, offset, limit}`.

### 4.3 VIEW — componenti Vue che emettono eventi

Tre componenti, zero logica di business:

- **`<SearchBar>`**: costruisce il dominio dai filtri attivi (delega a `model/domain.js`), emette `update:domain`. Regola OR-nel-gruppo / AND-tra-gruppi presa pari pari da §1.4.
- **`<Pager>`**: porta diretto del widget Odoo. Props `{offset, limit, total}`, emette `update({offset, limit})`. ~30 righe.
- **`<RecordList>`**: mostra `store.page.records`, header cliccabili → `store.sortBy`, in fondo il `<Pager>`.

### 4.4 Form prev/next — la decisione che devi prendere

Il pattern Odoo: la lista passa `resIds` (gli id **della pagina**) + l'indice. Con vue-router (history mode, sei già su quello) hai due strade:

| Strada                              | Come                                                                                                                                     | Trade-off                                                                                            |
|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| **A — stato condiviso (come Odoo)** | la list view salva `resIds` nello store prima di navigare a `/record/:id`; la form legge `resIds` + calcola `index = resIds.indexOf(id)` | semplice, prev/next solo entro pagina caricata; refresh perde resIds (vanno ri-derivati dalla query) |
| **B — derivato dalla query**        | la form ricalcola `resIds = queryRecords(...).records.map(id)` dallo stato query nello store                                             | sopravvive al refresh; prev/next può attraversare le pagine se non applichi offset/limit ai resIds   |

Per te (dataset in memoria, no server) la **B è più robusta**: niente passaggio di array tra route, e puoi navigare l'intero risultato di ricerca, non solo la pagina. Prev/next form:

```javascript
// nella form view
const ids = queryRecords(allRecords, {domain: store.domain, order: store.order}).records.map(r => r.id);
const i = ids.indexOf(currentId);
const goPrev = () => router.push(`/record/${ids[i - 1]}`);  // con guardia su i>0
const goNext = () => router.push(`/record/${ids[i + 1]}`);
```

Riusa lo **stesso `<Pager>`** con `limit:1`, `offset:i`, `total:ids.length`, `onUpdate:({offset})=>router.push(ids[offset])`. Identico a Odoo.

### 4.5 Guardia dirty (se le form saranno editabili)

Replica `onPagerUpdate`: prima di cambiare record, se ci sono modifiche non salvate → salva o chiedi conferma. Con vue-router usa `onBeforeRouteLeave` / `beforeRouteUpdate` come equivalente di `beforeLeave` di Odoo.

---

## 5. Sintesi dei pattern da rubare

1. **Dominio = dato puro** (lista prefissa), non codice. Serializzabile, esportabile, valutabile con stack.
2. **Algebra componibile** (`and`/`or`/`not` su array) invece di concatenare stringhe.
3. **Regola OR-nel-gruppo / AND-tra-gruppi** per i filtri multipli.
4. **Facet = proiezione UI del dominio**, non lo stato sorgente.
5. **Pager generico** `{offset, limit, total, onUpdate}` riusato identico in list (limit=N) e form (limit=1).
6. **`web_search_read` = filtra+ordina+pagina → {records, total}**: un'unica funzione che alimenta tutto.
7. **Lazy count** (`count_limit`): non calcolare il totale finché non serve.
8. **Prev/next form = resIds + indice**: la form naviga una lista di id, non conosce la query.
9. **Guardia dirty** prima di ogni cambio record/pagina.
10. **VIEW emette eventi, MODEL/STORE calcolano**: la VIEW non filtra/ordina/pagina mai.

---

### Indice file Odoo citati

| File                                         | Cosa guardare                                                                                 |
|----------------------------------------------|-----------------------------------------------------------------------------------------------|
| `core/domain.js`                             | `combine/and/or/not` (27-61), operatori (332-395), `matchDomain`                              |
| `search/search_arch_parser.js`               | parsing XML → search items (38-92, 181-258)                                                   |
| `search/search_model.js`                     | `_getDomain` (1653-1692), `_getFacets` (1694-1768), default (1444-1464), favoriti (2202-2274) |
| `core/pager/pager.js`                        | calcoli (34-52), navigate (64-83), update (116-121)                                           |
| `views/list/list_controller.js`              | usePager (132-156), openRecord (248-269)                                                      |
| `views/list/dynamic_list.js`                 | sortBy (173-187)                                                                              |
| `model/relational_model/relational_model.js` | load (185-192), `_loadUngroupedList` (584-595)                                                |
| `web/models/models.py`                       | `web_search_read` (44-66)                                                                     |
| `views/form/form_controller.js`              | usePager (222-232), onPagerUpdate (358-368), beforeLeave (370-377)                            |
| `webclient/actions/action_service.js`        | switchView (1309-1354), `_getViewInfo` (465-505), restore (1363-1393)                         |
