import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, SCHEMA_VERSION, createState, createCharacter, createTransaction } from '../../src/model/schema.js';

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
