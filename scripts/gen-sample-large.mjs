// Genera un salvataggio V2 di esempio "grande" (~5x) con molte relazioni coi gruppi.
// Usa le funzioni MODEL reali -> integrità referenziale garantita.
// Output: outputs/sample-state-v2-large.json
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  addCharacter, addGroup, addMember, addTransaction,
  softDeleteCharacter, softDeleteGroup,
} from '../src/model/reputation.js';
import { createState } from '../src/model/schema.js';
import { serializeState } from '../src/store/io.js';

// PRNG deterministico (mulberry32) per output ripetibile.
function rng(seed) {
  let a = seed;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return value;
  };
  return next;
}
const rand = rng(20260611);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1));

const CHAR_NAMES = [
  'Aldric il Giusto', 'Brina Lamacorta', 'Corvo', 'Delia Vento', 'Eldon Barbagrigia',
  'Faina', 'Gorm Pugnodiferro', 'Helga la Saggia', 'Ivar Lupodargento', 'Jasmin Velluto',
  'Kael Ombralunga', 'Lyra Cantastorie', 'Morwen', 'Nestor il Mercante', 'Orla Fiammascura',
  'Pelle di Cuoio', 'Quinto Asso', 'Rina Spinarossa', 'Sven Martelletto', 'Thalia Lunargenta',
  'Ulf Zannafredda', 'Vesna', 'Wulfric', 'Xandra la Nera', 'Ysolde', 'Zeno il Pavido',
  'Bran Corvonero', 'Cilla', 'Doran Scudobianco', 'Enya',
];

const GROUPS = [
  ['Guardie di Vallalta', 'fazione'],
  ['Borgo di Pietrarossa', 'villaggio'],
  ['Gilda dei Mercanti', 'gilda'],
  ['Culto della Fiamma', 'culto'],
  ['Megalopoli di Auros', 'città'],
  ['Clan Zannafredda', 'clan'],
  ['Compagnia della Strada', 'compagnia'],
  ['Senato di Auros', 'fazione'],
  ['Casata Lunargenta', 'casata'],
  ['Banditi del Passo', 'fazione'],
];

let s = createState();

// 30 personaggi
for (const name of CHAR_NAMES) {
  s = addCharacter(s, name);
}
const charIds = s.characters.map((c) => c.id);

// 10 gruppi
for (const [name, type] of GROUPS) {
  s = addGroup(s, name, type);
}
const groupIds = s.groups.map((g) => g.id);

// Membri: ogni gruppo prende 3-7 personaggi distinti (un pg può stare in più gruppi)
for (const gid of groupIds) {
  const size = randInt(3, 7);
  const chosen = new Set();
  while (chosen.size < size) {
    chosen.add(pick(charIds));
  }
  for (const cid of chosen) {
    s = addMember(s, gid, cid);
  }
}

const REASONS_POS = ['Salvato in battaglia', 'Debito d\'onore', 'Affare concluso', 'Riparato il tetto', 'Patto siglato', 'Difeso il villaggio', 'Dono generoso'];
const REASONS_NEG = ['Lite per il bottino', 'Tradimento sospettato', 'Debito non pagato', 'Insulto in pubblico', 'Furto al mercato', 'Promessa infranta'];
const reason = (delta) => (delta >= 0 ? pick(REASONS_POS) : pick(REASONS_NEG));
const delta = () => {
  const d = randInt(-25, 30);
  const nonZero = d === 0 ? 5 : d;
  return nonZero;
};

let clock = 1749100000000;
const tick = () => {
  clock += randInt(60000, 3600000);
  return clock;
};
const tx = (from, to) => {
  const d = delta();
  s = addTransaction(s, from, to, d, reason(d));
};

// char -> char (~40)
for (let i = 0; i < 40; i += 1) {
  const a = pick(charIds);
  let b = pick(charIds);
  while (b === a) {
    b = pick(charIds);
  }
  clock = tick();
  tx(a, b);
}

// Relazioni coi gruppi -----------------------------------------------------

// char -> group dirette (~20)
for (let i = 0; i < 20; i += 1) {
  clock = tick();
  tx(pick(charIds), pick(groupIds));
}

// group -> char dirette (~20)
for (let i = 0; i < 20; i += 1) {
  clock = tick();
  tx(pick(groupIds), pick(charIds));
}

// Relazioni verso i MEMBRI dei gruppi -> alimentano i punteggi derivati.
// Per ogni gruppo: alcuni "esterni" valutano i suoi membri (derivato X->G),
// e i membri valutano alcuni esterni (derivato G->X).
for (const g of s.groups) {
  const members = g.memberIds;
  if (members.length === 0) {
    continue;
  }
  const outsiders = charIds.filter((c) => !members.includes(c));
  // 2-3 esterni valutano 2-3 membri ciascuno
  const obs = randInt(2, 3);
  for (let i = 0; i < obs; i += 1) {
    const x = pick(outsiders);
    const targets = randInt(2, Math.min(3, members.length));
    const seen = new Set();
    while (seen.size < targets) {
      seen.add(pick(members));
    }
    for (const m of seen) {
      clock = tick();
      tx(x, m);
    }
  }
  // i membri valutano 1-2 esterni
  for (const m of members) {
    if (rand() < 0.5) {
      continue;
    }
    clock = tick();
    tx(m, pick(outsiders));
  }
}

// group -> group (~5)
for (let i = 0; i < 5; i += 1) {
  const a = pick(groupIds);
  let b = pick(groupIds);
  while (b === a) {
    b = pick(groupIds);
  }
  clock = tick();
  tx(a, b);
}

// Un po' di archiviati per realismo
s = softDeleteCharacter(s, charIds[charIds.length - 1]);
s = softDeleteGroup(s, groupIds[groupIds.length - 1]);

const json = serializeState(s);
mkdirSync('outputs', { recursive: true });
writeFileSync('outputs/sample-state-v2-large.json', json, { encoding: 'utf8' });

console.log(
  `Generato: ${s.characters.length} personaggi, ${s.groups.length} gruppi, ${s.transactions.length} transazioni`,
);