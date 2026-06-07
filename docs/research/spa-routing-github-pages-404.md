# SPA con rotte su GitHub Pages: il problema del 404 (e come risolverlo)

## Il contesto

Un'app **SPA** (Single Page Application, es. Vue/React) con più "pagine" e rotte
diverse esiste in realtà come **un solo file**: `index.html`. È il JavaScript che, una
volta caricato, cambia cosa vedi a schermo. Le "pagine" sono finte: le disegna il JS.

Esempio di rotte:

- `tuosito.com/` → home
- `tuosito.com/personaggi` → lista personaggi
- `tuosito.com/impostazioni` → impostazioni

Nessuna di queste (tranne la prima) è un file vero sul server.

## Cosa succede quando apri un URL

Scrivi un URL → il browser chiede al server: "dammi il file a questo indirizzo".

### Scenario A — entri dalla home (tutto bene)

1. Apri `tuosito.com/` → il server dà `index.html`. ✅
2. Il JS parte.
3. Clicchi "Personaggi" → il JS cambia schermata, l'URL diventa
   `tuosito.com/personaggi`. **Nessuna richiesta al server**, fa tutto il JS. ✅

### Scenario B — apri il link diretto (qui esplode)

1. Apri direttamente `tuosito.com/personaggi` (link condiviso, bookmark, o **F5**
   mentre sei su quella pagina).
2. Il browser chiede al server il file `/personaggi`.
3. Il server cerca un file chiamato `personaggi`... **non esiste** (c'è solo
   `index.html`!).
4. Il server risponde **404 Not Found**. ❌ Pagina di errore.

> **Causa:** il server di GitHub Pages è "stupido": cerca il file esatto. I server veri
> (es. AWS/Nginx) si configurano con una regola *rewrite*: "qualunque indirizzo → dai
> sempre `index.html`, poi pensa il JS". GitHub Pages non permette questa regola.

## I due fix (risolvono lo Scenario B)

Scegline **uno**.

### Fix 1 — hash-routing (URL con `#`)

Gli URL diventano: `tuosito.com/#/personaggi`

Trucco: **tutto ciò che sta dopo `#` il browser NON lo manda al server.** Il server
riceve solo `tuosito.com/` → dà sempre `index.html` ✅. Poi il JS legge la parte dopo
`#` e mostra la pagina giusta.

- Risultato: mai 404.
- Costo: URL più brutti (c'è il cancelletto).
- Config: zero — basta scegliere "hash mode" nel router.

### Fix 2 — copiare `index.html` in `404.html`

GitHub Pages ha una regola: quando non trova un file, prima di arrendersi serve un file
chiamato `404.html` (se esiste).

Trucco: fai in modo che `404.html` sia **una copia identica di `index.html`**. Così:

1. Apri `/personaggi` → il server non trova il file →
2. serve `404.html` (= copia di `index.html`) →
3. `index.html` carica il JS →
4. il JS vede l'URL `/personaggi` e mostra la pagina giusta. ✅

- Risultato: URL puliti (senza `#`) e niente 404.
- Costo: una riga nello script di build che copia il file.

## Sintesi

| Fix | URL | Config |
|-----|-----|--------|
| 1 — hash-routing | `tuosito.com/#/personaggi` (brutto) | zero |
| 2 — copia `404.html` | `tuosito.com/personaggi` (pulito) | 1 riga |

Entrambi fanno funzionare link diretti e refresh, senza perdere funzionalità.

## Nota sull'app attuale

L'app di oggi è **una schermata sola, zero rotte** → questo problema **non la tocca**.
Vale solo se in futuro passa a Vue/React multi-pagina.

## Limite vero di GitHub Pages

Non è il routing: è che Pages serve **solo file statici** (roba client). Niente backend,
niente DB server, niente login server, niente SSR. Per quelli serve AWS, non Pages. Ma
una SPA pura lato client → Pages basta e avanza.
