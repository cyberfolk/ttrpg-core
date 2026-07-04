<template>
  <div class="ds-card ds-card--filament rep-cc"
    :class="{ 'ds-card--interactive': !editing }"
    :role="!editing ? 'button' : undefined"
    :tabindex="!editing ? 0 : undefined"
    @click="!editing ? goToProfile() : undefined"
    @keydown="!editing ? onKeyDown($event) : undefined">

    <!-- Apri scheda: freccia nell'angolo -->
    <button v-if="!editing" class="rep-cc__corner" type="button"
      @click.stop="goToProfile" aria-label="Apri scheda">
      <Icon name="goto" />
    </button>

    <!-- Nome -->
    <div class="rep-cc__namerow" @click.stop="!editing ? goToProfile() : undefined" :title="$name(group)">
      <span v-if="!editing" class="rep-cc__name">{{ $name(group) }}</span>
      <input v-else ref="nameInput" class="ds-input rep-cc__nameinput" type="text" v-model="editName"
        @click.stop @keydown.enter="saveEdit" @keydown.escape="cancelEdit" aria-label="Nome gruppo" />
    </div>

    <!-- Meta: numero membri -->
    <div class="rep-gc__meta">
      <span class="rep-gc__members">{{ memberCount }} {{ memberCount === 1 ? 'membro' : 'membri' }}</span>
    </div>

    <!-- Punteggio sintetico -->
    <HoverTip :text="SCORE_TIP" label="Spiegazione punteggio sintetico" class-name="rep-cc__scoretip">
      <span class="ds-score ds-score--lg" :class="{ 'ds-score--empty': score === null }"
        :style="score !== null ? { background: scoreColor(score) } : undefined">
        {{ score !== null ? score : '–' }}
      </span>
    </HoverTip>

    <!-- Azioni: in modifica → Salva/Annulla; altrimenti → ingranaggio con menu -->
    <div class="rep-cc__actions" @click.stop>
      <template v-if="editing">
        <HoverTip text="Salva" label="Salva modifiche" :tab-index="-1">
          <button class="ds-btn ds-btn--sm ds-btn--primary ds-btn--icon"
            @click="saveEdit" aria-label="Salva modifiche">
            <Icon name="check" />
          </button>
        </HoverTip>
        <HoverTip text="Annulla" label="Annulla modifiche" :tab-index="-1">
          <button class="ds-btn ds-btn--sm ds-btn--ghost ds-btn--icon"
            @click="cancelEdit" aria-label="Annulla modifiche">
            <Icon name="close" />
          </button>
        </HoverTip>
      </template>
      <ActionMenu v-else label="Azioni gruppo" icon="gear">
        <template #default="{ close }">
          <button type="button" class="ds-menu__item" @click="startEdit(); close()">
            <Icon name="edit" /> Rinomina
          </button>
          <button type="button" class="ds-menu__item" @click="onArchive(); close()">
            <Icon name="archive" /> Archivia
          </button>
        </template>
      </ActionMenu>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { averageIncomingScore, renameGroup, softDeleteGroup } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import ActionMenu from './ActionMenu.vue';
import { SCORE_TIP } from '../uiCopy.js';

const props = defineProps({
  group: { type: Object, required: true },
});

const { state, dispatch } = useStore();
const ui = useUiState();
const router = useRouter();

const editing = ref(false);
const editName = ref('');
const nameInput = ref(null);

const memberCount = computed(() => props.group.memberIds.length);
const score = computed(() => averageIncomingScore(state.value, props.group.id, ui.showArchived));

function goToProfile() {
  router.push({ name: 'groupProfile', params: { id: props.group.id } });
}

function onKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToProfile(); }
}

async function startEdit() {
  editing.value = true;
  editName.value = props.group.name;
  await nextTick();
  nameInput.value?.focus();
  nameInput.value?.select();
}

function cancelEdit() {
  editing.value = false;
  editName.value = '';
}

function saveEdit() {
  const name = editName.value.trim();
  if (!name) return;
  dispatch((s) => renameGroup(s, props.group.id, name));
  cancelEdit();
}

function onArchive() {
  dispatch((s) => softDeleteGroup(s, props.group.id));
}
</script>

<style scoped>
.rep-gc__meta {
  display: flex; align-items: center; gap: .5rem; flex-wrap: wrap;
  margin-top: -.15rem;
}
.rep-gc__members {
  font-size: var(--fs-sm); color: var(--text-muted); white-space: nowrap;
}
</style>
