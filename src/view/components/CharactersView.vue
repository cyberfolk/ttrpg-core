<template>
  <section>
    <!-- Toolbar -->
    <div class="rep-toolbar">
      <!-- Search -->
      <div class="rep-toolbar__search">
        <span class="ds-search">
          <span class="ds-search__icon"><Icon name="search" /></span>
          <input class="ds-input ds-input--with-icon" type="search" placeholder="Cerca per nome…"
            v-model="ui.search" :disabled="searchDisabled" />
        </span>
      </div>

      <!-- Azioni: toggle vista (griglia<->lista) + aggiungi, icone compatte -->
      <div class="rep-toolbar__actions">
        <HoverTip :text="isList ? 'Mostra come griglia' : 'Mostra come lista'" :tab-index="-1">
          <button class="ds-btn ds-btn--secondary ds-btn--icon" @click="toggleView"
            :aria-label="isList ? 'Mostra come griglia' : 'Mostra come lista'">
            <Icon :name="isList ? 'gallery' : 'list'" />
          </button>
        </HoverTip>
        <HoverTip text="Aggiungi personaggio" :tab-index="-1">
          <button class="ds-btn ds-btn--primary ds-btn--icon" :class="{ coach: coachAdd }"
            @click="openAdd" aria-label="Aggiungi personaggio">
            <Icon name="plus" />
          </button>
        </HoverTip>
        <!-- Coach-mark primo accesso: indica quale bottone crea il personaggio. -->
        <span v-if="coachAdd" class="coach-tag coach-tag--end">{{ ONBOARD.coach.add }}</span>
      </div>
    </div>

    <!-- Primo accesso: nessun personaggio e nessuna ricerca attiva. Insegna cosa
         sono i personaggi e instrada a crearne il primo. -->
    <EmptyState v-if="items.length === 0 && !ui.search" icon="user"
      :title="ONBOARD.charactersZero.title" :body="ONBOARD.charactersZero.body">
      <button type="button" class="ds-btn ds-btn--primary" @click="openAdd">
        <Icon name="plus" /> {{ ONBOARD.charactersZero.cta }}
      </button>
    </EmptyState>

    <!-- Ricerca senza risultati: stato secondario, tono leggero. -->
    <EmptyState v-else-if="items.length === 0" compact icon="search"
      :title="ONBOARD.noResults.title" :body="ONBOARD.noResults.body" />

    <!-- Un solo personaggio (senza ricerca): il flusso guidato ha appena creato il
         primo e qui l'utente si areniva. Guida arioso, solo glifo + titolo + corpo:
         niente azioni né riga nav (sarebbero rumore) — a guidare ci pensano il "+"
         pulsante (coach-mark) e la navigazione pulsante fra le sezioni. Sparisce da
         sola al secondo personaggio. -->
    <EmptyState v-else-if="items.length === 1 && !ui.search" icon="users"
      :title="ONBOARD.charactersOne.title" :body="ONBOARD.charactersOne.body">
      <p class="rep-onboard-cta">{{ ONBOARD.charactersOne.cta }}</p>
    </EmptyState>

    <!-- Views -->
    <GalleryView v-else-if="ui.activeView === 'gallery'" :items="items" />
    <ListView    v-else :items="items" />

    <!-- Add character dialog -->
    <div v-if="addOpen" class="ds-overlay" @click.self="closeAdd">
      <div class="ds-dialog" style="max-width:420px">
        <div class="ds-dialog__head">
          <h3 class="ds-dialog__title">Aggiungi personaggio</h3>
          <button class="ds-dialog__close" @click="closeAdd" aria-label="Chiudi">
            <Icon name="close" />
          </button>
        </div>
        <div class="ds-dialog__body">
          <form class="rep-addchar" @submit.prevent="onAdd">
            <span class="ds-field ds-field--block">
              <label class="ds-field__label" for="add-char-name">Nome del personaggio</label>
              <span class="ds-field__wrap">
                <input id="add-char-name" ref="nameInput" class="ds-input" type="text"
                  placeholder="Es. Aragorn" v-model="newName" />
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
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUiState } from '../useUiState.js';
import { useStore } from '../useStore.js';
import { useDisplayedCharacters } from '../useDisplayedCharacters.js';
import { addCharacter, listActiveCharacters } from '../../model/reputation.js';
import { ONBOARD } from '../uiCopy.js';
import GalleryView from './GalleryView.vue';
import ListView from './ListView.vue';
import EmptyState from './EmptyState.vue';
import HoverTip from './HoverTip.vue';
import Icon from './Icon.vue';

const ui = useUiState();
const route = useRoute();
const router = useRouter();
const { state, dispatch } = useStore();
const { items } = useDisplayedCharacters();

// Ricerca disabilitata finché non ci sono almeno due personaggi: con 0/1 non c'è
// nulla da filtrare, e il campo attivo sarebbe solo rumore nel primo accesso.
const searchDisabled = computed(() => listActiveCharacters(state.value).length < 2);
const newName = ref('');
const addOpen = ref(false);
const nameInput = ref(null);

// Coach-mark primo accesso: attivo con un solo personaggio (e nessuna ricerca),
// stesso stato che mostra il pannello guida. Indica il "+" che crea il secondo.
const coachAdd = computed(() => items.value.length === 1 && !ui.search);

// Toggle vista: alterna griglia (galleria) e lista
const isList = computed(() => ui.activeView === 'list');
function toggleView() {
  ui.activeView = isList.value ? 'gallery' : 'list';
}

async function openAdd() {
  addOpen.value = true;
  await nextTick();
  nameInput.value?.focus();
}

// Arrivo da "Crea il primo personaggio" (faccia a faccia): apri subito il dialog
// e ripulisci la query, così un refresh non lo riapre.
onMounted(() => {
  if (route.query.nuovo) {
    openAdd();
    router.replace({ name: 'characters', query: {} });
  }
});

function closeAdd() {
  addOpen.value = false;
  newName.value = '';
}

function onAdd() {
  const name = newName.value.trim();
  if (!name) return;
  dispatch((s) => addCharacter(s, name));
  closeAdd();
}
</script>

<style scoped>
/* Ancora del coach-tag "+": la caption è absolute rispetto a questo contenitore. */
.rep-toolbar__actions { position: relative; }

/* Guida primo accesso (un personaggio): usa direttamente EmptyState, look arioso
   come gli altri stati vuoti. La guida attiva la portano i controlli pulsanti
   (coach-mark); la CTA (.rep-onboard-cta, globale) ce li manda. */
</style>
