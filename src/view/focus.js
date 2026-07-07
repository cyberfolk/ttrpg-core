// Direttiva `v-focus`: al mount mette a fuoco l'elemento e ne seleziona il
// contenuto (se è un campo di testo). Usata dagli input di modifica inline
// (scheda anagrafica, rinomina profilo) per essere pronti a scrivere subito.
//
//   <input v-focus />
//
// `el.select?.()` è no-op sugli elementi senza selezione (es. non-input).

export const vFocus = {
  mounted(el) {
    el.focus();
    el.select?.();
  },
};
