<template>
  <section v-if="character" class="profile-view">
    <span v-if="isArchived" class="ribbon">Archiviato</span>

    <nav class="breadcrumb">
      <router-link to="/personaggi">Personaggi</router-link>
      <span> / {{ character.name }}</span>
    </nav>

    <button class="back" @click="goBack">← Indietro</button>

    <header class="profile-header">
      <h2>{{ character.name }}</h2>
      <span class="synthetic" :style="syntheticStyle">
        {{ synthetic === null ? '–' : synthetic }}
      </span>
    </header>

    <div class="tabs">
      <button :class="{ active: tab === 'in' }" @click="tab = 'in'">Di lui pensano</button>
      <button :class="{ active: tab === 'out' }" @click="tab = 'out'">Lui pensa</button>
    </div>

    <RelationList
      :key="tab"
      :current-id="character.id"
      :direction="tab"
      @open-tx="openTx"
    />

    <TransactionModal
      v-if="tx"
      :from-id="tx.fromId"
      :to-id="tx.toId"
      @close="tx = null"
    />
  </section>

  <NotFound v-else />
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { averageIncomingScore } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import RelationList from './RelationList.vue';
import TransactionModal from './TransactionModal.vue';
import NotFound from './NotFound.vue';

const props = defineProps({
  id: { type: String, required: true },
});

const { state } = useStore();
const ui = useUiState();
const router = useRouter();

const tab = ref('in'); // 'in' = entrata (default) ; 'out' = uscita
const tx = ref(null);

const character = computed(() => {
  const found = state.value.characters.find((c) => c.id === props.id);
  const result = found || null;
  return result;
});

const isArchived = computed(() => {
  const archived = character.value !== null && character.value.deletedAt !== null;
  return archived;
});

const synthetic = computed(() => {
  if (character.value === null) {
    return null;
  }
  const value = averageIncomingScore(state.value, character.value.id, ui.showArchived);
  return value;
});

const syntheticStyle = computed(() => {
  if (synthetic.value === null) {
    return 'background:#eee';
  }
  const style = `background:${scoreColor(synthetic.value)}`;
  return style;
});

function goBack() {
  router.push('/personaggi');
}

function openTx(pair) {
  tx.value = pair;
}
</script>
