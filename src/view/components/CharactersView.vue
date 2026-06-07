<template>
  <section class="characters-view">
    <div class="controls">
      <input
        class="search"
        type="text"
        placeholder="Cerca per nome…"
        v-model="ui.search"
      />

      <div class="view-switcher">
        <button :class="{ active: ui.activeView === 'gallery' }" @click="ui.activeView = 'gallery'">Gallery</button>
        <button :class="{ active: ui.activeView === 'list' }" @click="ui.activeView = 'list'">Lista</button>
        <button :class="{ active: ui.activeView === 'matrix' }" @click="ui.activeView = 'matrix'">Matrice</button>
      </div>

      <label class="archived-toggle">
        <input type="checkbox" v-model="ui.showArchived" />
        Mostra archiviati
      </label>

      <div class="sort-controls" v-if="ui.activeView !== 'matrix'">
        <span>Ordina:</span>
        <button @click="setSort('name')">
          Nome {{ sortArrow('name') }}
        </button>
        <button @click="setSort('score')">
          Punteggio {{ sortArrow('score') }}
        </button>
      </div>

      <form class="add-char" @submit.prevent="onAdd">
        <input v-model="newName" type="text" placeholder="Nome personaggio" />
        <button type="submit">+ Personaggio</button>
      </form>
    </div>

    <GalleryView v-if="ui.activeView === 'gallery'" :items="items" />
    <ListView v-else-if="ui.activeView === 'list'" :items="items" />
    <MatrixView v-else />
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useUiState } from '../useUiState.js';
import { useStore } from '../useStore.js';
import { useDisplayedCharacters } from '../useDisplayedCharacters.js';
import { addCharacter } from '../../model/reputation.js';
import GalleryView from './GalleryView.vue';
import ListView from './ListView.vue';
import MatrixView from './MatrixView.vue';

const ui = useUiState();
const { dispatch } = useStore();
const items = useDisplayedCharacters();
const newName = ref('');

function setSort(key) {
  if (ui.sort.key === key) {
    ui.sort.dir = ui.sort.dir === 'asc' ? 'desc' : 'asc';
    return;
  }
  ui.sort.key = key;
  ui.sort.dir = 'asc';
}

function sortArrow(key) {
  if (ui.sort.key !== key) {
    return '';
  }
  const arrow = ui.sort.dir === 'asc' ? '▲' : '▼';
  return arrow;
}

function onAdd() {
  const name = newName.value.trim();
  if (name.length === 0) {
    return;
  }
  dispatch((s) => addCharacter(s, name));
  newName.value = '';
}
</script>
