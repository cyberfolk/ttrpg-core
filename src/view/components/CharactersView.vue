<template>
  <section>
    <!-- Toolbar -->
    <div class="rep-toolbar">
      <!-- Search -->
      <div class="rep-toolbar__search">
        <span class="ds-field ds-field--block">
          <span class="ds-field__wrap">
            <span class="ds-field__icon">
              <Icon name="search" />
            </span>
            <input class="ds-input ds-input--with-icon" type="search" placeholder="Cerca per nome…"
              v-model="ui.search" />
          </span>
        </span>
      </div>

      <!-- Segmented view switcher -->
      <div class="ds-seg">
        <button class="ds-seg__btn" :class="{ active: ui.activeView === 'gallery' }"
          @click="ui.activeView = 'gallery'">
          <span class="ds-seg__icon"><Icon name="gallery" /></span>
          Gallery
        </button>
        <button class="ds-seg__btn" :class="{ active: ui.activeView === 'list' }"
          @click="ui.activeView = 'list'">
          <span class="ds-seg__icon"><Icon name="list" /></span>
          Lista
        </button>
      </div>

      <!-- Add character -->
      <div class="rep-toolbar__add">
        <button class="ds-btn ds-btn--primary" @click="openAdd">
          <span class="ds-btn__icon"><Icon name="plus" /></span>
          Aggiungi personaggio
        </button>
      </div>
    </div>

    <!-- Paginazione: in alto a destra. Solo gallery e lista (matrix non consuma items) -->
    <Pager v-if="ui.activeView !== 'matrix'"
      :page="ui.page" :page-size="ui.pageSize" :total="total"
      @update:page="ui.page = $event" @update:page-size="ui.pageSize = $event" />

    <!-- Views -->
    <GalleryView v-if="ui.activeView === 'gallery'" :items="items" />
    <ListView    v-else-if="ui.activeView === 'list'" :items="items" :offset="ui.page * ui.pageSize" />
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
import { ref, nextTick } from 'vue';
import { useUiState } from '../useUiState.js';
import { useStore } from '../useStore.js';
import { useDisplayedCharacters } from '../useDisplayedCharacters.js';
import { addCharacter } from '../../model/reputation.js';
import GalleryView from './GalleryView.vue';
import ListView from './ListView.vue';
import MatrixView from './MatrixView.vue';
import Pager from './Pager.vue';
import Icon from './Icon.vue';

const ui = useUiState();
const { dispatch } = useStore();
const { items, total } = useDisplayedCharacters();
const newName = ref('');
const addOpen = ref(false);
const nameInput = ref(null);

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
