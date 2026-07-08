import { SCHEMA_VERSION } from '../model/schema.js';

function validateConfirmedEmpty(entity, label) {
  if (entity.confirmedEmpty === undefined) {
    return;
  }
  const ok = Array.isArray(entity.confirmedEmpty)
    && entity.confirmedEmpty.every((f) => typeof f === 'string');
  if (!ok) {
    throw new Error(`${label} ${entity.id}: confirmedEmpty deve essere un array di stringhe`);
  }
}

function validatePool(list, label) {
  if (!Array.isArray(list)) {
    throw new Error(`Pool ${label} non valido: non è un array`);
  }
  for (const it of list) {
    const validId = typeof it.id === 'string' && it.id.length > 0;
    const validName = typeof it.name === 'string';
    if (!validId || !validName) {
      throw new Error(`Pool ${label} non valido: elemento con id/name errati (${JSON.stringify(it)})`);
    }
  }
}

export function serializeState(state) {
  const payload = {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    characters: state.characters,
    transactions: state.transactions,
    groups: state.groups,
    photos: state.photos,
    tags: state.tags,
    players: state.players,
    races: state.races,
    classes: state.classes,
  };
  const json = JSON.stringify(payload, null, 2);
  return json;
}

const CHARACTER_DEFAULTS = {
  isPg: false, raceId: null, classLevels: [], alignment: '',
  playerId: null, tagIds: [], notes: '', avatarPhotoId: null, confirmedEmpty: [],
};
const GROUP_DEFAULTS = {
  seat: '', guideId: null, motto: '', tagIds: [], notes: '', avatarPhotoId: null,
  confirmedEmpty: [],
};

function withDefaults(obj, defaults) {
  const filled = { ...defaults, ...obj };
  return filled;
}

export function migrate(data) {
  const groups = Array.isArray(data.groups) ? data.groups : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const players = Array.isArray(data.players) ? data.players : [];
  const races = Array.isArray(data.races) ? data.races : [];
  const classes = Array.isArray(data.classes) ? data.classes : [];
  // Backfill del punto focale (default centro) sulle foto prive.
  const rawPhotos = Array.isArray(data.photos) ? data.photos : [];
  const photos = rawPhotos.map((p) => ({ focus: { x: 50, y: 50 }, ...p }));
  const characters = (data.characters || []).map((c) => withDefaults(c, CHARACTER_DEFAULTS));
  const migratedGroups = groups.map((g) => withDefaults(g, GROUP_DEFAULTS));
  const migrated = {
    ...data,
    characters,
    groups: migratedGroups,
    photos,
    tags,
    players,
    races,
    classes,
    version: SCHEMA_VERSION,
  };
  return migrated;
}

