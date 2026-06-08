# Design — Deploy prototipo su GitHub Pages

> ⚠️ **Snapshot storico (feature 002).** I riferimenti a "nessun build / nessun framework"
> fotografano il deploy di allora (app statica vanilla servita da root). Dalla feature 003
> c'è build Vite (`dist/`) + routing SPA con `404.html` (ADR 0003).

Data: 2026-06-06
Stato: approvato (design), in attesa di piano implementativo
Progetto: ttrpg-core — distribuzione del prototipo agli amici (non-tecnici)

---

## 1. Obiettivo

Dare agli amici (competenze informatiche limitate) un modo banale per usare l'app:
**un link**. Nessuna installazione, nessuno zip, nessun eseguibile. In fase prototipo,
con dati locali al browser di ciascuno.

---

## 2. Contesto e decisioni (esito brainstorming)

| Tema | Decisione | Note |
|------|-----------|------|
| Modello dati | **Locali ora, condivisi dopo** | Ogni browser ha i suoi dati (`localStorage`). Condivisione = fase AWS futura |
| Strategia distribuzione | **Solo link online (hosted)** | Niente bundle locale / exe: troppi attriti per non-tecnici |
| Host | **GitHub Pages, repo pubblica** | Già su GitHub, zero account nuovi, gratis, deploy automatico |
| Metodo deploy | **Deploy from branch** (`main`, root) | App statica senza build; no GitHub Actions |
| Modifiche all'app | **Nessuna** | `index.html` in root + path relativi → funziona sotto `/ttrpg-core/` |

Fatti chiave:
- L'app è **statica** (HTML/CSS/JS, nessun backend). Il server locale serviva solo ad
  aggirare il CORS sui moduli ES in sviluppo.
- `localStorage` ⇒ i dati sono **per-browser**; pubblicare online non li condivide.
- I segreti (incluse future credenziali AWS) non vanno mai nel repo, pubblico o privato.
- Lo stesso artefatto statico migrerà a AWS S3+CloudFront in futuro: questo deploy non è
  lavoro buttato.

---

## 3. Approccio

**GitHub Pages in modalità "Deploy from branch"**, sorgente `main` / cartella root.

L'app ha `index.html` nella root del repo e referenzia gli asset con path **relativi**:
```html
<link rel="stylesheet" href="styles/main.css">
<script type="module" src="src/view/app.js"></script>
```
I path relativi risolvono correttamente anche quando il sito è servito sotto il
sottopercorso di progetto `https://cyberfolk.github.io/ttrpg-core/`. **Nessuna modifica
al codice dell'app è necessaria.**

`.nojekyll` nella root disabilita l'elaborazione Jekyll di Pages, che altrimenti ignora
file/cartelle con prefisso `_` e può interferire con siti statici "raw". Buona pratica
anche se oggi nessun file inizia con `_`.

---

## 4. Passi

1. **Repo pubblica** — cambiare visibilità del repository GitHub a public.
2. **`.nojekyll`** — creare un file vuoto `.nojekyll` nella root, committare e pushare.
3. **Abilitare Pages** — Settings → Pages → Source: "Deploy from a branch", branch
   `main`, folder `/ (root)`.
4. **Verifica** — attendere la prima pubblicazione, aprire
   `https://cyberfolk.github.io/ttrpg-core/` e controllare che:
   - la matrice si carichi (moduli ES serviti correttamente, niente errori CORS/404);
   - aggiunta personaggi / transazioni / export / import funzionino;
   - i dati persistano al reload.
5. **README** (opzionale) — aggiungere il link live in cima al README.

---

## 5. Cosa ricevono gli amici

Un URL. Lo aprono nel browser, usano l'app. I dati restano nel loro browser
(`localStorage`). "Spegnere" = chiudere la tab. Per spostare dati tra dispositivi/persone
usano i bottoni **Scarica** / **Carica** (export/import JSON già implementati).

---

## 6. Fuori scope (ora)

- Dominio custom.
- Autenticazione / password gate sul prototipo (URL pubblico; nessun dato sensibile lato
  server perché i dati sono locali).
- Backend / dati condivisi / sincronizzazione (fase AWS).
- Bundle locale offline (zip / Electron / Tauri).
- Pipeline CI/CD con GitHub Actions (il deploy-from-branch basta).

---

## 7. Rischi e mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Path assoluti romperebbero il sito sotto `/ttrpg-core/` | I path sono già relativi; verifica al passo 4 |
| Jekyll altera l'output | `.nojekyll` |
| Tutto il repo è pubblicato (docs, package.json) | Innocuo: solo asset collegati sono raggiungibili; repo già pubblica |
| Cache del browser su aggiornamenti | Hard refresh in verifica; per il prototipo accettabile |
| Esposizione codice sorgente | Accettata: nessun segreto nel repo |
