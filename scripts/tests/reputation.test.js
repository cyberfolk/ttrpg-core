import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, SCHEMA_VERSION, createState, createCharacter, createTransaction } from '../../src/model/schema.js';
import { clampView, computeScore } from '../../src/model/reputation.js';

test('BASE è 50 e SCHEMA_VERSION è 1', () => {
  assert.equal(BASE, 50);
  assert.equal(SCHEMA_VERSION, 1);
});

test('createState produce stato vuoto valido', () => {
  const s = createState();
  assert.deepEqual(s.characters, []);
  assert.deepEqual(s.transactions, []);
  assert.equal(s.version, 1);
});

test('createCharacter genera id, name e deletedAt null', () => {
  const c = createCharacter('Aragorn');
  assert.equal(typeof c.id, 'string');
  assert.ok(c.id.length > 0);
  assert.equal(c.name, 'Aragorn');
  assert.equal(c.deletedAt, null);
});

test('createTransaction popola i campi e createdAt numerico', () => {
  const tx = createTransaction('c1', 'c2', 10, 'salvato in battaglia');
  assert.equal(typeof tx.id, 'string');
  assert.equal(tx.fromId, 'c1');
  assert.equal(tx.toId, 'c2');
  assert.equal(tx.delta, 10);
  assert.equal(tx.name, 'salvato in battaglia');
  assert.equal(typeof tx.createdAt, 'number');
});

test('clampView blocca tra 1 e 100', () => {
  assert.equal(clampView(50), 50);
  assert.equal(clampView(0), 1);
  assert.equal(clampView(-5), 1);
  assert.equal(clampView(150), 100);
});

test('computeScore di relazione senza transazioni è 50', () => {
  const state = createState();
  state.characters.push(createCharacter('A'), createCharacter('B'));
  const [a, b] = state.characters;
  assert.equal(computeScore(state, a.id, b.id), 50);
});

test('computeScore somma i delta della direzione corretta', () => {
  const state = createState();
  const a = createCharacter('A');
  const b = createCharacter('B');
  state.characters.push(a, b);
  state.transactions.push(
    createTransaction(a.id, b.id, 10, 'x'),
    createTransaction(a.id, b.id, 5, 'y'),
    createTransaction(b.id, a.id, -30, 'z'),
  );
  assert.equal(computeScore(state, a.id, b.id), 65);
  assert.equal(computeScore(state, b.id, a.id), 20);
});

test('computeScore clampa solo in vista, somma interna libera', () => {
  const state = createState();
  const a = createCharacter('A');
  const b = createCharacter('B');
  state.characters.push(a, b);
  state.transactions.push(
    createTransaction(a.id, b.id, 60, 'su'),
    createTransaction(a.id, b.id, -20, 'giu'),
  );
  assert.equal(computeScore(state, a.id, b.id), 90);
});
