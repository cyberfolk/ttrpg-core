import { onMounted, onUnmounted } from 'vue';
import { createStructuralResize, containsFocus } from './anchoring.js';

// Ciclo di chiusura condiviso per overlay teleportati (combobox m2m, InlineSelect,
// …): chiude su click esterno, scroll/resize del viewport e — se richiesto — Esc.
// Estratto dal boilerplate duplicato di Many2ManyField e InlineSelect.
//
// I trigger/popover usano @click.stop, quindi al listener sul document arrivano
// solo i click ESTERNI. Con posizione fixed, scroll/resize scollegano il popover
// dal trigger → si chiude.
//
// Eccezione mobile: se il popover ospita il campo a fuoco, lo spostamento del
// viewport è causato dalla tastiera software che si apre — cioè dal popover
// stesso. Chiuderlo lì lo renderebbe inutilizzabile su telefono (il picker si
// chiuderebbe nell'istante in cui la sua ricerca prende il focus). Un resize di
// sola altezza è sempre la tastiera; solo un cambio di larghezza è strutturale.
//
// isOpen:     () => boolean, stato aperto/chiuso.
// onDismiss:  () => void, come chiudere (idempotente).
// opts.scrollGuard: ref all'elemento che scrolla internamente: uno scroll che
//                   parte DENTRO di esso non deve chiudere (altrimenti la sua
//                   scrollbar sarebbe inutilizzabile). Fa anche da riferimento
//                   per la guardia sul focus.
// opts.escape: se true, aggiunge un listener keydown su document per Esc. Alcuni
//              componenti gestiscono Esc localmente (keydown sul popover) e non
//              lo vogliono qui.
export function useDismiss(isOpen, onDismiss, opts = {}) {
  const { scrollGuard = null, escape = false } = opts;
  const isStructuralResize = createStructuralResize();

  function onDocClick() {
    if (isOpen()) onDismiss();
  }
  function onKeydown(e) {
    if (e.key === 'Escape' && isOpen()) onDismiss();
  }
  function onViewportShift(e) {
    if (!isOpen()) return;
    if (e?.type === 'scroll' && scrollGuard?.value?.contains(e.target)) return;
    // Resize di sola altezza col focus dentro il popover = tastiera software.
    if (e?.type === 'resize' && !isStructuralResize() && containsFocus(scrollGuard?.value)) return;
    // Stesso motivo per lo scroll: il browser scrolla la pagina da solo per
    // portare in vista il campo appena messo a fuoco dentro il popover.
    if (e?.type === 'scroll' && containsFocus(scrollGuard?.value)) return;
    onDismiss();
  }

  onMounted(() => {
    document.addEventListener('click', onDocClick);
    if (escape) document.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onViewportShift, true);
    window.addEventListener('resize', onViewportShift);
  });
  onUnmounted(() => {
    document.removeEventListener('click', onDocClick);
    if (escape) document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('scroll', onViewportShift, true);
    window.removeEventListener('resize', onViewportShift);
  });
}
