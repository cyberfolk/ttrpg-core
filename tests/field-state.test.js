import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createCharacter, createGroup } from '../src/model/schema.js';
import {
  fieldState,
  confirmGroupFieldEmpty, confirmCharacterFieldEmpty,
  setGroupMotto, setGroupGuide, setGroupSeat, addGroup, addMember,
  setRace, setAlignment, setClassLevels,
} from '../src/model/reputation.js';
import { migrate, validateState, parseImport, serializeState } from '../src/store/io.js';

test('fieldState: valore presente → filled', () => {
  const g = { ...createGroup('G', 'fazione'), motto: 'Per la gloria' };
  assert.equal(fieldState(g, 'motto'), 'filled');
});

test('fieldState: vuoto e non confermato → absent (da definire)', () => {
  const g = createGroup('G', 'fazione');
  assert.equal(fieldState(g, 'motto'), 'absent');
  assert.equal(fieldState(g, 'guideId'), 'absent');
});

test('fieldState: vuoto e confermato → none', () => {
  const g = { ...createGroup('G', 'fazione'), confirmedEmpty: ['motto'] };
  assert.equal(fieldState(g, 'motto'), 'none');
});

test('confirmGroupFieldEmpty marca il campo e azzera il valore (testo → "")', () => {
  let s = createState();
  s = addGroup(s, 'G', 'fazione');
  const id = s.groups[0].id;
  s = setGroupMotto(s, id, 'Vecchio motto');
  s = confirmGroupFieldEmpty(s, id, 'motto');
  const g = s.groups[0];
  assert.equal(g.motto, '');
  assert.ok(g.confirmedEmpty.includes('motto'));
  assert.equal(fieldState(g, 'motto'), 'none');
});

test('confirmGroupFieldEmpty su riferimento azzera a null', () => {
  let s = createState();
  const c = createCharacter('Guida');
  s = { ...s, characters: [c] };
  s = addGroup(s, 'G', 'fazione');
  const id = s.groups[0].id;
  s = addMember(s, id, c.id);
  s = setGroupGuide(s, id, c.id);
  s = confirmGroupFieldEmpty(s, id, 'guideId');
  const g = s.groups[0];
  assert.equal(g.guideId, null);
  assert.ok(g.confirmedEmpty.includes('guideId'));
});

test('impostare un valore rimuove il campo da confirmedEmpty (torna filled)', () => {
  let s = createState();
  s = addGroup(s, 'G', 'fazione');
  const id = s.groups[0].id;
  s = confirmGroupFieldEmpty(s, id, 'seat');
  assert.equal(fieldState(s.groups[0], 'seat'), 'none');
  s = setGroupSeat(s, id, 'Waterdeep');
  const g = s.groups[0];
  assert.equal(fieldState(g, 'seat'), 'filled');
  assert.ok(!g.confirmedEmpty.includes('seat'));
});

test('svuotare un campo non lo conferma vuoto: torna absent', () => {
  let s = createState();
  s = addGroup(s, 'G', 'fazione');
  const id = s.groups[0].id;
  s = setGroupSeat(s, id, 'Waterdeep');
  s = setGroupSeat(s, id, '');
  assert.equal(fieldState(s.groups[0], 'seat'), 'absent');
});

test('confirmCharacterFieldEmpty marca razza e la azzera', () => {
  let s = createState();
  const c = createCharacter('A');
  s = { ...s, characters: [c] };
  s = confirmCharacterFieldEmpty(s, c.id, 'raceId');
  const ch = s.characters[0];
  assert.equal(ch.raceId, null);
  assert.equal(fieldState(ch, 'raceId'), 'none');
  // impostare una razza reale la sconferma
  s = { ...s, races: [{ id: 'r1', name: 'Umano' }] };
  s = setRace(s, c.id, 'r1');
  assert.equal(fieldState(s.characters[0], 'raceId'), 'filled');
});

test('classLevels: array vuoto → absent, poi confermabile → none', () => {
  let s = createState();
  const c = createCharacter('A');
  s = { ...s, characters: [c] };
  assert.equal(fieldState(s.characters[0], 'classLevels'), 'absent');
  s = confirmCharacterFieldEmpty(s, c.id, 'classLevels');
  assert.deepEqual(s.characters[0].classLevels, []);
  assert.equal(fieldState(s.characters[0], 'classLevels'), 'none');
});

test('impostare classLevels sconferma il campo (torna filled)', () => {
  let s = createState();
  const c = createCharacter('A');
  s = { ...s, characters: [c], classes: [{ id: 'k1', name: 'Mago' }] };
  s = confirmCharacterFieldEmpty(s, c.id, 'classLevels');
  s = setClassLevels(s, c.id, [{ classId: 'k1', level: 5 }]);
  assert.equal(fieldState(s.characters[0], 'classLevels'), 'filled');
  assert.ok(!s.characters[0].confirmedEmpty.includes('classLevels'));
});

test('migrate v4→v5 fa il backfill di confirmedEmpty vuoto', () => {
  const v4 = {
    version: 4,
    characters: [{ id: 'c1', name: 'A', deletedAt: null, isPg: false, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '', avatarPhotoId: null }],
    groups: [{ id: 'g1', name: 'G', type: 'f', memberIds: [], deletedAt: null, seat: '', guideId: null, motto: '', tagIds: [], notes: '', avatarPhotoId: null }],
    transactions: [], tags: [], players: [], races: [], classes: [], photos: [],
  };
  const m = migrate(v4);
  assert.equal(m.version, 5);
  assert.deepEqual(m.characters[0].confirmedEmpty, []);
  assert.deepEqual(m.groups[0].confirmedEmpty, []);
});

test('validateState rifiuta confirmedEmpty non-array-di-stringhe', () => {
  let s = createState();
  s = addGroup(s, 'G', 'fazione');
  s.groups[0].confirmedEmpty = [42];
  assert.throws(() => validateState(s), /confirmedEmpty/);
});

test('round-trip preserva confirmedEmpty', () => {
  let s = createState();
  s = addGroup(s, 'G', 'fazione');
  const id = s.groups[0].id;
  s = confirmGroupFieldEmpty(s, id, 'motto');
  const back = parseImport(serializeState(s));
  assert.deepEqual(back.groups[0].confirmedEmpty, ['motto']);
});
