import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryBlobStore } from '../src/store/photoBlobStore.js';

test('put/get round-trip', async () => {
  const store = memoryBlobStore();
  const blob = { fake: 'blob' };
  await store.put('p1', blob);
  const got = await store.get('p1');
  assert.equal(got, blob);
});

test('get di una chiave assente ritorna null', async () => {
  const store = memoryBlobStore();
  const got = await store.get('nada');
  assert.equal(got, null);
});

test('delete rimuove il blob', async () => {
  const store = memoryBlobStore();
  await store.put('p1', { a: 1 });
  await store.delete('p1');
  const got = await store.get('p1');
  assert.equal(got, null);
});
