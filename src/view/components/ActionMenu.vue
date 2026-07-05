<template>
  <div class="ds-menu">
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
import { ref } from 'vue';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import { useAnchoredMenu } from '../useAnchoredMenu.js';

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

const triggerEl = ref(null);
const tipEl = ref(null);
const popEl = ref(null);

// Apertura/chiusura, posizione ancorata, dismiss e focus gestiti dal composable.
// onOpen nasconde il tooltip del trigger prima di aprire il menu.
const { open, popStyle, close, toggle } = useAnchoredMenu(triggerEl, popEl, {
  onOpen: () => tipEl.value?.hide(),
});
</script>
