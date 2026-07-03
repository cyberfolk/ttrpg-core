# TODO

Tracker prossimo ID: **T002**

---

### [T001] | Gestire casi edge nei dati di esempio
Casi edge-limit iniettati in `datas/sample-state-v2-large.json` da verificare/gestire nella VIEW (rendering, troncamento, escaping, ordinamento, disambiguazione).

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
- 29 membri (stress lista)
