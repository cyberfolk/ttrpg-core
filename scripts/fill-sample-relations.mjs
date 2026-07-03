// Riempie datas/sample-story.json così che ogni entità (personaggio o gruppo)
// abbia almeno una transazione verso ogni altra entità, in entrambe le direzioni
// (grafo diretto completo). Le transazioni esistenti non vengono toccate: si
// aggiungono solo le direzioni mancanti. Delta coerente con le fazioni della
// storia (blocco cittadino vs Corvi Neri), motivi variati da pool di template.
//
// Uso:  node scripts/fill-sample-relations.mjs            (scrive il file)
//       node scripts/fill-sample-relations.mjs --dry      (solo report)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const FILE = join(here, '..', 'datas', 'sample-story.json');
const dryRun = process.argv.includes('--dry');

const raw = readFileSync(FILE, 'utf8');
const data = JSON.parse(raw);

const chars = data.characters.filter((c) => c.deletedAt == null);
const groups = data.groups.filter((g) => g.deletedAt == null);

// Fazioni della storia. Mirena (002) è la redenta: ex-Corvo ora allineata alla città.
const CRIME_CHARS = new Set(['004', '009']); // Sera Ombravento, Kessa la Rossa
const NEUTRAL_CHARS = new Set(['00b', '00e']); // Nyra Fiordighiaccio, Grimwald il Muto
const CRIME_GROUPS = new Set(['6a0d0000-0000-4000-8000-000000000003']); // I Corvi Neri

const shortId = (id) => id.slice(-3); // ultime 3 cifre esadecimali dell'id personaggio

function factionOf(entity) {
  if (entity.kind === 'group') {
    return CRIME_GROUPS.has(entity.id) ? 'crime' : 'city';
  }
  const s = shortId(entity.id);
  if (NEUTRAL_CHARS.has(s)) return 'neutral';
  if (CRIME_CHARS.has(s)) return 'crime';
  return 'city';
}

const entities = [
  ...chars.map((c) => ({ id: c.id, name: c.name, kind: 'character' })),
  ...groups.map((g) => ({ id: g.id, name: g.name, kind: 'group', memberIds: g.memberIds || [] })),
];
entities.forEach((e) => (e.faction = factionOf(e)));
const byId = new Map(entities.map((e) => [e.id, e]));

// Coppie (from|to) già coperte da almeno una transazione.
const existing = new Set(data.transactions.map((t) => `${t.fromId}|${t.toId}`));

// Rapporto di appartenenza gruppo<->membro (in una delle due direzioni).
function isBelonging(a, b) {
  const grp = a.kind === 'group' ? a : b.kind === 'group' ? b : null;
  const other = grp === a ? b : a;
  const belong = grp != null && other.kind === 'character' && grp.memberIds.includes(other.id);
  return belong;
}

// Categoria della relazione from->to.
function relationKind(from, to) {
  if (isBelonging(from, to)) return 'belong';
  if (from.faction === 'neutral' || to.faction === 'neutral') return 'neutral';
  const crossBloc =
    (from.faction === 'city' && to.faction === 'crime') ||
    (from.faction === 'crime' && to.faction === 'city');
  const kind = crossBloc ? 'rival' : 'ally';
  return kind;
}

// Pool di motivi (gender-neutral per evitare accordi sbagliati) e delta per categoria.
// {to} è l'entità giudicata: la frase la nomina come soggetto dell'azione.
const POOLS = {
  ally: {
    deltas: [8, 10, 12, 15, 18, 20],
    templates: [
      '{to} ha combattuto al mio fianco senza esitare',
      'Posso contare su {to} quando le cose si fanno difficili',
      '{to} ha mantenuto la parola data, come sempre',
      'Devo a {to} più di un favore che non dimentico',
      '{to} si è schierato dalla mia parte davanti a tutti',
      'Ho stretto un patto con {to} e finora ha retto',
      '{to} mi ha teso una mano nel momento del bisogno',
      'Con {to} le nostre strade corrono nella stessa direzione',
    ],
  },
  rival: {
    deltas: [-15, -20, -25, -30, -35, -40],
    templates: [
      '{to} ha tramato nell’ombra contro di me',
      'Non perdonerò a {to} il torto subito',
      '{to} mi ha voltato le spalle al momento del bisogno',
      'Ogni volta che incrocio {to} porto la mano alla lama',
      '{to} lavora contro tutto ciò in cui credo',
      '{to} ha rotto ogni tregua che avevamo',
      'Le mire di {to} minacciano quanto ho costruito',
      'So bene da che parte sta {to}, e non è la mia',
    ],
  },
  neutral: {
    deltas: [3, 5, 8, -3, -5],
    templates: [
      'Ho incrociato {to} un paio di volte, senza troppe parole',
      '{to} bada ai suoi affari, e io ai miei',
      'Con {to} ci si saluta appena, nulla di più',
      'Di {to} so poco, e per ora mi basta così',
      '{to} è passato di qui una volta, poi più nulla',
    ],
  },
  belong: {
    deltas: [10, 12, 14, 15, 18],
    templates: [
      '{to} porta alto il nome della nostra insegna',
      'Sono orgoglioso di avere {to} tra le nostre file',
      '{to} risponde alla chiamata ogni volta che serve',
      'La fedeltà di {to} verso i nostri non è mai mancata',
      '{to} è uno di noi, nel bene e nel male',
    ],
  },
};

