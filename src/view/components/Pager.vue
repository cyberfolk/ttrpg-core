<template>
  <nav v-if="totalPages > 1 && !isMobile" class="rep-pager" aria-label="Paginazione">
    <span v-if="label" class="rep-pager__label">{{ label }}</span>
    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
      @click="goPrev" aria-label="Pagina precedente">
      <Icon name="prev" />
    </button>
    <span class="rep-pager__counter">
      <button v-if="!editing" type="button" class="rep-pager__range"
        @click="startEdit" title="Modifica quante righe vedere"
        aria-label="Modifica l'intervallo di righe visualizzate">{{ from }}–{{ to }}</button>
      <input v-else ref="editInput" class="ds-input rep-pager__range-input" type="text"
        v-model="editValue" @keydown.enter="commitEdit" @keydown.escape="cancelEdit"
        @blur="commitEdit" aria-label="Intervallo di righe da visualizzare" />
      <span class="rep-pager__total"> / {{ total }}</span>
    </span>
    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
      @click="goNext" aria-label="Pagina successiva">
      <Icon name="next" />
    </button>
  </nav>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue';
import Icon from './Icon.vue';
import { useIsMobile } from '../useIsMobile.js';

const isMobile = useIsMobile();

const props = defineProps({
  page: { type: Number, required: true },      // 0-based
  pageSize: { type: Number, required: true },
  total: { type: Number, required: true },
  label: { type: String, default: '' },
});

const emit = defineEmits(['update:page', 'update:pageSize']);

// Edit inline dell'intervallo "da–a": l'utente riscrive quante righe vedere
// (es. "1–18" per vederle tutte). Prendo l'ultimo numero come limite superiore.
const editing = ref(false);
const editValue = ref('');
const editInput = ref(null);

async function startEdit() {
  editValue.value = `${from.value}–${to.value}`;
  editing.value = true;
  await nextTick();
  editInput.value?.focus();
  editInput.value?.select();
}

function cancelEdit() {
  editing.value = false;
}

function commitEdit() {
  if (!editing.value) return;
  editing.value = false;
  const nums = (editValue.value.match(/\d+/g) || []).map(Number);
  if (nums.length === 0) return;
  const end = nums[nums.length - 1];
  const start = nums.length > 1 ? nums[0] : 1;
  const size = Math.max(1, end - start + 1);
  const targetPage = Math.max(0, Math.floor((start - 1) / size));
  emit('update:pageSize', size);
  emit('update:page', targetPage);
}

const totalPages = computed(() => {
  const pages = Math.max(1, Math.ceil(props.total / props.pageSize));
  return pages;
});

// Looping: oltre l'ultima pagina torna alla prima e viceversa.
function goPrev() {
  const target = (props.page - 1 + totalPages.value) % totalPages.value;
  emit('update:page', target);
}

function goNext() {
  const target = (props.page + 1) % totalPages.value;
  emit('update:page', target);
}

const from = computed(() => {
  const value = props.total === 0 ? 0 : props.page * props.pageSize + 1;
  return value;
});

const to = computed(() => {
  const value = Math.min((props.page + 1) * props.pageSize, props.total);
  return value;
});
</script>

<style scoped>
/* Meta-strip: agganciato sopra l'header di tabella, non una riga isolata. */
.rep-pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-block: 0 .45rem;
}
.rep-pager__counter {
  font-variant-numeric: tabular-nums;
  min-width: 9ch;
  text-align: center;
}
/* Range "da–a" editabile: sembra testo ma è un bottone (sottolineatura punteggiata
   come affordance "clicca per cambiare quante righe vedere"). */
.rep-pager__range {
  appearance: none;
  background: transparent;
  border: none;
  padding: 0 2px;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-variant-numeric: tabular-nums;
  transition: color var(--dur-fast);
}
.rep-pager__range:hover { color: var(--accent-text); }
.rep-pager__range:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.ds-input.rep-pager__range-input {
  width: 6ch;
  padding: 0 4px;
  min-height: 0;
  line-height: 1.4;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.rep-pager__label {
  font-family: var(--font-display); font-size: var(--fs-label);
  letter-spacing: var(--ls-caps); text-transform: uppercase;
  color: var(--text-faint); margin-right: 2px;
}
</style>
