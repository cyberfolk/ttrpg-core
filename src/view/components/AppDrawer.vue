<template>
  <div class="rep-drawer-root">
    <div class="rep-drawer-scrim" :class="{ 'is-open': open }"
      @click="emit('close')" aria-hidden="true"></div>

    <aside class="rep-drawer" :class="{ 'is-open': open }"
      role="dialog" aria-modal="true" aria-label="Menu e impostazioni">

      <!-- Intestazione menu (niente brand duplicato: il logo e' gia nell'header) -->
      <div class="rep-drawer__head">
        <span class="rep-drawer__title">Menu</span>
        <button ref="closeBtn" class="rep-drawer__close" @click="emit('close')" aria-label="Chiudi menu">
          <Icon name="close" />
        </button>
      </div>

      <!-- Navigazione primaria: mostrata solo su mobile (su desktop vive nell'header) -->
      <nav class="rep-drawer__sec rep-drawer__nav" aria-label="Sezioni Reputazione">
        <div class="rep-drawer__label">Reputazione</div>
        <button v-for="item in navItems" :key="item.routeName" class="rep-drawer__fn"
          :class="{ 'is-active': item.isActive }" :aria-current="item.isActive ? 'page' : undefined"
          @click="goTo(item.routeName)">
          <span class="rep-drawer__fn-ic" aria-hidden="true"><Icon :name="item.icon" /></span>
          {{ item.label }}
        </button>
      </nav>

      <!-- Funzioni future (hint, non navigabili) -->
      <div class="rep-drawer__sec" v-if="soonFunctions.length">
        <div class="rep-drawer__label">Altre funzioni</div>
        <span v-for="fn in soonFunctions" :key="fn.id" class="rep-drawer__fn rep-drawer__fn--soon">
          <span class="rep-drawer__fn-ic" aria-hidden="true"></span>
          {{ fn.label }}
          <span class="rep-drawer__badge">in arrivo</span>
        </span>
      </div>

      <!-- Dati -->
      <div class="rep-drawer__sec">
        <div class="rep-drawer__label">Dati</div>
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
        <button class="ds-btn ds-btn--danger ds-btn--sm" style="margin-top:0.5rem;width:100%" @click="openWipe">
          <span class="ds-btn__icon"><Icon name="trash" /></span>
          Pulisci dati
        </button>
      </div>

      <!-- Impostazioni -->
      <div class="rep-drawer__sec">
        <div class="rep-drawer__label">Impostazioni</div>
        <label class="rep-drawer__toggle">
          <span class="ds-switch">
            <input type="checkbox" v-model="ui.showArchived" />
            <span class="ds-switch__track"><span class="ds-switch__thumb"></span></span>
          </span>
          Mostra archiviati
        </label>
      </div>

      <!-- Come funziona: collassato, il menu resta magro -->
      <details class="rep-drawer__sec rep-drawer__help">
        <summary class="rep-drawer__help-summary">
          <Icon name="help" />
          Come funziona la reputazione
        </summary>
        <p class="rep-drawer__doc">{{ reputationHelp }}</p>
      </details>
    </aside>

    <!-- Conferma pulizia dati: azione distruttiva e irreversibile. -->
    <div v-if="wipeOpen" class="ds-overlay" @click.self="closeWipe">
      <div class="ds-dialog" style="max-width:420px" role="alertdialog" aria-modal="true"
        aria-labelledby="wipe-title" aria-describedby="wipe-desc">
        <div class="ds-dialog__head">
          <h3 class="ds-dialog__title" id="wipe-title">Pulisci tutti i dati</h3>
          <button class="ds-dialog__close" @click="closeWipe" aria-label="Chiudi">
            <Icon name="close" />
          </button>
        </div>
        <div class="ds-dialog__body">
          <p id="wipe-desc" style="margin:0">
            Elimina <strong>tutti</strong> i personaggi, i gruppi e le transazioni.
            L'operazione è <strong>irreversibile</strong>: scarica prima i dati se vuoi conservarli.
          </p>
        </div>
        <div class="ds-dialog__foot">
          <button ref="wipeCancelBtn" class="ds-btn ds-btn--ghost" @click="closeWipe">Annulla</button>
          <button class="ds-btn ds-btn--danger" @click="confirmWipe">
            <span class="ds-btn__icon"><Icon name="trash" /></span>
            Elimina tutto
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { APP_FUNCTIONS } from '../appFunctions.js';
import { REPUTATION_HELP } from '../uiCopy.js';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { useDialog } from '../useDialog.js';
import { createState } from '../../model/schema.js';
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

const reputationHelp = REPUTATION_HELP;

// Sezioni navigabili della funzione Reputazione (mobile: la nav vive nel drawer).
const NAV_SECTIONS = [
  { routeName: 'characters', label: 'Personaggi', icon: 'user', match: ['characters', 'profile'] },
  { routeName: 'groups', label: 'Gruppi', icon: 'users', match: ['groups', 'groupProfile'] },
];

const navItems = computed(() => {
  const items = NAV_SECTIONS.map((s) => {
    const isActive = s.match.includes(route.name);
    return { ...s, isActive };
  });
  return items;
});

const soonFunctions = computed(() => {
  const soon = APP_FUNCTIONS.filter((fn) => fn.status === 'soon');
  return soon;
});

const closeBtn = ref(null);

// Pulizia dati: conferma esplicita perché è distruttiva e irreversibile.
const wipeOpen = ref(false);
const wipeCancelBtn = ref(null);

function openWipe() {
  wipeOpen.value = true;
}

function closeWipe() {
  wipeOpen.value = false;
}

function confirmWipe() {
  replaceState(createState());
  closeWipe();
  emit('close'); // torni a zero: chiudi anche il drawer
}

function goTo(routeName) {
  if (route.name !== routeName) {
    router.push({ name: routeName });
  }
  emit('close');
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

// Drawer persistente pilotato dalla prop `open`: Escape chiude, apertura porta
// il focus sul bottone di chiusura. Mentre la conferma di pulizia è aperta il
// drawer si considera "non aperto" ai fini di Escape/focus, così Escape chiude
// solo la conferma (dialog annidato) e non anche il drawer.
useDialog({
  isOpen: () => props.open && !wipeOpen.value,
  onClose: () => emit('close'),
  onOpen: () => closeBtn.value?.focus(),
});

// Conferma pulizia: Escape annulla, apertura mette a fuoco "Annulla" (mai
// l'azione distruttiva, per non cancellare con un Invio involontario).
useDialog({
  isOpen: () => wipeOpen.value,
  onClose: closeWipe,
  onOpen: () => wipeCancelBtn.value?.focus(),
});
</script>
