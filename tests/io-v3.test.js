import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createCharacter, createGroup, createLookup } from '../src/model/schema.js';
import { setCharacterTags, setGroupSeat, addLookupItem } from '../src/model/reputation.js';
import { migrate, serializeState, parseImport } from '../src/store/io.js';

test('migrate v2 aggiunge i pool e i default sui campi', () => {
  const v2 = {
    version: 2,
    characters: [{ id: 'c1', name: 'A', deletedAt: null }],
    groups: [{ id: 'g1', name: 'G', type: 'fazione', memberIds: [], deletedAt: null }],
    transactions: [],
  };
  const m = migrate(v2);
  assert.equal(m.version, 3);
  assert.deepEqual(m.tags, []);
  assert.deepEqual(m.players, []);
  assert.deepEqual(m.races, []);
  assert.deepEqual(m.classes, []);
  assert.equal(m.characters[0].isPg, false);
  assert.deepEqual(m.characters[0].classLevels, []);
  assert.equal(m.characters[0].alignment, '');
  assert.equal(m.characters[0].raceId, null);
  assert.equal(m.characters[0].playerId, null);
  assert.deepEqual(m.characters[0].tagIds, []);
  assert.equal(m.characters[0].notes, '');
  assert.equal(m.groups[0].seat, '');
  assert.equal(m.groups[0].guideId, null);
  assert.equal(m.groups[0].motto, '');
  assert.deepEqual(m.groups[0].tagIds, []);
  assert.equal(m.groups[0].notes, '');
});

test('migrate non sovrascrive valori già presenti', () => {
  const partial = {
    version: 2,
    characters: [{ id: 'c1', name: 'A', deletedAt: null, notes: 'esistente' }],
    groups: [],
    transactions: [],
    tags: [{ id: 't1', name: 'mago' }],
  };
  const m = migrate(partial);
  assert.equal(m.characters[0].notes, 'esistente');
  assert.deepEqual(m.tags, [{ id: 't1', name: 'mago' }]);
});

test('serializeState include i quattro pool', () => {
  let s = createState();
  s = addLookupItem(s, 'tags', createLookup('mercenario'));
  const parsed = JSON.parse(serializeState(s));
  assert.equal(parsed.version, 3);
  assert.equal(parsed.tags[0].name, 'mercenario');
  assert.ok(Array.isArray(parsed.players));
  assert.ok(Array.isArray(parsed.races));
  assert.ok(Array.isArray(parsed.classes));
});

test('round-trip v3 con tag e sede', () => {
  let s = createState();
  const c = createCharacter('A');
  const g = createGroup('G', 'fazione');
  s = { ...s, characters: [c], groups: [g] };
  s = addLookupItem(s, 'tags', createLookup('nobile'));
  const tagId = s.tags[0].id;
  s = setCharacterTags(s, c.id, [tagId]);
  s = setGroupSeat(s, g.id, 'Valdûr');
  const back = parseImport(serializeState(s));
  assert.deepEqual(back.characters[0].tagIds, [tagId]);
  assert.equal(back.groups[0].seat, 'Valdûr');
});
