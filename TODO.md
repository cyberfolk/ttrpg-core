# TODO

Tracker prossimo ID: **T003**

---

### [T001] | Gestire casi edge nei dati di esempio
Casi edge-limit dentro a `datas/sample-state-v2-large.json` da verificare/gestire nella VIEW.

**Personaggi** (id prefisso `ed9e`):
- Nome 1 carattere (`Ц`)
- Injection HTML/XSS (`<script>`, `&`, virgolette) → escaping
- Newline + tab nel nome
- Emoji + RTL misto (arabo/ebraico)
- Diacritici combinanti (zalgo/glitch)

**Transazioni** (id prefisso `edf7`):
- delta `9999` → score clampa a 100
- delta `-9999` → score clampa a 1
- delta `0`
- self-loop (`fromId == toId`)
- verso/da personaggio eliminato (Enya)

**Gruppi** (id prefisso `ed9f`):
- Nome + `type` lunghissimi
- `memberIds: []` vuoto (0 membri)
- 1 membro, `type: ""`
- membri duplicati + id fantasma inesistente + membro eliminato
- nome/type con emoji + HTML + membri con nome vuoto/XSS

### [T002] | Tri-stato irraggiungibile nell'ordine di tabulazione
I bottoni «vuoto» e «nessuno» della scheda anagrafica sono attivabili da tastiera
(`@click`), ma non raggiungibili: vivono nella riga del trigger, mentre il popover di
`InlineSelect` è teleportato in coda a `<body>`. Da dentro l'editor, Shift+Tab chiude il
popover e scarica il focus su `<body>`.

Verificato nel browser su `EntitySheet.vue` (campo Allineamento): `Enter` sul bottone
focalizzato via JS salva correttamente (`confirmedEmpty: ["alignment"]`), ma nessun
percorso di Tab ci arriva.

Possibili strade: voci «— da definire» / «— nessuno» in coda alla lista di `InlineSelect`
(che ha già frecce ed Enter), oppure focus containment nel popover con i due bottoni dentro.
