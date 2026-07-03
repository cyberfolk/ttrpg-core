import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ambiguousIds, displayName } from '../../src/view/disambiguation.js';

test('ambiguousIds: nomi unici → mappa vuota', () => {
  const map = ambiguousIds([
    { id: 'a1', name: 'Corvo', kind: 'character' },
    { id: 'b1', name: 'Anselmo', kind: 'character' },
  ]);
  assert.equal(map.size, 0);
});

test('ambiguousIds: due omonimi stesso kind → entrambi con coda id', () => {
  const map = ambiguousIds([
    { id: 'char-aaaa', name: 'Corvo', kind: 'character' },
    { id: 'char-bbbb', name: 'Corvo', kind: 'character' },
    { id: 'char-cccc', name: 'Unico', kind: 'character' },
  ]);
  assert.equal(map.size, 2);
  assert.equal(map.get('char-aaaa'), 'aaaa');
  assert.equal(map.get('char-bbbb'), 'bbbb');
  assert.equal(map.has('char-cccc'), false);
});

test('ambiguousIds: stesso nome ma kind diversi → non ambigui (li distingue il glifo)', () => {
  const map = ambiguousIds([
    { id: 'char-1', name: 'Corvo', kind: 'character' },
    { id: 'group-1', name: 'Corvo', kind: 'group' },
  ]);
  assert.equal(map.size, 0);
});

test('ambiguousIds: collisione ignora maiuscole e spazi', () => {
  const map = ambiguousIds([
    { id: 'x1', name: '  Corvo ', kind: 'character' },
    { id: 'x2', name: 'corvo', kind: 'character' },
  ]);
  assert.equal(map.size, 2);
});

test('displayName: nome presente → il nome', () => {
  assert.equal(displayName({ id: 'char-aaaa', name: 'Corvo' }), 'Corvo');
});

test('displayName: nome vuoto o solo spazi → segnaposto con coda id', () => {
  assert.equal(displayName({ id: 'char-aaaa', name: '' }), '(senza nome) #aaaa');
  assert.equal(displayName({ id: 'char-bbbb', name: '   ' }), '(senza nome) #bbbb');
  assert.equal(displayName({ id: 'char-cccc', name: null }), '(senza nome) #cccc');
});
