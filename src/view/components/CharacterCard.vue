<template>
  <div class="ds-card ds-card--filament rep-cc"
    :class="{ 'ds-card--muted': isArchived, 'ds-card--interactive': isInteractive }"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @click="isInteractive ? goToProfile() : undefined"
    @keydown="isInteractive ? onKeyDown($event) : undefined">

    <!-- Archived ribbon -->
    <span v-if="isArchived" class="ds-ribbon">Archiviato</span>

    <!-- Apri scheda: freccia nell'angolo in alto a destra -->
    <button v-if="isInteractive" class="rep-cc__corner" type="button"
      @click.stop="goToProfile" aria-label="Apri scheda">
      <Icon name="goto" />
    </button>

    <!-- Name -->
    <div class="rep-cc__namerow" @click.stop="isInteractive ? goToProfile() : undefined" :title="$name(char)">
      <span v-if="!editing" class="rep-cc__name">{{ $name(char) }}</span>
      <input v-else ref="nameInput" class="ds-input rep-cc__nameinput" type="text" v-model="editName"
        @click.stop @keydown.enter="saveEdit" @keydown.escape="cancelEdit" aria-label="Nome personaggio" />
    </div>

    <!-- Score chip with tooltip -->
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
      <ActionMenu v-else label="Azioni personaggio" icon="gear">
        <template #default="{ close }">
          <template v-if="isArchived">
            <button type="button" class="ds-menu__item" @click="onRestore(); close()">
              <Icon name="restore" /> Ripristina
            </button>
            <button type="button" class="ds-menu__item ds-menu__item--danger" @click="onHardDelete(); close()">
              <Icon name="trash" /> Elimina
            </button>
          </template>
          <template v-else>
            <button type="button" class="ds-menu__item" @click="startEdit(); close()">
              <Icon name="edit" /> Rinomina
            </button>
            <button type="button" class="ds-menu__item" @click="onArchive(); close()">
              <Icon name="archive" /> Archivia
            </button>
          </template>
        </template>
      </ActionMenu>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { scoreColor } from '../scoreColor.js';
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter, renameCharacter } from '../../model/reputation.js';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import ActionMenu from './ActionMenu.vue';
import { SCORE_TIP } from '../uiCopy.js';

const props = defineProps({
  char:  { type: Object, required: true },
  score: { type: Number, default: null },
});

const { dispatch } = useStore();
const router = useRouter();

const editing = ref(false);
const editName = ref('');
const nameInput = ref(null);

const isArchived = computed(() => props.char.deletedAt !== null);
// Card navigabile solo se attiva e non in modifica.
const isInteractive = computed(() => !isArchived.value && !editing.value);

function goToProfile() {
  router.push({ name: 'profile', params: { id: props.char.id } });
}

function onKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToProfile(); }
}

async function startEdit() {
  editing.value = true;
  editName.value = props.char.name;
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
  dispatch((s) => renameCharacter(s, props.char.id, name));
  cancelEdit();
}

function onArchive() {
  dispatch((s) => softDeleteCharacter(s, props.char.id));
}

function onRestore() {
  dispatch((s) => restoreCharacter(s, props.char.id));
}

function onHardDelete() {
  if (window.confirm('Eliminazione DEFINITIVA e irreversibile. Confermi?')) {
    dispatch((s) => hardDeleteCharacter(s, props.char.id));
  }
}
</script>
