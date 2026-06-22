<template>
  <section v-if="group" class="rep-profile">
    <nav class="rep-breadcrumb">
      <router-link to="/gruppi">Gruppi</router-link>
      <span> / {{ group.name }}</span>
    </nav>
    <button class="ds-btn ds-btn--ghost ds-btn--sm" @click="goBack" style="margin-bottom:1rem">
      ← Indietro
    </button>

    <!-- Intestazione gruppo -->
    <div class="ds-card ds-card--filament" style="padding:1.5rem 1.75rem 1.75rem">
      <div class="rep-profile__head">
        <h2>
          {{ group.name }}
          <span v-if="group.type" class="ds-badge" style="margin-left:0.5rem">{{ group.type }}</span>
        </h2>
        <span v-if="isArchived" class="ds-badge ds-badge--ember">Archiviato</span>
      </div>

      <!-- Sezioni con tab switcher -->
      <div style="margin:1.1rem 0 1rem">
        <div class="ds-seg ds-seg--underline">
          <button class="ds-seg__btn" :class="{ active: tab === 'membri' }" @click="tab = 'membri'">
            Membri
          </button>
          <button class="ds-seg__btn" :class="{ active: tab === 'punteggi' }" @click="tab = 'punteggi'">
            Punteggi
          </button>
          <button class="ds-seg__btn" :class="{ active: tab === 'transazioni' }" @click="tab = 'transazioni'">
            Transazioni dirette
          </button>
        </div>
      </div>

      <!-- Tab: Membri -->
      <div v-if="tab === 'membri'">
        <Pager :page="membersPage" :page-size="MEMBERS_PAGE_SIZE" :total="membersTotal"
          @update:page="membersPage = $event" />
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
              <tr v-for="(char, i) in pagedMembers" :key="char.id"
                class="rep-table__row--clickable" role="button" tabindex="0"
                @click="goToChar(char.id)"
                @keydown="(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToChar(char.id); } }">
                <td class="rep-table__num">{{ membersPage * MEMBERS_PAGE_SIZE + i + 1 }}</td>
                <td>
                  <span class="rep-table__name" @click.stop="goToChar(char.id)">
                    {{ char.name }}
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
                <td></td>
                <td>
                  <select class="ds-input" v-model="selectedCandidateId" aria-label="Personaggio da aggiungere">
                    <option value="">Scegli un personaggio…</option>
                    <option v-for="c in addableCandidates" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
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
            @click="goToChar(char.id)"
            @keydown="(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToChar(char.id); } }">
            {{ char.name }}
            <Icon name="goto" />
          </div>
          <div class="rep-group-scores__grid">
            <!-- X → G diretto -->
            <div class="rep-group-scores__cell">
              <span class="rep-group-scores__label">{{ char.name }} → gruppo (diretto)</span>
              <span class="ds-score ds-score--sm"
                :class="scoreXtoGDirect(char.id) === null ? 'ds-score--empty' : ''"
                :style="scoreXtoGDirect(char.id) !== null ? { background: scoreColor(scoreXtoGDirect(char.id)) } : undefined">
                {{ scoreXtoGDirect(char.id) !== null ? scoreXtoGDirect(char.id) : 'n/d' }}
              </span>
            </div>
            <!-- X → G derivato (membri) -->
            <div class="rep-group-scores__cell">
              <span class="rep-group-scores__label">{{ char.name }} → gruppo (membri)</span>
              <span class="ds-score ds-score--sm"
                :class="scoreXtoGDerived(char.id) === null ? 'ds-score--empty' : ''"
                :style="scoreXtoGDerived(char.id) !== null ? { background: scoreColor(scoreXtoGDerived(char.id)) } : undefined">
                {{ scoreXtoGDerived(char.id) !== null ? scoreXtoGDerived(char.id) : 'n/d' }}
              </span>
            </div>
            <!-- G → X diretto -->
            <div class="rep-group-scores__cell">
              <span class="rep-group-scores__label">Gruppo → {{ char.name }} (diretto)</span>
              <span class="ds-score ds-score--sm"
                :class="scoreGtoXDirect(char.id) === null ? 'ds-score--empty' : ''"
                :style="scoreGtoXDirect(char.id) !== null ? { background: scoreColor(scoreGtoXDirect(char.id)) } : undefined">
                {{ scoreGtoXDirect(char.id) !== null ? scoreGtoXDirect(char.id) : 'n/d' }}
              </span>
            </div>
            <!-- G → X derivato (membri) -->
            <div class="rep-group-scores__cell">
              <span class="rep-group-scores__label">Gruppo → {{ char.name }} (membri)</span>
              <span class="ds-score ds-score--sm"
                :class="scoreGtoXDerived(char.id) === null ? 'ds-score--empty' : ''"
                :style="scoreGtoXDerived(char.id) !== null ? { background: scoreColor(scoreGtoXDerived(char.id)) } : undefined">
                {{ scoreGtoXDerived(char.id) !== null ? scoreGtoXDerived(char.id) : 'n/d' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Transazioni dirette sul gruppo -->
      <div v-if="tab === 'transazioni'">
        <p style="font-size:0.85rem;opacity:0.7;margin-bottom:1rem">
          Transazioni tra personaggi e il gruppo come entità (non attraverso i membri).
        </p>

        <!-- Apri modale transazione -->
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
          <div style="flex:1;min-width:10rem">
            <label class="ds-field__label" style="display:block;margin-bottom:0.25rem">Personaggio</label>
            <select class="ds-input" v-model="txCharId">
              <option value="">— Scegli personaggio —</option>
              <option v-for="c in activeCharacters" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div style="flex:1;min-width:10rem">
            <label class="ds-field__label" style="display:block;margin-bottom:0.25rem">Direzione</label>
            <select class="ds-input" v-model="txDirection">
              <option value="to">Personaggio → Gruppo</option>
              <option value="from">Gruppo → Personaggio</option>
            </select>
          </div>
          <div style="align-self:flex-end">
            <button class="ds-btn ds-btn--primary ds-btn--sm" :disabled="!txCharId"
              @click="openTx">
              Apri transazioni
            </button>
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
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import {
  listActiveCharacters,
  listActiveGroups,
  addMember,
  removeMember,
  computeScore,
  hasTransaction,
  groupDerivedIncoming,
  groupDerivedOutgoing,
} from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import TransactionModal from './TransactionModal.vue';
import NotFound from './NotFound.vue';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import Pager from './Pager.vue';

const MEMBERS_PAGE_SIZE = 10;

const props = defineProps({
  id: { type: String, required: true },
});

const { state, dispatch } = useStore();
const router = useRouter();

const tab = ref('membri');
const selectedCandidateId = ref('');
const txCharId = ref('');
const txDirection = ref('to');
const activeTx = ref(null);

const group = computed(() => {
  const found = state.value.groups.find((g) => g.id === props.id) || null;
  return found;
});

const isArchived = computed(() => {
  const archived = group.value !== null && group.value.deletedAt !== null;
  return archived;
});

const activeCharacters = computed(() => listActiveCharacters(state.value));

const members = computed(() => {
  if (!group.value) return [];
  const memberList = group.value.memberIds
    .map((mid) => state.value.characters.find((c) => c.id === mid))
    .filter(Boolean);
  return memberList;
});

const membersPage = ref(0);
const membersTotal = computed(() => members.value.length);
const pagedMembers = computed(() => {
  const start = membersPage.value * MEMBERS_PAGE_SIZE;
  const slice = members.value.slice(start, start + MEMBERS_PAGE_SIZE);
  return slice;
});

// Clamp pagina quando il totale cala (sgancio di un membro).
watch(membersTotal, (n) => {
  const lastPage = Math.max(0, Math.ceil(n / MEMBERS_PAGE_SIZE) - 1);
  if (membersPage.value > lastPage) membersPage.value = lastPage;
});

const addableCandidates = computed(() => {
  if (!group.value) return [];
  const memberSet = new Set(group.value.memberIds);
  const candidates = activeCharacters.value.filter((c) => !memberSet.has(c.id));
  return candidates;
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
  selectedCandidateId.value = '';
}

function onRemoveMember(charId) {
  dispatch((s) => removeMember(s, props.id, charId));
}

function goBack() {
  router.push('/gruppi');
}

function goToChar(id) {
  router.push({ name: 'profile', params: { id } });
}

function openTx() {
  const charId = txCharId.value;
  if (!charId) return;
  const groupId = props.id;
  const pair = txDirection.value === 'to'
    ? { fromId: charId, toId: groupId }
    : { fromId: groupId, toId: charId };
  activeTx.value = pair;
}
</script>

<style scoped>
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
}
</style>
