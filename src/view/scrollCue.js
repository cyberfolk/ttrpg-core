// Direttiva `v-scroll-cue`: su un contenitore scrollabile in orizzontale (es. la
// striscia dei tab su telefono), marca il GENITORE con le classi `sc-more-left` /
// `sc-more-right` a seconda che ci sia altro contenuto oltre i bordi. La CSS le usa
// per mostrare fade + chevron solo dal lato giusto (e nasconderli a fine corsa).
//
//   <div class="ds-seg ds-seg--underline" v-scroll-cue> … </div>

export const vScrollCue = {
  mounted(el) {
    const target = el.parentElement || el;
    const update = () => {
      const moreLeft = el.scrollLeft > 1;
      const moreRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      target.classList.toggle('sc-more-left', moreLeft);
      target.classList.toggle('sc-more-right', moreRight);
    };
    el.__scUpdate = update;
    el.__scTarget = target;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    // Ricalcolo dopo il layout (larghezze dei tab / font caricati).
    requestAnimationFrame(update);
  },
  updated(el) {
    if (el.__scUpdate) el.__scUpdate();
  },
  unmounted(el) {
    if (!el.__scUpdate) return;
    el.removeEventListener('scroll', el.__scUpdate);
    window.removeEventListener('resize', el.__scUpdate);
    if (el.__scTarget) el.__scTarget.classList.remove('sc-more-left', 'sc-more-right');
  },
};
