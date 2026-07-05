import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorageAdapter } from '../src/store/storage.js';
import { createStore } from '../src/store/store.js';
import { addCharacter, addGroup } from '../src/model/reputation.js';

test('memoryStorageAdapter fa round-trip get/set', () => {
  const storage = memoryStorageAdapter();
  assert.equal(storage.getItem('k'), null);
  storage.setItem('k', 'v');
  assert.equal(storage.getItem('k'), 'v');
});

test('createStore parte da stato vuoto se storage vuoto', () => {
  const store = createStore({ storage: memoryStorageAdapter() });
  assert.deepEqual(store.getState().characters, []);
});

test('dispatch applica una funzione MODEL e aggiorna lo stato', () => {
  const store = createStore({ storage: memoryStorageAdapter() });
  store.dispatch((s) => addCharacter(s, 'A'));
  assert.equal(store.getState().characters.length, 1);
});

test('dispatch persiste su storage (ricaricando si ritrova lo stato)', () => {
  const storage = memoryStorageAdapter();
  const store1 = createStore({ storage });
  store1.dispatch((s) => addCharacter(s, 'A'));
  const store2 = createStore({ storage });
  assert.equal(store2.getState().characters.length, 1);
  assert.equal(store2.getState().characters[0].name, 'A');
});

test('subscribe notifica i listener a ogni dispatch', () => {
  const store = createStore({ storage: memoryStorageAdapter() });
  let calls = 0;
  store.subscribe(() => { calls += 1; });
  store.dispatch((s) => addCharacter(s, 'A'));
  store.dispatch((s) => addCharacter(s, 'B'));
  assert.equal(calls, 2);
});

test('replaceState sostituisce lo stato e persiste', () => {
  const storage = memoryStorageAdapter();
  const store = createStore({ storage });
  store.dispatch((s) => addCharacter(s, 'A'));
  store.replaceState({ version: 2, characters: [], transactions: [], groups: [] });
  assert.equal(store.getState().characters.length, 0);
  const reloaded = createStore({ storage });
  assert.equal(reloaded.getState().characters.length, 0);
});

test('dispatch crea un gruppo e lo persiste', () => {
  const storage = memoryStorageAdapter();
  const store1 = createStore({ storage });
  store1.dispatch((s) => addGroup(s, 'G', 'fazione'));
  const store2 = createStore({ storage });
  assert.equal(store2.getState().groups.length, 1);
  assert.equal(store2.getState().groups[0].name, 'G');
});
