<template>
  <section v-if="character" class="rep-profile">
    <nav class="rep-breadcrumb">
      <router-link to="/personaggi">Personaggi</router-link>
      <span> / {{ $name(character) }}</span>
    </nav>

    <RecordPager v-if="recordIndex >= 0" :index="recordIndex" :total="recordIds.length"
      @update:index="goToIndex" />

    <div class="ds-card ds-card--filament rep-profile__card">
      <!-- Profile header -->
      <div class="rep-profile__head">
        <!-- Riga titolo: nome (editabile inline su hover, come i campi del modulo) +
             ingranaggio azioni (archivia o ripristina/elimina). In editing: input + Salva/Annulla. -->
        <div class="rep-profile__titlerow">
          <h2 v-if="editing === false">
            <button type="button" class="rep-profile__nameedit" @click="startEdit" aria-label="Rinomina">
              <span>{{ $name(character) }}</span>
              <Icon name="edit" class="rep-profile__name-ico" />
            </button>
          </h2>
          <input v-else class="ds-input rep-profile__edit" type="text" v-model="editName"
            v-focus aria-label="Nuovo nome"
            @blur="commitName" @keydown.enter="commitName" @keydown.escape="cancelEdit" />

          <span v-if="isArchived" class="ds-badge ds-badge--ember rep-profile__archbadge">Archiviato</span>

          <ActionMenu class="rep-profile__gear" label="Azioni personaggio" icon="gear" open-on-hover>
            <template #default="{ close }">
              <template v-if="isArchived === false">
                <button type="button" class="ds-menu__item" @click="onArchive(); close()">
                  <Icon name="archive" /> Archivia
                </button>
              </template>
              <template v-else>
                <button type="button" class="ds-menu__item" @click="onRestore(); close()">
                  <Icon name="restore" /> Ripristina
                </button>
                <button type="button" class="ds-menu__item ds-menu__item--danger" @click="onHardDelete(); close()">
                  <Icon name="trash" /> Elimina
                </button>
              </template>
            </template>
          </ActionMenu>
        </div>
      </div>

      <!-- Scheda anagrafica reale: legge/scrive lo STORE. -->
      <EntitySheet :key="character.id" kind="character" :entity="character" :reputation="synthetic" />

      <!-- Tab switcher -->
      <div class="rep-profile__tabs">
        <div class="ds-seg ds-seg--underline">
          <button class="ds-seg__btn" :class="{ active: tab === 'note' }" @click="tab = 'note'">
            Note
          </button>
          <button class="ds-seg__btn" :class="{ active: tab === 'in' }" @click="tab = 'in'">
            Di lui pensano
          </button>
          <button class="ds-seg__btn" :class="{ active: tab === 'out' }" @click="tab = 'out'">
            Lui pensa
          </button>
          <button class="ds-seg__btn" :class="{ active: tab === 'groups' }" @click="tab = 'groups'">
            Membro di
          </button>
        </div>
      </div>

      <!-- Note -->
      <Notes v-if="tab === 'note'" :key="character.id" kind="character" :entity="character" />

      <!-- Relations -->
      <RelationList
        v-if="tab === 'in' || tab === 'out'"
        :key="tab"
        :current-id="character.id"
        :direction="tab"
        @open-tx="openTx"
      />

      <!-- Gruppi del personaggio -->
      <template v-if="tab === 'groups'">
        <div class="rep-table-wrap rep-table--flush">
          <table class="rep-table">
            <thead>
              <tr>
                <th class="rep-table__num">#</th>
                <th>Nome</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="memberGroups.length === 0">
                <td colspan="3" class="rep-empty">Non è membro di alcun gruppo.</td>
              </tr>
              <tr v-for="(group, i) in memberGroups" :key="group.id"
                class="rep-table__row--clickable" role="button" tabindex="0"
                @click="goToGroup(group.id)" v-activate>

                <td class="rep-table__num">{{ i + 1 }}</td>
                <td>
                  <span class="rep-table__name" @click.stop="goToGroup(group.id)">
                    {{ $name(group) }}
                    <Icon name="goto" />
                  </span>
                </td>
                <td @click.stop>
                  <div class="rep-table__actions">
                    <template v-if="confirmUnlinkId === group.id">
                      <button class="ds-btn ds-btn--sm ds-btn--danger"
                        type="button" @click="confirmUnlink(group.id)">Sgancia</button>
                      <button class="ds-btn ds-btn--sm ds-btn--ghost"
                        type="button" @click="confirmUnlinkId = null">Annulla</button>
                    </template>
                    <HoverTip v-else text="Sgancia dal gruppo" label="Sgancia dal gruppo" :tab-index="-1">
                      <button class="ds-btn ds-btn--sm ds-btn--danger ds-btn--icon"
                        type="button" aria-label="Sgancia dal gruppo" @click="confirmUnlinkId = group.id">
                        <Icon name="unlink" />
                      </button>
                    </HoverTip>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rep-addrow">
                <td class="rep-table__num"></td>
                <td>
                  <EntityPicker
                    v-model="newGroupId"
                    :only="availableGroupIds"
                    label="Gruppo da aggiungere"
                    placeholder="Scegli un gruppo…"
                    hide-label />
                </td>
                <td>
                  <HoverTip text="Aggiungi al gruppo" label="Aggiungi al gruppo" :tab-index="-1">
                    <button class="ds-btn ds-btn--primary ds-btn--sm ds-btn--icon"
                      type="button" :disabled="!newGroupId" aria-label="Aggiungi al gruppo"
                      @click="onAddGroup">
                      <Icon name="plus" />
                    </button>
                  </HoverTip>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>

      <!-- Ornament -->
      <div class="rep-profile__orn">
        <div class="ds-orn" role="separator">
          <span class="ds-orn__line"></span>
          <span class="ds-orn__motif">
            <svg width="52" height="20" viewBox="0 0 52 20" fill="none" aria-hidden="true">
              <path d="M2 10 C 8 10, 9 4, 14 10 C 9 16, 8 10, 2 10 Z" stroke="currentColor" stroke-width="1.3"/>
              <rect x="26" y="3" width="9.9" height="9.9" rx="1.4" transform="rotate(45 26 3)" stroke="currentColor" stroke-width="1.3"/>
              <path d="M50 10 C 44 10, 43 4, 38 10 C 43 16, 44 10, 50 10 Z" stroke="currentColor" stroke-width="1.3"/>
            </svg>
          </span>
          <span class="ds-orn__line ds-orn__line--r"></span>
        </div>
      </div>
    </div>

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
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { useDisplayedCharacters } from '../useDisplayedCharacters.js';
import {
  averageIncomingScore, listActiveGroups, addMember, removeMember,
  renameCharacter, softDeleteCharacter, restoreCharacter, hardDeleteCharacter,
} from '../../model/reputation.js';
import RecordPager from './RecordPager.vue';
import RelationList from './RelationList.vue';
import EntityPicker from './EntityPicker.vue';
import TransactionModal from './TransactionModal.vue';
import NotFound from './NotFound.vue';
import HoverTip from './HoverTip.vue';
import Icon from './Icon.vue';
import ActionMenu from './ActionMenu.vue';
import EntitySheet from './EntitySheet.vue';
import Notes from './Notes.vue';
import { SCORE_TIP } from '../uiCopy.js';

