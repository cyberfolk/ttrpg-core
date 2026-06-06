import { BASE, createCharacter, createTransaction } from './schema.js';

export function clampView(value) {
  const clamped = Math.max(1, Math.min(100, value));
  return clamped;
}

export function sumDelta(state, fromId, toId) {
  const total = state.transactions
    .filter((tx) => tx.fromId === fromId && tx.toId === toId)
    .reduce((acc, tx) => acc + tx.delta, 0);
  return total;
}

export function computeScore(state, fromId, toId) {
  const raw = BASE + sumDelta(state, fromId, toId);
  const score = clampView(raw);
  return score;
}

export function addCharacter(state, name) {
  const character = createCharacter(name);
  const next = {
    ...state,
    characters: [...state.characters, character],
  };
  return next;
}

export function listActiveCharacters(state) {
  const active = state.characters.filter((c) => c.deletedAt === null);
  return active;
}

export function addTransaction(state, fromId, toId, delta, name) {
  const transaction = createTransaction(fromId, toId, delta, name);
  const next = {
    ...state,
    transactions: [...state.transactions, transaction],
  };
  return next;
}

export function editTransaction(state, txId, changes) {
  const transactions = state.transactions.map((tx) => {
    if (tx.id !== txId) {
      return tx;
    }
    const updated = { ...tx, ...changes };
    return updated;
  });
  const next = { ...state, transactions };
  return next;
}

export function deleteTransaction(state, txId) {
  const transactions = state.transactions.filter((tx) => tx.id !== txId);
  const next = { ...state, transactions };
  return next;
}

export function listTransactions(state, fromId, toId) {
  const list = state.transactions
    .filter((tx) => tx.fromId === fromId && tx.toId === toId)
    .sort((x, y) => x.createdAt - y.createdAt);
  return list;
}
