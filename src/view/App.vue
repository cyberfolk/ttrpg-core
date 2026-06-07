<template>
  <div id="app-root">
    <header class="app-header">
      <router-link to="/" class="logo">TTRPG · Reputazione</router-link>
      <div class="data-ops">
        <button @click="onExport">Scarica</button>
        <label class="import">
          Carica
          <input type="file" accept="application/json" @change="onImportFile" />
        </label>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useStore } from './useStore.js';
import { serializeState, parseImport } from '../store/io.js';

const { getState, replaceState } = useStore();

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
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const state = parseImport(reader.result);
      if (!window.confirm('Importare sovrascrive i dati correnti. Procedere?')) {
        return;
      }
      replaceState(state);
    } catch (err) {
      window.alert(`Import fallito: ${err.message}`);
    }
  };
  reader.readAsText(file);
}
</script>
