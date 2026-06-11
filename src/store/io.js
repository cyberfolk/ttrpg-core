import { SCHEMA_VERSION } from '../model/schema.js';

export function serializeState(state) {
  const payload = {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    characters: state.characters,
    transactions: state.transactions,
    groups: state.groups,
  };
  const json = JSON.stringify(payload, null, 2);
  return json;
}

export function migrate(data) {
  const groups = Array.isArray(data.groups) ? data.groups : [];
  const migrated = { ...data, groups, version: SCHEMA_VERSION };
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
  };
  return state;
}
