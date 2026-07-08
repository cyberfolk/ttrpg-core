// Mini-renderer markdown senza dipendenze: titoli, grassetto/corsivo/codice
// inline, blockquote, elenchi (puntati e numerati), righello, paragrafi.
// Condiviso da Note e descrizione foto (stesso render).

// Sentinel NUL per proteggere i code-span dal parsing di bold/italic: non compare
// mai nel testo escapizzato, quindi non collide col contenuto utente (a differenza
// di uno spazio, che matcherebbe qualsiasi " 3 " nel testo).
const CODE_SENT = String.fromCharCode(0);

function escapeHtml(s) {
  const out = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return out;
}

function inlineMd(s) {
  // Il code-span va tokenizzato PRIMA di bold/italic: altrimenti gli asterischi
  // dentro un `...` verrebbero letti come enfasi. Il contenuto è già HTML-escaped
  // a monte (escapeHtml sull'intero src), quindi si reinserisce così com'è.
  const codes = [];
  let out = s.replace(/`([^`]+?)`/g, (_, code) => {
    const i = codes.push(code) - 1;
    const token = CODE_SENT + i + CODE_SENT;
    return token;
  });
  out = out
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  out = out.replace(new RegExp(CODE_SENT + '(\\d+)' + CODE_SENT, 'g'), (_, i) => {
    const restored = '<code>' + codes[Number(i)] + '</code>';
    return restored;
  });
  return out;
}

export function renderMarkdown(src) {
  const lines = escapeHtml(src || '').split(/\r?\n/);
  let html = '';
  let listType = null; // 'ul' | 'ol' | null
  let inQuote = false;
  const closeList = () => { if (listType) { html += '</' + listType + '>'; listType = null; } };
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

    // Righello: una riga di soli ---, *** o ___ (3+ caratteri).
    const isRule = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line);
    if (isRule) {
      closeList();
      closeQuote();
      html += '<hr>';
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

    // Elenco puntato (-, *) o numerato (1.). Cambiare tipo chiude e riapre.
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (bullet || ordered) {
      closeQuote();
      const type = bullet ? 'ul' : 'ol';
      if (listType && listType !== type) closeList();
      if (!listType) { html += '<' + type + '>'; listType = type; }
      const content = bullet ? bullet[1] : ordered[1];
      html += '<li>' + inlineMd(content) + '</li>';
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
