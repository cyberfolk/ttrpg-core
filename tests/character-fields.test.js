import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createCharacter } from '../src/model/schema.js';
import {
  setRole, setRace, setAlignment, setPlayer, setClassLevels,
  setCharacterTags, setCharacterNotes, characterLevel,
} from '../src/model/reputation.js';

function withChar() {
  const s0 = createState();
  const c = createCharacter('Aragorn');
  const s1 = { ...s0, characters: [c] };
  return { state: s1, id: c.id };
}

test('setRole cambia isPg senza mutare l originale', () => {
  const { state, id } = withChar();
  const next = setRole(state, id, true);
  assert.equal(next.characters[0].isPg, true);
  assert.equal(state.characters[0].isPg, false);
});

test('setRace, setAlignment, setPlayer aggiornano i riferimenti', () => {
  const { state, id } = withChar();
  let s = setRace(state, id, 'r1');
  s = setAlignment(s, id, 'Caotico Neutrale');
  s = setPlayer(s, id, 'p1');
  assert.equal(s.characters[0].raceId, 'r1');
  assert.equal(s.characters[0].alignment, 'Caotico Neutrale');
  assert.equal(s.characters[0].playerId, 'p1');
});

test('setClassLevels sostituisce l array e characterLevel ne somma i livelli', () => {
  const { state, id } = withChar();
  const levels = [{ classId: 'c1', level: 3 }, { classId: 'c2', level: 2 }];
  const next = setClassLevels(state, id, levels);
  assert.deepEqual(next.characters[0].classLevels, levels);
  assert.equal(characterLevel(next.characters[0]), 5);
});

test('characterLevel di zero classi è 0', () => {
  const c = createCharacter('X');
  assert.equal(characterLevel(c), 0);
});

test('setCharacterTags e setCharacterNotes aggiornano', () => {
  const { state, id } = withChar();
  let s = setCharacterTags(state, id, ['t1', 't2']);
  s = setCharacterNotes(s, id, 'nota **md**');
  assert.deepEqual(s.characters[0].tagIds, ['t1', 't2']);
  assert.equal(s.characters[0].notes, 'nota **md**');
});
