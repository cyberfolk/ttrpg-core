<template>
  <nav v-if="totalPages > 1" class="rep-pager" aria-label="Paginazione">
    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon" :disabled="page === 0"
      @click="$emit('update:page', page - 1)" aria-label="Pagina precedente">
      <Icon name="prev" />
    </button>
    <span class="rep-pager__counter">{{ from }}–{{ to }} / {{ total }}</span>
    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon" :disabled="page >= totalPages - 1"
      @click="$emit('update:page', page + 1)" aria-label="Pagina successiva">
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
});

defineEmits(['update:page']);

const totalPages = computed(() => {
  const pages = Math.max(1, Math.ceil(props.total / props.pageSize));
  return pages;
});

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
.rep-pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}
.rep-pager__counter {
  font-variant-numeric: tabular-nums;
  min-width: 9ch;
  text-align: center;
}
</style>
