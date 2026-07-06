<template>
  <div class="ds-menu" @mouseenter="onEnter" @mouseleave="onLeave">
    <!-- openOnHover: il menu si apre passando col mouse, quindi niente tooltip
         (sarebbe ridondante e coprirebbe il menu). Altrimenti trigger col tooltip. -->
    <HoverTip v-if="!openOnHover" ref="tipEl" text="Azioni" :tab-index="-1">
      <button ref="triggerEl" type="button"
        class="ds-btn ds-btn--sm ds-btn--secondary ds-menu__trigger"
        :class="{ 'ds-btn--icon': !triggerText }"
        :aria-label="label" aria-haspopup="menu" :aria-expanded="open ? 'true' : 'false'"
        @click.stop="toggle">
        <span v-if="triggerText" class="ds-menu__trigger-text">{{ triggerText }}</span>
        <Icon :name="icon" />
      </button>
    </HoverTip>
    <button v-else ref="triggerEl" type="button"
      class="ds-btn ds-btn--sm ds-btn--secondary ds-menu__trigger"
      :class="{ 'ds-btn--icon': !triggerText }"
      :aria-label="label" aria-haspopup="menu" :aria-expanded="open ? 'true' : 'false'"
      @click.stop="toggle">
      <span v-if="triggerText" class="ds-menu__trigger-text">{{ triggerText }}</span>
      <Icon :name="icon" />
    </button>
    <Teleport to="body">
      <div v-if="open" class="ds-menu__pop" role="menu" ref="popEl"
        :aria-label="label" :style="popStyle" @click.stop
        @mouseenter="onEnter" @mouseleave="onLeave">
        <slot :close="close" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import { useAnchoredMenu } from '../useAnchoredMenu.js';

// Menu "azioni extra" (kebab): trigger a puntini + popover ancorato.
// Il popover e' in Teleport su <body> con posizione fixed calcolata dal rect
// del trigger: la card profilo ha overflow:hidden, in absolute verrebbe clippato
// (stesso motivo dei dropdown di RelationList). Le voci sono nello slot (bottoni
// .ds-menu__item con role="menuitem"); lo slot riceve `close` per chiudere.
const props = defineProps({
  label: { type: String, default: 'Altre azioni' },
  // Se valorizzato, il trigger mostra questo testo accanto all'icona (piu'
  // scopribile del solo glifo). Vuoto = solo icona.
  triggerText: { type: String, default: '' },
  // Glifo del trigger (nome Icon). Default kebab; 'gear' per menu impostazioni.
  icon: { type: String, default: 'more' },
  // Se true: il menu si apre passando col mouse (oltre che al click), senza
  // tooltip. Il click resta per touch/tastiera. Opt-in: le card lo tengono a false.
  openOnHover: { type: Boolean, default: false },
});

const triggerEl = ref(null);
const tipEl = ref(null);
const popEl = ref(null);

// Apertura/chiusura, posizione ancorata, dismiss e focus gestiti dal composable.
// onOpen nasconde il tooltip del trigger prima di aprire il menu.
const { open, popStyle, openMenu, close, closePassive, toggle } = useAnchoredMenu(triggerEl, popEl, {
  onOpen: () => tipEl.value?.hide(),
});

// --- Apertura a hover (opt-in) ---
// Chiusura ritardata: dà il tempo di attraversare il gap trigger→popover senza
// che il menu si chiuda. L'ingresso nel popover annulla la chiusura in coda.
let closeTimer = null;
function cancelClose() {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
}
function onEnter() {
  if (!props.openOnHover) return;
  cancelClose();
  if (!open.value) openMenu(false); // hover non ruba il focus
}
function onLeave() {
  if (!props.openOnHover) return;
  cancelClose();
  closeTimer = setTimeout(() => closePassive(), 130);
}
onUnmounted(cancelClose);
</script>
