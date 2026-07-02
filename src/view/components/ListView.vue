<template>
  <div class="rep-table-wrap">
  <table class="rep-table rep-table--stable">
    <colgroup>
      <col style="width:3rem" />
      <col />
      <col style="width:8.5rem" />
      <col style="width:6.5rem" />
    </colgroup>
    <thead>
      <tr>
        <th class="rep-table__num">#</th>
        <th class="rep-table__sortable" :aria-sort="ariaSort('name')" role="button" tabindex="0"
          @click="toggleSort('name')" @keydown="(e) => onSortKey(e, 'name')">
          Nome
          <Icon v-if="ui.sort.key === 'name'" :name="ui.sort.dir === 'asc' ? 'up' : 'down'" />
        </th>
        <th class="rep-table__sortable" :aria-sort="ariaSort('score')" role="button" tabindex="0"
          :title="SCORE_TIP" @click="toggleSort('score')" @keydown="(e) => onSortKey(e, 'score')">
          Reputazione complessiva
          <Icon v-if="ui.sort.key === 'score'" :name="ui.sort.dir === 'asc' ? 'up' : 'down'" />
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
        :class="rowClass(item.char)"
        :role="isRowInteractive(item.char) ? 'button' : undefined"
        :tabindex="isRowInteractive(item.char) ? 0 : undefined"
        @click="isRowInteractive(item.char) ? goToProfile(item.char.id) : undefined"
        @keydown="isRowInteractive(item.char) ? onKeyDown($event, item.char.id) : undefined">

        <td class="rep-table__num">{{ offset + i + 1 }}</td>
        <td>
          <template v-if="editingId !== item.char.id">
            <span class="rep-table__name" @click.stop="goToProfile(item.char.id)">
              {{ item.char.name }}
              <Icon name="goto" />
            </span>
            <span v-if="item.char.deletedAt !== null" class="ds-badge ds-badge--ember" style="margin-left:8px">
              Archiviato
            </span>
          </template>
          <input v-else class="ds-input rep-table__edit" type="text" v-model="editName"
            @keydown.enter="saveEdit(item.char.id)" @keydown.escape="cancelEdit" />
        </td>
        <td @click.stop>
          <span class="ds-score" :class="item.score === null ? 'ds-score--empty' : ''"
            :style="item.score !== null ? { background: scoreColor(item.score) } : undefined">
            {{ item.score !== null ? item.score : '–' }}
          </span>
        </td>
        <td @click.stop>
          <div class="rep-table__actions">
            <template v-if="editingId === item.char.id">
              <HoverTip text="Salva" label="Salva modifiche" :tab-index="-1">
                <button class="ds-btn ds-btn--sm ds-btn--primary ds-btn--icon" @click="saveEdit(item.char.id)"
                  aria-label="Salva modifiche">
                  <Icon name="check" />
                </button>
              </HoverTip>
              <HoverTip text="Annulla" label="Annulla modifiche" :tab-index="-1">
                <button class="ds-btn ds-btn--sm ds-btn--ghost ds-btn--icon" @click="cancelEdit"
                  aria-label="Annulla modifiche">
                  <Icon name="close" />
                </button>
              </HoverTip>
            </template>
            <template v-else-if="item.char.deletedAt === null">
              <HoverTip text="Rinomina" label="Rinomina personaggio" :tab-index="-1">
                <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon" @click="startEdit(item.char)"
                  aria-label="Rinomina personaggio">
                  <Icon name="edit" />
                </button>
              </HoverTip>
              <HoverTip text="Archivia" label="Archivia personaggio" :tab-index="-1">
                <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
                  @click="onArchive(item.char.id)" aria-label="Archivia personaggio">
                  <Icon name="archive" />
                </button>
              </HoverTip>
            </template>
            <template v-else>
              <HoverTip text="Ripristina" label="Ripristina personaggio" :tab-index="-1">
                <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
                  @click="onRestore(item.char.id)" aria-label="Ripristina personaggio">
                  <Icon name="restore" />
                </button>
              </HoverTip>
              <HoverTip text="Elimina" label="Elimina personaggio" :tab-index="-1">
                <button class="ds-btn ds-btn--sm ds-btn--danger ds-btn--icon"
                  @click="onHardDelete(item.char.id)" aria-label="Elimina personaggio">
                  <Icon name="trash" />
                </button>
              </HoverTip>
            </template>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { scoreColor } from '../scoreColor.js';
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter, renameCharacter } from '../../model/reputation.js';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import { SCORE_TIP } from '../uiCopy.js';

defineProps({
  items: { type: Array, required: true },
  offset: { type: Number, default: 0 },
});

const { dispatch } = useStore();
const ui = useUiState();
const router = useRouter();

const editingId = ref(null);
const editName = ref('');

// Ordinamento colonne (stato globale ui.sort: la lista si riordina nel composable).
function toggleSort(key) {
  if (ui.sort.key === key) {
    ui.sort = { key, dir: ui.sort.dir === 'asc' ? 'desc' : 'asc' };
  } else {
    ui.sort = { key, dir: key === 'score' ? 'desc' : 'asc' };
  }
}

function ariaSort(key) {
  if (ui.sort.key !== key) return 'none';
  const dir = ui.sort.dir === 'asc' ? 'ascending' : 'descending';
  return dir;
}

function onSortKey(e, key) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort(key); }
}

// Una riga e' navigabile (click apre scheda) solo se attiva e non in modifica.
function isRowInteractive(char) {
  const interactive = char.deletedAt === null && editingId.value !== char.id;
  return interactive;
}

function rowClass(char) {
  if (editingId.value === char.id) {
    return 'rep-table__row--editing';
  }
  const cls = char.deletedAt === null ? 'rep-table__row--clickable' : undefined;
  return cls;
}

function goToProfile(id) {
  router.push({ name: 'profile', params: { id } });
}

function onKeyDown(e, id) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToProfile(id); }
}

function startEdit(char) {
  editingId.value = char.id;
  editName.value = char.name;
}

function cancelEdit() {
  editingId.value = null;
  editName.value = '';
}

function saveEdit(id) {
  const name = editName.value.trim();
  if (!name) return;
  dispatch((s) => renameCharacter(s, id, name));
  cancelEdit();
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

<style scoped>
/* Larghezze colonna fisse: la geometria non cambia tra lettura e modifica,
   quindi le colonne non si spostano quando compare l'input inline. */
.rep-table--stable {
  table-layout: fixed;
  width: 100%;
}
.rep-table--stable :deep(.rep-table__name) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Inline edit: input compatto + padding riga ridotto per non alterare
   l'altezza della riga passando da lettura a modifica. */
.rep-table__row--editing :deep(td) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.ds-input.rep-table__edit {
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  min-height: 0;
  line-height: 1.4;
}
@media (pointer: coarse) {
  .ds-input.rep-table__edit { min-height: 34px; }
}
</style>
