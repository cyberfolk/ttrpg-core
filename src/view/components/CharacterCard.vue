<template>
  <div class="character-card" :class="{ archived: isArchived }">
    <span v-if="isArchived" class="ribbon">Archiviato</span>

    <router-link class="card-name" :to="{ name: 'profile', params: { id: char.id } }">
      {{ char.name }} <span class="goto">↪</span>
    </router-link>

    <div class="card-score" :style="scoreStyle">
      {{ score === null ? '–' : score }}
    </div>

    <div class="card-actions">
      <button v-if="!isArchived" @click="onArchive">Archivia</button>
      <template v-else>
        <button @click="onRestore">Ripristina</button>
        <button @click="onHardDelete">Elimina definitivo</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from '../useStore.js';
import { scoreColor } from '../scoreColor.js';
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter } from '../../model/reputation.js';

const props = defineProps({
  char: { type: Object, required: true },
  score: { type: Number, default: null },
});

const { dispatch } = useStore();

const isArchived = computed(() => props.char.deletedAt !== null);

const scoreStyle = computed(() => {
  if (props.score === null) {
    const style = 'background:#eee';
    return style;
  }
  const style = `background:${scoreColor(props.score)}`;
  return style;
});

function onArchive() {
  dispatch((s) => softDeleteCharacter(s, props.char.id));
}

function onRestore() {
  dispatch((s) => restoreCharacter(s, props.char.id));
}

function onHardDelete() {
  const shouldDelete = window.confirm('Eliminazione DEFINITIVA e irreversibile. Confermi?');
  if (shouldDelete) {
    dispatch((s) => hardDeleteCharacter(s, props.char.id));
  }
}
</script>
