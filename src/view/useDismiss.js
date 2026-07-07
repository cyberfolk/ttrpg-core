import { onMounted, onUnmounted } from 'vue';

// Ciclo di chiusura condiviso per overlay teleportati (combobox m2m, InlineSelect,
// …): chiude su click esterno, scroll/resize del viewport e — se richiesto — Esc.
// Estratto dal boilerplate duplicato di Many2ManyField e InlineSelect.
//
// I trigger/popover usano @click.stop, quindi al listener sul document arrivano
// solo i click ESTERNI. Con posizione fixed, scroll/resize scollegano il popover
// dal trigger → si chiude.
//
// isOpen:     () => boolean, stato aperto/chiuso.
// onDismiss:  () => void, come chiudere (idempotente).
// opts.scrollGuard: ref all'elemento che scrolla internamente: uno scroll che
//                   parte DENTRO di esso non deve chiudere (altrimenti la sua
//                   scrollbar sarebbe inutilizzabile).
// opts.escape: se true, aggiunge un listener keydown su document per Esc. Alcuni
//              componenti gestiscono Esc localmente (keydown sul popover) e non
//              lo vogliono qui.
export function useDismiss(isOpen, onDismiss, opts = {}) {
  const { scrollGuard = null, escape = false } = opts;

  function onDocClick() {
    if (isOpen()) onDismiss();
  }
  function onKeydown(e) {
    if (e.key === 'Escape' && isOpen()) onDismiss();
  }
  function onViewportShift(e) {
    if (!isOpen()) return;
    if (e?.type === 'scroll' && scrollGuard?.value?.contains(e.target)) return;
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