export function validateState(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Stato non valido: non è un oggetto');
  }
  if (!Array.isArray(data.characters) || !Array.isArray(data.transactions)) {
    throw new Error('Stato non valido: characters/transactions mancanti');
  }
  if (!Array.isArray(data.groups)) {
    throw new Error('Stato non valido: groups mancante');
  }
  for (const c of data.characters) {
    const validId = typeof c.id === 'string' && c.id.length > 0;
    const validName = typeof c.name === 'string';
    const validDeletedAt = c.deletedAt === null || typeof c.deletedAt === 'number';
    if (!validId || !validName || !validDeletedAt) {
      throw new Error(`Personaggio non valido: campi mancanti o errati (${JSON.stringify(c)})`);
    }
  }
  const charIds = new Set(data.characters.map((c) => c.id));
  for (const g of data.groups) {
    const validId = typeof g.id === 'string' && g.id.length > 0;
    const validName = typeof g.name === 'string';
    const validType = typeof g.type === 'string';
    const validMembers = Array.isArray(g.memberIds) && g.memberIds.every((mid) => charIds.has(mid));
    const validDeletedAt = g.deletedAt === null || typeof g.deletedAt === 'number';
    if (!validId || !validName || !validType || !validMembers || !validDeletedAt) {
      throw new Error(`Gruppo non valido: campi mancanti o errati (${JSON.stringify(g)})`);
    }
  }
  const nodeIds = new Set([...charIds, ...data.groups.map((g) => g.id)]);
  for (const tx of data.transactions) {
    const validId = typeof tx.id === 'string' && tx.id.length > 0;
    const validFrom = typeof tx.fromId === 'string';
    const validTo = typeof tx.toId === 'string';
    const validDelta = typeof tx.delta === 'number' && Number.isFinite(tx.delta);
    const validTxName = typeof tx.name === 'string';
    const validCreatedAt = typeof tx.createdAt === 'number';
    if (!validId || !validFrom || !validTo || !validDelta || !validTxName || !validCreatedAt) {
      throw new Error(`Transazione non valida: campi mancanti o errati (${tx.id})`);
    }
    if (!nodeIds.has(tx.fromId) || !nodeIds.has(tx.toId)) {
      throw new Error(`Integrità referenziale rotta: transazione ${tx.id} punta a un nodo inesistente`);
    }
  }

  validatePool(data.tags, 'tags');
  validatePool(data.players, 'players');
  validatePool(data.races, 'races');
  validatePool(data.classes, 'classes');

  const tagIdSet = new Set(data.tags.map((t) => t.id));
  const playerIdSet = new Set(data.players.map((p) => p.id));
  const raceIdSet = new Set(data.races.map((r) => r.id));
  const classIdSet = new Set(data.classes.map((k) => k.id));

  for (const c of data.characters) {
    if (typeof c.isPg !== 'boolean') {
      throw new Error(`Personaggio ${c.id}: isPg non booleano`);
    }
    if (c.raceId !== null && !raceIdSet.has(c.raceId)) {
      throw new Error(`Personaggio ${c.id}: raceId punta a una razza inesistente`);
    }
    if (c.playerId !== null && !playerIdSet.has(c.playerId)) {
      throw new Error(`Personaggio ${c.id}: playerId punta a un giocatore inesistente`);
    }
    if (typeof c.alignment !== 'string') {
      throw new Error(`Personaggio ${c.id}: alignment non è stringa`);
    }
    if (typeof c.notes !== 'string') {
      throw new Error(`Personaggio ${c.id}: notes non è stringa`);
    }
    if (!Array.isArray(c.tagIds) || !c.tagIds.every((tid) => tagIdSet.has(tid))) {
      throw new Error(`Personaggio ${c.id}: tagIds contiene un tag inesistente`);
    }
    validateConfirmedEmpty(c, 'Personaggio');
    if (!Array.isArray(c.classLevels)) {
      throw new Error(`Personaggio ${c.id}: classLevels non è un array`);
    }
    for (const cl of c.classLevels) {
      const okClass = classIdSet.has(cl.classId);
      const okLevel = Number.isInteger(cl.level) && cl.level >= 1 && cl.level <= 20;
      if (!okClass) {
        throw new Error(`Personaggio ${c.id}: classLevels punta a una classe inesistente`);
      }
      if (!okLevel) {
        throw new Error(`Personaggio ${c.id}: livello di classe fuori 1..20 (${cl.level})`);
      }
    }
  }

  for (const g of data.groups) {
    if (typeof g.seat !== 'string' || typeof g.motto !== 'string' || typeof g.notes !== 'string') {
      throw new Error(`Gruppo ${g.id}: seat/motto/notes non stringa`);
    }
    if (g.guideId !== null && !g.memberIds.includes(g.guideId)) {
      throw new Error(`Gruppo ${g.id}: guideId non è un membro del gruppo`);
    }
    if (!Array.isArray(g.tagIds) || !g.tagIds.every((tid) => tagIdSet.has(tid))) {
      throw new Error(`Gruppo ${g.id}: tagIds contiene un tag inesistente`);
    }
    validateConfirmedEmpty(g, 'Gruppo');
  }

  if (!Array.isArray(data.photos)) {
    throw new Error('Stato non valido: photos mancante');
  }
  const photoById = new Map();
  for (const p of data.photos) {
    const validId = typeof p.id === 'string' && p.id.length > 0;
    const validEntity = typeof p.entityId === 'string' && nodeIds.has(p.entityId);
    const validCaption = typeof p.caption === 'string';
    const validDesc = typeof p.description === 'string';
    const validTags = Array.isArray(p.tagIds) && p.tagIds.every((tid) => tagIdSet.has(tid));
    const validCreatedAt = typeof p.createdAt === 'number';
    if (!validId || !validCaption || !validDesc || !validTags || !validCreatedAt) {
      throw new Error(`Foto non valida: campi mancanti o errati (${JSON.stringify(p)})`);
    }
    if (!validEntity) {
      throw new Error(`Foto ${p.id}: entityId punta a un nodo inesistente`);
    }
    if (p.focus !== undefined) {
      const f = p.focus;
      const okFocus = f && typeof f.x === 'number' && typeof f.y === 'number'
        && f.x >= 0 && f.x <= 100 && f.y >= 0 && f.y <= 100;
      if (!okFocus) {
        throw new Error(`Foto ${p.id}: focus deve avere x/y numerici in 0..100`);
      }
    }
    photoById.set(p.id, p);
  }
  const checkAvatar = (entity) => {
    if (entity.avatarPhotoId === null || entity.avatarPhotoId === undefined) {
      return;
    }
    const photo = photoById.get(entity.avatarPhotoId);
    if (!photo) {
      throw new Error(`Entità ${entity.id}: avatarPhotoId punta a una foto inesistente`);
    }
    if (photo.entityId !== entity.id) {
      throw new Error(`Entità ${entity.id}: avatar punta a una foto di un'altra entità`);
    }
  };
  for (const c of data.characters) {
    checkAvatar(c);
  }
  for (const g of data.groups) {
    checkAvatar(g);
  }

  const valid = true;
  return valid;
}

export function parseImport(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new Error(`JSON non valido: ${err.message}`);
  }
  const migrated = migrate(data);
  validateState(migrated);
  const state = {
    version: migrated.version,
    characters: migrated.characters,
    transactions: migrated.transactions,
    groups: migrated.groups,
    photos: migrated.photos,
    tags: migrated.tags,
    players: migrated.players,
    races: migrated.races,
    classes: migrated.classes,
  };
  return state;
}
