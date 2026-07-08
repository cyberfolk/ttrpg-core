import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createPhoto, createCharacter } from '../src/model/schema.js';
import { addPhoto, setPhotoFocus } from '../src/model/photos.js';
import { migrate, validateState, serializeState, parseImport } from '../src/store/io.js';

test('createPhoto ha focus centrale di default', () => {
  const p = createPhoto('c1');
  assert.deepEqual(p.focus, { x: 50, y: 50 });
});

test('setPhotoFocus imposta e arrotonda il punto focale', () => {
  let s = createState();
  const c = createCharacter('A');
  s = { ...s, characters: [c] };
  s = addPhoto(s, c.id, {});
  const id = s.photos[0].id;
  s = setPhotoFocus(s, id, { x: 20.4, y: 8.6 });
  assert.deepEqual(s.photos[0].focus, { x: 20, y: 9 });
});

test('setPhotoFocus clampa fuori 0..100', () => {
  let s = createState();
  const c = createCharacter('A');
  s = { ...s, characters: [c] };
  s = addPhoto(s, c.id, {});
  const id = s.photos[0].id;
  s = setPhotoFocus(s, id, { x: -30, y: 240 });
  assert.deepEqual(s.photos[0].focus, { x: 0, y: 100 });
});

test('migrate fa il backfill di focus sulle foto prive', () => {
  const data = {
    version: 4,
    characters: [{ id: 'c1', name: 'A', deletedAt: null, isPg: false, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '', avatarPhotoId: null }],
    groups: [],
    transactions: [],
    photos: [{ id: 'ph1', entityId: 'c1', caption: '', description: '', tagIds: [], createdAt: 1 }],
    tags: [], players: [], races: [], classes: [],
  };
  const m = migrate(data);
  assert.deepEqual(m.photos[0].focus, { x: 50, y: 50 });
});

test('validateState rifiuta un focus fuori range', () => {
  let s = createState();
  const c = createCharacter('A');
  s = { ...s, characters: [c] };
  s = addPhoto(s, c.id, {});
  s.photos[0].focus = { x: 50, y: 150 };
  assert.throws(() => validateState(s), /focus/);
});

test('round-trip preserva il focus', () => {
  let s = createState();
  const c = createCharacter('A');
  s = { ...s, characters: [c] };
  s = addPhoto(s, c.id, {});
  const id = s.photos[0].id;
  s = setPhotoFocus(s, id, { x: 30, y: 12 });
  const back = parseImport(serializeState(s));
  assert.deepEqual(back.photos[0].focus, { x: 30, y: 12 });
});
