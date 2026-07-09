import { watch, onMounted, onUnmounted, nextTick, toValue } from 'vue';

// Scroll-lock del fondo pagina, con conteggio: due dialog annidati (drawer +
// conferma) non devono sbloccare il body quando si chiude solo quello interno.
let lockDepth = 0;
let previousBodyOverflow = '';

function lockBodyScroll() {
  lockDepth += 1;
  if (lockDepth === 1) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}
function unlockBodyScroll() {
  lockDepth = Math.max(0, lockDepth - 1);
  if (lockDepth === 0) document.body.style.overflow = previousBodyOverflow;
}

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableIn(root) {
  const nodes = [...root.querySelectorAll(FOCUSABLE)]
    .filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
  return nodes;
}

// Comportamento comune a overlay/dialog/drawer: chiusura con Escape e messa a
// fuoco di un elemento all'apertura. Passando `container` si aggiungono le tre
// meccaniche che rendono una superficie davvero *modale*: focus trap sul Tab,
// resto della pagina inerte, scroll di fondo bloccato — più il focus restituito
// a chi ha aperto il dialog. Non rende markup né gestisce lo stato aperto/chiuso:
// quello resta della vista (prop `open`, ref locale, o modale montata da aperta).
//
// @param {Object} opts
// @param {boolean | import('vue').Ref<boolean> | () => boolean} [opts.isOpen]
//        stato aperto. Default `() => true` per le modali montate già aperte
//        (esistono solo mentre sono visibili).
// @param {() => void} opts.onClose - invocata su Escape (se aperta).
// @param {() => boolean} [opts.onEscape] - Escape gerarchico: invocata PRIMA di
//        `onClose`. Se ritorna `true` ha consumato il tasto (tipicamente è uscita
//        da una riga in modifica) e il dialog NON si chiude.
// @param {() => void} [opts.onOpen] - invocata dopo nextTick a ogni apertura
//        (e al mount se già aperta): tipicamente mette a fuoco un campo
//        (`input.focus()` o `input.select()`).
// @param {import('vue').Ref<HTMLElement>} [opts.container] - il nodo del dialog.
//        Presente ⇒ focus trap + inert + scroll-lock + focus restore.
// @param {boolean} [opts.closeOnEscape=true] - disattiva la chiusura con Escape.
export function useDialog(opts = {}) {
  const {
    isOpen = () => true, onClose, onOpen, onEscape,
    container = null, closeOnEscape = true,
  } = opts;

  // Chi ha aperto il dialog: riceve indietro il focus alla chiusura.
  let previouslyFocused = null;
  // Figli di <body> resi inerti all'apertura, da ripristinare alla chiusura.
  let inertedNodes = [];
  let active = false;
  // Ha bloccato *questa* istanza lo scroll? `activate` è async: senza il flag,
  // uno smontaggio immediato scaricherebbe un lock mai preso.
  let lockedByMe = false;

  // Rende inerte tutto ciò che sta fuori dal dialog. Per i dialog teleportati su
  // <body> l'overlay è un figlio diretto di <body>: gli altri figli (#app) vanno
  // inerti. Per i dialog montati dentro #app nessun figlio di <body> è "fuori"
  // dal dialog, quindi non si inertizza nulla e il trap del Tab resta l'unico
  // guardiano — corretto: non esiste un antenato da escludere senza spegnere
  // anche il dialog stesso.
  function applyInert(node) {
    inertedNodes = [...document.body.children]
      .filter((child) => !child.contains(node) && !child.hasAttribute('inert'));
    for (const child of inertedNodes) child.setAttribute('inert', '');
  }
  function releaseInert() {
    for (const child of inertedNodes) child.removeAttribute('inert');
    inertedNodes = [];
  }

  // Tab ciclico entro il dialog: dall'ultimo focusabile si torna al primo.
  function trapTab(e) {
    const root = toValue(container);
    if (!root) return;
    const items = focusableIn(root);
    if (!items.length) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const current = document.activeElement;
    if (e.shiftKey && (current === first || !root.contains(current))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && current === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onKeydown(e) {
    if (!toValue(isOpen)) return;
    if (e.key === 'Tab' && container) {
      trapTab(e);
      return;
    }
    if (e.key !== 'Escape') return;
    // Escape gerarchico: chi ha uno stato interno (una riga in modifica) lo
    // smonta per primo e si tiene il tasto.
    if (onEscape && onEscape()) {
      e.stopPropagation();
      return;
    }
    if (closeOnEscape && onClose) onClose();
  }

  async function activate() {
    if (active) return;
    active = true;
    previouslyFocused = document.activeElement;
    await nextTick();
    if (!active) return; // smontato mentre aspettavamo il nextTick
    const root = toValue(container);
    if (root) {
      applyInert(root);
      lockBodyScroll();
      lockedByMe = true;
    }
    if (onOpen) onOpen();
  }

  function deactivate() {
    if (!active) return;
    active = false;
    releaseInert();
    if (lockedByMe) {
      unlockBodyScroll();
      lockedByMe = false;
    }
    // Il trigger può essere sparito con la sua vista (es. dopo un'eliminazione):
    // in quel caso il focus torna al body senza rumore.
    if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus();
    previouslyFocused = null;
  }

  watch(() => toValue(isOpen), (open) => {
    if (open) activate();
    else deactivate();
  });

  onMounted(() => {
    window.addEventListener('keydown', onKeydown);
    if (toValue(isOpen)) activate();
  });
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    // Le modali montate solo da aperte spariscono senza passare da isOpen=false.
    deactivate();
  });
}
