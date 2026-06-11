import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, SCHEMA_VERSION, createState, createCharacter, createTransaction, createGroup } from '../../src/model/schema.js';
import { clampView, computeScore, addCharacter, listActiveCharacters, addTransaction, editTransaction, deleteTransaction, listTransactions, softDeleteCharacter, restoreCharacter, hardDeleteCharacter, listArchivedCharacters, averageIncomingScore, hasTransaction, addGroup, listActiveGroups, listArchivedGroups, softDeleteGroup, restoreGroup, hardDeleteGroup, addMember, removeMember, resolveNode, groupDerivedIncoming, groupDerivedOutgoing } from '../../src/model/reputation.js';

test('BASE è 50', () => {
  assert.equal(BASE, 50);
});

test('createState produce stato vuoto valido', () => {
  const s = createState();
  assert.deepEqual(s.characters, []);
  assert.deepEqual(s.transactions, []);
  assert.equal(s.version, 2);
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

test('softDeleteCharacter imposta deletedAt e lo toglie dagli attivi', () => {
  let s = twoChars();
  const a = s.characters[0];
  s = softDeleteCharacter(s, a.id);
  assert.equal(typeof s.characters.find((c) => c.id === a.id).deletedAt, 'number');
  assert.equal(listActiveCharacters(s).length, 1);
  assert.equal(listArchivedCharacters(s).length, 1);
});

test('restoreCharacter riporta deletedAt a null', () => {
  let s = twoChars();
  const a = s.characters[0];
  s = softDeleteCharacter(s, a.id);
  s = restoreCharacter(s, a.id);
  assert.equal(s.characters.find((c) => c.id === a.id).deletedAt, null);
  assert.equal(listActiveCharacters(s).length, 2);
});

test('hardDeleteCharacter rimuove il char e le sue transazioni in entrambe le direzioni', () => {
  let s = twoChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, b.id, 10, 'out');
  s = addTransaction(s, b.id, a.id, -5, 'in');
  s = hardDeleteCharacter(s, a.id);
  assert.equal(s.characters.length, 1);
  assert.equal(s.transactions.length, 0);
});

function threeChars() {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  s = addCharacter(s, 'C');
  return s;
}

test('averageIncomingScore è null se nessuno ha transazioni verso il pg', () => {
  const s = threeChars();
  const a = s.characters[0];
  assert.equal(averageIncomingScore(s, a.id, false), null);
});

test('averageIncomingScore media solo i mittenti con almeno una transazione', () => {
  let s = threeChars();
  const [a, b, c] = s.characters;
  s = addTransaction(s, b.id, a.id, 10, 'x');
  assert.equal(averageIncomingScore(s, a.id, false), 60);
});

test('averageIncomingScore fa la media su più mittenti', () => {
  let s = threeChars();
  const [a, b, c] = s.characters;
  s = addTransaction(s, b.id, a.id, 10, 'x'); // B->A = 60
  s = addTransaction(s, c.id, a.id, -30, 'y'); // C->A = 20
  assert.equal(averageIncomingScore(s, a.id, false), 40);
});

test('averageIncomingScore esclude mittenti archiviati quando includeArchived=false', () => {
  let s = threeChars();
  const [a, b, c] = s.characters;
  s = addTransaction(s, b.id, a.id, 10, 'x'); // 60
  s = addTransaction(s, c.id, a.id, -30, 'y'); // 20
  s = softDeleteCharacter(s, c.id);
  assert.equal(averageIncomingScore(s, a.id, false), 60);
});

test('averageIncomingScore include mittenti archiviati quando includeArchived=true', () => {
  let s = threeChars();
  const [a, b, c] = s.characters;
  s = addTransaction(s, b.id, a.id, 10, 'x'); // 60
  s = addTransaction(s, c.id, a.id, -30, 'y'); // 20
  s = softDeleteCharacter(s, c.id);
  assert.equal(averageIncomingScore(s, a.id, true), 40);
});

test('averageIncomingScore non considera il pg stesso come mittente', () => {
  let s = threeChars();
  const [a, b] = s.characters;
  s = addTransaction(s, a.id, a.id, 40, 'auto');
  s = addTransaction(s, b.id, a.id, 10, 'x'); // 60
  assert.equal(averageIncomingScore(s, a.id, false), 60);
});

test('SCHEMA_VERSION è 2', () => {
  assert.equal(SCHEMA_VERSION, 2);
});

test('createState include groups vuoto', () => {
  const state = createState();
  assert.deepEqual(state.groups, []);
  assert.equal(state.version, 2);
});

test('createGroup crea gruppo con campi attesi', () => {
  const g = createGroup('Ladri', 'gilda');
  assert.equal(typeof g.id, 'string');
  assert.equal(g.name, 'Ladri');
  assert.equal(g.type, 'gilda');
  assert.deepEqual(g.memberIds, []);
  assert.equal(g.deletedAt, null);
});

test('createGroup senza type usa stringa vuota', () => {
  const g = createGroup('Senza tipo');
  assert.equal(g.type, '');
});

test('addGroup aggiunge un gruppo attivo', () => {
  let s = createState();
  s = addGroup(s, 'Guardie', 'fazione');
  assert.equal(s.groups.length, 1);
  assert.equal(s.groups[0].name, 'Guardie');
  assert.equal(s.groups[0].type, 'fazione');
  assert.deepEqual(listActiveGroups(s).map((g) => g.name), ['Guardie']);
});

test('soft delete e restore gruppo', () => {
  let s = createState();
  s = addGroup(s, 'G', '');
  const id = s.groups[0].id;
  s = softDeleteGroup(s, id);
  assert.equal(listActiveGroups(s).length, 0);
  assert.equal(listArchivedGroups(s).length, 1);
  s = restoreGroup(s, id);
  assert.equal(listActiveGroups(s).length, 1);
  assert.equal(listArchivedGroups(s).length, 0);
});

test('addMember è idempotente e non duplica', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const charId = s.characters[0].id;
  const groupId = s.groups[0].id;
  s = addMember(s, groupId, charId);
  s = addMember(s, groupId, charId);
  assert.deepEqual(s.groups[0].memberIds, [charId]);
});

