<template>
  <nav v-if="total > 1" class="rep-recpager" aria-label="Navigazione record">
    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
      type="button" @click="goPrev" aria-label="Record precedente">
      <Icon name="prev" />
    </button>
    <span class="rep-recpager__counter">
      <input v-if="editing" ref="inputRef" class="ds-input rep-recpager__input" type="number"
        min="1" :max="total" :value="index + 1" aria-label="Numero record"
        @change="onCommit" @keyup.enter="onCommit" @blur="onCommit" />
      <button v-else type="button" class="rep-recpager__value" @click="startEdit"
        aria-label="Modifica numero record">{{ index + 1 }}</button>
      <span class="rep-recpager__sep">/ {{ total }}</span>
    </span>
    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
      type="button" @click="goNext" aria-label="Record successivo">
      <Icon name="next" />
    </button>
  </nav>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({
  index: { type: Number, required: true }, // 0-based
  total: { type: Number, required: true },
});

const emit = defineEmits(['update:index']);

const editing = ref(false);
const inputRef = ref(null);

async function startEdit() {
  editing.value = true;
  await nextTick();
  inputRef.value?.select();
}

// Looping: oltre l'ultimo torna al primo e viceversa.
function goPrev() {
  const target = (props.index - 1 + props.total) % props.total;
  emit('update:index', target);
}

function goNext() {
  const target = (props.index + 1) % props.total;
  emit('update:index', target);
}

function onCommit(e) {
  editing.value = false;
  const n = Number(e.target.value);
  if (Number.isNaN(n)) return;
  const clamped = Math.min(props.total, Math.max(1, Math.round(n)));
  if (clamped - 1 !== props.index) emit('update:index', clamped - 1);
}
</script>

<style scoped>
.rep-recpager {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  max-width: 760px; margin: 0 auto 12px;
}
.rep-recpager__counter {
  display: inline-flex; align-items: center; gap: 6px;
  font-variant-numeric: tabular-nums;
}
.rep-recpager__value {
  border: none; background: transparent; cursor: pointer;
  font: inherit; color: var(--text-strong); font-weight: var(--fw-semibold);
  padding: .1rem .35rem; border-radius: var(--radius-sm);
  font-variant-numeric: tabular-nums;
  transition: background var(--dur-fast), box-shadow var(--dur-fast);
}
.rep-recpager__value:hover {
  background: var(--gold-100); box-shadow: inset 0 0 0 1px var(--line-gold);
}
.rep-recpager__input {
  width: 4rem; text-align: center;
}
.rep-recpager__input::-webkit-outer-spin-button,
.rep-recpager__input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.rep-recpager__input { -moz-appearance: textfield; appearance: textfield; }
.rep-recpager__sep { color: var(--text-muted); }
</style>
