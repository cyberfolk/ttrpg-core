<template>
  <section>
    <!-- Toolbar -->
    <div class="rep-toolbar">
      <div class="rep-toolbar__search">
        <span class="ds-search">
          <span class="ds-search__icon"><Icon name="search" /></span>
          <input class="ds-input ds-input--with-icon" type="search" placeholder="Cerca per nome…"
            v-model="search" />
        </span>
      </div>

      <!-- Azioni: toggle vista (griglia<->lista) + aggiungi, icone compatte -->
      <div class="rep-toolbar__actions">
        <button class="ds-btn ds-btn--secondary ds-btn--icon" @click="toggleView"
          :aria-label="viewMode === 'list' ? 'Mostra come griglia' : 'Mostra come lista'"
          :title="viewMode === 'list' ? 'Mostra come griglia' : 'Mostra come lista'">
          <Icon :name="viewMode === 'list' ? 'gallery' : 'list'" />
        </button>
        <button class="ds-btn ds-btn--primary ds-btn--icon" @click="openAdd"
          aria-label="Aggiungi gruppo" title="Aggiungi gruppo">
          <Icon name="plus" />
        </button>
      </div>
    </div>

    <!-- Lista gruppi attivi -->
    <div v-if="filteredActive.length === 0 && !search" class="rep-empty" style="margin-top:2rem">
      Nessun gruppo. Aggiungine uno!
    </div>
    <div v-else-if="filteredActive.length === 0" class="rep-empty" style="margin-top:2rem">
      Nessun gruppo corrisponde alla ricerca.
    </div>

    <!-- Vista card -->
    <GroupGalleryView v-else-if="viewMode === 'gallery'" :groups="sortedActive" />

    <div v-else class="rep-table-wrap">
      <table class="rep-table rep-table--stable">
        <colgroup>
          <col class="rep-col--num" />
          <col />
          <col class="rep-col--members" />
          <col class="rep-col--score" />
          <col class="rep-col--actions" />
        </colgroup>
        <thead>
          <tr>
            <th class="rep-table__num">#</th>
            <SortableTh col="name" :sort="sort" @sort="toggleSort">Nome</SortableTh>
            <SortableTh col="members" class="rep-table__members-cell" :sort="sort" @sort="toggleSort"># Membri</SortableTh>
            <SortableTh col="score" class="rep-col--right" :sort="sort" @sort="toggleSort">Rep.</SortableTh>
            <th class="rep-table__actions-cell">Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(group, i) in sortedActive" :key="group.id"
            :class="editingId === group.id ? 'rep-table__row--editing' : 'rep-table__row--clickable'"
            :role="editingId === group.id ? undefined : 'button'"
            :tabindex="editingId === group.id ? undefined : 0"
            @click="editingId === group.id ? undefined : goToProfile(group.id)"
            v-activate>

            <td class="rep-table__num">{{ i + 1 }}</td>

            <!-- Nome -->
            <td class="rep-table__name-cell">
              <span v-if="editingId !== group.id" class="rep-table__name" @click.stop="goToProfile(group.id)">
                {{ $name(group) }}
                <Icon name="goto" />
              </span>
              <input v-else class="ds-input rep-table__edit" type="text" v-model="editName"
                @keydown.enter="saveEdit(group.id)" @keydown.escape="cancelEdit" />
            </td>


            <!-- # Membri (solo numero, ordinabile come int) -->
            <td class="rep-table__members-cell" style="font-variant-numeric:tabular-nums">
              {{ group.memberIds.length }}
            </td>

            <!-- Reputazione complessiva -->
            <td class="rep-col--right" @click.stop>
              <ScoreChip :score="scoreOf(group.id)" size="sm" />
            </td>

            <!-- Azioni -->
            <td class="rep-table__actions-cell" @click.stop>
              <div class="rep-table__actions">
                <template v-if="editingId === group.id">
                  <HoverTip text="Salva" label="Salva modifiche" :tab-index="-1">
                    <button class="ds-btn ds-btn--sm ds-btn--primary ds-btn--icon" @click="saveEdit(group.id)"
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
                <ActionMenu v-else label="Azioni gruppo" icon="gear">
                  <template #default="{ close }">
                    <button type="button" class="ds-menu__item" @click="startEdit(group); close()">
                      <Icon name="edit" /> Rinomina
                    </button>
                    <button type="button" class="ds-menu__item" @click="onArchive(group.id); close()">
                      <Icon name="archive" /> Archivia
                    </button>
                  </template>
                </ActionMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Gruppi archiviati -->
    <div v-if="showArchived && archivedGroups.length > 0" style="margin-top:2rem">
      <div class="rep-drawer__label" style="margin-bottom:0.5rem">Archiviati</div>
      <div v-for="group in archivedGroups" :key="group.id" class="ds-card ds-card--filament rep-group-row rep-group-row--archived">
        <span class="rep-group-row__name" style="opacity:0.6">
          {{ $name(group) }}
        </span>
        <div class="rep-group-row__actions">
          <button class="ds-btn ds-btn--ghost ds-btn--sm" @click="onRestore(group.id)">
            <Icon name="restore" />
            Ripristina
          </button>
          <button class="ds-btn ds-btn--sm ds-btn--danger" @click="onHardDelete(group.id)">
            <Icon name="trash" />
            Elimina
          </button>
        </div>
      </div>
    </div>

    <!-- Add group dialog -->
    <div v-if="addOpen" class="ds-overlay" @click.self="closeAdd">
      <div class="ds-dialog" style="max-width:440px">
        <div class="ds-dialog__head">
          <h3 class="ds-dialog__title">Aggiungi gruppo</h3>
          <button class="ds-dialog__close" @click="closeAdd" aria-label="Chiudi">
            <Icon name="close" />
          </button>
        </div>
        <div class="ds-dialog__body">
          <form class="rep-addchar" @submit.prevent="onAdd" style="display:flex;flex-direction:column;gap:0.75rem">
            <span class="ds-field ds-field--block">
              <label class="ds-field__label" for="add-group-name">Nome del gruppo</label>
              <span class="ds-field__wrap">
                <input id="add-group-name" ref="nameInput" class="ds-input" type="text"
                  placeholder="Es. Fratellanza dell'Alba" v-model="newName" />
              </span>
            </span>
          </form>
        </div>
        <div class="ds-dialog__foot">
          <button class="ds-btn ds-btn--ghost" @click="closeAdd">Annulla</button>
          <button class="ds-btn ds-btn--primary" :disabled="!newName.trim()" @click="onAdd">
            Aggiungi
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import {
  listActiveGroups,
  listArchivedGroups,
  addGroup,
  softDeleteGroup,
  restoreGroup,
  hardDeleteGroup,
  renameGroup,
  averageIncomingScore,
} from '../../model/reputation.js';
import { useSortable } from '../useSortable.js';
import { useDialog } from '../useDialog.js';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import SortableTh from './SortableTh.vue';
import ActionMenu from './ActionMenu.vue';
import ScoreChip from './ScoreChip.vue';
import GroupGalleryView from './GroupGalleryView.vue';

