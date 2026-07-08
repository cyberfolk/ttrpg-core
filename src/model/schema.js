export const BASE = 50;
export const SCHEMA_VERSION = 5;

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
    photos: [],
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
    avatarPhotoId: null,
    // Campi opzionali marcati "confermato vuoto" (vs "da definire"): vedi
    // fieldState in reputation.js. Es. ['motto', 'guideId'].
    confirmedEmpty: [],
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
    avatarPhotoId: null,
    // Campi opzionali marcati "confermato vuoto" (vs "da definire").
    confirmedEmpty: [],
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

export function createPhoto(entityId, meta = {}) {
  const photo = {
    id: newId(),
    entityId,
    caption: meta.caption ?? '',
    description: meta.description ?? '',
    tagIds: meta.tagIds ?? [],
    createdAt: Date.now(),
    // Punto focale per l'inquadratura in object-fit: cover (0..100%). 50/50 = centro.
    focus: meta.focus ?? { x: 50, y: 50 },
  };
  return photo;
}
