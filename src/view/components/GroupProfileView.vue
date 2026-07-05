<template>
  <section v-if="group" class="rep-profile">
    <nav class="rep-breadcrumb">
      <router-link to="/gruppi">Gruppi</router-link>
      <span> / {{ $name(group) }}</span>
    </nav>

    <RecordPager v-if="recordIndex >= 0" :index="recordIndex" :total="recordIds.length"
      @update:index="goToIndex" />

    <!-- Intestazione gruppo -->
    <div class="ds-card ds-card--filament rep-profile__card">
      <div class="rep-profile__head">
        <!-- Riga titolo: nome e ingranaggio azioni. In editing: input + Salva/Annulla. -->
        <div class="rep-profile__titlerow">
          <h2 v-if="editing === false">{{ $name(group) }}</h2>
          <span v-else class="rep-gp-edit">
            <input class="ds-input rep-gp-edit__name" type="text" v-model="editName"
              aria-label="Nuovo nome" @keydown.enter="saveEdit" @keydown.escape="cancelEdit" />
          </span>

          <div v-if="editing" class="rep-profile__editactions">
            <button class="ds-btn ds-btn--sm ds-btn--primary" @click="saveEdit">
              <span class="ds-btn__icon"><Icon name="check" /></span>
              Salva
            </button>
            <button class="ds-btn ds-btn--sm ds-btn--ghost" @click="cancelEdit">
              <span class="ds-btn__icon"><Icon name="close" /></span>
              Annulla
            </button>
          </div>
          <ActionMenu v-else class="rep-profile__gear" label="Azioni gruppo" icon="gear">
            <template #default="{ close }">
              <button type="button" class="ds-menu__item" @click="showScores(); close()">
                <Icon name="sliders" /> Punteggi
              </button>
              <template v-if="isArchived === false">
                <button type="button" class="ds-menu__item" @click="startEdit(); close()">
                  <Icon name="edit" /> Rinomina
                </button>
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

        <!-- Reputazione complessiva, subito sotto il nome, con il badge di stato -->
        <div class="rep-profile__meta">
          <span class="rep-profile__synthetic">
            <HoverTip :text="SCORE_TIP" label="Spiegazione punteggio sintetico" class-name="rep-cc__scoretip">
              <span class="rep-profile__synthetic-inner">
                <span class="rep-profile__synthetic-label">Reputazione<br>Complessiva</span>
                <ScoreChip :score="synthetic" size="lg" />
              </span>
            </HoverTip>
          </span>
          <span v-if="isArchived" class="ds-badge ds-badge--ember">Archiviato</span>
        </div>
      </div>

      <!-- Sezioni con tab switcher -->
      <div class="rep-gp-tabs">
        <div class="ds-seg ds-seg--underline">
          <button class="ds-seg__btn" :class="{ active: tab === 'in' }" @click="tab = 'in'">
            Di lui pensano
          </button>
          <button class="ds-seg__btn" :class="{ active: tab === 'out' }" @click="tab = 'out'">
            Lui pensa
          </button>
          <button class="ds-seg__btn" :class="{ active: tab === 'membri' }" @click="tab = 'membri'">
            Membri
          </button>
          <button v-if="showAdvanced" class="ds-seg__btn" :class="{ active: tab === 'punteggi' }"
            @click="tab = 'punteggi'">
            Punteggi
          </button>
        </div>
      </div>

      <!-- Relazioni dirette gruppo↔nodo (stesso componente dei personaggi) -->
      <RelationList v-if="tab === 'in' || tab === 'out'" :key="tab"
        :current-id="group.id" :direction="tab" @open-tx="openTxFromList" />

      <!-- Tab: Membri -->
      <div v-if="tab === 'membri'">
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
              <tr v-if="membersTotal === 0">
                <td colspan="3" class="rep-empty">Nessun membro nel gruppo.</td>
              </tr>
              <tr v-for="(char, i) in members" :key="char.id"
                class="rep-table__row--clickable" role="button" tabindex="0"
                @click="goToChar(char.id)" v-activate>
                <td class="rep-table__num">{{ i + 1 }}</td>
                <td>
                  <span class="rep-table__name" @click.stop="goToChar(char.id)">
                    {{ $name(char) }}
                    <Icon name="goto" />
                  </span>
                </td>
                <td @click.stop>
                  <div class="rep-table__actions">
                    <HoverTip text="Sgancia" label="Sgancia membro" :tab-index="-1">
                      <button class="ds-btn ds-btn--sm ds-btn--danger ds-btn--icon"
                        type="button" @click="onRemoveMember(char.id)" aria-label="Sgancia membro">
                        <Icon name="unlink" />
                      </button>
                    </HoverTip>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="addableCandidates.length > 0">
              <tr class="rep-addrow">
                <td class="rep-table__num"></td>
                <td>
                  <EntityPicker
                    v-model="selectedCandidateId"
                    :only="addableCandidateIds"
                    label="Personaggio da aggiungere"
                    placeholder="Scegli un personaggio…"
                    hide-label />
                </td>
                <td>
                  <HoverTip text="Aggiungi membro" label="Aggiungi membro" :tab-index="-1">
                    <button class="ds-btn ds-btn--primary ds-btn--sm ds-btn--icon"
                      type="button" :disabled="!selectedCandidateId" aria-label="Aggiungi membro"
                      @click="onAddMember">
                      <Icon name="plus" />
                    </button>
                  </HoverTip>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p v-if="addableCandidates.length === 0 && activeCharacters.length > 0" class="rep-empty" style="margin-top:0.75rem">
          Tutti i personaggi attivi sono già membri.
        </p>
        <p v-else-if="addableCandidates.length === 0" class="rep-empty" style="margin-top:0.75rem">
          Nessun personaggio disponibile da aggiungere.
        </p>
      </div>

      <!-- Tab: Punteggi (4 numeri per coppia X↔G) -->
      <div v-if="tab === 'punteggi'">
        <p v-if="relevantChars.length === 0" class="rep-empty">
          Nessun personaggio con relazione verso questo gruppo.
        </p>
        <div v-for="char in relevantChars" :key="char.id" class="rep-group-scores">
          <div class="rep-group-scores__head"
            role="button" tabindex="0"
            @click="goToChar(char.id)" v-activate>
            {{ $name(char) }}
            <Icon name="goto" />
          </div>
          <div class="rep-group-scores__grid">
            <!-- X → G diretto -->
            <div class="rep-group-scores__cell">
              <span class="rep-group-scores__label">{{ $name(char) }} → gruppo (diretto)</span>
              <ScoreChip :score="scoreXtoGDirect(char.id)" size="sm" empty="n/d" />
            </div>
            <!-- X → G derivato (membri) -->
            <div class="rep-group-scores__cell">
              <span class="rep-group-scores__label">{{ $name(char) }} → gruppo (membri)</span>
              <ScoreChip :score="scoreXtoGDerived(char.id)" size="sm" empty="n/d" />
            </div>
            <!-- G → X diretto -->
            <div class="rep-group-scores__cell">
              <span class="rep-group-scores__label">Gruppo → {{ $name(char) }} (diretto)</span>
              <ScoreChip :score="scoreGtoXDirect(char.id)" size="sm" empty="n/d" />
            </div>
            <!-- G → X derivato (membri) -->
            <div class="rep-group-scores__cell">
              <span class="rep-group-scores__label">Gruppo → {{ $name(char) }} (membri)</span>
              <ScoreChip :score="scoreGtoXDerived(char.id)" size="sm" empty="n/d" />
            </div>
          </div>
        </div>
      </div>

      <!-- Ornamento -->
      <div style="margin-top:22px">
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
      v-if="activeTx"
      :from-id="activeTx.fromId"
      :to-id="activeTx.toId"
      @close="activeTx = null"
    />
  </section>

  <NotFound v-else />
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import {
  listActiveCharacters,
  listActiveGroups,
  listArchivedGroups,
  addMember,
  removeMember,
  computeScore,
  hasTransaction,
  averageIncomingScore,
  groupDerivedIncoming,
  groupDerivedOutgoing,
  renameGroup,
  softDeleteGroup,
  restoreGroup,
  hardDeleteGroup,
} from '../../model/reputation.js';
import { SCORE_TIP } from '../uiCopy.js';
import TransactionModal from './TransactionModal.vue';
import NotFound from './NotFound.vue';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import ActionMenu from './ActionMenu.vue';
import ScoreChip from './ScoreChip.vue';
import RecordPager from './RecordPager.vue';
import RelationList from './RelationList.vue';
import EntityPicker from './EntityPicker.vue';

