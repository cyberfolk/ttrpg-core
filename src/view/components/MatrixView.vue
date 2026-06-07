<template>
  <div class="matrix-view">
    <p v-if="chars.length < 2" class="empty">Aggiungi almeno due personaggi.</p>
    <table v-else class="matrix">
      <thead>
        <tr>
          <th>da \ a</th>
          <th v-for="c in chars" :key="c.id">
            <router-link :to="{ name: 'profile', params: { id: c.id } }">{{ c.name }} ↪</router-link>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="from in chars" :key="from.id">
          <th class="row-head">
            <router-link :to="{ name: 'profile', params: { id: from.id } }">{{ from.name }} ↪</router-link>
          </th>
          <td
            v-for="to in chars"
            :key="to.id"
            :class="from.id === to.id ? 'diagonal' : 'score-cell'"
            :style="from.id === to.id ? '' : cellStyle(from.id, to.id)"
            @click="from.id === to.id ? null : openTx(from.id, to.id)"
          >
            {{ from.id === to.id ? '—' : score(from.id, to.id) }}
          </td>
        </tr>
      </tbody>
    </table>

    <TransactionModal
      v-if="tx"
      :from-id="tx.fromId"
      :to-id="tx.toId"
      @close="tx = null"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { listActiveCharacters, computeScore } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import TransactionModal from './TransactionModal.vue';

const { state } = useStore();
const ui = useUiState();
const tx = ref(null);

const chars = computed(() => {
  const list = ui.showArchived ? state.value.characters : listActiveCharacters(state.value);
  return list;
});

function score(fromId, toId) {
  const value = computeScore(state.value, fromId, toId);
  return value;
}

function cellStyle(fromId, toId) {
  const s = computeScore(state.value, fromId, toId);
  const style = `background:${scoreColor(s)}`;
  return style;
}

function openTx(fromId, toId) {
  tx.value = { fromId, toId };
}
</script>
