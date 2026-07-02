import { ref } from 'vue';

// Stato di ordinamento colonne + toggle, condiviso dalle tabelle ordinabili
// (personaggi, gruppi, relazioni). NON contiene il comparatore: l'ordinamento
// vero e proprio resta nella vista, perché i campi e la gestione dei null
// dipendono dal dominio. Qui vive solo la meccanica comune: quale colonna,
// quale direzione, come cambia al click.
//
// La coppia { key, dir } può stare in uno stato locale (default) oppure in un
// ref/computed esterno passato come `model` (es. `ui.sort` globale dei
// personaggi): in quel caso il toggle scrive lì.
//
// @param {Object} opts
// @param {{key:string,dir:'asc'|'desc'}} [opts.initial] - ordinamento iniziale
//        (ignorato se si passa `model`). Default { key:'name', dir:'asc' }.
// @param {import('vue').Ref} [opts.model] - ref/computed writable che tiene lo
//        stato { key, dir }. Se assente, lo stato è locale al composable.
// @param {string[]} [opts.descKeys] - colonne che, da nuove, partono in 'desc'
//        (tipicamente numeri e punteggi). Le altre partono in 'asc'.
// @param {() => void} [opts.onChange] - eseguito dopo ogni cambio ordinamento
//        (es. riportare la paginazione a pagina 0).
export function useSortable(opts = {}) {
  const local = ref(opts.initial ?? { key: 'name', dir: 'asc' });
  const sort = opts.model ?? local;
  const descKeys = opts.descKeys ?? [];

  function defaultDir(key) {
    const dir = descKeys.includes(key) ? 'desc' : 'asc';
    return dir;
  }

  function toggleSort(key) {
    if (sort.value.key === key) {
      // Stessa colonna: inverte la direzione.
      const dir = sort.value.dir === 'asc' ? 'desc' : 'asc';
      sort.value = { key, dir };
    } else {
      // Nuova colonna: parte dalla direzione di default per quel campo.
      const dir = defaultDir(key);
      sort.value = { key, dir };
    }
    if (opts.onChange) opts.onChange();
  }

  return { sort, toggleSort };
}
