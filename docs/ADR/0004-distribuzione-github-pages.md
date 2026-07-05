# ADR 0004 — Distribuzione: hosting su GitHub Pages, solo-link

Data: 2026-07-05
Stato: Accettato
Ambito: distribuzione / deploy. Non tocca la logica applicativa (MODEL/STORE/VIEW).

## Contesto

L'app va data ad amici con competenze informatiche limitate. Serviva un modo di
distribuzione a **zero attrito**: nessuna installazione, nessuno zip, nessun eseguibile.
In fase prototipo i dati sono locali al browser di ciascuno (`localStorage`), non condivisi.

Vincoli rilevanti:

- L'app è **statica** (nessun backend): un artefatto di soli file serviti.
- I dati vivono in `localStorage` → sono **per-browser**; pubblicare online non li condivide.
- Nessun segreto nel repo (incluse future credenziali cloud), pubblico o privato.

## Decisione

- **Host: GitHub Pages, repo pubblica.** Già su GitHub, zero account nuovi, gratis.
- **Distribuzione: solo link online (hosted).** Niente bundle locale / exe / Electron /
  Tauri / zip: troppi attriti per non-tecnici. Gli amici ricevono un URL e basta.
- **Dati: per-browser (`localStorage`).** Spostamento dati tra dispositivi/persone via i
  bottoni Scarica/Carica (export/import JSON già implementati). Condivisione reale =
  fase cloud futura.
- **Stesso artefatto statico migrabile** a AWS S3 + CloudFront in futuro: questo deploy
  non è lavoro buttato.

Il **meccanismo** di pubblicazione è evoluto: non più "Deploy from branch" (che valeva
per la V1 vanilla senza build), ma **build Vite + GitHub Actions** che pubblica `dist/`
come artifact Pages (vedi ADR 0003 e `.github/workflows/deploy.yml`). La pipeline artifact
non esegue Jekyll, quindi non serve `.nojekyll`.

## Conseguenze

**Positive:**
- Onboarding banale per gli amici: un link, nessuna installazione.
- Gratis, nessuna infrastruttura da gestire; codice già su GitHub.
- Percorso di migrazione al cloud (S3+CloudFront) senza rifare il frontend.

**Negative / trade-off:**
- Repo pubblica → codice sorgente esposto (accettato: nessun segreto nel repo).
- Dati non condivisi tra utenti finché non arriva il backend cloud.
- Nessun dominio custom né auth sul prototipo (URL pubblico; nessun dato sensibile
  lato server perché i dati sono locali).

## Alternative considerate

- **Bundle locale (zip / Electron / Tauri):** scartato, troppo attrito d'installazione
  per non-tecnici.
- **Vercel / Netlify:** validi ma introdurrebbero un account/servizio in più; Pages sfrutta
  il repo GitHub già esistente.
- **Repo privata + Pages:** scartata, complicherebbe l'accesso senza benefici (nessun
  segreto da proteggere, i dati sensibili non stanno sul server).

## Quando rivedere

Quando servisse condivisione reale dei dati o autenticazione (arrivo del backend cloud):
allora l'hosting statico diventa frontend + API, e la scelta S3+CloudFront (o equivalente)
va formalizzata in un nuovo ADR.
