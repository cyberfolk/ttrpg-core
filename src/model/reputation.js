import { BASE, createCharacter, createTransaction, createGroup } from './schema.js';

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

export function hasTransaction(state, fromId, toId) {
  const has = state.transactions.some((tx) => tx.fromId === fromId && tx.toId === toId);
  return has;
}

export function addGroup(state, name, type) {
  const group = createGroup(name, type);
  const next = { ...state, groups: [...state.groups, group] };
  return next;
}

export function listActiveGroups(state) {
  const active = state.groups.filter((g) => g.deletedAt === null);
  return active;
}

export function listArchivedGroups(state) {
  const archived = state.groups.filter((g) => g.deletedAt !== null);
  return archived;
}

export function softDeleteGroup(state, id) {
  const groups = state.groups.map((g) => {
    if (g.id !== id) {
      return g;
    }
    const updated = { ...g, deletedAt: Date.now() };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}

export function restoreGroup(state, id) {
  const groups = state.groups.map((g) => {
    if (g.id !== id) {
      return g;
    }
    const updated = { ...g, deletedAt: null };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}

export function hardDeleteGroup(state, id) {
  const groups = state.groups.filter((g) => g.id !== id);
  const transactions = state.transactions.filter(
    (tx) => tx.fromId !== id && tx.toId !== id,
  );
  const next = { ...state, groups, transactions };
  return next;
}

export function addMember(state, groupId, charId) {
  const charExists = state.characters.some((c) => c.id === charId);
  if (!charExists) {
    return state;
  }
  const groups = state.groups.map((g) => {
    if (g.id !== groupId) {
      return g;
    }
    if (g.memberIds.includes(charId)) {
      return g;
    }
    const updated = { ...g, memberIds: [...g.memberIds, charId] };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}

export function removeMember(state, groupId, charId) {
  const groups = state.groups.map((g) => {
    if (g.id !== groupId) {
      return g;
    }
    const memberIds = g.memberIds.filter((mid) => mid !== charId);
    const updated = { ...g, memberIds };
    return updated;
  });
  const next = { ...state, groups };
  return next;
}

export function resolveNode(state, id) {
  const character = state.characters.find((c) => c.id === id);
  if (character) {
    const node = { kind: 'character', entity: character };
    return node;
  }
  const group = state.groups.find((g) => g.id === id);
  if (group) {
    const node = { kind: 'group', entity: group };
    return node;
  }
  return null;
}

// Calcola la media arrotondata dei punteggi dei membri qualificati.
// scoreFn.has(state, mid) → bool: il membro è qualificato (ha transazioni)
// scoreFn.score(state, mid) → number: punteggio del membro
function averageQualifiedScores(state, memberIds, scoreFn) {
  const qualified = memberIds.filter((mid) => scoreFn.has(state, mid));
  if (qualified.length === 0) {
    return null;
  }
  const total = qualified.reduce((acc, mid) => acc + scoreFn.score(state, mid), 0);
  const average = Math.round(total / qualified.length);
  return average;
}

// Punteggio derivato: come sourceId considera il gruppo (media verso i membri qualificati).
export function groupDerivedIncoming(state, sourceId, groupId) {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) {
    return null;
  }
  const average = averageQualifiedScores(state, group.memberIds, {
    has: (s, mid) => hasTransaction(s, sourceId, mid),
    score: (s, mid) => computeScore(s, sourceId, mid),
  });
  return average;
}

// Punteggio derivato: come il gruppo considera targetId (media dei membri qualificati verso target).
export function groupDerivedOutgoing(state, groupId, targetId) {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) {
    return null;
  }
  const average = averageQualifiedScores(state, group.memberIds, {
    has: (s, mid) => hasTransaction(s, mid, targetId),
    score: (s, mid) => computeScore(s, mid, targetId),
  });
  return average;
}
