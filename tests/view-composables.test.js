// Smoke test della logica pura estratta nella VIEW (useSortable).
// La VIEW si verifica a mano nel browser, ma useSortable è logica
// framework-reattiva senza DOM: coprirlo qui blinda la meccanica
// condivisa da tutte le tabelle ordinabili.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ref, computed } from 'vue';
import { useSortable } from '../src/view/useSortable.js';

test('useSortable: nuova colonna parte dalla direzione di default', () => {
  const { sort, toggleSort } = useSortable({ initial: { key: 'name', dir: 'asc' }, descKeys: ['score'] });
  toggleSort('score'); // in descKeys → desc
  assert.deepEqual(sort.value, { key: 'score', dir: 'desc' });
  toggleSort('name'); // non in descKeys → asc
  assert.deepEqual(sort.value, { key: 'name', dir: 'asc' });
});

test('useSortable: stessa colonna inverte la direzione', () => {
  const { sort, toggleSort } = useSortable({ initial: { key: 'name', dir: 'asc' } });
  toggleSort('name');
  assert.equal(sort.value.dir, 'desc');
  toggleSort('name');
  assert.equal(sort.value.dir, 'asc');
});

test('useSortable: model esterno riceve la scrittura', () => {
  const external = ref({ key: 'score', dir: 'desc' });
  const model = computed({ get: () => external.value, set: (v) => { external.value = v; } });
  const { toggleSort } = useSortable({ model, descKeys: ['score'] });
  toggleSort('name');
  assert.deepEqual(external.value, { key: 'name', dir: 'asc' });
});

test('useSortable: onChange scatta a ogni cambio', () => {
  let calls = 0;
  const { toggleSort } = useSortable({ initial: { key: 'name', dir: 'asc' }, onChange: () => { calls += 1; } });
  toggleSort('name');
  toggleSort('score');
  assert.equal(calls, 2);
});
