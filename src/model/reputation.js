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

export function softDeleteCharacter(state, id) {
  const characters = state.characters.map((c) => {
    if (c.id !== id) {
      return c;
    }
    const updated = { ...c, deletedAt: Date.now() };
    return updated;
  });
  const next = { ...state, characters };
  return next;
}

export function restoreCharacter(state, id) {
  const characters = state.characters.map((c) => {
    if (c.id !== id) {
      return c;
    }
    const updated = { ...c, deletedAt: null };
    return updated;
  });
  const next = { ...state, characters };
  return next;
}

export function hardDeleteCharacter(state, id) {
  const characters = state.characters.filter((c) => c.id !== id);
  const transactions = state.transactions.filter(
    (tx) => tx.fromId !== id && tx.toId !== id,
  );
  const next = { ...state, characters, transactions };
  return next;
}

export function listArchivedCharacters(state) {
  const archived = state.characters.filter((c) => c.deletedAt !== null);
  return archived;
}

export function averageIncomingScore(state, charId, includeArchived) {
  const pool = includeArchived
    ? state.characters
    : state.characters.filter((c) => c.deletedAt === null);
  const others = pool.filter((c) => c.id !== charId);
  const senders = others.filter((sender) => hasTransaction(state, sender.id, charId));
  if (senders.length === 0) {
    return null;
  }
  const total = senders.reduce((acc, sender) => acc + computeScore(state, sender.id, charId), 0);
  // media arrotondata all'intero per coerenza con i punteggi mostrati
  const average = Math.round(total / senders.length);
  return average;
}

function hasTransaction(state, fromId, toId) {
  const has = state.transactions.some((tx) => tx.fromId === fromId && tx.toId === toId);
  return has;
}
