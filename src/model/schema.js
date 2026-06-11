export const BASE = 50;
export const SCHEMA_VERSION = 2;

export function newId() {
  const id = crypto.randomUUID();
  return id;
}

export function createState() {
  const state = {
    version: SCHEMA_VERSION,
    characters: [],
    transactions: [],
    groups: [],
  };
  return state;
}

export function createGroup(name, type = '') {
  const group = {
    id: newId(),
    name,
    type,
    memberIds: [],
    deletedAt: null,
  };
  return group;
}

export function createCharacter(name) {
  const character = {
    id: newId(),
    name,
    deletedAt: null,
  };
  return character;
}

export function createTransaction(fromId, toId, delta, name) {
  const transaction = {
    id: newId(),
    fromId,
    toId,
    delta,
    name,
    createdAt: Date.now(),
  };
  return transaction;
}
