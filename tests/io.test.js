import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createGroup } from '../src/model/schema.js';
import { addCharacter, addTransaction, addGroup, addMember } from '../src/model/reputation.js';
import { serializeState, parseImport, validateState, migrate } from '../src/store/io.js';

function sample() {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'x');
  return s;
}

test('round-trip serialize → parseImport ricostruisce stato identico', () => {
  const s = sample();
  const json = serializeState(s);
  const back = parseImport(json);
  assert.deepEqual(back.characters, s.characters);
  assert.deepEqual(back.transactions, s.transactions);
});

test('validateState rifiuta transazione che punta a char inesistente', () => {
  const s = createState();
  s.transactions.push({ id: 't', fromId: 'ghost', toId: 'ghost2', delta: 1, name: 'n', createdAt: 1 });
  assert.throws(() => validateState(s), /integrità referenziale|fromId|toId/i);
});

test('parseImport rifiuta JSON malformato', () => {
  assert.throws(() => parseImport('{ not json'), /JSON|parse/i);
});

test('migrate lascia invariato uno stato già alla versione corrente', () => {
  const s = sample();
  const migrated = migrate(s);
  assert.equal(migrated.version, s.version);
});

test('validateState rifiuta personaggio senza id', () => {
  const s = { version: 1, characters: [{ name: 'A', deletedAt: null }], transactions: [], groups: [] };
  assert.throws(() => validateState(s), /personaggio|character|id/i);
});

test('validateState rifiuta transazione con delta non numerico', () => {
  const s = {
    version: 1,
    characters: [{ id: 'c1', name: 'A', deletedAt: null }],
    transactions: [{ id: 't1', fromId: 'c1', toId: 'c1', delta: 'x', name: 'n', createdAt: 1 }],
    groups: [],
  };
  assert.throws(() => validateState(s), /transazione|transaction|delta/i);
});

test('serializeState include groups', () => {
  let s = createState();
  s = addGroup(s, 'G', 'fazione');
  const json = serializeState(s);
  const parsed = JSON.parse(json);
  assert.equal(parsed.version, 2);
  assert.equal(parsed.groups.length, 1);
  assert.equal(parsed.groups[0].name, 'G');
});

test('migrate v1 aggiunge groups vuoto e porta version a 2', () => {
  const v1 = { version: 1, characters: [], transactions: [] };
  const migrated = migrate(v1);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.groups, []);
});

test('migrate non sovrascrive groups già presenti', () => {
  const v2 = { version: 2, characters: [], transactions: [], groups: [createGroup('G', '')] };
  const migrated = migrate(v2);
  assert.equal(migrated.groups.length, 1);
});

test('parseImport migra uno stato v1 senza groups', () => {
  const v1json = JSON.stringify({ version: 1, characters: [], transactions: [] });
  const state = parseImport(v1json);
  assert.equal(state.version, 2);
  assert.deepEqual(state.groups, []);
});

test('round-trip export/import con gruppi e transazione diretta su gruppo', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const a = s.characters[0];
  const g = s.groups[0];
  s = addMember(s, g.id, a.id);
  s = addTransaction(s, a.id, g.id, 10, 'verso gruppo');
  const restored = parseImport(serializeState(s));
  assert.equal(restored.groups.length, 1);
  assert.equal(restored.transactions.length, 1);
  assert.deepEqual(restored.groups[0].memberIds, [a.id]);
});

test('validateState accetta transazione il cui endpoint è un gruppo', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const a = s.characters[0];
  const g = s.groups[0];
  s = addTransaction(s, a.id, g.id, 5, 't');
  assert.equal(validateState(s), true);
});

test('validateState rifiuta transazione verso id inesistente', () => {
  const bad = {
    version: 2,
    characters: [{ id: 'c1', name: 'A', deletedAt: null }],
    transactions: [{ id: 't1', fromId: 'c1', toId: 'fantasma', delta: 1, name: 'x', createdAt: 1 }],
    groups: [],
  };
  assert.throws(() => validateState(bad));
});
