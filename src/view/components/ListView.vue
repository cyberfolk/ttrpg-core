<template>
  <div class="rep-table-wrap">
  <table class="rep-table rep-table--stable">
    <colgroup>
      <col class="rep-col--num" />
      <col />
      <col class="rep-col--score" />
      <col class="rep-col--actions" />
    </colgroup>
    <thead>
      <tr>
        <th class="rep-table__num">#</th>
        <SortableTh col="name" :sort="ui.sort" @sort="toggleSort">Nome</SortableTh>
        <SortableTh col="score" :sort="ui.sort" @sort="toggleSort">
          <HoverTip :text="SCORE_TIP" :tab-index="-1" label="Reputazione complessiva">
            Rep.
          </HoverTip>
        </SortableTh>
        <th class="rep-table__actions-cell">Azioni</th>
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
        v-activate>

        <td class="rep-table__num">{{ offset + i + 1 }}</td>
        <td class="rep-table__name-cell">
          <template v-if="editingId !== item.char.id">
            <span class="rep-table__name" @click.stop="goToProfile(item.char.id)">
              {{ $name(item.char) }}
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
        <td class="rep-table__actions-cell" @click.stop>
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
            <ActionMenu v-else label="Azioni personaggio" icon="gear">
              <template #default="{ close }">
                <template v-if="item.char.deletedAt === null">
                  <button type="button" class="ds-menu__item" @click="startEdit(item.char); close()">
                    <Icon name="edit" /> Rinomina
                  </button>
                  <button type="button" class="ds-menu__item" @click="onArchive(item.char.id); close()">
                    <Icon name="archive" /> Archivia
                  </button>
                </template>
                <template v-else>
                  <button type="button" class="ds-menu__item" @click="onRestore(item.char.id); close()">
                    <Icon name="restore" /> Ripristina
                  </button>
                  <button type="button" class="ds-menu__item ds-menu__item--danger" @click="onHardDelete(item.char.id); close()">
                    <Icon name="trash" /> Elimina
                  </button>
                </template>
              </template>
            </ActionMenu>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { useSortable } from '../useSortable.js';
import { scoreColor } from '../scoreColor.js';
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter, renameCharacter } from '../../model/reputation.js';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import SortableTh from './SortableTh.vue';
import ActionMenu from './ActionMenu.vue';
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

// Ordinamento colonne: lo stato vive in ui.sort (globale), la lista si riordina
// in useDisplayedCharacters. Il toggle scrive lì tramite un model writable.
const sortModel = computed({
  get: () => ui.sort,
  set: (v) => { ui.sort = v; },
});
const { toggleSort } = useSortable({ model: sortModel, descKeys: ['score'] });

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
.rep-col--num { width: 3rem; }
/* Colonna numerazione: label # e numeri centrati (il globale e' right-aligned). */
.rep-table--stable :deep(.rep-table__num) { text-align: center; }
/* Reputazione: label "Rep." e larghezza minima anche su desktop (come mobile). */
.rep-col--score { width: 4.5rem; }
.rep-col--actions { width: 6.5rem; }
.rep-table--stable :deep(.rep-table__name) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Mobile: resta table-layout:fixed (deterministico). Le colonne # e Azioni
   (rinomina/archivia stanno nella scheda) vanno a larghezza 0 con contenuto
   nascosto, MA le celle restano nel DOM: con display:none la colonna sparirebbe
   dal modello tabella mentre il <colgroup> mantiene i suoi 5 <col>, sfasando le
   larghezze di una colonna (il nome collassa sotto il punteggio). Il punteggio
   si stringe, il nome prende lo spazio residuo e tronca con ellissi. */
@media (max-width: 560px) {
  .rep-col--num,
  .rep-col--actions { width: 0; }
  .rep-table__num,
  .rep-table__actions-cell { padding-left: 0; padding-right: 0; overflow: hidden; }
  .rep-table__num { font-size: 0; }
  .rep-table__actions-cell :deep(.rep-table__actions) { display: none; }
  .rep-table--stable :deep(td.rep-table__name-cell) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
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
