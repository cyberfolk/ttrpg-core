<template>
  <section>
    <!-- Toolbar -->
    <div class="rep-toolbar">
      <div class="rep-toolbar__search">
        <span class="ds-field ds-field--block">
          <span class="ds-field__wrap">
            <span class="ds-field__icon">
              <Icon name="search" />
            </span>
            <input class="ds-input ds-input--with-icon" type="search" placeholder="Cerca per nome…"
              v-model="search" />
          </span>
        </span>
      </div>

      <!-- Segmented view switcher -->
      <div class="ds-seg">
        <button class="ds-seg__btn" :class="{ active: viewMode === 'gallery' }"
          disabled aria-disabled="true" title="Non ancora disponibile">
          <span class="ds-seg__icon"><Icon name="gallery" /></span>
          Gallery
        </button>
        <button class="ds-seg__btn" :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'">
          <span class="ds-seg__icon"><Icon name="list" /></span>
          Lista
        </button>
        <button class="ds-seg__btn" :class="{ active: viewMode === 'matrix' }"
          disabled aria-disabled="true" title="Non ancora disponibile">
          <span class="ds-seg__icon"><Icon name="matrix" /></span>
          Matrice
        </button>
      </div>

      <div class="rep-toolbar__add">
        <button class="ds-btn ds-btn--primary" @click="openAdd">
          <span class="ds-btn__icon"><Icon name="plus" /></span>
          Aggiungi gruppo
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

    <div v-else class="rep-table-wrap" style="margin-top:1rem">
      <table class="rep-table">
        <thead>
          <tr>
            <th class="rep-table__num">#</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Membri</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(group, i) in filteredActive" :key="group.id"
            :class="editingId === group.id ? undefined : 'rep-table__row--clickable'"
            :role="editingId === group.id ? undefined : 'button'"
            :tabindex="editingId === group.id ? undefined : 0"
            @click="editingId === group.id ? undefined : goToProfile(group.id)"
            @keydown="editingId === group.id ? undefined : onKeyDown($event, group.id)">

            <td class="rep-table__num">{{ i + 1 }}</td>

            <!-- Nome -->
            <td>
              <span v-if="editingId !== group.id" class="rep-table__name" @click.stop="goToProfile(group.id)">
                {{ group.name }}
                <Icon name="goto" />
              </span>
              <input v-else class="ds-input" type="text" v-model="editName" style="width:10rem"
                @keydown.enter="saveEdit(group.id)" @keydown.escape="cancelEdit" />
            </td>

            <!-- Tipo -->
            <td @click.stop>
              <span v-if="editingId !== group.id">
                <span v-if="group.type" class="ds-badge">{{ group.type }}</span>
                <span v-else class="rep-empty">–</span>
              </span>
              <input v-else class="ds-input" type="text" v-model="editType" placeholder="Tipo (es. fazione)"
                style="width:9rem"
                @keydown.enter="saveEdit(group.id)" @keydown.escape="cancelEdit" />
            </td>

            <!-- Membri -->
            <td>
              {{ group.memberIds.length }} {{ group.memberIds.length === 1 ? 'membro' : 'membri' }}
            </td>

            <!-- Azioni -->
            <td @click.stop>
              <div class="rep-table__actions">
                <template v-if="editingId === group.id">
                  <button class="ds-btn ds-btn--sm ds-btn--primary" @click="saveEdit(group.id)">Salva</button>
                  <button class="ds-btn ds-btn--sm ds-btn--ghost" @click="cancelEdit">Annulla</button>
                </template>
                <template v-else>
                  <HoverTip text="Rinomina" label="Rinomina gruppo" :tab-index="-1">
                    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon" @click="startEdit(group)"
                      aria-label="Rinomina gruppo">
                      <Icon name="edit" />
                    </button>
                  </HoverTip>
                  <HoverTip text="Archivia" label="Archivia gruppo" :tab-index="-1">
                    <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon" @click="onArchive(group.id)"
                      aria-label="Archivia gruppo">
                      <Icon name="archive" />
                    </button>
                  </HoverTip>
                </template>
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
          {{ group.name }}
          <span v-if="group.type" class="ds-badge" style="margin-left:0.35rem">{{ group.type }}</span>
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
            <span class="ds-field ds-field--block">
              <label class="ds-field__label" for="add-group-type">Tipo (opzionale)</label>
              <span class="ds-field__wrap">
                <input id="add-group-type" class="ds-input" type="text"
                  placeholder="Es. fazione, gilda, casata…" v-model="newType" />
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
import { ref, computed, nextTick } from 'vue';
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
  setGroupType,
} from '../../model/reputation.js';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';

const { state, dispatch } = useStore();
const ui = useUiState();
const router = useRouter();

const viewMode = ref('list');
const search = ref('');
const addOpen = ref(false);
const newName = ref('');
const newType = ref('');
const nameInput = ref(null);

const editingId = ref(null);
const editName = ref('');
const editType = ref('');

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

async function openAdd() {
  addOpen.value = true;
  await nextTick();
  nameInput.value?.focus();
}

function closeAdd() {
  addOpen.value = false;
  newName.value = '';
  newType.value = '';
}

function onAdd() {
  const name = newName.value.trim();
  if (!name) return;
  const type = newType.value.trim();
  dispatch((s) => addGroup(s, name, type));
  closeAdd();
}

function goToProfile(id) {
  router.push({ name: 'groupProfile', params: { id } });
}

function onKeyDown(e, id) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    goToProfile(id);
  }
}

function startEdit(group) {
  editingId.value = group.id;
  editName.value = group.name;
  editType.value = group.type;
}

function cancelEdit() {
  editingId.value = null;
  editName.value = '';
  editType.value = '';
}

function saveEdit(id) {
  const name = editName.value.trim();
  if (!name) return;
  const type = editType.value.trim();
  dispatch((s) => renameGroup(s, id, name));
  dispatch((s) => setGroupType(s, id, type));
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
</style>
