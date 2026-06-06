import { el, clear } from './dom.js';
import { listTransactions, computeScore } from '../model/reputation.js';

function charName(state, id) {
  const found = state.characters.find((c) => c.id === id);
  const name = found ? found.name : '???';
  return name;
}

// callbacks: { onAdd(fromId,toId,delta,name), onEdit(txId,{delta,name}), onDelete(txId), onClose() }
export function renderTransactionPanel(container, state, fromId, toId, callbacks) {
  clear(container);
  if (!fromId || !toId) {
    return;
  }

  const score = computeScore(state, fromId, toId);
  const title = el('h3', {
    text: `${charName(state, fromId)} → ${charName(state, toId)} : ${score}`,
  });
  const closeBtn = el('button', { text: 'Chiudi', onClick: () => callbacks.onClose() });

  const list = listTransactions(state, fromId, toId);
  const rows = list.map((tx) => {
    const deltaInput = el('input', { type: 'number', value: String(tx.delta) });
    const nameInput = el('input', { type: 'text', value: tx.name });
    const saveBtn = el('button', {
      text: 'Salva',
      onClick: () => callbacks.onEdit(tx.id, {
        delta: Number(deltaInput.value),
        name: nameInput.value.trim(),
      }),
    });
    const delBtn = el('button', { text: 'Elimina', onClick: () => callbacks.onDelete(tx.id) });
    const row = el('li', {}, [deltaInput, nameInput, saveBtn, delBtn]);
    return row;
  });
  const listEl = el('ul', { class: 'tx-list' }, rows);

  const newDelta = el('input', { type: 'number', placeholder: 'Delta (es. -5)' });
  const newName = el('input', { type: 'text', placeholder: 'Motivo' });
  const addBtn = el('button', {
    text: 'Aggiungi transazione',
    onClick: () => {
      const delta = Number(newDelta.value);
      const name = newName.value.trim();
      if (Number.isNaN(delta) || name.length === 0) {
        return;
      }
      callbacks.onAdd(fromId, toId, delta, name);
    },
  });
  const addForm = el('div', { class: 'tx-add' }, [newDelta, newName, addBtn]);

  container.appendChild(el('div', { class: 'panel' }, [title, closeBtn, listEl, addForm]));
}
