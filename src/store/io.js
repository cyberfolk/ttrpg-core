import { SCHEMA_VERSION } from '../model/schema.js';

export function serializeState(state) {
  const payload = {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    characters: state.characters,
    transactions: state.transactions,
  };
  const json = JSON.stringify(payload, null, 2);
  return json;
}

export function migrate(data) {
  // V1: nessuna migrazione. Hook per versioni future: if (data.version < 2) {...}
  const migrated = { ...data, version: SCHEMA_VERSION };
  return migrated;
}

export function validateState(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Stato non valido: non è un oggetto');
  }
  if (!Array.isArray(data.characters) || !Array.isArray(data.transactions)) {
    throw new Error('Stato non valido: characters/transactions mancanti');
  }
  const ids = new Set(data.characters.map((c) => c.id));
  for (const tx of data.transactions) {
    if (!ids.has(tx.fromId) || !ids.has(tx.toId)) {
      throw new Error(`Integrità referenziale rotta: transazione ${tx.id} punta a un personaggio inesistente`);
    }
  }
  return true;
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
  };
  return state;
}