const props = defineProps({
  id: { type: String, required: true },
});

const { state, dispatch } = useStore();
const ui = useUiState();
const router = useRouter();

const tab = ref('in');
const selectedCandidateId = ref(null);
const activeTx = ref(null);

// Navigazione scheda-per-scheda tra gruppi (come i personaggi). Ordine = default
// della lista gruppi (nome asc); archiviati in coda solo se showArchived è attivo.
const recordIds = computed(() => {
  const byName = (a, b) => a.name.localeCompare(b.name);
  const active = [...listActiveGroups(state.value)].sort(byName);
  const ids = active.map((g) => g.id);
  if (ui.showArchived) {
    const archived = [...listArchivedGroups(state.value)].sort(byName);
    ids.push(...archived.map((g) => g.id));
  }
  return ids;
});
const recordIndex = computed(() => recordIds.value.indexOf(props.id));

function goToIndex(index) {
  const id = recordIds.value[index];
  if (id) router.push({ name: 'groupProfile', params: { id } });
}
// Rinomina inline del gruppo dall'header della scheda.
const editing = ref(false);
const editName = ref('');

// Tab "Punteggi" nascosto di default: rivelato dall'azione Punteggi nel menu
// dell'ingranaggio, che poi ci porta direttamente sopra.
const showAdvanced = ref(false);
function showScores() {
  showAdvanced.value = true;
  tab.value = 'punteggi';
}

