import { el, clear } from './dom.js';
import { listActiveCharacters, listArchivedCharacters, computeScore } from '../model/reputation.js';

function scoreColor(score) {
  // 1 = rosso (0deg), 100 = verde (120deg)
  const hue = Math.round(((score - 1) / 99) * 120);
  const color = `hsl(${hue}, 70%, 75%)`;
  return color;
}

// onCellClick(fromId, toId), onSoftDelete(id)
export function renderMatrix(container, state, onCellClick, onSoftDelete) {
  clear(container);
  const chars = listActiveCharacters(state);

  if (chars.length < 2) {
    container.appendChild(el('p', { text: 'Aggiungi almeno due personaggi.' }));
    return;
  }

  const headerCells = [el('th', { text: 'da \\ a' })];
  for (const c of chars) {
    headerCells.push(el('th', { text: c.name }));
  }
  const thead = el('thead', {}, [el('tr', {}, headerCells)]);

  const rows = [];
  for (const from of chars) {
    const archiveBtn = el('button', {
      text: '🗑',
      title: 'Archivia',
      onClick: () => onSoftDelete(from.id),
    });
    const cells = [el('th', {}, [from.name + ' ', archiveBtn])];
    for (const to of chars) {
      if (from.id === to.id) {
        cells.push(el('td', { class: 'diagonal', text: '—' }));
        continue;
      }
      const score = computeScore(state, from.id, to.id);
      const cell = el('td', {
        class: 'score-cell',
        style: `background:${scoreColor(score)}`,
        text: String(score),
        onClick: () => onCellClick(from.id, to.id),
      });
      cells.push(cell);
    }
    rows.push(el('tr', {}, cells));
  }
  const tbody = el('tbody', {}, rows);

  container.appendChild(el('table', { class: 'matrix' }, [thead, tbody]));
}

// callbacks: { onRestore(id), onHardDelete(id) }
export function renderArchived(container, state, callbacks) {
  clear(container);
  const archived = listArchivedCharacters(state);
  if (archived.length === 0) {
    return;
  }
  const items = archived.map((c) => {
    const restoreBtn = el('button', { text: 'Ripristina', onClick: () => callbacks.onRestore(c.id) });
    const hardBtn = el('button', {
      text: 'Elimina definitivamente',
      onClick: () => callbacks.onHardDelete(c.id),
    });
    const row = el('li', {}, [c.name + ' ', restoreBtn, hardBtn]);
    return row;
  });
  const block = el('div', { class: 'archived' }, [
    el('h3', { text: 'Personaggi archiviati' }),
    el('ul', {}, items),
  ]);
  container.appendChild(block);
}
