import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorageAdapter } from '../../src/store/storage.js';

test('memoryStorageAdapter fa round-trip get/set', () => {
  const storage = memoryStorageAdapter();
  assert.equal(storage.getItem('k'), null);
  storage.setItem('k', 'v');
  assert.equal(storage.getItem('k'), 'v');
});
