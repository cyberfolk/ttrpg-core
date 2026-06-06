import { el, clear } from './dom.js';
import { listActiveCharacters, computeScore } from '../model/reputation.js';

function scoreColor(score) {
  // 1 = rosso (0deg), 100 = verde (120deg)
  const hue = Math.round(((score - 1) / 99) * 120);
  const color = `hsl(${hue}, 70%, 75%)`;
  return color;
}

// onCellClick(fromId, toId)
export function renderMatrix(container, state, onCellClick) {
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
    const cells = [el('th', { text: from.name })];
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
