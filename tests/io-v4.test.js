import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, serializeState, parseImport, validateState } from '../src/store/io.js';

function v3State() {
  const data = {
    version: 3,
    characters: [{ id: 'c1', name: 'A', deletedAt: null, isPg: false, raceId: null,
      classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
    groups: [{ id: 'g1', name: 'G', type: 'fazione', memberIds: [], deletedAt: null,
      seat: '', guideId: null, motto: '', tagIds: [], notes: '' }],
    transactions: [], tags: [], players: [], races: [], classes: [],
  };
  return data;
}

test('migrate v3→v4 aggiunge photos e avatarPhotoId, bumpa la versione', () => {
  const m = migrate(v3State());
  assert.equal(m.version, 4);
  assert.deepEqual(m.photos, []);
  assert.equal(m.characters[0].avatarPhotoId, null);
  assert.equal(m.groups[0].avatarPhotoId, null);
});

test('migrate non sovrascrive avatarPhotoId già presente', () => {
  const data = v3State();
  data.photos = [{ id: 'p1', entityId: 'c1', caption: '', description: '', tagIds: [], createdAt: 1 }];
  data.characters[0].avatarPhotoId = 'p1';
  const m = migrate(data);
  assert.equal(m.characters[0].avatarPhotoId, 'p1');
});

test('serialize→parse round-trip conserva le foto', () => {
  const data = v3State();
  data.photos = [{ id: 'p1', entityId: 'c1', caption: 'x', description: '', tagIds: [], createdAt: 1 }];
  const state = parseImport(serializeState(migrate(data)));
  assert.equal(state.photos.length, 1);
  assert.equal(state.photos[0].id, 'p1');
});

test('validateState rifiuta una foto con entityId inesistente', () => {
  const m = migrate(v3State());
  m.photos = [{ id: 'p1', entityId: 'MANCA', caption: '', description: '', tagIds: [], createdAt: 1 }];
  assert.throws(() => validateState(m), /foto|photo|nodo/i);
});

test('validateState rifiuta avatarPhotoId che non esiste tra le foto', () => {
  const m = migrate(v3State());
  m.characters[0].avatarPhotoId = 'p-fantasma';
  assert.throws(() => validateState(m), /avatar/i);
});

test('validateState rifiuta un avatar che punta a una foto di un altra entità', () => {
  const m = migrate(v3State());
  m.photos = [{ id: 'p1', entityId: 'g1', caption: '', description: '', tagIds: [], createdAt: 1 }];
  m.characters[0].avatarPhotoId = 'p1'; // p1 è del gruppo, non del personaggio
  assert.throws(() => validateState(m), /avatar/i);
});

test('validateState valida anche l avatarPhotoId dei gruppi', () => {
  const m = migrate(v3State());
  m.groups[0].avatarPhotoId = 'p-fantasma';
  assert.throws(() => validateState(m), /avatar/i);
});

test('validateState rifiuta una foto con createdAt non numerico', () => {
  const m = migrate(v3State());
  m.photos = [{ id: 'p1', entityId: 'c1', caption: '', description: '', tagIds: [], createdAt: 'ieri' }];
  assert.throws(() => validateState(m), /foto|photo/i);
});
