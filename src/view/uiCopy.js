// Testi UI condivisi (tooltip, label). Estendibile: aggiungi nuove chiavi qui.
export const SCORE_TIP = "Media dei voti ricevuti dagli altri. Conta solo chi ha espresso almeno un voto.";

export const REPUTATION_HELP = "Ogni personaggio ha un'opinione su ogni altro, da 1 a 100 (di base 50). Le relazioni sono asimmetriche: ciò che A pensa di B è indipendente da ciò che B pensa di A. Ogni transazione, un evento positivo o negativo, alza o abbassa il punteggio. Il punteggio sintetico mostrato è la media dei voti che un personaggio riceve dagli altri.";

// --- Onboarding / stati vuoti -------------------------------------------------
// Testi del flusso di primo accesso: ogni punto morto instrada al passo dopo,
// lungo la catena "campagna vuota → prima relazione". Voce Atlante: sobria,
// competente, il dato prima dell'ornamento.
export const ONBOARD = {
  // Faccia a faccia, campagna vuota (0 personaggi): la schermata iniziale.
  facingZero: {
    title: 'Apri il registro',
    body: 'Qui leggi chi si fida di chi. Aggiungi i personaggi della campagna: ogni relazione parte da 50, poi la muovi registrando cosa succede tra loro.',
    cta: 'Crea il primo personaggio',
  },
  // Faccia a faccia, un solo personaggio: manca il secondo per confrontare.
  facingOne: {
    title: 'Serve un secondo nome',
    body: 'La reputazione è tra due entità. Con un personaggio solo non c\'è nessuno da confrontare: aggiungine un altro.',
    cta: 'Aggiungi un personaggio',
  },
  // Elenco personaggi vuoto: dove la creazione avviene davvero.
  charactersZero: {
    title: 'Nessun personaggio, ancora',
    body: 'I personaggi sono i nodi del tuo grafo di reputazione: PG e PNG che si giudicano a vicenda. Creane uno per cominciare.',
    cta: 'Aggiungi personaggio',
  },
  // Elenco gruppi vuoto: fazioni, città, gilde.
  groupsZero: {
    title: 'Nessun gruppo, ancora',
    body: 'I gruppi raccolgono i personaggi in fazioni, città o gilde, e partecipano alla reputazione come un\'entità a sé. Creane uno per raggrupparli.',
    cta: 'Aggiungi gruppo',
  },
  // Ricerca senza risultati (stato secondario, non primo accesso).
  noResults: {
    title: 'Nessuna corrispondenza',
    body: 'Nessun nome corrisponde alla ricerca. Prova un altro termine o svuota il campo.',
  },
  // Due entità scelte ma nessuna transazione fra loro: l'ultimo passo prima
  // dell'"aha" (il punteggio si muove da 50).
  facingNoLedger: {
    body: 'Nessuna transazione tra loro — entrambi partono da 50.',
    cta: 'Registra la prima transazione',
  },
};