const { state, dispatch } = useStore();
const ui = useUiState();
const router = useRouter();

const viewMode = ref('gallery');
// Toggle vista: da lista torna a griglia, altrimenti va in lista
function toggleView() {
  viewMode.value = viewMode.value === 'list' ? 'gallery' : 'list';
}
const search = ref('');
const addOpen = ref(false);
const newName = ref('');
const nameInput = ref(null);

const editingId = ref(null);
const editName = ref('');

const activeGroups = computed(() => listActiveGroups(state.value));
const archivedGroups = computed(() => listArchivedGroups(state.value));
const showArchived = computed(() => ui.showArchived);

const filteredActive = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) {
    return activeGroups.value;
  }
  const filtered = activeGroups.value.filter((g) => g.name.toLowerCase().includes(q));
  return filtered;
});

// Reputazione complessiva per gruppo (stessa metrica del profilo): mappa
// id -> punteggio, calcolata una volta per gli attivi.
const scoreMap = computed(() => {
  const map = new Map();
  for (const g of activeGroups.value) {
    map.set(g.id, averageIncomingScore(state.value, g.id, ui.showArchived));
  }
  return map;
});
function scoreOf(id) {
  const score = scoreMap.value.get(id) ?? null;
  return score;
}

// Ordinamento colonne (stato locale della vista). nome parte asc;
// numeri (membri/punteggio) partono desc.
const { sort, toggleSort } = useSortable({
  initial: { key: 'name', dir: 'asc' },
  descKeys: ['members', 'score'],
});

