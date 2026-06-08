<template>
  <div>
    <p v-if="rows.length === 0" class="rep-empty">Nessuna relazione.</p>
    <div v-else>
      <div v-for="row in rows" :key="row.other.id"
        class="rep-relation"
        role="button" tabindex="0"
        @click="emitTx(row.other.id)"
        @keydown="(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emitTx(row.other.id); } }">
        <span class="rep-relation__name"
          @click.stop="goToProfile(row.other.id)">
          {{ row.other.name }}
          <Icon name="goto" />
        </span>
        <span class="ds-score"
          :class="{ 'ds-score--interactive': true }"
          :style="{ background: scoreColor(row.score) }"
          @click.stop="emitTx(row.other.id)">
          {{ row.score }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { listActiveCharacters, computeScore } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import Icon from './Icon.vue';

const props = defineProps({
  currentId: { type: String, required: true },
  direction: { type: String, required: true },
});

const emit = defineEmits(['open-tx']);

const { state } = useStore();
const ui = useUiState();
const router = useRouter();

const others = computed(() => {
  const pool = ui.showArchived ? state.value.characters : listActiveCharacters(state.value);
  return pool.filter((c) => c.id !== props.currentId);
});

const rows = computed(() => {
  const mapped = others.value.map((other) => {
    const score = props.direction === 'in'
      ? computeScore(state.value, other.id, props.currentId)
      : computeScore(state.value, props.currentId, other.id);
    return { other, score };
  });
  return [...mapped].sort((a, b) => b.score - a.score);
});

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
