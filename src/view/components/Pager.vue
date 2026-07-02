<template>
  <nav v-if="totalPages > 1" class="rep-pager" aria-label="Paginazione">
    <span v-if="label" class="rep-pager__label">{{ label }}</span>
    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
      @click="goPrev" aria-label="Pagina precedente">
      <Icon name="prev" />
    </button>
    <span class="rep-pager__counter">{{ from }}–{{ to }} / {{ total }}</span>
    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
      @click="goNext" aria-label="Pagina successiva">
      <Icon name="next" />
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({
  page: { type: Number, required: true },      // 0-based
  pageSize: { type: Number, required: true },
  total: { type: Number, required: true },
  label: { type: String, default: '' },
});

const emit = defineEmits(['update:page']);

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
.rep-pager__label {
  font-family: var(--font-display); font-size: var(--fs-label);
  letter-spacing: var(--ls-caps); text-transform: uppercase;
  color: var(--text-faint); margin-right: 2px;
}
</style>
