# Companion browser — cos'è e quanto costa

## Cos'è

Il "companion browser" è una **sessione di browser pilotata da Claude** durante la chat. Apro un URL
locale (es. `http://localhost:8000` o un file mockup), navigo, scatto screenshot, clicco, e **rivedo
il risultato visivo** in tempo reale mentre ragioniamo insieme sul design.

Serve quando la decisione è **visiva**: layout gallery vs lista vs profilo (feature 003). Invece di
descrivere a parole "card a griglia con avatar a sinistra", genero 2-3 varianti HTML/CSS reali, le
apro nel browser, ti mostro gli screenshot affiancati e scegliamo guardando, non immaginando.

### Flusso tipico

1. Genero N mockup statici (HTML+CSS inline, nessun framework, throwaway).
2. Li servo localmente o li apro come file.
3. Scatto screenshot di ciascuno → li vedo e te li descrivo/mostro.
4. Tu scegli / chiedi modifiche → itero sul mockup → nuovo screenshot.
5. La variante vincente diventa input per la spec/ADR della 003.

### Cosa NON è

- Non è l'app vera. Sono mockup usa-e-getta per decidere, non codice di produzione.
- Non sostituisce il brainstorm: lo **alimenta** con materiale visivo.
- Non tocca MODEL/STORE/IO. Pura esplorazione VIEW.

---

## Perché consuma parecchi token

Due voci pesano:

1. **Generazione mockup** — ogni variante HTML/CSS completa è output (token in uscita). 3 varianti
   ricche = molto output.
2. **Screenshot** — ogni immagine rientra in contesto come **input visivo**. Le immagini costano
   token in funzione della risoluzione: una screenshot full-page ad alta risoluzione può valere
   ~1000-1600 token; più screenshot per più iterazioni si sommano in fretta.
3. **Iterazioni** — ogni giro "modifica → nuovo screenshot" ripaga entrambe le voci sopra.

Il moltiplicatore vero è **iterazioni × varianti × screenshot**, non il singolo mockup.

---

## Stima consumo (ordine di grandezza)

Numeri indicativi, per ragionare sul budget — non garanzie.

| Voce                                   | Token stimati (cad.) | Note                                  |
|----------------------------------------|----------------------|---------------------------------------|
| Mockup HTML/CSS generato              | ~800–2.000 output    | dipende da quanto è ricco             |
| Screenshot in contesto                | ~1.000–1.600 input   | scala con risoluzione/dimensione      |
| Giro di iterazione (mod + screenshot) | ~1.500–3.000         | output modifica + nuova immagine      |

### Scenari

- **Leggero** (1 variante, 2 screenshot, 1 iterazione)
  ≈ 1 mockup (~1.500) + 2 screenshot (~3.000) + 1 iter (~2.000) ≈ **~6–7k token**.

- **Medio** (3 varianti, screenshot per ognuna, 2-3 iterazioni sulla vincente)
  ≈ 3 mockup (~4.500) + 4-5 screenshot (~6.000) + 3 iter (~7.000) ≈ **~17–20k token**.

- **Pesante** (3 varianti × 3 viste = gallery/lista/profilo, molte iterazioni)
  facilmente **~40k+ token**.

Per confronto, una decisione **solo testo** (descrivo opzioni a parole, tu scegli) costa
tipicamente **~2-4k token** in tutto.

---

## Come preventivare prima di partire

Stima rapida:

```
token ≈ (varianti × ~1.500)              # generazione mockup
      + (screenshot_totali × ~1.300)     # immagini in contesto
      + (iterazioni × ~2.300)            # giri di modifica
```

Per tenerlo sotto controllo:

- **Fissa un budget** prima ("max 3 varianti, max 2 iterazioni").
- **Una vista alla volta** (prima gallery, poi lista, poi profilo) invece di tutto insieme.
- **Screenshot mirati** (sezione, non full-page) dove basta.
- **Mockup snelli** — palette e spaziatura, non contenuto realistico esaustivo.

---

## Quando conviene vs solo testo

| Situazione                                          | Scelta consigliata |
|-----------------------------------------------------|--------------------|
| Differenze tra layout sono sottili/visive          | Companion browser  |
| Decisione su spaziatura, gerarchia, densità info    | Companion browser  |
| Hai già in testa il layout, serve solo confermarlo  | Solo testo         |
| Budget token stretto                                 | Solo testo         |
| Decisione strutturale (rotte, framework) non estetica| Solo testo         |

Per la 003 (gallery/lista/profilo) la parte visiva è forte → il companion browser **probabilmente
ripaga**, ma con budget fissato (scenario medio ~20k) per non sforare.