// Contatore id: continua la sequenza esadecimale dopo l'ultimo id transazione.
const maxIdHex = data.transactions.reduce((m, t) => {
  const n = parseInt(t.id.slice(-12), 16);
  return Number.isFinite(n) && n > m ? n : m;
}, 0);
let idCounter = maxIdHex;
const nextId = () => {
  idCounter += 1;
  return `77000000-0000-4000-8000-${idCounter.toString(16).padStart(12, '0')}`;
};

// createdAt: continua dopo l'ultima transazione, +1h per riga (ordine stabile).
const maxCreatedAt = data.transactions.reduce((m, t) => Math.max(m, t.createdAt), 0);
let clock = maxCreatedAt;
const nextCreatedAt = () => {
  clock += 3600000;
  return clock;
};

const newTx = [];
let pick = 0; // indice per variare template/delta in modo deterministico
for (const from of entities) {
  for (const to of entities) {
    if (from.id === to.id) continue;
    const key = `${from.id}|${to.id}`;
    if (existing.has(key)) continue;
    const kind = relationKind(from, to);
    const pool = POOLS[kind];
    const delta = pool.deltas[pick % pool.deltas.length];
    const template = pool.templates[pick % pool.templates.length];
    const name = template.replace('{to}', to.name);
    newTx.push({
      id: nextId(),
      fromId: from.id,
      toId: to.id,
      delta,
      name,
      createdAt: nextCreatedAt(),
    });
    existing.add(key);
    pick += 1;
  }
}

// Report.
const totalPairs = entities.length * (entities.length - 1);
console.log(`Entità: ${entities.length} (personaggi ${chars.length}, gruppi ${groups.length})`);
console.log(`Coppie dirette possibili: ${totalPairs}`);
console.log(`Transazioni esistenti: ${data.transactions.length}`);
console.log(`Direzioni già coperte: ${totalPairs - newTx.length}`);
console.log(`Direzioni mancanti aggiunte: ${newTx.length}`);
const breakdown = newTx.reduce((acc, t) => {
  const f = byId.get(t.fromId);
  const to = byId.get(t.toId);
  const k = relationKind(f, to);
  acc[k] = (acc[k] || 0) + 1;
  return acc;
}, {});
console.log('Ripartizione nuove per categoria:', breakdown);

if (dryRun) {
  console.log('\n[--dry] Nessuna scrittura.');
  process.exit(0);
}

// Serializza le nuove transazioni nello stesso stile compatto (una per riga)
// e le inserisce prima della `]` di chiusura dell'array transactions, senza
// riscrivere il resto del file.
const fmt = (t) =>
  `    { "id": ${JSON.stringify(t.id)}, "fromId": ${JSON.stringify(t.fromId)}, ` +
  `"toId": ${JSON.stringify(t.toId)}, "delta": ${t.delta}, "name": ${JSON.stringify(t.name)}, ` +
  `"createdAt": ${t.createdAt} }`;

const marker = '\n  ]';
const idx = raw.lastIndexOf(marker); // chiusura dell'array transactions
const head = raw.slice(0, idx); // termina con l'ultima transazione `}`
const tail = raw.slice(idx); // `\n  ]\n}` finale
const block = ',\n' + newTx.map(fmt).join(',\n');
const out = head + block + tail;

writeFileSync(FILE, out, { encoding: 'utf8' }); // UTF-8 senza BOM
console.log(`\nScritto ${FILE}`);
