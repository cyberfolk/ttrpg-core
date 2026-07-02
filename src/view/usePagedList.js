import { ref, computed, toValue, watch } from 'vue';

// Paginazione locale di una lista: numero di pagina + clamp automatico + fetta
// della pagina corrente. È la meccanica comune dietro ogni <Pager> della VIEW
// (personaggi a parte: quelli usano lo stato globale ui.page).
//
// NON decide QUANDO tornare a pagina 0: i trigger (cambio ricerca, ordinamento,
// filtri) dipendono dalla vista, che chiama `reset()` nei propri watch.
//
// @param {number | import('vue').Ref<number> | () => number} total - totale
//        elementi (ref, getter o numero). Alla sua diminuzione la pagina viene
//        riportata all'ultima valida (evita di restare su una pagina vuota).
// @param {number | import('vue').Ref<number> | () => number} pageSize - elementi
//        per pagina (accetta anche ui.pageSize reattivo).
// @returns {{ page, offset, lastPage, reset, paginate }}
export function usePagedList(total, pageSize) {
  const page = ref(0);

  const lastPage = computed(() => {
    const max = Math.max(0, Math.ceil(toValue(total) / toValue(pageSize)) - 1);
    return max;
  });

  const offset = computed(() => {
    const start = page.value * toValue(pageSize);
    return start;
  });

  // Se il totale cala (filtro, archiviazione) e la pagina resta oltre i dati,
  // riporta all'ultima pagina valida.
  watch(() => toValue(total), () => {
    if (page.value > lastPage.value) {
      page.value = lastPage.value;
    }
  });

  function reset() {
    page.value = 0;
  }

  // Fetta della pagina corrente a partire da una lista già ordinata/filtrata.
  function paginate(list) {
    const start = offset.value;
    const slice = list.slice(start, start + toValue(pageSize));
    return slice;
  }

  return { page, offset, lastPage, reset, paginate };
}
