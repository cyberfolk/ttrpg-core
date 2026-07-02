// Genera il salvataggio V2 di esempio "grande" con molte relazioni coi gruppi
// e un blocco di casi-limite (nomi estremi, unicode, gruppo vuoto/solitario,
// membri duplicati, delta estremi, archiviati). Il dataset resta IMPORTABILE
// (integrità referenziale intatta: nessun membro fantasma).
// Usa le funzioni MODEL reali dove possibile; i gruppi con membri duplicati
// sono costruiti a mano perche' addMember li deduplicherebbe.
//
// Output DETERMINISTICO: id e timestamp vengono rimappati a valori stabili in
// coda, cosi' rieseguendo lo script si riottiene lo stesso file byte-per-byte.
// Scrive direttamente in datas/sample-state-v2-large.json.
import { writeFileSync } from 'node:fs';
import {
  addCharacter, addGroup, addMember, addTransaction,
  softDeleteCharacter, softDeleteGroup,
} from '../src/model/reputation.js';
import { createState, newId, SCHEMA_VERSION } from '../src/model/schema.js';

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

// Gruppi aggiuntivi "puliti": membri indicati per indice di personaggio base
// (0-29). Creati dopo i casi-limite ma dichiarati qui per leggibilità.
const EXTRA_GROUPS = [
  ['Corporazione dei Mercanti', 'gilda', [2, 5, 8, 11]],
  ['Ordine del Sole Nascente', 'ordine', [5, 8, 11, 14, 17]],
  ['Casata Valombra', 'casata', [9, 12, 15]],
  ['Setta del Velo Cinereo', 'setta', [13, 16, 19, 22]],
  ['Compagnia della Lama Spezzata', 'compagnia', [1, 4, 7, 10, 13, 16]],
  ['Circolo dei Druidi di Selvanera', 'circolo', [7, 10, 13]],
];

let s = createState();

// --- BASE deterministica: 30 personaggi, 10 gruppi, relazioni ------------
for (const name of CHAR_NAMES) {
  s = addCharacter(s, name);
}
const charIds = s.characters.map((c) => c.id);

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
  tx(a, b);
}

// char -> group dirette (~20)
for (let i = 0; i < 20; i += 1) {
  tx(pick(charIds), pick(groupIds));
}

// group -> char dirette (~20)
for (let i = 0; i < 20; i += 1) {
  tx(pick(groupIds), pick(charIds));
}

