<template>
  <div class="rep-table-wrap">
  <table class="rep-table">
    <thead>
      <tr>
        <th class="rep-table__num">#</th>
        <th>Nome</th>
        <th>
          <span class="rep-th-help">
            Punteggio sintetico
            <HoverTip :text="SCORE_TIP" label="Aiuto" class-name="rep-tip--help">
              <Icon name="help" />
            </HoverTip>
          </span>
        </th>
        <th>Azioni</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="items.length === 0">
        <td colspan="4" class="rep-empty">Nessun personaggio.</td>
      </tr>
      <tr v-for="(item, i) in items" :key="item.char.id"
        :style="item.char.deletedAt !== null ? { opacity: 0.6 } : undefined"
        :class="item.char.deletedAt === null ? 'rep-table__row--clickable' : undefined"
        :role="item.char.deletedAt === null ? 'button' : undefined"
        :tabindex="item.char.deletedAt === null ? 0 : undefined"
        @click="item.char.deletedAt === null ? goToProfile(item.char.id) : undefined"
        @keydown="item.char.deletedAt === null ? onKeyDown($event, item.char.id) : undefined">

        <td class="rep-table__num">{{ i + 1 }}</td>
        <td>
          <span class="rep-table__name" @click.stop="goToProfile(item.char.id)">
            {{ item.char.name }}
            <Icon name="goto" />
          </span>
          <span v-if="item.char.deletedAt !== null" class="ds-badge ds-badge--ember" style="margin-left:8px">
            Archiviato
          </span>
        </td>
        <td>
          <span class="ds-score" :class="item.score === null ? 'ds-score--empty' : ''"
            :style="item.score !== null ? { background: scoreColor(item.score) } : undefined">
            {{ item.score !== null ? item.score : '–' }}
          </span>
        </td>
        <td @click.stop>
          <div class="rep-table__actions">
            <template v-if="item.char.deletedAt === null">
              <HoverTip text="Archivia" label="Archivia personaggio" :tab-index="-1">
                <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
                  @click="onArchive(item.char.id)" aria-label="Archivia personaggio">
                  <Icon name="archive" />
                </button>
              </HoverTip>
            </template>
            <template v-else>
              <button class="ds-btn ds-btn--sm ds-btn--secondary" @click="onRestore(item.char.id)">Ripristina</button>
              <button class="ds-btn ds-btn--sm ds-btn--danger" @click="onHardDelete(item.char.id)">Elimina</button>
            </template>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { scoreColor } from '../scoreColor.js';
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter } from '../../model/reputation.js';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import { SCORE_TIP } from '../uiCopy.js';

defineProps({
  items: { type: Array, required: true },
});

const { dispatch } = useStore();
const router = useRouter();

function goToProfile(id) {
  router.push({ name: 'profile', params: { id } });
}

function onKeyDown(e, id) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToProfile(id); }
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
