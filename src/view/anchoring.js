// Posizionamento condiviso dei popover teleportati (position:fixed) rispetto al
// loro trigger, tenendoli SEMPRE dentro il viewport. Estratto da Many2ManyField
// (placePicker) per riuso da InlineSelect e chiunque apra un popover ancorato.
//
// - Clamp orizzontale: mai tagliato a destra/sinistra (mobile, trigger vicino al
//   bordo).
// - Flip verticale: se sotto il trigger non c'è spazio sufficiente, apre verso
//   l'alto invece di uscire dal fondo.
// - max-height che riempie lo spazio disponibile (chi lo consuma mette overflow
//   sul contenitore scrollabile).
//
// triggerEl: elemento ancora (per il rect). popEl: box del popover già montato
// (per la larghezza reale; se assente si usa la larghezza del trigger).
// opts.gap: stacco dal trigger (px). opts.margin: margine minimo dai bordi (px).
// opts.cap: tetto della max-height (px). opts.align: 'left' (default) | 'right'.
// opts.minWidth: larghezza minima (px), a sua volta clampata al viewport.
export function placeInViewport(triggerEl, popEl, opts = {}) {
  const { gap = 4, margin = 8, cap = 240, align = 'left', minWidth = null } = opts;
  const trg = triggerEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const popW = popEl ? popEl.offsetWidth : trg.width;
  const style = { position: 'fixed' };

  // Orizzontale
  if (align === 'right') {
    let right = vw - trg.right;
    right = Math.min(right, vw - popW - margin);
    right = Math.max(margin, right);
    style.right = `${right}px`;
  } else {
    let left = Math.min(trg.left, vw - popW - margin);
    left = Math.max(margin, left);
    style.left = `${left}px`;
  }
  if (minWidth != null) style.minWidth = `${Math.min(minWidth, vw - 2 * margin)}px`;

  // Verticale: sotto se c'è spazio, altrimenti flip sopra.
  const spaceBelow = vh - trg.bottom - margin;
  const spaceAbove = trg.top - margin;
  const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
  if (openUp) {
    style.bottom = `${vh - trg.top + gap}px`;
    style.maxHeight = `${Math.min(spaceAbove, cap)}px`;
  } else {
    style.top = `${trg.bottom + gap}px`;
    style.maxHeight = `${Math.min(spaceBelow, cap)}px`;
  }
  return style;
}