// Relazioni verso i MEMBRI dei gruppi -> alimentano i punteggi derivati.
for (const g of s.groups) {
  const members = g.memberIds;
  if (members.length === 0) {
    continue;
  }
  const outsiders = charIds.filter((c) => !members.includes(c));
  const obs = randInt(2, 3);
  for (let i = 0; i < obs; i += 1) {
    const x = pick(outsiders);
    const targets = randInt(2, Math.min(3, members.length));
    const seen = new Set();
    while (seen.size < targets) {
      seen.add(pick(members));
    }
    for (const m of seen) {
      tx(x, m);
    }
  }
  for (const m of members) {
    if (rand() < 0.5) {
      continue;
    }
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
  tx(a, b);
}

// Archiviati "naturali": ultimo personaggio base (Enya) e ultimo gruppo base
// (Banditi del Passo). Restano gli unici archiviati del dataset.
s = softDeleteCharacter(s, charIds[charIds.length - 1]);
s = softDeleteGroup(s, groupIds[groupIds.length - 1]);

// --- CASI-LIMITE ---------------------------------------------------------
// Personaggi con nomi estremi/unicode/whitespace/HTML/duplicati.
const EDGE_CHAR_NAMES = [
  'Aelthrindavel Ombraluminescente della Torre di Cristallo del Crepuscolo Eterno, Signore dei Sette Venti Gelidi, Custode del Sigillo Infranto e Ultimo Erede della Casata Dimenticata di Valcupa',
  'Supercalifragilisticexpialidocioustantissimamentesenzaspazidisorta',
  'Ц',
  '<script>alert(\'rep\')</script> & "virgolette" \'apici\' <b>grassetto</b>',
  '   ',
  '',
  'Corvo',
  'Riga1\nRiga2\tTab',
  '𝕽𝖆𝖌𝖓𝖆𝖗 🗡️🛡️🐉 مرحبا שלום 🔥',
  'ZzzoÉ̷̢̛͈̳͇̬͛̈́̀͝ n̶̡̠̈́̆̕ (glitch combinanti)',
];
for (const name of EDGE_CHAR_NAMES) {
  s = addCharacter(s, name);
}
const allCharIds = s.characters.map((c) => c.id);

// Gruppi speciali. Costruiti a mano per poter contenere membri duplicati
// (addMember li deduplicherebbe) o configurazioni particolari.
const rawGroup = (name, type, idxs) => {
  const memberIds = idxs.map((x) => allCharIds[x]);
  const g = { id: newId(), name, type, memberIds, deletedAt: null };
  s = { ...s, groups: [...s.groups, g] };
  return g;
};

rawGroup(
  'Confraternita Arcana degli Astri Nascosti e Custodi del Grimorio Proibito delle Ere Perdute, Ramo Occidentale di Vallalta e Territori Limitrofi del Passo Innevato',
  'ordine cavalleresco-monastico-mercantile transregionale',
  [0, 1],
);
rawGroup('Gruppo Vuoto', 'fazione', []);
rawGroup('Gruppo Solitario', '', [2]);
rawGroup('Membri Duplicati', 'clan', [2, 2, 29]);
rawGroup('🏰 Fortezza <Ombre> & "Nebbie" 𝔊𝔬𝔱𝔦𝔠𝔞', '🗡️ militare', [33, 35]);
const gOrda = rawGroup(
  'Orda Sterminata', 'orda',
  Array.from({ length: 29 }, (_, i) => i),
);
for (const [name, type, idxs] of EXTRA_GROUPS) {
  rawGroup(name, type, idxs);
}

// Transazioni estreme: delta ai limiti e una causale vuota.
const txRaw = (from, to, d, name) => {
  s = addTransaction(s, from, to, d, name);
};
txRaw(allCharIds[30], allCharIds[31], 9999, 'Delta estremo positivo');
txRaw(allCharIds[32], allCharIds[33], -9999, 'Delta estremo negativo');
txRaw(allCharIds[0], gOrda.id, 5, '');
txRaw(gOrda.id, allCharIds[36], 12, 'Voce di corridoio');
txRaw(allCharIds[38], allCharIds[39], -3, 'Screzio linguistico');

// --- Rimappatura deterministica di id e timestamp ------------------------
// Sostituisce gli uuid casuali (e i createdAt/deletedAt basati su Date.now)
// con valori stabili, così l'output è riproducibile byte-per-byte.
let idCounter = 0;
const detId = () => {
  idCounter += 1;
  const hex = idCounter.toString(16).padStart(12, '0');
  return `d0dec0de-0000-4000-8000-${hex}`;
};
const EXPORTED_AT = 1781189644285;
const CREATED_AT_BASE = 1749100000000;
const CREATED_AT_STEP = 60000;
const ARCHIVED_AT = 1749900000000;

const idMap = new Map();
for (const c of s.characters) {
  const nid = detId();
  idMap.set(c.id, nid);
  c.id = nid;
}
for (const g of s.groups) {
  const nid = detId();
  idMap.set(g.id, nid);
  g.id = nid;
}
for (const g of s.groups) {
  g.memberIds = g.memberIds.map((m) => idMap.get(m) ?? m);
  if (g.deletedAt !== null) {
    g.deletedAt = ARCHIVED_AT;
  }
}
for (const c of s.characters) {
  if (c.deletedAt !== null) {
    c.deletedAt = ARCHIVED_AT;
  }
}
s.transactions.forEach((t, i) => {
  t.id = detId();
  t.fromId = idMap.get(t.fromId) ?? t.fromId;
  t.toId = idMap.get(t.toId) ?? t.toId;
  t.createdAt = CREATED_AT_BASE + i * CREATED_AT_STEP;
});

// --- Serializzazione (exportedAt fisso per determinismo) -----------------
const payload = {
  version: SCHEMA_VERSION,
  exportedAt: EXPORTED_AT,
  characters: s.characters,
  transactions: s.transactions,
  groups: s.groups,
};
const json = `${JSON.stringify(payload, null, 2)}\n`;
writeFileSync('datas/sample-state-v2-large.json', json, { encoding: 'utf8' });

console.log(
  `Generato: ${s.characters.length} personaggi, ${s.groups.length} gruppi, ${s.transactions.length} transazioni`,
);
