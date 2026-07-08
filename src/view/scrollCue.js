// Direttiva `v-scroll-cue`: su un contenitore scrollabile in orizzontale (es. la
// striscia dei tab su telefono), marca il GENITORE con le classi `sc-more-left` /
// `sc-more-right` a seconda che ci sia altro contenuto oltre i bordi. La CSS le usa
// per mostrare fade + chevron solo dal lato giusto (e nasconderli a fine corsa).
//
// In più, quando cambia il tab attivo (`.ds-seg__btn.active`), auto-scrolla la
// striscia per portare quel tab in CENTRO. Il browser clampa la corsa ai bordi,
// quindi il primo e l'ultimo tab restano allineati al proprio lato (nessuno scroll
// inutile): solo i tab intermedi vengono davvero centrati.
//
//   <div class="ds-seg ds-seg--underline" v-scroll-cue> … </div>

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const vScrollCue = {
  mounted(el) {
    const target = el.parentElement || el;
    const update = () => {
      const moreLeft = el.scrollLeft > 1;
      const moreRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      target.classList.toggle('sc-more-left', moreLeft);
      target.classList.toggle('sc-more-right', moreRight);
    };
    // Centra il tab attivo nella striscia; no-op se non è cambiato o se non c'è
    // eccedenza da scrollare. La corsa oltre i bordi è clampata dal browser.
    const centerActive = (smooth) => {
      const active = el.querySelector('.ds-seg__btn.active');
      const changed = active && active !== el.__scActive;
      el.__scActive = active;
      if (!changed) return;
      // Scarto tra il centro del tab attivo e il centro della striscia, in
      // coordinate viewport (robusto a prescindere dall'offsetParent).
      const activeRect = active.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const delta = (activeRect.left + activeRect.width / 2) - (elRect.left + el.clientWidth / 2);
      const behavior = smooth && !prefersReducedMotion() ? 'smooth' : 'auto';
      el.scrollBy({ left: delta, behavior });
    };
    el.__scUpdate = update;
    el.__scCenter = centerActive;
    el.__scTarget = target;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    // Ricalcolo dopo il layout (larghezze dei tab / font caricati). Al primo giro
    // il centraggio è senza animazione: non deve sembrare uno scroll spontaneo.
    centerActive(false);
    requestAnimationFrame(() => { update(); centerActive(false); });
  },
  updated(el) {
    if (el.__scUpdate) el.__scUpdate();
    if (el.__scCenter) el.__scCenter(true);
  },
  unmounted(el) {
    if (!el.__scUpdate) return;
    el.removeEventListener('scroll', el.__scUpdate);
    window.removeEventListener('resize', el.__scUpdate);
    if (el.__scTarget) el.__scTarget.classList.remove('sc-more-left', 'sc-more-right');
  },
};
