export const BASE = 50;
export const SCHEMA_VERSION = 3;

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
    tags: [],
    players: [],
    races: [],
    classes: [],
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
    seat: '',
    guideId: null,
    motto: '',
    tagIds: [],
    notes: '',
  };
  return group;
}

export function createCharacter(name) {
  const character = {
    id: newId(),
    name,
    deletedAt: null,
    isPg: false,
    raceId: null,
    classLevels: [],
    alignment: '',
    playerId: null,
    tagIds: [],
    notes: '',
  };
  return character;
}

export function createLookup(name) {
  const item = { id: newId(), name };
  return item;
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