const sortedActive = computed(() => {
  const { key, dir } = sort.value;
  const mul = dir === 'asc' ? 1 : -1;
  const rows = [...filteredActive.value].sort((a, b) => {
    if (key === 'name') {
      const cmp = a.name.localeCompare(b.name) * mul;
      return cmp;
    }
    if (key === 'members') {
      const cmp = (a.memberIds.length - b.memberIds.length) * mul;
      return cmp;
    }
    // key === 'score': i gruppi senza punteggio (null) restano sempre in coda.
    const sa = scoreMap.value.get(a.id) ?? null;
    const sb = scoreMap.value.get(b.id) ?? null;
    if (sa === null && sb === null) return 0;
    if (sa === null) return 1;
    if (sb === null) return -1;
    const cmp = (sa - sb) * mul;
    return cmp;
  });
  return rows;
});

function openAdd() {
  addOpen.value = true;
}

function closeAdd() {
  addOpen.value = false;
  newName.value = '';
}

// Dialog "aggiungi gruppo": Escape chiude, apertura mette a fuoco il nome.
useDialog({
  isOpen: () => addOpen.value,
  onClose: closeAdd,
  onOpen: () => nameInput.value?.focus(),
});

function onAdd() {
  const name = newName.value.trim();
  if (!name) return;
  dispatch((s) => addGroup(s, name));
  closeAdd();
}

function goToProfile(id) {
  router.push({ name: 'groupProfile', params: { id } });
}

function startEdit(group) {
  editingId.value = group.id;
  editName.value = group.name;
}

function cancelEdit() {
  editingId.value = null;
  editName.value = '';
}

function saveEdit(id) {
  const name = editName.value.trim();
  if (!name) return;
  dispatch((s) => renameGroup(s, id, name));
  cancelEdit();
}

function onArchive(id) {
  dispatch((s) => softDeleteGroup(s, id));
}

function onRestore(id) {
  dispatch((s) => restoreGroup(s, id));
}

function onHardDelete(id) {
  const confirmed = window.confirm('Eliminare definitivamente il gruppo? Questa operazione non è reversibile.');
  if (!confirmed) return;
  dispatch((s) => hardDeleteGroup(s, id));
}
</script>

<style scoped>
.rep-group-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.rep-group-row__main {
  flex: 1;
  min-width: 0;
}

.rep-group-row__name {
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.rep-group-row__name:hover {
  text-decoration: underline;
}

.rep-group-row__edit {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.rep-group-row__meta {
  font-size: 0.8rem;
  opacity: 0.65;
  white-space: nowrap;
}

.rep-group-row__actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

/* Larghezze colonna fisse (colgroup): la geometria non cambia passando
   da lettura a modifica, quindi le colonne non si spostano. */
.rep-table--stable {
  table-layout: fixed;
  width: 100%;
}
.rep-col--num { width: 3rem; }
/* Colonna numerazione: label # e numeri centrati (il globale e' right-aligned). */
.rep-table--stable :deep(.rep-table__num) { text-align: center; }
.rep-col--members { width: 6rem; }
/* Reputazione: label "Rep." e larghezza minima anche su desktop (come mobile). */
.rep-col--score { width: 4.5rem; }
.rep-col--actions { width: 6.5rem; }
.rep-table--stable :deep(.rep-table__name) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Mobile: resta table-layout:fixed (deterministico). Le colonne #, Membri e
   Azioni (rinomina/archivia stanno nella scheda) vanno a larghezza 0 con
   contenuto nascosto, MA le celle restano nel DOM: con display:none la colonna
   sparirebbe dal modello tabella mentre il <colgroup> mantiene i suoi 5 <col>,
   sfasando le larghezze di una colonna (il nome collassa sotto il punteggio).
   Restano solo Nome + Reputazione; il nome prende il resto e tronca con ellissi. */
@media (max-width: 560px) {
  .rep-col--num,
  .rep-col--members,
  .rep-col--actions { width: 0; }
  .rep-table__num,
  .rep-table__members-cell,
  .rep-table__actions-cell { padding-left: 0; padding-right: 0; overflow: hidden; }
  .rep-table__num,
  .rep-table__members-cell { font-size: 0; }
  .rep-table__actions-cell :deep(.rep-table__actions) { display: none; }
  .rep-table--stable :deep(td.rep-table__name-cell) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* Inline edit: input compatti + padding riga ridotto per non alterare
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
