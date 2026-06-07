<template>
  <div class="relation-list">
    <div class="relation-sort">
      <button @click="setSort('name')">Nome {{ sortArrow('name') }}</button>
      <button @click="setSort('score')">Punteggio {{ sortArrow('score') }}</button>
    </div>

    <p v-if="rows.length === 0" class="empty">Nessuna relazione.</p>

    <ul v-else>
      <li v-for="row in rows" :key="row.other.id" class="relation-row">
        <router-link
          class="relation-name"
          :to="{ name: 'profile', params: { id: row.other.id } }"
          @click.stop
        >
          {{ row.other.name }} <span class="goto">↪</span>
        </router-link>
        <span class="relation-score" :style="scoreStyle(row.score)" @click="emitTx(row.other.id)">
          {{ row.score }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { listActiveCharacters, computeScore } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';

const props = defineProps({
  currentId: { type: String, required: true },
  direction: { type: String, required: true }, // 'in' | 'out'
});

const emit = defineEmits(['open-tx']);

const { state } = useStore();
const ui = useUiState();
const sort = ref({ key: 'name', dir: 'asc' });

const others = computed(() => {
  const pool = ui.showArchived ? state.value.characters : listActiveCharacters(state.value);
  const list = pool.filter((c) => c.id !== props.currentId);
  return list;
});

const rows = computed(() => {
  const mapped = others.value.map((other) => {
    const score = props.direction === 'in'
      ? computeScore(state.value, other.id, props.currentId)
      : computeScore(state.value, props.currentId, other.id);
    const row = { other, score };
    return row;
  });
  const dirMul = sort.value.dir === 'asc' ? 1 : -1;
  const sorted = [...mapped].sort((a, b) => {
    if (sort.value.key === 'name') {
      const cmp = a.other.name.localeCompare(b.other.name);
      return cmp * dirMul;
    }
    const cmp = a.score - b.score;
    return cmp * dirMul;
  });
  return sorted;
});

function setSort(key) {
  if (sort.value.key === key) {
    sort.value.dir = sort.value.dir === 'asc' ? 'desc' : 'asc';
    return;
  }
  sort.value = { key, dir: 'asc' };
}

function sortArrow(key) {
  if (sort.value.key !== key) {
    return '';
  }
  const arrow = sort.value.dir === 'asc' ? '▲' : '▼';
  return arrow;
}

function scoreStyle(score) {
  const style = `background:${scoreColor(score)}; cursor:pointer`;
  return style;
}

function emitTx(otherId) {
  const pair = props.direction === 'in'
    ? { fromId: otherId, toId: props.currentId }
    : { fromId: props.currentId, toId: otherId };
  emit('open-tx', pair);
}
</script>
