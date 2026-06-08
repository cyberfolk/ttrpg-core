<template>
  <div id="app-root">
    <header class="rep-header">
      <!-- Hamburger drawer -->
      <button ref="menuBtn" class="rep-header__menu" @click="openDrawer" aria-label="Apri menu">
        <Icon name="menu" />
      </button>

      <!-- Logo -->
      <span class="ds-logo">
        <span class="ds-logo__mark">
          <svg :width="30" :height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="16" y="2.2" width="19.5" height="19.5" rx="3" transform="rotate(45 16 2.2)"
              stroke="currentColor" stroke-width="1.6" />
            <rect x="16" y="8" width="11.3" height="11.3" rx="2" transform="rotate(45 16 8)"
              stroke="currentColor" stroke-width="1.2" opacity="0.55" />
            <circle cx="16" cy="16" r="2.1" fill="currentColor" />
          </svg>
        </span>
        <span class="ds-logo__words">
          <span class="ds-logo__title">TTRPG</span>
          <span class="ds-logo__tag">Reputazione</span>
        </span>
      </span>

      <!-- Header ops -->
      <div class="rep-header__ops">
        <button class="ds-btn ds-btn--secondary ds-btn--sm" @click="onExport">
          <span class="ds-btn__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
            </svg>
          </span>
          Scarica
        </button>
        <label class="ds-btn ds-btn--secondary ds-btn--sm" style="cursor:pointer">
          <span class="ds-btn__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
            </svg>
          </span>
          Carica
          <input type="file" accept="application/json" @change="onImportFile" style="display:none" />
        </label>
      </div>
    </header>

    <main class="rep-main">
      <router-view />
    </main>

    <AppDrawer :open="drawerOpen" @close="onDrawerClose" />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useStore } from './useStore.js';
import { serializeState, parseImport } from '../store/io.js';
import AppDrawer from './components/AppDrawer.vue';
import Icon from './components/Icon.vue';

const { getState, replaceState } = useStore();

const drawerOpen = ref(false);
const menuBtn = ref(null);

function openDrawer() {
  drawerOpen.value = true;
}

function onDrawerClose() {
  drawerOpen.value = false;
  nextTick(() => menuBtn.value?.focus());
}

function onExport() {
  const text = serializeState(getState());
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `reputation-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function onImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const state = parseImport(reader.result);
      if (!window.confirm('Importare sovrascrive i dati correnti. Procedere?')) return;
      replaceState(state);
    } catch (err) {
      window.alert(`Import fallito: ${err.message}`);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
</script>
