# Test di regressione browser — RelationList.vue

Sequenza manuale/assistita (Claude-in-Chrome) per verificare che modifiche future
**non smontino** ciò che ora funziona nei tab relazioni (`Di lui pensano` / `Lui pensa`)
di un profilo personaggio. Copre a11y tastiera, menu Teleport, indicatore filtri,
glifo kind, path mobile.

## Setup

1. Dev server: `npm run dev` → annota la porta (es. `http://localhost:5174/ttrpg-core/`).
2. Apri l'app, vai su un personaggio con relazioni (lista `/personaggi` → click su una card).
   Devi vedere la tabella con colonne `# / Nome / Tipo / Punteggio` + icona colonne, e
   sopra la ricerca con l'icona **imbuto** (filtri).
3. Le coordinate negli step sono indicative (viewport ~1568 largo); rilocalizza con uno
   screenshot se non combaciano.

> Prerequisito dati: il personaggio deve avere almeno una riga relazione. Per i test
> di gruppo serve che esistano gruppi; se non ce ne sono, il glifo sarà sempre "omino"
> (personaggio) — comunque valido per il test del glifo.

---

## 1. Click sul TESTO della voce (filtri) — NON deve chiudere, deve selezionare

Regressione storica: il `focusout` chiudeva la tendina a metà click sul testo.

1. Click sull'icona **imbuto** (filtri) accanto alla ricerca → si apre la tendina con
   `Nascondi righe senza interazioni` / `Nascondi personaggi` / `Nascondi gruppi`.
2. Click sul **testo** di una voce (es. la stringa "Nascondi gruppi", non sul quadratino).
3. **Atteso**: la checkbox si spunta (✓) **e la tendina resta aperta**.

❌ Se la tendina si chiude senza spuntare → regressione del fix `2e28da3`.

## 2. Esc chiude e riporta il focus

1. Con la tendina filtri aperta, premi **Esc**.
2. **Atteso**: tendina chiusa **e** anello di focus visibile attorno all'icona imbuto
   (il focus è tornato al bottone trigger).

## 3. Indicatore filtri attivi (dot)

1. Lascia spuntato un filtro (es. "Nascondi gruppi") e chiudi la tendina.
2. **Atteso**: icona imbuto in **oro** + piccolo **dot** in alto a destra.
   `aria-label`/`title` del bottone diventano "Filtri righe (attivi)".
3. Togli la spunta → dot e oro spariscono.

## 4. Colonne opzionali: toggle "Tipo" → colonna sparisce, glifo compare

1. Click sull'icona **colonne** (in coda all'header della tabella).
2. Click sul **testo** "Tipo" per togliere la spunta.
3. **Atteso**: colonna `Tipo` sparisce; davanti a ogni **nome** compare un **glifo**
   (omino = personaggio, gruppo = gruppo). Icona colonne mostra il **dot** attivo.
4. Ri-spunta "Tipo" → colonna torna, glifo sparisce (niente ridondanza).

## 5. Path mobile (≤480px) — verifica deterministica via JS

Il viewport dello screenshot può non rispettare la `resize_window`; verifica le **regole CSS**.

```js
let mediaColTypeHidden = false, mediaKindIcoShown = false, mediaOptsHidden = false;
for (const sheet of document.styleSheets) {
  let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
  for (const rule of rules) {
    if (rule.type === CSSRule.MEDIA_RULE && rule.conditionText.includes('480')) {
      for (const inner of rule.cssRules) {
        const sel = inner.selectorText || '';
        const decl = inner.style ? inner.style.display : '';
        if (sel.includes('rep-col-type') && decl === 'none') mediaColTypeHidden = true;
        if (sel.includes('rep-col-opts') && decl === 'none') mediaOptsHidden = true;
        if (sel.includes('rep-kind-ico') && decl === 'inline-flex') mediaKindIcoShown = true;
      }
    }
  }
}
({ mediaColTypeHidden, mediaOptsHidden, mediaKindIcoShown });
```

**Atteso**: tutti e tre `true`. Significa: a ≤480px la colonna Tipo e il dropdown colonne
sono nascosti, e il glifo kind è mostrato (il dato kind si sposta, non si perde).

## 6. Semantica a11y delle righe — verifica DOM via JS

```js
const name = document.querySelector('.rep-table__name');
const rowScore = document.querySelector('.rep-table td .ds-score');
const row = document.querySelector('.rep-table__row--clickable');
const th = document.querySelector('th.rep-table__sortable');
({
  name_tag: name?.tagName,                       // atteso: "A"
  name_hasHref: name?.hasAttribute('href'),      // atteso: true
  name_tabIndex: name?.tabIndex,                 // atteso: 0
  rowScore_tag: rowScore?.tagName,               // atteso: "BUTTON"
  rowScore_type: rowScore?.getAttribute('type'), // atteso: "button"
  rowScore_ariaLabel: rowScore?.getAttribute('aria-label'), // atteso: "Registra transazione con ..."
  row_role: row?.getAttribute('role'),           // atteso: null (niente role=button)
  row_tabindex: row?.getAttribute('tabindex'),   // atteso: null
  th_ariaSort: th?.getAttribute('aria-sort'),    // atteso: "ascending" | "descending" | "none"
});
```

⚠️ Nota: `document.querySelector('.ds-score')` da solo pesca il **punteggio sintetico
nell'header del profilo** (uno `<span>` in ProfileView). Per il punteggio di riga usa
sempre il selettore `.rep-table td .ds-score`.

## 7. Navigazione al profilo da tastiera

1. Da JS: `document.querySelector('.rep-table__name').focus()`.
2. Premi **Invio** (tastiera reale).
3. **Atteso**: l'URL cambia in `/personaggio/<altro-id>` (o `/gruppo/<id>` se la riga è un
   gruppo) — il nome è un link reale, navigabile senza mouse.

## 8. Punteggio apre la transazione (mouse + tastiera)

1. Click sul chip **punteggio** di una riga → si apre il modale transazione.
2. Da tastiera: Tab fino al punteggio → **Invio**/**Spazio** apre lo stesso modale.

---

## Esito atteso complessivo

Tutti gli step verdi = harden (commit `73bbd01`), adapt (`e82d934`), polish (`9e7b20d`)
e fix label (`2e28da3`) ancora integri. Qualsiasi rosso indica una regressione su quel
commit.

Affianca sempre: `npm run build` (compila) + `npm test` (70+ test MODEL/STORE/IO verdi)
+ `node .claude/skills/impeccable/scripts/detect.mjs --json src/view/components/RelationList.vue`
(atteso `[]`).
