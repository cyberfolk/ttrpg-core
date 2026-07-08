// Mini-renderer markdown senza dipendenze: titoli, grassetto/corsivo/codice inline,
// elenchi puntati, paragrafi. Condiviso da Note e descrizione foto (stesso render).

function escapeHtml(s) {
  const out = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return out;
}

function inlineMd(s) {
  const out = s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  return out;
}

export function renderMarkdown(src) {
  const lines = escapeHtml(src || '').split(/\r?\n/);
  let html = '';
  let inList = false;
  let inQuote = false;
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  const closeQuote = () => { if (inQuote) { html += '</blockquote>'; inQuote = false; } };
  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      closeList();
      closeQuote();
      const level = heading[1].length;
      html += '<h' + level + '>' + inlineMd(heading[2].trim()) + '</h' + level + '>';
      continue;
    }
    // Blockquote: `>` è già escapizzato in `&gt;` (escapeHtml precede il parsing).
    // Righe `>` consecutive confluiscono in un unico <blockquote>.
    const quote = /^\s*&gt;\s?(.*)$/.exec(line);
    if (quote) {
      closeList();
      if (!inQuote) { html += '<blockquote>'; inQuote = true; } else { html += ' '; }
      html += inlineMd(quote[1].trim());
      continue;
    }
    const isBullet = /^\s*[-*]\s+/.test(line);
    if (isBullet) {
      closeQuote();
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + inlineMd(line.replace(/^\s*[-*]\s+/, '')) + '</li>';
      continue;
    }
    closeList();
    closeQuote();
    if (line.trim() === '') continue;
    html += '<p>' + inlineMd(line) + '</p>';
  }
  closeList();
  closeQuote();
  return html;
}
