<template>
  <section>
    <!-- Toolbar -->
    <div class="rep-toolbar">
      <!-- Search -->
      <div class="rep-toolbar__search">
        <span class="ds-search">
          <span class="ds-search__icon"><Icon name="search" /></span>
          <input class="ds-input ds-input--with-icon" type="search" placeholder="Cerca per nome…"
            v-model="ui.search" />
        </span>
      </div>

      <!-- Azioni: toggle vista (griglia<->lista) + aggiungi, icone compatte -->
      <div class="rep-toolbar__actions">
        <button class="ds-btn ds-btn--secondary ds-btn--icon" @click="toggleView"
          :aria-label="isList ? 'Mostra come griglia' : 'Mostra come lista'"
          :title="isList ? 'Mostra come griglia' : 'Mostra come lista'">
          <Icon :name="isList ? 'gallery' : 'list'" />
        </button>
        <button class="ds-btn ds-btn--primary ds-btn--icon" @click="openAdd"
          aria-label="Aggiungi personaggio" title="Aggiungi personaggio">
          <Icon name="plus" />
        </button>
      </div>
    </div>

    <!-- Views -->
    <GalleryView v-if="ui.activeView === 'gallery'" :items="items" />
    <ListView    v-else-if="ui.activeView === 'list'" :items="items" />
    <MatrixView  v-else />

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
import { ref, computed, nextTick } from 'vue';
import { useUiState } from '../useUiState.js';
import { useStore } from '../useStore.js';
import { useDisplayedCharacters } from '../useDisplayedCharacters.js';
import { addCharacter } from '../../model/reputation.js';
import GalleryView from './GalleryView.vue';
import ListView from './ListView.vue';
import MatrixView from './MatrixView.vue';
import Icon from './Icon.vue';

const ui = useUiState();
const { dispatch } = useStore();
const { items } = useDisplayedCharacters();
const newName = ref('');
const addOpen = ref(false);
const nameInput = ref(null);

// Toggle vista: se in lista torna a griglia, altrimenti (griglia o matrix) va in lista
const isList = computed(() => ui.activeView === 'list');
function toggleView() {
  ui.activeView = isList.value ? 'gallery' : 'list';
}

async function openAdd() {
  addOpen.value = true;
  await nextTick();
  nameInput.value?.focus();
}

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