test('addMember ignora personaggio inesistente', () => {
  let s = createState();
  s = addGroup(s, 'G', '');
  const groupId = s.groups[0].id;
  s = addMember(s, groupId, 'id-fantasma');
  assert.deepEqual(s.groups[0].memberIds, []);
});

test('removeMember toglie il membro ed è idempotente', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const charId = s.characters[0].id;
  const groupId = s.groups[0].id;
  s = addMember(s, groupId, charId);
  s = removeMember(s, groupId, charId);
  assert.deepEqual(s.groups[0].memberIds, []);
  s = removeMember(s, groupId, charId);
  assert.deepEqual(s.groups[0].memberIds, []);
});

test('hardDeleteGroup rimuove gruppo e sue transazioni dirette, non i membri', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const charId = s.characters[0].id;
  const groupId = s.groups[0].id;
  s = addMember(s, groupId, charId);
  s = addTransaction(s, charId, groupId, 10, 'verso gruppo');
  s = addTransaction(s, groupId, charId, -5, 'dal gruppo');
  s = hardDeleteGroup(s, groupId);
  assert.equal(s.groups.length, 0);
  assert.equal(s.transactions.length, 0);
  assert.equal(s.characters.length, 1);
});

test('hasTransaction è esportata e rileva una transazione', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addCharacter(s, 'B');
  const [a, b] = s.characters;
  assert.equal(hasTransaction(s, a.id, b.id), false);
  s = addTransaction(s, a.id, b.id, 5, 't');
  assert.equal(hasTransaction(s, a.id, b.id), true);
});

test('resolveNode distingue personaggio, gruppo e id ignoto', () => {
  let s = createState();
  s = addCharacter(s, 'A');
  s = addGroup(s, 'G', '');
  const charId = s.characters[0].id;
  const groupId = s.groups[0].id;
  assert.equal(resolveNode(s, charId).kind, 'character');
  assert.equal(resolveNode(s, groupId).kind, 'group');
  assert.equal(resolveNode(s, 'ignoto'), null);
});

test('groupDerivedIncoming: media membri qualificati, neutri esclusi', () => {
  let s = createState();
  s = addCharacter(s, 'X');
  s = addCharacter(s, 'M1');
  s = addCharacter(s, 'M2');
  s = addCharacter(s, 'M3');
  s = addGroup(s, 'G', '');
  const [x, m1, m2, m3] = s.characters;
  const g = s.groups[0];
  s = addMember(s, g.id, m1.id);
  s = addMember(s, g.id, m2.id);
  s = addMember(s, g.id, m3.id);
  s = addTransaction(s, x.id, m1.id, 20, 't');
  s = addTransaction(s, x.id, m2.id, -10, 't');
  const expected = Math.round((computeScore(s, x.id, m1.id) + computeScore(s, x.id, m2.id)) / 2);
  assert.equal(groupDerivedIncoming(s, x.id, g.id), expected);
});

test('groupDerivedIncoming è null se nessun membro qualificato', () => {
  let s = createState();
  s = addCharacter(s, 'X');
  s = addCharacter(s, 'M1');
  s = addGroup(s, 'G', '');
  const [x, m1] = s.characters;
  const g = s.groups[0];
  s = addMember(s, g.id, m1.id);
  assert.equal(groupDerivedIncoming(s, x.id, g.id), null);
});

test('groupDerivedOutgoing: media di come i membri considerano X', () => {
  let s = createState();
  s = addCharacter(s, 'X');
  s = addCharacter(s, 'M1');
  s = addCharacter(s, 'M2');
  s = addGroup(s, 'G', '');
  const [x, m1, m2] = s.characters;
  const g = s.groups[0];
  s = addMember(s, g.id, m1.id);
  s = addMember(s, g.id, m2.id);
  s = addTransaction(s, m1.id, x.id, 30, 't');
  assert.equal(groupDerivedOutgoing(s, g.id, x.id), computeScore(s, m1.id, x.id));
});

test('groupDerivedOutgoing è null se nessun membro qualificato', () => {
  let s = createState();
  s = addCharacter(s, 'X');
  s = addCharacter(s, 'M1');
  s = addGroup(s, 'G', '');
  const [x, m1] = s.characters;
  const g = s.groups[0];
  s = addMember(s, g.id, m1.id);
  assert.equal(groupDerivedOutgoing(s, g.id, x.id), null);
});
