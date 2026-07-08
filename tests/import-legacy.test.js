// Import end-to-end di file "vecchi" (pre-feature anagrafica): stringa JSON grezza
// → parseImport (migrate + validate insieme). Prova la GIUNZIONE che i test di
// migrate/validate isolati non coprono: un file migrato da v1/v2 deve anche
// PASSARE la validazione e produrre uno stato v3 usabile.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImport } from '../src/store/io.js';
import { computeScore } from '../src/model/reputation.js';

// Export realistico v2 (com'era prima della feature): niente pool, niente campi
// anagrafici; personaggi/gruppi/transazioni nella forma v2.
const LEGACY_V2 = JSON.stringify({
  version: 2,
  exportedAt: 1749200000000,
  characters: [
    { id: 'c1', name: 'Aragorn', deletedAt: null },
    { id: 'c2', name: 'Sauron', deletedAt: 1749100000000 },
  ],
  groups: [
    { id: 'g1', name: 'La Compagnia', type: 'fazione', memberIds: ['c1'], deletedAt: null },
  ],
  transactions: [
    { id: 't1', fromId: 'c1', toId: 'g1', delta: 10, name: 'salvato in battaglia', createdAt: 1749100000000 },
    { id: 't2', fromId: 'c1', toId: 'c2', delta: -30, name: 'tradimento', createdAt: 1749100000001 },
  ],
});

// Export realistico v1 (ancora più vecchio): nessun array groups.
const LEGACY_V1 = JSON.stringify({
  version: 1,
  exportedAt: 1749200000000,
  characters: [{ id: 'c1', name: 'Bilbo', deletedAt: null }],
  transactions: [],
});

test('import di un file v2 legacy migra E passa la validazione (nessun throw)', () => {
  const state = parseImport(LEGACY_V2);
  assert.equal(state.version, 5);
});

test('import v2 legacy: pool aggiunti vuoti', () => {
  const state = parseImport(LEGACY_V2);
  assert.deepEqual(state.tags, []);
  assert.deepEqual(state.players, []);
  assert.deepEqual(state.races, []);
  assert.deepEqual(state.classes, []);
});

test('import v2 legacy: personaggi con default anagrafici retro-riempiti', () => {
  const state = parseImport(LEGACY_V2);
  const c1 = state.characters.find((c) => c.id === 'c1');
  assert.equal(c1.isPg, false);
  assert.equal(c1.raceId, null);
  assert.deepEqual(c1.classLevels, []);
  assert.equal(c1.alignment, '');
  assert.equal(c1.playerId, null);
  assert.deepEqual(c1.tagIds, []);
  assert.equal(c1.notes, '');
});

test('import v2 legacy: gruppi con default retro-riempiti', () => {
  const state = parseImport(LEGACY_V2);
  const g1 = state.groups.find((g) => g.id === 'g1');
  assert.equal(g1.seat, '');
  assert.equal(g1.guideId, null);
  assert.equal(g1.motto, '');
  assert.deepEqual(g1.tagIds, []);
  assert.equal(g1.notes, '');
  assert.deepEqual(g1.memberIds, ['c1']);
});

test('import v2 legacy: le transazioni sopravvivono e il punteggio si ricalcola', () => {
  const state = parseImport(LEGACY_V2);
  assert.equal(state.transactions.length, 2);
  // 50 + (-30) sulla direzione c1→c2
  assert.equal(computeScore(state, 'c1', 'c2'), 20);
  // 50 + 10 sulla direzione c1→g1 (gruppo come nodo)
  assert.equal(computeScore(state, 'c1', 'g1'), 60);
});

test('import di un file v1 legacy migra a v3 con groups e pool vuoti', () => {
  const state = parseImport(LEGACY_V1);
  assert.equal(state.version, 5);
  assert.deepEqual(state.groups, []);
  assert.deepEqual(state.tags, []);
  const c1 = state.characters.find((c) => c.id === 'c1');
  assert.equal(c1.isPg, false);
  assert.deepEqual(c1.classLevels, []);
});
