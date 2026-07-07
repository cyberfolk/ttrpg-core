import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createCharacter, createGroup } from '../src/model/schema.js';
import {
  setGroupSeat, setGroupGuide, setGroupMotto, setGroupTags, setGroupNotes,
  addMember, removeMember, hardDeleteCharacter,
} from '../src/model/reputation.js';

function withGroupAndMember() {
  const c = createCharacter('Gorim');
  const g = createGroup('La Compagnia', 'fazione');
  const s0 = { ...createState(), characters: [c], groups: [g] };
  const s1 = addMember(s0, g.id, c.id);
  return { state: s1, groupId: g.id, charId: c.id };
}

test('setGroupSeat/Motto/Tags/Notes aggiornano il gruppo', () => {
  const { state, groupId } = withGroupAndMember();
  let s = setGroupSeat(state, groupId, 'Valdûr');
  s = setGroupMotto(s, groupId, "L'ombra ricorda.");
  s = setGroupTags(s, groupId, ['t1']);
  s = setGroupNotes(s, groupId, 'nota');
  const g = s.groups[0];
  assert.equal(g.seat, 'Valdûr');
  assert.equal(g.motto, "L'ombra ricorda.");
  assert.deepEqual(g.tagIds, ['t1']);
  assert.equal(g.notes, 'nota');
});

test('setGroupGuide accetta un membro', () => {
  const { state, groupId, charId } = withGroupAndMember();
  const s = setGroupGuide(state, groupId, charId);
  assert.equal(s.groups[0].guideId, charId);
});

test('setGroupGuide accetta null', () => {
  const { state, groupId, charId } = withGroupAndMember();
  let s = setGroupGuide(state, groupId, charId);
  s = setGroupGuide(s, groupId, null);
  assert.equal(s.groups[0].guideId, null);
});

test('setGroupGuide rifiuta un non-membro (stato invariato)', () => {
  const { state, groupId } = withGroupAndMember();
  const s = setGroupGuide(state, groupId, 'estraneo');
  assert.equal(s.groups[0].guideId, null);
});

test('removeMember azzera la guida se era quel membro', () => {
  const { state, groupId, charId } = withGroupAndMember();
  let s = setGroupGuide(state, groupId, charId);
  s = removeMember(s, groupId, charId);
  assert.equal(s.groups[0].guideId, null);
  assert.deepEqual(s.groups[0].memberIds, []);
});

test('hardDeleteCharacter azzera la guida nei gruppi che lo indicavano', () => {
  const { state, groupId, charId } = withGroupAndMember();
  let s = setGroupGuide(state, groupId, charId);
  s = hardDeleteCharacter(s, charId);
  assert.equal(s.groups[0].guideId, null);
  assert.deepEqual(s.groups[0].memberIds, []);
});
