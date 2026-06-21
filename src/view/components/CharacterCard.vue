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

    <!-- Actions: solo icone, titolo azione nel tooltip al hover -->
    <div class="rep-cc__actions" @click.stop>
      <template v-if="isArchived">
        <HoverTip text="Ripristina" label="Ripristina personaggio" :tab-index="-1">
          <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
            @click="onRestore" aria-label="Ripristina personaggio">
            <Icon name="restore" />
          </button>
        </HoverTip>
        <HoverTip text="Elimina" label="Elimina personaggio" :tab-index="-1">
          <button class="ds-btn ds-btn--sm ds-btn--danger ds-btn--icon"
            @click="onHardDelete" aria-label="Elimina personaggio">
            <Icon name="trash" />
          </button>
        </HoverTip>
      </template>
      <template v-else>
        <HoverTip text="Archivia" label="Archivia personaggio" :tab-index="-1">
          <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
            @click="onArchive" aria-label="Archivia personaggio">
            <Icon name="archive" />
          </button>
        </HoverTip>
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
import { SCORE_TIP } from '../uiCopy.js';

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
