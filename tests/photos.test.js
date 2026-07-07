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

import {
  addPhoto, removePhoto, setAvatar, clearAvatar, updatePhotoMeta, listPhotos,
} from '../src/model/photos.js';

function withEntities() {
  const s0 = createState();
  const c = createCharacter('Aragorn');
  const g = createGroup('Compagnia', 'fazione');
  const s1 = { ...s0, characters: [c], groups: [g] };
  return { state: s1, charId: c.id, groupId: g.id };
}

test('addPhoto aggiunge una foto legata all entità, senza mutare l originale', () => {
  const { state, charId } = withEntities();
  const next = addPhoto(state, charId, { caption: 'ritratto' });
  assert.equal(next.photos.length, 1);
  assert.equal(next.photos[0].entityId, charId);
  assert.equal(next.photos[0].caption, 'ritratto');
  assert.equal(state.photos.length, 0);
});

test('setAvatar punta l avatar del personaggio a una foto; clearAvatar lo azzera lasciando la foto', () => {
  const { state, charId } = withEntities();
  let s = addPhoto(state, charId, {});
  const pid = s.photos[0].id;
  s = setAvatar(s, charId, pid);
  assert.equal(s.characters[0].avatarPhotoId, pid);
  s = clearAvatar(s, charId);
  assert.equal(s.characters[0].avatarPhotoId, null);
  assert.equal(s.photos.length, 1); // la foto resta in galleria
});

test('setAvatar funziona anche sui gruppi', () => {
  const { state, groupId } = withEntities();
  let s = addPhoto(state, groupId, {});
  const pid = s.photos[0].id;
  s = setAvatar(s, groupId, pid);
  assert.equal(s.groups[0].avatarPhotoId, pid);
});

test('removePhoto elimina la foto e azzera a cascata l avatar che la puntava', () => {
  const { state, charId } = withEntities();
  let s = addPhoto(state, charId, {});
  const pid = s.photos[0].id;
  s = setAvatar(s, charId, pid);
  s = removePhoto(s, pid);
  assert.equal(s.photos.length, 0);
  assert.equal(s.characters[0].avatarPhotoId, null);
});

test('updatePhotoMeta fa il merge dei soli campi passati', () => {
  const { state, charId } = withEntities();
  let s = addPhoto(state, charId, { caption: 'a', description: 'b' });
  const pid = s.photos[0].id;
  s = updatePhotoMeta(s, pid, { caption: 'nuovo' });
  assert.equal(s.photos[0].caption, 'nuovo');
  assert.equal(s.photos[0].description, 'b');
});

test('listPhotos ritorna solo le foto dell entità ordinate per createdAt', () => {
  const { state, charId, groupId } = withEntities();
  let s = addPhoto(state, charId, { caption: 'x' });
  s = addPhoto(s, groupId, { caption: 'y' });
  const only = listPhotos(s, charId);
  assert.equal(only.length, 1);
  assert.equal(only[0].caption, 'x');
});
