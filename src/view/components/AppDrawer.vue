<template>
  <div class="rep-drawer-root">
    <div class="rep-drawer-scrim" :class="{ 'is-open': open }"
      @click="emit('close')" aria-hidden="true"></div>

    <aside class="rep-drawer" :class="{ 'is-open': open }"
      role="dialog" aria-modal="true" aria-label="Menu TTRPG-Core">

      <!-- Identità app -->
      <div class="rep-drawer__sec rep-drawer__brand">
        <span class="rep-drawer__mark" aria-hidden="true">◆</span>
        <span class="rep-drawer__brandtext">
          <b>TTRPG-Core</b>
          <span>Toolset per le tue campagne</span>
        </span>
        <button ref="closeBtn" class="rep-drawer__close" @click="emit('close')" aria-label="Chiudi menu">
          <Icon name="close" />
        </button>
      </div>

      <!-- Selettore funzioni -->
      <div class="rep-drawer__sec">
        <div class="rep-drawer__label">Funzioni</div>
        <template v-for="fn in functions" :key="fn.id">
          <button v-if="fn.status === 'active'" class="rep-drawer__fn"
            :class="{ 'is-active': fn.id === activeId }" @click="onSelect(fn)">
            <span class="rep-drawer__fn-ic" aria-hidden="true"></span>
            {{ fn.label }}
          </button>
          <span v-else class="rep-drawer__fn rep-drawer__fn--soon">
            <span class="rep-drawer__fn-ic" aria-hidden="true"></span>
            {{ fn.label }}
            <span class="rep-drawer__badge">in arrivo</span>
          </span>
        </template>
      </div>

      <!-- Come funziona la reputazione -->
      <div class="rep-drawer__sec">
        <div class="rep-drawer__label">Reputazione · come funziona</div>
        <p class="rep-drawer__doc">{{ reputationHelp }}</p>
      </div>

      <!-- Impostazioni generali (app-level) -->
      <div class="rep-drawer__sec">
        <div class="rep-drawer__label">Impostazioni generali</div>
        <div class="rep-drawer__actions">
          <button class="ds-btn ds-btn--secondary ds-btn--sm" @click="onExport">
            <span class="ds-btn__icon"><Icon name="download" /></span>
            Scarica dati
          </button>
          <label class="ds-btn ds-btn--secondary ds-btn--sm" style="cursor:pointer">
            <span class="ds-btn__icon"><Icon name="upload" /></span>
            Carica dati
            <input type="file" accept="application/json" @change="onImportFile" style="display:none" />
          </label>
        </div>
      </div>

      <!-- Impostazioni Reputazione -->
      <div class="rep-drawer__sec">
        <div class="rep-drawer__label">Impostazioni · Reputazione</div>
        <label class="rep-drawer__toggle">
          <span class="ds-switch">
            <input type="checkbox" v-model="ui.showArchived" />
            <span class="ds-switch__track"><span class="ds-switch__thumb"></span></span>
          </span>
          Mostra archiviati
        </label>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { APP_FUNCTIONS, activeFunctionId } from '../appFunctions.js';
import { REPUTATION_HELP } from '../uiCopy.js';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { serializeState, parseImport } from '../../store/io.js';
import Icon from './Icon.vue';

const props = defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(['close']);

const route = useRoute();
const router = useRouter();
const ui = useUiState();
const { getState, replaceState } = useStore();

const functions = APP_FUNCTIONS;
const reputationHelp = REPUTATION_HELP;

const activeId = computed(() => {
  const id = activeFunctionId(route.name);
  return id;
});

const closeBtn = ref(null);

function onSelect(fn) {
  if (fn.routeName && route.name !== fn.routeName) {
    router.push({ name: fn.routeName });
  }
  emit('close');
}

function onKeydown(event) {
  if (event.key === 'Escape' && props.open) {
    emit('close');
  }
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

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    closeBtn.value?.focus();
  }
});

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>
