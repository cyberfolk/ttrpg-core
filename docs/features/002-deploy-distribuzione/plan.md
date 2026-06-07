# Deploy GitHub Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pubblicare il prototipo statico su GitHub Pages, così gli amici lo usano da un semplice link.

**Architecture:** GitHub Pages in modalità "Deploy from branch" (`main`, root). L'app è già statica con `index.html` in root e path relativi → funziona sotto `/ttrpg-core/` senza modifiche al codice. `.nojekyll` disabilita Jekyll.

**Tech Stack:** GitHub Pages (hosting statico). Nessun build, nessun framework, nessuna CI.

**Spec di riferimento:** `docs/features/002-deploy-distribuzione/spec.md`

> **Nota esecuzione:** `gh` CLI NON è installato. I Task 2 e 3 sono azioni nella UI web di GitHub (percorso click fornito), non scriptabili. I Task 1, 4, 5 sono eseguibili da terminale/codice.

---

## File Structure

```
ttrpg-core/
  .nojekyll        // NUOVO — file vuoto, disabilita Jekyll su Pages
  README.md        // MODIFICATO — aggiunge il link live in cima
  index.html       // invariato (già root + path relativi)
```

Nessun file dell'app cambia. Nessun test automatico: la verifica è il sito live (Task 4).

---

## Task 1: Aggiungere `.nojekyll` e pushare

**Files:**
- Create: `.nojekyll`

- [ ] **Step 1: Creare il file vuoto `.nojekyll` nella root del progetto**

Contenuto: file vuoto (0 byte). Da terminale Git Bash:
```bash
cd /c/Users/andre/cyberfolk/ttrpg-core
touch .nojekyll
```
(Oppure crea un file vuoto chiamato esattamente `.nojekyll`, senza estensione.)

- [ ] **Step 2: Verificare che il file esista ed è vuoto**

Run:
```bash
ls -la .nojekyll
```
Expected: il file è elencato, dimensione 0.

- [ ] **Step 3: Commit e push**

```bash
git add .nojekyll
git commit -m "[CHORE] .nojekyll per GitHub Pages"
git push
```
Expected: push su `origin/main` riuscito.

---

## Task 2: Rendere la repo pubblica (UI GitHub — azione manuale)

**Files:** nessuno.

- [ ] **Step 1: Aprire le impostazioni del repository**

Vai a: `https://github.com/cyberfolk/ttrpg-core/settings`

- [ ] **Step 2: Cambiare visibilità**

Scorri fino in fondo → sezione **"Danger Zone"** → **"Change repository visibility"** →
**"Change to public"**. Conferma digitando il nome del repo quando richiesto
(`cyberfolk/ttrpg-core`).

- [ ] **Step 3: Verificare**

In cima alla pagina del repo, accanto al nome, l'etichetta deve dire **Public**.

---

## Task 3: Abilitare GitHub Pages (UI GitHub — azione manuale)

**Files:** nessuno.

- [ ] **Step 1: Aprire le impostazioni Pages**

Vai a: `https://github.com/cyberfolk/ttrpg-core/settings/pages`

- [ ] **Step 2: Configurare la sorgente**

Sotto **"Build and deployment"**:
- **Source:** seleziona **"Deploy from a branch"**.
- **Branch:** seleziona **`main`** e cartella **`/ (root)`**.
- Clicca **Save**.

- [ ] **Step 3: Attendere la prima pubblicazione**

Dopo il Save, GitHub avvia il deploy (1-2 minuti). Ricaricando la pagina Pages compare
in alto: *"Your site is live at https://cyberfolk.github.io/ttrpg-core/"*.

---

## Task 4: Verificare il sito live

**Files:** nessuno.

- [ ] **Step 1: Controllare che la pagina risponda**

Run (dopo che il deploy del Task 3 è completo):
```bash
curl -s -o /dev/null -w "%{http_code}" https://cyberfolk.github.io/ttrpg-core/
```
Expected: `200`.

- [ ] **Step 2: Controllare che i moduli ES siano serviti**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" https://cyberfolk.github.io/ttrpg-core/src/view/app.js
```
Expected: `200` (se `404`, i path o il deploy non sono corretti — vedi nota sotto).

- [ ] **Step 3: Verifica funzionale nel browser**

Apri `https://cyberfolk.github.io/ttrpg-core/` e controlla nell'ordine:
1. La pagina carica senza errori in Console (F12 → Console): nessun 404 su
   `styles/main.css` o `src/view/*.js`, nessun errore CORS sui moduli.
2. Aggiungi 2 personaggi → la matrice appare con celle a 50.
3. Click su una cella → pannello transazioni; aggiungi una transazione → punteggio cambia.
4. Ricarica la pagina → i dati persistono (localStorage).
5. `Scarica` → scarica il JSON. `Carica` → reimporta.

> **Se i moduli danno 404/CORS:** significherebbe path assoluti. Verifica che `index.html`
> usi `href="styles/main.css"` e `src="src/view/app.js"` (relativi, senza `/` iniziale).
> Al momento della stesura sono già relativi, quindi non serve alcuna modifica.

---

## Task 5: Aggiungere il link live al README

**Files:**
- Modify: `README.md` (in cima, dopo il titolo)

- [ ] **Step 1: Aggiungere la riga del link live**

Dopo la prima riga titolo `# TTRPG Core — Sistema di Reputazione`, inserire una riga
vuota e poi:
```markdown
**App live:** https://cyberfolk.github.io/ttrpg-core/
```

- [ ] **Step 2: Commit e push**

```bash
git add README.md
git commit -m "[DOCS] README: link all'app live su GitHub Pages"
git push
```
Expected: push riuscito; ogni push futuro su `main` ripubblica automaticamente il sito.

---

## Self-Review

- **Copertura spec:** §3 approccio → Task 1+3; §4 passi 1-5 → Task 2,3,1,4,5; §5 (link
  amici) → Task 4 produce l'URL; §7 rischio path assoluti → nota in Task 4.
- **Placeholder:** nessuno; tutti i comandi e i percorsi UI sono concreti.
- **Dipendenze tra task:** Task 1 (push `.nojekyll`) prima di Task 3 (così la prima
  pubblicazione include il file). Task 4 dopo che Task 3 è "live". Ordine corretto.
- **Fuori scope confermato:** dominio custom, auth, backend, GitHub Actions — non presenti.

---

## Note di esecuzione

- I Task 2 e 3 li devi fare **tu** nella UI di GitHub (gh CLI assente). In alternativa,
  installa gh (`winget install GitHub.cli`, poi `gh auth login`) e si potranno scriptare:
  - pubblica repo: `gh repo edit cyberfolk/ttrpg-core --visibility public`
  - abilita Pages: `gh api -X POST repos/cyberfolk/ttrpg-core/pages -f source.branch=main -f source.path=/`
- I Task 1, 4 (curl), 5 sono eseguibili da terminale.
