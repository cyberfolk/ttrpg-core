<template>
  <div class="ds-card ds-card--filament rep-cc"
    :class="{ 'ds-card--muted': isArchived, 'ds-card--interactive': !isArchived }"
    :role="isArchived ? undefined : 'button'"
    :tabindex="isArchived ? undefined : 0"
    @click="isArchived ? undefined : goToProfile()"
    @keydown="isArchived ? undefined : onKeyDown($event)">

    <!-- Archived ribbon -->
    <span v-if="isArchived" class="ds-ribbon">Archiviato</span>

    <!-- Name -->
    <span class="rep-cc__name" @click.stop="goToProfile">
      {{ char.name }}
      <Icon name="goto" />
    </span>

    <!-- Score chip with tooltip -->
    <HoverTip :text="SCORE_TIP" label="Spiegazione punteggio sintetico" class-name="rep-cc__scoretip">
      <span class="ds-score ds-score--lg" :class="{ 'ds-score--empty': score === null }"
        :style="score !== null ? { background: scoreColor(score) } : undefined">
        {{ score !== null ? score : '–' }}
      </span>
    </HoverTip>

    <!-- Actions -->
    <div class="rep-cc__actions" @click.stop>
      <template v-if="isArchived">
        <button class="ds-btn ds-btn--sm ds-btn--secondary" @click="onRestore">
          <span class="ds-btn__icon"><Icon name="restore" /></span>
          Ripristina
        </button>
        <button class="ds-btn ds-btn--sm ds-btn--danger" @click="onHardDelete">
          <span class="ds-btn__icon"><Icon name="trash" /></span>
          Elimina
        </button>
      </template>
      <template v-else>
        <button class="ds-btn ds-btn--sm ds-btn--secondary" @click="onArchive">
          <span class="ds-btn__icon"><Icon name="archive" /></span>
          Archivia
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { scoreColor } from '../scoreColor.js';
import { softDeleteCharacter, restoreCharacter, hardDeleteCharacter } from '../../model/reputation.js';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';

const SCORE_TIP = "Punteggio sintetico: media delle valutazioni che gli altri personaggi danno a questo (reputazione in ingresso). Va da 1 a 100: rosso = ostile, verde = alleato. Il trattino indica nessuna relazione registrata.";

const props = defineProps({
  char:  { type: Object, required: true },
  score: { type: Number, default: null },
});

const { dispatch } = useStore();
const router = useRouter();

const isArchived = computed(() => props.char.deletedAt !== null);

function goToProfile() {
  router.push({ name: 'profile', params: { id: props.char.id } });
}

function onKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToProfile(); }
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
