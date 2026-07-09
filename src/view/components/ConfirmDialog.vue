<template>
  <!-- Conferma di un'azione distruttiva. Teleportato su <body>: le viste che lo
       montano hanno animazioni con transform, e un antenato con transform
       intrappola il position:fixed dell'overlay (stessa scelta di TransactionModal).
       Sostituisce window.confirm: un modale nativo del browser, nel mezzo di un
       design system committato, è l'unico punto in cui l'app smette di essere
       sé stessa — proprio davanti all'azione irreversibile. -->
  <Teleport to="body">
    <div class="ds-overlay" @click.self="emit('cancel')">
      <div ref="dialogEl" class="ds-dialog ds-dialog--sm" role="alertdialog" aria-modal="true"
        :aria-labelledby="titleId" :aria-describedby="bodyId">
        <div class="ds-dialog__head">
          <h3 class="ds-dialog__title" :id="titleId">{{ title }}</h3>
          <button class="ds-dialog__close" @click="emit('cancel')" aria-label="Chiudi">
            <Icon name="close" />
          </button>
        </div>
        <div class="ds-dialog__body">
          <p :id="bodyId" class="confirm__body"><slot>{{ body }}</slot></p>
        </div>
        <div class="ds-dialog__foot">
          <button ref="cancelBtn" class="ds-btn ds-btn--ghost" @click="emit('cancel')">
            {{ cancelText }}
          </button>
          <button class="ds-btn" :class="danger ? 'ds-btn--danger' : 'ds-btn--primary'"
            @click="emit('confirm')">
            <span v-if="danger" class="ds-btn__icon"><Icon name="trash" /></span>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, useId } from 'vue';
import { useDialog } from '../useDialog.js';
import Icon from './Icon.vue';

const props = defineProps({
  title: { type: String, required: true },
  // Testo del corpo; in alternativa si passa lo slot di default (markup ricco).
  body: { type: String, default: '' },
  confirmText: { type: String, default: 'Conferma' },
  cancelText: { type: String, default: 'Annulla' },
  // L'azione conferma distrugge dati: bottone ember + glifo cestino.
  danger: { type: Boolean, default: true },
});

const emit = defineEmits(['confirm', 'cancel']);

const uid = useId();
const titleId = `${uid}-title`;
const bodyId = `${uid}-body`;
const dialogEl = ref(null);
const cancelBtn = ref(null);

// Montato solo da aperto. Il focus va su «Annulla», mai sull'azione distruttiva:
// un Invio involontario non deve cancellare nulla.
useDialog({
  onClose: () => emit('cancel'),
  container: dialogEl,
  onOpen: () => cancelBtn.value?.focus(),
});
</script>

<style scoped>
.confirm__body { margin: 0; color: var(--text-body); text-wrap: pretty; }
.confirm__body :deep(strong) { color: var(--text-strong); font-weight: var(--fw-bold); }
</style>
