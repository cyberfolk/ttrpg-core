import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../../src/model/schema.js';
import { addCharacter, addTransaction } from '../../src/model/reputation.js';
import { serializeState, parseImport, validateState, migrate } from '../../src/store/io.js';

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
  const s = { version: 1, characters: [{ name: 'A', deletedAt: null }], transactions: [] };
  assert.throws(() => validateState(s), /personaggio|character|id/i);
});

test('validateState rifiuta transazione con delta non numerico', () => {
  const s = {
    version: 1,
    characters: [{ id: 'c1', name: 'A', deletedAt: null }],
    transactions: [{ id: 't1', fromId: 'c1', toId: 'c1', delta: 'x', name: 'n', createdAt: 1 }],
  };
  assert.throws(() => validateState(s), /transazione|transaction|delta/i);
});
