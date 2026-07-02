// Smoke test della logica pura estratta nella VIEW (useSortable, usePagedList).
// La VIEW si verifica a mano nel browser, ma questi due composable sono logica
// framework-reattiva senza DOM: coprirli qui blinda la meccanica condivisa da
// tutte le tabelle ordinabili e paginate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ref, computed, nextTick } from 'vue';
import { useSortable } from '../../src/view/useSortable.js';
import { usePagedList } from '../../src/view/usePagedList.js';

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

test('usePagedList: paginate ritorna la fetta corrente', () => {
  const list = Array.from({ length: 25 }, (_, i) => i);
  const { page, paginate } = usePagedList(list.length, 10);
  assert.deepEqual(paginate(list), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  page.value = 2;
  assert.deepEqual(paginate(list), [20, 21, 22, 23, 24]);
});

test('usePagedList: offset e lastPage', () => {
  const { page, offset, lastPage } = usePagedList(25, 10);
  assert.equal(lastPage.value, 2);
  page.value = 2;
  assert.equal(offset.value, 20);
});

test('usePagedList: clamp quando il totale cala', async () => {
  const total = ref(25);
  const { page } = usePagedList(total, 10);
  page.value = 2; // ultima pagina valida con 25 elementi
  total.value = 5; // ora una sola pagina
  await nextTick();
  assert.equal(page.value, 0);
});

test('usePagedList: reset torna a pagina 0', () => {
  const { page, reset } = usePagedList(30, 10);
  page.value = 2;
  reset();
  assert.equal(page.value, 0);
});
