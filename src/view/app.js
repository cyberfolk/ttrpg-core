import { localStorageAdapter } from '../store/storage.js';
import { createStore } from '../store/store.js';
import { serializeState, parseImport } from '../store/io.js';
import {
  addCharacter, addTransaction, editTransaction, deleteTransaction,
  softDeleteCharacter, restoreCharacter, hardDeleteCharacter,
} from '../model/reputation.js';
import { renderToolbar } from './toolbar.js';
import { renderMatrix, renderArchived } from './matrix.js';
import { renderTransactionPanel } from './transactionPanel.js';

const store = createStore({ storage: localStorageAdapter() });

const ui = { selected: null, showArchived: false };

const toolbarEl = document.getElementById('toolbar');
const matrixEl = document.getElementById('matrix');
const archivedEl = document.getElementById('archived');
const panelEl = document.getElementById('panel');

function downloadJson(text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `reputation-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const state = parseImport(reader.result);
      if (!window.confirm('Importare sovrascrive i dati correnti. Procedere?')) {
        return;
      }
      store.replaceState(state);
    } catch (err) {
      window.alert(`Import fallito: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

const toolbarCallbacks = {
  onAddCharacter: (name) => store.dispatch((s) => addCharacter(s, name)),
  onExport: () => downloadJson(serializeState(store.getState())),
  onImport: (file) => importFromFile(file),
  onToggleArchived: (visible) => { ui.showArchived = visible; render(); },
};

const panelCallbacks = {
  onAdd: (fromId, toId, delta, name) => store.dispatch((s) => addTransaction(s, fromId, toId, delta, name)),
  onEdit: (txId, changes) => store.dispatch((s) => editTransaction(s, txId, changes)),
  onDelete: (txId) => store.dispatch((s) => deleteTransaction(s, txId)),
  onClose: () => { ui.selected = null; render(); },
};

const archivedCallbacks = {
  onRestore: (id) => store.dispatch((s) => restoreCharacter(s, id)),
  onHardDelete: (id) => {
    if (window.confirm('Eliminazione DEFINITIVA e irreversibile. Confermi?')) {
      store.dispatch((s) => hardDeleteCharacter(s, id));
    }
  },
};

function onCharSoftDelete(id) {
  store.dispatch((s) => softDeleteCharacter(s, id));
}

function onCellClick(fromId, toId) {
  ui.selected = { fromId, toId };
  render();
}

function render() {
  const state = store.getState();
  renderToolbar(toolbarEl, state, toolbarCallbacks, ui.showArchived);
  renderMatrix(matrixEl, state, onCellClick, onCharSoftDelete);
  if (ui.showArchived) {
    renderArchived(archivedEl, state, archivedCallbacks);
  } else {
    archivedEl.replaceChildren();
  }
  if (ui.selected) {
    renderTransactionPanel(panelEl, state, ui.selected.fromId, ui.selected.toId, panelCallbacks);
  } else {
    panelEl.replaceChildren();
  }
}

store.subscribe(() => render());
render();
