<template>
  <div class="ds-menu" ref="rootEl">
    <HoverTip ref="tipEl" text="Azioni" :tab-index="-1">
      <button ref="triggerEl" type="button"
        class="ds-btn ds-btn--sm ds-btn--secondary ds-menu__trigger"
        :class="{ 'ds-btn--icon': !triggerText }"
        :aria-label="label" aria-haspopup="menu" :aria-expanded="open ? 'true' : 'false'"
        @click.stop="toggle">
        <span v-if="triggerText" class="ds-menu__trigger-text">{{ triggerText }}</span>
        <Icon :name="icon" />
      </button>
    </HoverTip>
    <Teleport to="body">
      <div v-if="open" class="ds-menu__pop" role="menu" ref="popEl"
        :aria-label="label" :style="popStyle" @click.stop>
        <slot :close="close" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';

// Menu "azioni extra" (kebab): trigger a puntini + popover ancorato.
// Il popover e' in Teleport su <body> con posizione fixed calcolata dal rect
// del trigger: la card profilo ha overflow:hidden, in absolute verrebbe clippato
// (stesso motivo dei dropdown di RelationList). Le voci sono nello slot (bottoni
// .ds-menu__item con role="menuitem"); lo slot riceve `close` per chiudere.
defineProps({
  label: { type: String, default: 'Altre azioni' },
  // Se valorizzato, il trigger mostra questo testo accanto all'icona (piu'
  // scopribile del solo glifo). Vuoto = solo icona.
  triggerText: { type: String, default: '' },
  // Glifo del trigger (nome Icon). Default kebab; 'gear' per menu impostazioni.
  icon: { type: String, default: 'more' },
});

const open = ref(false);
const rootEl = ref(null);
const triggerEl = ref(null);
const tipEl = ref(null);
const popEl = ref(null);
const popStyle = ref(null);

// Posizione fixed allineata al bordo destro del trigger, appena sotto di esso.
function floatStyle() {
  const r = triggerEl.value.getBoundingClientRect();
  const style = {
    position: 'fixed',
    top: `${r.bottom + 4}px`,
    right: `${window.innerWidth - r.right}px`,
  };
  return style;
}

async function openMenu() {
  tipEl.value?.hide();
  popStyle.value = floatStyle();
  open.value = true;
  await nextTick();
  const first = popEl.value?.querySelector('[role="menuitem"]');
  if (first) first.focus();
}

// Chiusura intenzionale (toggle, Esc, scelta voce): torna il focus al trigger.
function close() {
  if (!open.value) return;
  open.value = false;
  triggerEl.value?.focus();
}

// Chiusura passiva (click esterno, scroll, resize): non rubare il focus.
function closePassive() {
  open.value = false;
}

function toggle() {
  if (open.value) close();
  else openMenu();
}

function onKeydown(e) {
  if (e.key === 'Escape' && open.value) close();
}

// Click sul trigger/menu usa @click.stop, quindi qui arrivano solo click esterni.
// Con posizione fixed, scroll/resize scollegherebbero il popover dal trigger.
onMounted(() => {
  document.addEventListener('click', closePassive);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('scroll', closePassive, true);
  window.addEventListener('resize', closePassive);
});
onUnmounted(() => {
  document.removeEventListener('click', closePassive);
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('scroll', closePassive, true);
  window.removeEventListener('resize', closePassive);
});
</script>
