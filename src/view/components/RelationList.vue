<template>
  <div>
    <p v-if="total === 0" class="rep-empty">Nessuna relazione.</p>
    <template v-else>
      <Pager :page="page" :page-size="PAGE_SIZE" :total="total"
        @update:page="page = $event" />

      <div class="rep-table-wrap rep-table--flush">
        <table class="rep-table">
          <thead>
            <tr>
              <th class="rep-table__num">#</th>
              <th class="rep-table__sortable" role="button" tabindex="0"
                @click="toggleSort('name')"
                @keydown="(e) => onSortKey(e, 'name')">
                Nome
                <Icon v-if="sort.key === 'name'" :name="sort.dir === 'asc' ? 'up' : 'down'" />
              </th>
              <th class="rep-table__sortable" role="button" tabindex="0"
                @click="toggleSort('score')"
                @keydown="(e) => onSortKey(e, 'score')">
                Punteggio
                <Icon v-if="sort.key === 'score'" :name="sort.dir === 'asc' ? 'up' : 'down'" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in pageRows" :key="row.other.id"
              class="rep-table__row--clickable" role="button" tabindex="0"
              @click="emitTx(row.other.id)"
              @keydown="(e) => onRowKey(e, row.other.id)">

              <td class="rep-table__num">{{ offset + i + 1 }}</td>
              <td>
                <span class="rep-table__name" @click.stop="goToProfile(row.other.id)">
                  {{ row.other.name }}
                  <Icon name="goto" />
                </span>
              </td>
              <td>
                <span class="ds-score ds-score--interactive"
                  :style="{ background: scoreColor(row.score) }"
                  @click.stop="emitTx(row.other.id)">
                  {{ row.score }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { listActiveCharacters, computeScore } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import Icon from './Icon.vue';
import Pager from './Pager.vue';

const PAGE_SIZE = 10;

const props = defineProps({
  currentId: { type: String, required: true },
  direction: { type: String, required: true },
});

const emit = defineEmits(['open-tx']);

const { state } = useStore();
const ui = useUiState();
const router = useRouter();

const page = ref(0);
const sort = ref({ key: 'score', dir: 'desc' }); // key: 'name' | 'score'

const others = computed(() => {
  const pool = ui.showArchived ? state.value.characters : listActiveCharacters(state.value);
  const filtered = pool.filter((c) => c.id !== props.currentId);
  return filtered;
});

const sortedRows = computed(() => {
  const mapped = others.value.map((other) => {
    const score = props.direction === 'in'
      ? computeScore(state.value, other.id, props.currentId)
      : computeScore(state.value, props.currentId, other.id);
    return { other, score };
  });
  const { key, dir } = sort.value;
  const sorted = [...mapped].sort((a, b) => {
    const cmp = key === 'name'
      ? a.other.name.localeCompare(b.other.name)
      : a.score - b.score;
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
});

const total = computed(() => sortedRows.value.length);

const offset = computed(() => page.value * PAGE_SIZE);

const pageRows = computed(() => {
  const start = offset.value;
  const slice = sortedRows.value.slice(start, start + PAGE_SIZE);
  return slice;
});

function toggleSort(key) {
  if (sort.value.key === key) {
    const nextDir = sort.value.dir === 'asc' ? 'desc' : 'asc';
    sort.value = { key, dir: nextDir };
  } else {
    // nuovo campo: nome parte asc (A→Z), punteggio parte desc (alto→basso)
    sort.value = { key, dir: key === 'name' ? 'asc' : 'desc' };
  }
  page.value = 0;
}

function onSortKey(e, key) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort(key); }
}

function onRowKey(e, otherId) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emitTx(otherId); }
}

function emitTx(otherId) {
  const pair = props.direction === 'in'
    ? { fromId: otherId, toId: props.currentId }
    : { fromId: props.currentId, toId: otherId };
  emit('open-tx', pair);
}

function goToProfile(id) {
  router.push({ name: 'profile', params: { id } });
}
</script>

<style scoped>
.rep-table__sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
</style>
