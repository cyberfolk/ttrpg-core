<template>
  <section v-if="character" class="rep-profile">
    <nav class="rep-breadcrumb">
      <router-link to="/personaggi">Personaggi</router-link>
      <span> / {{ character.name }}</span>
    </nav>
    <button class="ds-btn ds-btn--ghost ds-btn--sm" @click="goBack" style="margin-bottom:1rem">
      ← Indietro
    </button>

    <div class="ds-card ds-card--filament" style="padding:1.5rem 1.75rem 1.75rem">
      <!-- Profile header -->
      <div class="rep-profile__head">
        <h2>{{ character.name }}</h2>
        <span v-if="isArchived" class="ds-badge ds-badge--ember">Archiviato</span>
        <span class="rep-profile__synthetic">
          <HoverTip :text="SCORE_TIP" label="Spiegazione punteggio sintetico" class-name="rep-cc__scoretip">
            <span class="ds-score ds-score--lg"
              :class="synthetic === null ? 'ds-score--empty' : ''"
              :style="synthetic !== null ? { background: scoreColor(synthetic) } : undefined">
              {{ synthetic !== null ? synthetic : '–' }}
            </span>
          </HoverTip>
        </span>
      </div>

      <!-- Tab switcher -->
      <div style="margin:1.1rem 0 1rem">
        <div class="ds-seg ds-seg--underline">
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

      <!-- Relations -->
      <RelationList
        v-if="tab !== 'groups'"
        :key="tab"
        :current-id="character.id"
        :direction="tab"
        @open-tx="openTx"
      />

      <!-- Gruppi del personaggio -->
      <template v-else>
        <p v-if="memberGroups.length === 0" class="rep-empty">Non è membro di alcun gruppo.</p>
        <div v-else class="rep-table-wrap">
          <table class="rep-table">
            <thead>
              <tr>
                <th class="rep-table__num">#</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(group, i) in memberGroups" :key="group.id"
                class="rep-table__row--clickable" role="button" tabindex="0"
                @click="goToGroup(group.id)"
                @keydown="(e) => onGroupKey(e, group.id)">

                <td class="rep-table__num">{{ i + 1 }}</td>
                <td>
                  <span class="rep-table__name" @click.stop="goToGroup(group.id)">
                    {{ group.name }}
                    <Icon name="goto" />
                  </span>
                </td>
                <td>
                  <span v-if="group.type" class="ds-badge">{{ group.type }}</span>
                  <span v-else>–</span>
                </td>
                <td @click.stop>
                  <div class="rep-table__actions">
                    <HoverTip text="Apri gruppo" label="Apri gruppo" :tab-index="-1">
                      <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
                        @click="goToGroup(group.id)" aria-label="Apri gruppo">
                        <Icon name="goto" />
                      </button>
                    </HoverTip>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Ornament -->
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
      v-if="tx"
      :from-id="tx.fromId"
      :to-id="tx.toId"
      @close="tx = null"
    />
  </section>

  <NotFound v-else />
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { averageIncomingScore, listActiveGroups } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import RelationList from './RelationList.vue';
import TransactionModal from './TransactionModal.vue';
import NotFound from './NotFound.vue';
import HoverTip from './HoverTip.vue';
import Icon from './Icon.vue';
import { SCORE_TIP } from '../uiCopy.js';

const props = defineProps({
  id: { type: String, required: true },
});

const { state } = useStore();
const ui = useUiState();
const router = useRouter();
const tab = ref('in');
const tx = ref(null);

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

function goBack() {
  router.push('/personaggi');
}

function goToGroup(id) {
  router.push({ name: 'groupProfile', params: { id } });
}

function onGroupKey(e, id) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToGroup(id); }
}

function openTx(pair) {
  tx.value = pair;
}
</script>
