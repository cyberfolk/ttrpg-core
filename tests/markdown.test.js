import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/view/markdown.js';

test('blockquote: riga `>` diventa <blockquote>, non un <p> con &gt;', () => {
  const html = renderMarkdown('> Calci nel didietro!');
  assert.match(html, /<blockquote>Calci nel didietro!<\/blockquote>/);
  assert.doesNotMatch(html, /&gt;/);
});

test('blockquote: righe consecutive confluiscono in un solo blocco', () => {
  const html = renderMarkdown('> riga uno\n> riga due');
  const count = (html.match(/<blockquote>/g) || []).length;
  assert.equal(count, 1);
  assert.match(html, /riga uno riga due/);
});

test('blockquote: inline markdown dentro la citazione', () => {
  const html = renderMarkdown('> **forte** e *corsivo*');
  assert.match(html, /<blockquote><strong>forte<\/strong> e <em>corsivo<\/em><\/blockquote>/);
});

test('blockquote chiude prima di heading/lista/paragrafo', () => {
  const html = renderMarkdown('> cit\n# Titolo\n- voce\ntesto');
  assert.match(html, /<blockquote>cit<\/blockquote><h1>Titolo<\/h1>/);
  assert.match(html, /<ul><li>voce<\/li><\/ul>/);
  assert.match(html, /<p>testo<\/p>/);
});

test('regressione: heading, lista, grassetto restano intatti', () => {
  const html = renderMarkdown('# T\n- a\n- b\n**x**');
  assert.match(html, /<h1>T<\/h1>/);
  assert.match(html, /<ul><li>a<\/li><li>b<\/li><\/ul>/);
  assert.match(html, /<strong>x<\/strong>/);
});

test('code-span protegge il contenuto dal parsing di enfasi', () => {
  const html = renderMarkdown('`a*b*c` e `**x**`');
  assert.match(html, /<code>a\*b\*c<\/code>/);
  assert.match(html, /<code>\*\*x\*\*<\/code>/);
  assert.doesNotMatch(html, /<em>|<strong>/);
});

test('numeri con spazi nel testo NON diventano codice', () => {
  const html = renderMarkdown('ha 3 spade e 12 frecce');
  assert.match(html, /<p>ha 3 spade e 12 frecce<\/p>/);
  assert.doesNotMatch(html, /<code>/);
});

test('lista numerata → <ol>', () => {
  const html = renderMarkdown('1. primo\n2. secondo');
  assert.match(html, /<ol><li>primo<\/li><li>secondo<\/li><\/ol>/);
});

test('cambio tipo lista chiude e riapre', () => {
  const html = renderMarkdown('- a\n1. b');
  assert.match(html, /<ul><li>a<\/li><\/ul><ol><li>b<\/li><\/ol>/);
});

test('righello ---, *** o ___ → <hr>', () => {
  assert.match(renderMarkdown('---'), /<hr>/);
  assert.match(renderMarkdown('***'), /<hr>/);
  assert.match(renderMarkdown('___'), /<hr>/);
});
