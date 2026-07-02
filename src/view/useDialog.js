import { watch, onMounted, onUnmounted, nextTick, toValue } from 'vue';

// Comportamento comune a overlay/dialog/drawer: chiusura con Escape e messa a
// fuoco di un elemento all'apertura. Non rende markup né gestisce lo stato
// aperto/chiuso: quello resta della vista (prop `open`, ref locale, o modal
// montata solo da aperta). Qui vive solo la meccanica a11y ripetuta.
//
// @param {Object} opts
// @param {boolean | import('vue').Ref<boolean> | () => boolean} [opts.isOpen]
//        stato aperto. Default `() => true` per le modali montate già aperte
//        (esistono solo mentre sono visibili).
// @param {() => void} opts.onClose - invocata su Escape (se aperta).
// @param {() => void} [opts.onOpen] - invocata dopo nextTick a ogni apertura
//        (e al mount se già aperta): tipicamente mette a fuoco un campo
//        (`input.focus()` o `input.select()`).
// @param {boolean} [opts.closeOnEscape=true] - disattiva la chiusura con Escape.
export function useDialog(opts = {}) {
  const { isOpen = () => true, onClose, onOpen, closeOnEscape = true } = opts;

  async function runOpen() {
    await nextTick();
    if (onOpen) onOpen();
  }

  function onKeydown(e) {
    if (closeOnEscape && e.key === 'Escape' && toValue(isOpen) && onClose) {
      onClose();
    }
  }

  // All'apertura (falso → vero) porta il focus dentro il dialog.
  watch(() => toValue(isOpen), (open) => {
    if (open) runOpen();
  });

  onMounted(() => {
    window.addEventListener('keydown', onKeydown);
    if (toValue(isOpen)) runOpen();
  });
  onUnmounted(() => window.removeEventListener('keydown', onKeydown));
}
