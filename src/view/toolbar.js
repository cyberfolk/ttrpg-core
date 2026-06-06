import { el, clear } from './dom.js';

// callbacks: { onAddCharacter(name), onExport(), onImport(file), onToggleArchived(visible) }
export function renderToolbar(container, state, callbacks, showArchived) {
  clear(container);

  const nameInput = el('input', { type: 'text', placeholder: 'Nome personaggio' });

  const addBtn = el('button', {
    text: '+ Personaggio',
    onClick: () => {
      const name = nameInput.value.trim();
      if (name.length === 0) {
        return;
      }
      callbacks.onAddCharacter(name);
      nameInput.value = '';
    },
  });

  const exportBtn = el('button', { text: 'Scarica', onClick: () => callbacks.onExport() });

  const importInput = el('input', {
    type: 'file',
    accept: 'application/json',
    onChange: (e) => {
      const file = e.target.files[0];
      if (file) {
        callbacks.onImport(file);
      }
    },
  });

  const archivedToggle = el('label', {}, [
    el('input', {
      type: 'checkbox',
      onChange: (e) => callbacks.onToggleArchived(e.target.checked),
    }),
    ' Mostra archiviati',
  ]);
  if (showArchived) {
    archivedToggle.querySelector('input').checked = true;
  }

  const bar = el('div', { class: 'toolbar' }, [
    nameInput, addBtn, exportBtn,
    el('label', { class: 'import' }, ['Carica', importInput]),
    archivedToggle,
  ]);
  container.appendChild(bar);
}
