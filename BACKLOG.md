# BACKLOG

Il lavoro da fare della repo. Fatta → si cancella. Voci separate da `---`.

Ordinato per **tipo di azione**, non per tema: A blocca il resto, B parte subito su un agente, C le
fa Claude in Chrome, D va progettato prima del codice, E aspetta dati che non ci sono, F sta fuori
da qui, G l'ha rimandato l'utente. Gli id `Snnn` restano: dicono il tema, il gruppo dice cosa serve
per farla. Un gruppo vuoto non ha intestazione.

---

# A - Decisioni tue

## S002 - Tri-stato irraggiungibile nell'ordine di tabulazione (era T002)

I bottoni «vuoto» e «nessuno» della scheda anagrafica sono attivabili da tastiera
(`@click`), ma non raggiungibili: vivono nella riga del trigger, mentre il popover di
`InlineSelect` è teleportato in coda a `<body>`. Da dentro l'editor, Shift+Tab chiude il
popover e scarica il focus su `<body>`.

Verificato nel browser su `EntitySheet.vue` (campo Allineamento): `Enter` sul bottone
focalizzato via JS salva correttamente (`confirmedEmpty: ["alignment"]`), ma nessun
percorso di Tab ci arriva.

Possibili strade: voci «— da definire» / «— nessuno» in coda alla lista di `InlineSelect`
(che ha già frecce ed Enter), oppure focus containment nel popover con i due bottoni dentro.

---

# C - Prove in Chrome

## S001 - Gestire casi edge nei dati di esempio (era T001)

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