const group = computed(() => {
  const found = state.value.groups.find((g) => g.id === props.id) || null;
  return found;
});

const isArchived = computed(() => {
  const archived = group.value !== null && group.value.deletedAt !== null;
  return archived;
});

// Reputazione complessiva del gruppo-come-entita': media dei giudizi diretti
// ricevuti (stessa metrica del profilo personaggio).
const synthetic = computed(() => {
  if (group.value === null) return null;
  const score = averageIncomingScore(state.value, group.value.id, ui.showArchived);
  return score;
});

const activeCharacters = computed(() => listActiveCharacters(state.value));

const members = computed(() => {
  if (!group.value) return [];
  const memberList = group.value.memberIds
    .map((mid) => state.value.characters.find((c) => c.id === mid))
    .filter(Boolean);
  return memberList;
});

const membersTotal = computed(() => members.value.length);

const addableCandidates = computed(() => {
  if (!group.value) return [];
  const memberSet = new Set(group.value.memberIds);
  const candidates = activeCharacters.value.filter((c) => !memberSet.has(c.id));
  return candidates;
});

const addableCandidateIds = computed(() => {
  const ids = addableCandidates.value.map((c) => c.id);
  return ids;
});

// Personaggi rilevanti per il tab punteggi:
// membri del gruppo + qualsiasi personaggio attivo con transazioni dirette verso/da il gruppo.
const relevantChars = computed(() => {
  if (!group.value) return [];
  const groupId = props.id;
  const memberSet = new Set(group.value.memberIds);
  const active = activeCharacters.value;
  const relevant = active.filter((c) => {
    const isMember = memberSet.has(c.id);
    const hasDirect = hasTransaction(state.value, c.id, groupId) || hasTransaction(state.value, groupId, c.id);
    const hasDerived = groupDerivedIncoming(state.value, c.id, groupId) !== null ||
      groupDerivedOutgoing(state.value, groupId, c.id) !== null;
    const result = isMember || hasDirect || hasDerived;
    return result;
  });
  return relevant;
});

function scoreXtoGDirect(charId) {
  const groupId = props.id;
  const hasTx = hasTransaction(state.value, charId, groupId);
  if (!hasTx) return null;
  const score = computeScore(state.value, charId, groupId);
  return score;
}

function scoreXtoGDerived(charId) {
  const groupId = props.id;
  const score = groupDerivedIncoming(state.value, charId, groupId);
  return score;
}

function scoreGtoXDirect(charId) {
  const groupId = props.id;
  const hasTx = hasTransaction(state.value, groupId, charId);
  if (!hasTx) return null;
  const score = computeScore(state.value, groupId, charId);
  return score;
}

function scoreGtoXDerived(charId) {
  const groupId = props.id;
  const score = groupDerivedOutgoing(state.value, groupId, charId);
  return score;
}

function onAddMember() {
  const charId = selectedCandidateId.value;
  if (!charId) return;
  dispatch((s) => addMember(s, props.id, charId));
  selectedCandidateId.value = null;
}

function onRemoveMember(charId) {
  dispatch((s) => removeMember(s, props.id, charId));
}

function goToChar(id) {
  router.push({ name: 'profile', params: { id } });
}

// Apertura modale dal click su una riga di RelationList (emette gia' la coppia).
function openTxFromList(pair) {
  activeTx.value = pair;
}

function startEdit() {
  if (group.value === null) return;
  editName.value = group.value.name;
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
  editName.value = '';
}

function saveEdit() {
  const name = editName.value.trim();
  if (!name) return;
  const id = group.value.id;
  dispatch((s) => renameGroup(s, id, name));
  cancelEdit();
}

function onArchive() {
  const id = group.value.id;
  dispatch((s) => softDeleteGroup(s, id));
}

function onRestore() {
  const id = group.value.id;
  dispatch((s) => restoreGroup(s, id));
}

function onHardDelete() {
  const confirmed = window.confirm('Eliminare definitivamente il gruppo? Questa operazione non è reversibile.');
  if (!confirmed) return;
  const id = group.value.id;
  dispatch((s) => hardDeleteGroup(s, id));
  router.push({ name: 'groups' });
}
</script>

<style scoped>
/* Rinomina inline: nome grande come il titolo. */
.rep-gp-edit {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.rep-gp-edit__name {
  font-size: 1.3rem;
  font-weight: 600;
  max-width: 100%;
}

.rep-gp-tabs {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 0.75rem; flex-wrap: wrap; margin: 1.1rem 0 1.5rem;
}
.rep-group-scores {
  border-bottom: 1px solid var(--ds-border, rgba(255,255,255,0.08));
  padding: 0.75rem 0;
}

.rep-group-scores:last-child {
  border-bottom: none;
}

.rep-group-scores__head {
  font-weight: 600;
  margin-bottom: 0.5rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.rep-group-scores__head:hover {
  text-decoration: underline;
}

.rep-group-scores__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
}

.rep-group-scores__cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.rep-group-scores__label {
  font-size: 0.8rem;
  opacity: 0.75;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
