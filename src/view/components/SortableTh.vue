<template>
  <th class="rep-table__sortable" :aria-sort="ariaSort" role="button" tabindex="0"
    @click="$emit('sort', col)" v-activate>
    <slot />
    <Icon v-if="sort.key === col" :name="sort.dir === 'asc' ? 'up' : 'down'" />
  </th>
</template>

<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';

// Intestazione di colonna ordinabile: markup + a11y comuni a tutte le tabelle.
// La label è lo slot; l'icona su/giù compare solo sulla colonna attiva.
// Emette `sort` con la chiave di colonna: la vista decide come riordinare.
// Classi extra (es. rep-col--right) passano per attribute fallthrough sul <th>.
const props = defineProps({
  col: { type: String, required: true },
  sort: { type: Object, required: true }, // { key, dir }
});

defineEmits(['sort']);

// Stato di ordinamento per gli screen reader (aria-sort sull'header attivo).
const ariaSort = computed(() => {
  if (props.sort.key !== props.col) return 'none';
  const direction = props.sort.dir === 'asc' ? 'ascending' : 'descending';
  return direction;
});
</script>
