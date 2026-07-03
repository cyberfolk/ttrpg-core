// Disambiguazione a display per entità omonime. L'id resta la chiave vera:
// qui calcoliamo solo quali nomi collidono, per mostrare un hint accanto al
// nome SOLO quando serve (due entità dello stesso tipo con lo stesso nome).

// Coda breve e leggibile di un id, per distinguere due omonimi.
export function shortId(id) {
  const tail = String(id).slice(-4);
  return tail;
}

const NO_NAME = '(senza nome)';

// Nome da mostrare per un'entità: il suo nome, oppure — se vuoto o solo spazi —
// un segnaposto con la coda id, così più entità senza nome restano distinguibili.
// Difensivo: i nomi vuoti nascono solo da import di dati malformati.
export function displayName(entity) {
  if (!entity) {
    return '';
  }
  const name = (entity.name ?? '').trim();
  if (name) {
    return name;
  }
  const label = `${NO_NAME} #${shortId(entity.id)}`;
  return label;
}

// Data una lista di entità { id, name, kind }, restituisce una Map
// id -> coda-id SOLO per quelle il cui nome (trim, case-insensitive) collide
// con un'altra entità dello STESSO kind. Le entità con nome unico non compaiono.
// Un personaggio e un gruppo omonimi NON sono ambigui: li distingue il glifo.
export function ambiguousIds(entities) {
  const byKey = new Map(); // `${kind}|${nome}` -> [id...]
  for (const e of entities) {
    const name = (e.name ?? '').trim().toLowerCase();
    const key = `${e.kind}|${name}`;
    if (!byKey.has(key)) {
      byKey.set(key, []);
    }
    byKey.get(key).push(e.id);
  }
  const suffixes = new Map();
  for (const ids of byKey.values()) {
    if (ids.length > 1) {
      for (const id of ids) {
        suffixes.set(id, shortId(id));
      }
    }
  }
  return suffixes;
}
