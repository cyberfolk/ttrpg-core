<template>
  <table class="list-view">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Punteggio</th>
        <th>Azioni</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="items.length === 0">
        <td colspan="3" class="empty">Nessun personaggio.</td>
      </tr>
      <tr v-for="item in items" :key="item.char.id" :class="{ archived: item.char.deletedAt !== null }">
        <td>
          <router-link :to="{ name: 'profile', params: { id: item.char.id } }">
            {{ item.char.name }} ↪
          </router-link>
          <span v-if="item.char.deletedAt !== null" class="ribbon-inline">(archiviato)</span>
        </td>
        <td :style="scoreStyle(item.score)">{{ item.score === null ? '–' : item.score }}</td>
        <td>
          <button v-if="item.char.deletedAt === null" @click="onArchive(item.char.id)">Archivia</button>
          <template v-else>
            <button @click="onRestore(item.char.id)">Ripristina</button>
            <button @click="onHardDelete(item.char.id)">Elimina definitivo</button>
          </template>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { useStore } from '../useStore.js';
import { scoreColor } from '../scoreColor.js';
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter } from '../../model/reputation.js';

defineProps({
  items: { type: Array, required: true },
});

const { dispatch } = useStore();

function scoreStyle(score) {
  if (score === null) {
    return 'background:#eee';
  }
  const style = `background:${scoreColor(score)}`;
  return style;
}

function onArchive(id) {
  dispatch((s) => softDeleteCharacter(s, id));
}

function onRestore(id) {
  dispatch((s) => restoreCharacter(s, id));
}

function onHardDelete(id) {
  if (window.confirm('Eliminazione DEFINITIVA e irreversibile. Confermi?')) {
    dispatch((s) => hardDeleteCharacter(s, id));
  }
}
</script>
