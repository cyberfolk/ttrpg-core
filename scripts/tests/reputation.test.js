import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, SCHEMA_VERSION, createState, createCharacter, createTransaction } from '../../src/model/schema.js';
import { clampView, computeScore, addCharacter, listActiveCharacters, addTransaction, editTransaction, deleteTransaction, listTransactions } from '../../src/model/reputation.js';

test('BASE è 50 e SCHEMA_VERSION è 1', () => {
  assert.equal(BASE, 50);
  assert.equal(SCHEMA_VERSION, 1);
});

test('createState produce stato vuoto valido', () => {
  const s = createState();
  assert.deepEqual(s.characters, []);
  assert.deepEqual(s.transactions, []);
  assert.equal(s.version, 1);
});

test('createCharacter genera id, name e deletedAt null', () => {
  const c = createCharacter('Aragorn');
  assert.equal(typeof c.id, 'string');
  assert.ok(c.id.length > 0);
  assert.equal(c.name, 'Aragorn');
  assert.equal(c.deletedAt, null);
});

test('createTransaction popola i campi e createdAt numerico', () => {
  const tx = createTransaction('c1', 'c2', 10, 'salvato in battaglia');
  assert.equal(typeof tx.id, 'string');
  assert.equal(tx.fromId, 'c1');
  assert.equal(tx.toId, 'c2');
  assert.equal(tx.delta, 10);
  assert.equal(tx.name, 'salvato in battaglia');
  assert.equal(typeof tx.createdAt, 'number');
});

test('clampView blocca tra 1 e 100', () => {
  assert.equal(clampView(50), 50);
  assert.equal(clampView(0), 1);
  assert.equal(clampView(-5), 1);
  assert.equal(clampView(150), 100);
});

test('computeScore di relazione senza transazioni è 50', () => {
  const state = createState();
  state.characters.push(createCharacter('A'), createCharacter('B'));
  const [a, b] = state.characters;
  assert.equal(computeScore(state, a.id, b.id), 50);
});

test('computeScore somma i delta della direzione corretta', () => {
  const state = createState();
  const a = createCharacter('A');
  const b = createCharacter('B');
  state.characters.push(a, b);
  state.transactions.push(
    createTransaction(a.id, b.id, 10, 'x'),
    createTransaction(a.id, b.id, 5, 'y'),
    createTransaction(b.id, a.id, -30, 'z'),
  );
  assert.equal(computeScore(state, a.id, b.id), 65);
  assert.equal(computeScore(state, b.id, a.id), 20);
});

test('computeScore clampa solo in vista, somma interna libera', () => {
  const state = createState();
  const a = createCharacter('A');
  const b = createCharacter('B');
  state.characters.push(a, b);
  state.transactions.push(
    createTransaction(a.id, b.id, 60, 'su'),
    createTransaction(a.id, b.id, -20, 'giu'),
  );
  assert.equal(computeScore(state, a.id, b.id), 90);
});

test('addCharacter ritorna nuovo stato senza mutare il precedente', () => {
  const s0 = createState();
  const s1 = addCharacter(s0, 'Aragorn');
  assert.equal(s0.characters.length, 0);
  assert.equal(s1.characters.length, 1);
  assert.equal(s1.characters[0].name, 'Aragorn');
});

test('nuovo personaggio nasce a 50 verso tutti gli esistenti e viceversa', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  const [a, b] = s.characters;
  assert.equal(computeScore(s, a.id, b.id), 50);
  assert.equal(computeScore(s, b.id, a.id), 50);
});

test('listActiveCharacters esclude i soft-deleted', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s.characters[0].deletedAt = 123;
  const active = listActiveCharacters(s);
  assert.equal(active.length, 0);
});

function twoChars() {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  return s;
}

test('addTransaction modifica il punteggio e non muta lo stato originale', () => {
  const s0 = twoChars();
  const [a, b] = s0.characters;
  const s1 = addTransaction(s0, a.id, b.id, 10, 'aiuto');
  assert.equal(s0.transactions.length, 0);
  assert.equal(computeScore(s1, a.id, b.id), 60);
});

test('listTransactions filtra per direzione e ordina per createdAt', () => {
  let s = twoChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'primo');
  s = addTransaction(s, b.id, a.id, -5, 'opposto');
  s = addTransaction(s, a.id, b.id, 3, 'secondo');
  const list = listTransactions(s, a.id, b.id);
  assert.equal(list.length, 2);
  assert.equal(list[0].name, 'primo');
  assert.equal(list[1].name, 'secondo');
});

test('editTransaction cambia delta e name e ricalcola il punteggio', () => {
  let s = twoChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'x');
  const tx = s.transactions[0];
  s = editTransaction(s, tx.id, { delta: 25, name: 'y' });
  assert.equal(s.transactions[0].delta, 25);
  assert.equal(s.transactions[0].name, 'y');
  assert.equal(computeScore(s, a.id, b.id), 75);
});

test('deleteTransaction rimuove la transazione e ricalcola', () => {
  let s = twoChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'x');
  const tx = s.transactions[0];
  s = deleteTransaction(s, tx.id);
  assert.equal(s.transactions.length, 0);
  assert.equal(computeScore(s, a.id, b.id), 50);
});
