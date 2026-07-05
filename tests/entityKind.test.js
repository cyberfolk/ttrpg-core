import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kindIcon, kindLabel, entityRouteTo } from '../src/view/entityKind.js';

test('kindIcon: gruppo → users, personaggio → user', () => {
  assert.equal(kindIcon('group'), 'users');
  assert.equal(kindIcon('character'), 'user');
});

test('kindIcon: kind ignoto ricade su user', () => {
  assert.equal(kindIcon('boh'), 'user');
});

test('kindLabel: gruppo → Gruppo, personaggio → Personaggio', () => {
  assert.equal(kindLabel('group'), 'Gruppo');
  assert.equal(kindLabel('character'), 'Personaggio');
});

test('entityRouteTo: gruppo → groupProfile con id nei params', () => {
  const loc = entityRouteTo('group', 'g-123');
  assert.deepEqual(loc, { name: 'groupProfile', params: { id: 'g-123' } });
});

test('entityRouteTo: personaggio → profile con id nei params', () => {
  const loc = entityRouteTo('character', 'c-456');
  assert.deepEqual(loc, { name: 'profile', params: { id: 'c-456' } });
});