const props = defineProps({
  id: { type: String, required: true },
});

const { state, dispatch } = useStore();
const ui = useUiState();
const router = useRouter();
const tab = ref('note');
const tx = ref(null);
const newGroupId = ref(null);
// Rinomina inline del personaggio dall'header della scheda.
const editing = ref(false);
const editName = ref('');
// Sgancio gruppo: conferma inline a due passi (niente delete silenzioso).
const confirmUnlinkId = ref(null);
// Cambio tab azzera una conferma di sgancio in sospeso.
watch(tab, () => { confirmUnlinkId.value = null; });

// Lista ordinata dei personaggi (stesso ordine della vista lista) per il pager prev/next.
const { all: displayedCharacters } = useDisplayedCharacters();
const recordIds = computed(() => displayedCharacters.value.map((it) => it.char.id));
const recordIndex = computed(() => recordIds.value.indexOf(props.id));

function goToIndex(index) {
  const id = recordIds.value[index];
  if (id) router.push({ name: 'profile', params: { id } });
}

const character = computed(() => state.value.characters.find((c) => c.id === props.id) || null);
const isArchived = computed(() => character.value !== null && character.value.deletedAt !== null);
const synthetic = computed(() => {
  if (character.value === null) return null;
  return averageIncomingScore(state.value, character.value.id, ui.showArchived);
});

const memberGroups = computed(() => {
  if (character.value === null) return [];
  const charId = character.value.id;
  const groups = listActiveGroups(state.value).filter((g) => g.memberIds.includes(charId));
  return groups;
});

// Gruppi attivi a cui il personaggio non appartiene ancora (assegnabili).
const availableGroups = computed(() => {
  if (character.value === null) return [];
  const charId = character.value.id;
  const groups = listActiveGroups(state.value).filter((g) => !g.memberIds.includes(charId));
  return groups;
});

const availableGroupIds = computed(() => {
  const ids = availableGroups.value.map((g) => g.id);
  return ids;
});

function confirmUnlink(groupId) {
  const charId = character.value.id;
  dispatch((s) => removeMember(s, groupId, charId));
  confirmUnlinkId.value = null;
}

function onAddGroup() {
  if (!newGroupId.value) return;
  const charId = character.value.id;
  const groupId = newGroupId.value;
  dispatch((s) => addMember(s, groupId, charId));
  newGroupId.value = null;
}

function goToGroup(id) {
  router.push({ name: 'groupProfile', params: { id } });
}

function openTx(pair) {
  tx.value = pair;
}

const vFocus = { mounted(el) { el.focus(); el.select?.(); } };

function startEdit() {
  if (character.value === null) return;
  editName.value = character.value.name;
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
  editName.value = '';
}

function saveEdit() {
  const name = editName.value.trim();
  if (!name) return;
  const id = character.value.id;
  dispatch((s) => renameCharacter(s, id, name));
  cancelEdit();
}

// Commit "da campo" (blur/invio): salva se valido, altrimenti esce senza toccare.
function commitName() {
  const name = editName.value.trim();
  if (name) saveEdit();
  else cancelEdit();
}

function onArchive() {
  const id = character.value.id;
  dispatch((s) => softDeleteCharacter(s, id));
}

function onRestore() {
  const id = character.value.id;
  dispatch((s) => restoreCharacter(s, id));
}

function onHardDelete() {
  const confirmed = window.confirm('Eliminazione DEFINITIVA e irreversibile. Confermi?');
  if (!confirmed) return;
  const id = character.value.id;
  dispatch((s) => hardDeleteCharacter(s, id));
  router.push({ name: 'characters' });
}
</script>

<style scoped>
/* Input di rinomina inline: eredita la scala del titolo per non far saltare
   l'altezza dell'header. */
.rep-profile__edit {
  font-size: 1.3rem;
  font-weight: 600;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
}
</style>
