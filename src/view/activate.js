// Direttiva `v-activate`: rende un elemento "attivabile" da tastiera come un
// bottone. Su Enter o Spazio simula il click nativo, così l'elemento riusa il
// suo stesso handler `@click` (nessuna logica duplicata tra mouse e tastiera).
//
// Uso tipico: righe di tabella o intestazioni con role="button" tabindex="0".
//   <tr role="button" tabindex="0" @click="apri(id)" v-activate>
//
// Guardia `e.target === el`: agisce solo se il tasto parte DALL'elemento stesso,
// non da un figlio. Serve per le righe con input di modifica inline: premere
// Invio nell'input non deve far scattare il click della riga (l'evento risale
// per bubbling fino alla riga, ma `e.target` resta l'input).

const handlers = new WeakMap();

export const vActivate = {
  mounted(el) {
    const onKeydown = (e) => {
      if (e.target !== el) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    };
    handlers.set(el, onKeydown);
    el.addEventListener('keydown', onKeydown);
  },
  unmounted(el) {
    const onKeydown = handlers.get(el);
    if (onKeydown) {
      el.removeEventListener('keydown', onKeydown);
      handlers.delete(el);
    }
  },
};
