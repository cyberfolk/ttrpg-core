import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA_VERSION, createState, createPhoto, createCharacter, createGroup,
} from '../src/model/schema.js';

test('SCHEMA_VERSION è 4', () => {
  assert.equal(SCHEMA_VERSION, 4);
});

test('createState ha photos vuoto', () => {
  const s = createState();
  assert.deepEqual(s.photos, []);
});

test('createPhoto ha la forma attesa e default vuoti', () => {
  const p = createPhoto('e1');
  assert.equal(typeof p.id, 'string');
  assert.ok(p.id.length > 0);
  assert.equal(p.entityId, 'e1');
  assert.equal(p.caption, '');
  assert.equal(p.description, '');
  assert.deepEqual(p.tagIds, []);
  assert.equal(typeof p.createdAt, 'number');
});

test('createPhoto applica i meta passati', () => {
  const p = createPhoto('e1', { caption: 'ciao', description: 'lungo', tagIds: ['t1'] });
  assert.equal(p.caption, 'ciao');
  assert.equal(p.description, 'lungo');
  assert.deepEqual(p.tagIds, ['t1']);
});

test('createCharacter e createGroup partono con avatarPhotoId null', () => {
  assert.equal(createCharacter('A').avatarPhotoId, null);
  assert.equal(createGroup('G', 'fazione').avatarPhotoId, null);
});
