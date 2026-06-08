<template>
  <div class="rep-matrix-wrap">
    <p v-if="chars.length < 2" class="rep-empty">Aggiungi almeno due personaggi.</p>
    <table v-else class="rep-matrix">
      <thead>
        <tr>
          <!-- Corner: "Pensa di" + curved arrow -->
          <th class="corner">
            <span class="rep-matrix__corner-label">Pensa di</span>
            <svg class="rep-matrix__corner-arrow" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.9" stroke-linecap="round"
              stroke-linejoin="round" aria-hidden="true">
              <path d="M6 20 C 6 13, 6.5 9.5, 16 9.5" />
              <path d="M12 5.5 L16 9.5 L12 13.5" />
            </svg>
          </th>
          <th v-for="c in chars" :key="c.id" class="col">{{ c.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="from in chars" :key="from.id">
          <th class="row" @click="goToProfile(from.id)">{{ from.name }}</th>
          <td v-for="to in chars" :key="to.id">
            <span v-if="from.id === to.id" class="diag">—</span>
            <span v-else class="cell"
              :style="{ background: scoreColor(score(from.id, to.id)) }"
              @click="openTx(from.id, to.id)">
              {{ score(from.id, to.id) }}
            </span>
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
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { listActiveCharacters, computeScore } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import TransactionModal from './TransactionModal.vue';

const { state } = useStore();
const ui = useUiState();
const router = useRouter();
const tx = ref(null);

const chars = computed(() => {
  const list = ui.showArchived ? state.value.characters : listActiveCharacters(state.value);
  return list;
});

function score(fromId, toId) {
  return computeScore(state.value, fromId, toId);
}

function openTx(fromId, toId) {
  tx.value = { fromId, toId };
}

function goToProfile(id) {
  router.push({ name: 'profile', params: { id } });
}
</script>
