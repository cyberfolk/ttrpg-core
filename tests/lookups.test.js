import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, createLookup } from '../src/model/schema.js';
import { addLookupItem, renameLookupItem, listLookup } from '../src/model/reputation.js';

test('addLookupItem aggiunge un elemento al pool', () => {
  const s0 = createState();
  const tag = createLookup('mercenario');
  const s1 = addLookupItem(s0, 'tags', tag);
  assert.equal(s1.tags.length, 1);
  assert.equal(s1.tags[0].name, 'mercenario');
  assert.equal(s0.tags.length, 0, 'stato originale non mutato');
});

test('addLookupItem è idempotente sullo stesso id', () => {
  const s0 = createState();
  const tag = createLookup('nobile');
  const s1 = addLookupItem(s0, 'tags', tag);
  const s2 = addLookupItem(s1, 'tags', tag);
  assert.equal(s2.tags.length, 1);
});

test('addLookupItem funziona su ogni collezione', () => {
  let s = createState();
  s = addLookupItem(s, 'players', createLookup('Giulia'));
  s = addLookupItem(s, 'races', createLookup('Elfo'));
  s = addLookupItem(s, 'classes', createLookup('Ladro'));
  assert.equal(s.players[0].name, 'Giulia');
  assert.equal(s.races[0].name, 'Elfo');
  assert.equal(s.classes[0].name, 'Ladro');
});

test('renameLookupItem cambia il nome per id', () => {
  const s0 = createState();
  const race = createLookup('Elf');
  const s1 = addLookupItem(s0, 'races', race);
  const s2 = renameLookupItem(s1, 'races', race.id, 'Elfo');
  assert.equal(s2.races[0].name, 'Elfo');
});

test('listLookup ritorna il pool', () => {
  const s0 = createState();
  const s1 = addLookupItem(s0, 'tags', createLookup('mago'));
  assert.deepEqual(listLookup(s1, 'tags').map((t) => t.name), ['mago']);
});
