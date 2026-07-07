// Trasforma sample-story.json (schema v2) in schema v3:
// aggiunge i pool lookup (tags/players/races/classes) e popola i campi
// anagrafici di personaggi e gruppi. Le transazioni restano intatte.
//
// Uso: node scripts/enrich-sample-story.mjs
// Output: datas/sample-story-v3.json

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const src = join(root, 'datas', 'sample-story.json');
const dst = join(root, 'datas', 'sample-story.json');

const raw = readFileSync(src, 'utf8');
const data = JSON.parse(raw);

// --- ID personaggi (short alias) ---
const C = {
  aldric: '5107a1e0-0000-4000-8000-000000000001',
  mirena: '5107a1e0-0000-4000-8000-000000000002',
  bram: '5107a1e0-0000-4000-8000-000000000003',
  sera: '5107a1e0-0000-4000-8000-000000000004',
  anselmo: '5107a1e0-0000-4000-8000-000000000005',
  ysolde: '5107a1e0-0000-4000-8000-000000000006',
  gareth: '5107a1e0-0000-4000-8000-000000000007',
  vittore: '5107a1e0-0000-4000-8000-000000000008',
  kessa: '5107a1e0-0000-4000-8000-000000000009',
  toran: '5107a1e0-0000-4000-8000-00000000000a',
  nyra: '5107a1e0-0000-4000-8000-00000000000b',
  doran: '5107a1e0-0000-4000-8000-00000000000c',
  selene: '5107a1e0-0000-4000-8000-00000000000d',
  grimwald: '5107a1e0-0000-4000-8000-00000000000e',
};

const G = {
  guardia: '6a0d0000-0000-4000-8000-000000000001',
  gilda: '6a0d0000-0000-4000-8000-000000000002',
  corvi: '6a0d0000-0000-4000-8000-000000000003',
  ordine: '6a0d0000-0000-4000-8000-000000000004',
  sprone: '6a0d0000-0000-4000-8000-000000000005',
};

// --- Pool lookup: {id, name} con UUID fissi per prefisso ---
const races = {
  umano: { id: '9ace0000-0000-4000-8000-000000000001', name: 'Umano' },
  nano: { id: '9ace0000-0000-4000-8000-000000000002', name: 'Nano' },
  elfo: { id: '9ace0000-0000-4000-8000-000000000003', name: 'Elfo' },
  mezzelfo: { id: '9ace0000-0000-4000-8000-000000000004', name: 'Mezzelfo' },
  halfling: { id: '9ace0000-0000-4000-8000-000000000005', name: 'Halfling' },
  mezzorco: { id: '9ace0000-0000-4000-8000-000000000006', name: 'Mezzorco' },
  tiefling: { id: '9ace0000-0000-4000-8000-000000000007', name: 'Tiefling' },
  gnomo: { id: '9ace0000-0000-4000-8000-000000000008', name: 'Gnomo' },
};

const classes = {
  paladino: { id: 'c1a50000-0000-4000-8000-000000000001', name: 'Paladino' },
  ladro: { id: 'c1a50000-0000-4000-8000-000000000002', name: 'Ladro' },
  guerriero: { id: 'c1a50000-0000-4000-8000-000000000003', name: 'Guerriero' },
  chierico: { id: 'c1a50000-0000-4000-8000-000000000004', name: 'Chierico' },
  bardo: { id: 'c1a50000-0000-4000-8000-000000000005', name: 'Bardo' },
  mago: { id: 'c1a50000-0000-4000-8000-000000000006', name: 'Mago' },
  druido: { id: 'c1a50000-0000-4000-8000-000000000007', name: 'Druido' },
  ranger: { id: 'c1a50000-0000-4000-8000-000000000008', name: 'Ranger' },
  barbaro: { id: 'c1a50000-0000-4000-8000-000000000009', name: 'Barbaro' },
  stregone: { id: 'c1a50000-0000-4000-8000-00000000000a', name: 'Stregone' },
  monaco: { id: 'c1a50000-0000-4000-8000-00000000000b', name: 'Monaco' },
};

const players = {
  giulia: { id: 'b1a70000-0000-4000-8000-000000000001', name: 'Giulia' },
  marco: { id: 'b1a70000-0000-4000-8000-000000000002', name: 'Marco' },
  luca: { id: 'b1a70000-0000-4000-8000-000000000003', name: 'Luca' },
};

const tags = {
  capitano: { id: '7a600000-0000-4000-8000-000000000001', name: 'capitano' },
  spia: { id: '7a600000-0000-4000-8000-000000000002', name: 'spia' },
  criminale: { id: '7a600000-0000-4000-8000-000000000003', name: 'criminale' },
  nobile: { id: '7a600000-0000-4000-8000-000000000004', name: 'nobile' },
  mercante: { id: '7a600000-0000-4000-8000-000000000005', name: 'mercante' },
  religioso: { id: '7a600000-0000-4000-8000-000000000006', name: 'religioso' },
  guaritore: { id: '7a600000-0000-4000-8000-000000000007', name: 'guaritore' },
  ricercato: { id: '7a600000-0000-4000-8000-000000000008', name: 'ricercato' },
  veterano: { id: '7a600000-0000-4000-8000-000000000009', name: 'veterano' },
  recluta: { id: '7a600000-0000-4000-8000-00000000000a', name: 'recluta' },
  straniero: { id: '7a600000-0000-4000-8000-00000000000b', name: 'straniero' },
  corte: { id: '7a600000-0000-4000-8000-00000000000c', name: 'corte' },
  artigiano: { id: '7a600000-0000-4000-8000-00000000000d', name: 'artigiano' },
  eremita: { id: '7a600000-0000-4000-8000-00000000000e', name: 'eremita' },
  redento: { id: '7a600000-0000-4000-8000-00000000000f', name: 'redento' },
};

// --- Profili personaggi ---
const charProfiles = {
  [C.aldric]: {
    isPg: true, raceId: races.umano.id,
    classLevels: [{ classId: classes.paladino.id, level: 8 }],
    alignment: 'Legale Buono', playerId: players.giulia.id,
    tagIds: [tags.capitano.id, tags.veterano.id, tags.religioso.id],
    notes: '# Aldric il Giusto\n\nCapitano della **Guardia Cittadina**. Paladino votato alla Luce, difende i deboli e non scende a patti coi Corvi.\n\n- Ha messo una taglia su Kessa la Rossa.\n- Paga in segreto Mirena perché spii i Corvi.',
  },
  [C.mirena]: {
    isPg: true, raceId: races.mezzelfo.id,
    classLevels: [{ classId: classes.ladro.id, level: 6 }],
    alignment: 'Caotico Neutrale', playerId: players.marco.id,
    tagIds: [tags.spia.id, tags.redento.id, tags.ricercato.id],
    notes: '# Mirena Volpe\n\nEx-Corvo redenta. Spia doppiogiochista: passa mappe alla Guardia. I Corvi le hanno messo una taglia sulla testa dopo il tradimento.\n\n> «La Luce perdona chi si redime.»',
  },
  [C.bram]: {
    isPg: false, raceId: races.nano.id,
    classLevels: [{ classId: classes.guerriero.id, level: 4 }],
    alignment: 'Legale Neutrale', playerId: null,
    tagIds: [tags.artigiano.id, tags.mercante.id],
    notes: 'Fabbro nano, forgia le lame migliori della città. Membro della Gilda dei Mercanti.',
  },
  [C.sera]: {
    isPg: false, raceId: races.tiefling.id,
    classLevels: [{ classId: classes.ladro.id, level: 5 }],
    alignment: 'Caotico Malvagio', playerId: null,
    tagIds: [tags.criminale.id, tags.spia.id],
    notes: 'Assassina dei Corvi Neri. Esegue gli ordini di Kessa senza fare domande. Ha tentato di uccidere Mirena in un vicolo.',
  },
  [C.anselmo]: {
    isPg: false, raceId: races.umano.id,
    classLevels: [{ classId: classes.chierico.id, level: 7 }],
    alignment: 'Legale Buono', playerId: null,
    tagIds: [tags.religioso.id, tags.guaritore.id],
    notes: 'Padre dell\'Ordine della Luce. Cura i feriti senza chiedere nulla in cambio.',
  },
  [C.ysolde]: {
    isPg: false, raceId: races.elfo.id,
    classLevels: [{ classId: classes.bardo.id, level: 5 }],
    alignment: 'Neutrale Buono', playerId: null,
    tagIds: [tags.corte.id],
    notes: 'Bardessa di corte a Casa Sprone. Canta le gesta di Mirena l\'eroina e infama Kessa la Rossa.',
  },
  [C.gareth]: {
    isPg: false, raceId: races.umano.id,
    classLevels: [{ classId: classes.guerriero.id, level: 3 }, { classId: classes.bardo.id, level: 1 }],
    alignment: 'Legale Neutrale', playerId: null,
    tagIds: [tags.nobile.id, tags.corte.id],
    notes: 'Patriarca di **Casa Sprone**. Mecenate: finanzia Guardia, Gilda e Ordine della Luce.',
  },
  [C.vittore]: {
    isPg: false, raceId: races.umano.id,
    classLevels: [{ classId: classes.guerriero.id, level: 2 }],
    alignment: 'Legale Neutrale', playerId: null,
    tagIds: [tags.mercante.id],
    notes: 'Capo della Gilda dei Mercanti. Paga le tasse, finanzia le ronde della Guardia. I Corvi gli hanno bruciato il magazzino per il pizzo negato.',
  },
  [C.kessa]: {
    isPg: false, raceId: races.mezzorco.id,
    classLevels: [{ classId: classes.ladro.id, level: 7 }, { classId: classes.barbaro.id, level: 1 }],
    alignment: 'Caotico Malvagio', playerId: null,
    tagIds: [tags.criminale.id, tags.ricercato.id],
    notes: '# Kessa la Rossa\n\nCapo dei **Corvi Neri**. Spietata: ha ordinato la morte di Mirena la traditrice. Catturata dalla Guardia grazie alle mappe di Mirena.',
  },
  [C.toran]: {
    isPg: false, raceId: races.nano.id,
    classLevels: [{ classId: classes.guerriero.id, level: 3 }],
    alignment: 'Neutrale Buono', playerId: null,
    tagIds: [tags.veterano.id],
    notes: 'Oste e veterano della Guardia. La sua locanda è un crocevia di voci. I Corvi mangiano senza mai pagare.',
  },
  [C.nyra]: {
    isPg: true, raceId: races.gnomo.id,
    classLevels: [{ classId: classes.mago.id, level: 4 }, { classId: classes.stregone.id, level: 1 }],
    alignment: 'Neutrale', playerId: players.luca.id,
    tagIds: [tags.straniero.id],
    notes: 'Maga straniera, da poco in città. Incanta le merci dei mercanti contro i ladri. La Guardia le ha dato asilo al suo arrivo.',
  },
  [C.doran]: {
    isPg: false, raceId: races.halfling.id,
    classLevels: [{ classId: classes.ranger.id, level: 2 }],
    alignment: 'Legale Buono', playerId: null,
    tagIds: [tags.recluta.id],
    notes: 'Esploratore e recluta più promettente della Guardia: batte le strade e i dintorni, occhio da ranger. Prende Aldric a modello.',
  },
  [C.selene]: {
    isPg: false, raceId: races.mezzelfo.id,
    classLevels: [{ classId: classes.chierico.id, level: 4 }, { classId: classes.druido.id, level: 1 }],
    alignment: 'Neutrale Buono', playerId: null,
    tagIds: [tags.religioso.id, tags.guaritore.id],
    notes: 'Guaritrice dell\'Ordine della Luce, dono raro. Ha curato in segreto Mirena in fuga.',
  },
  [C.grimwald]: {
    isPg: false, raceId: races.umano.id,
    classLevels: [{ classId: classes.druido.id, level: 3 }, { classId: classes.monaco.id, level: 3 }],
    alignment: 'Neutrale', playerId: null,
    tagIds: [tags.eremita.id],
    notes: 'Eremita muto del bosco. Venera la Luce di Anselmo, dona erbe rare a Ysolde.',
  },
};

// --- Profili gruppi ---
const groupProfiles = {
  [G.guardia]: {
    seat: 'Caserma del Molo', guideId: C.aldric,
    motto: 'Scudo della città',
    tagIds: [tags.veterano.id],
    notes: 'La **Guardia Cittadina**. In guerra aperta coi Corvi Neri; protegge Gilda, Ordine e Casa Sprone.',
  },
  [G.gilda]: {
    seat: 'Loggia dei Mercanti', guideId: C.vittore,
    motto: 'Onesto guadagno, patto rispettato',
    tagIds: [tags.mercante.id],
    notes: 'La **Gilda dei Mercanti**. Finanzia le ronde della Guardia, assolda cacciatori di taglie contro i Corvi.',
  },
  [G.corvi]: {
    seat: 'Fogne del Quartiere Vecchio', guideId: C.kessa,
    motto: 'L\'ombra non perdona',
    tagIds: [tags.criminale.id, tags.ricercato.id],
    notes: 'I **Corvi Neri**, gilda del crimine. Taglieggiano i mercanti, in faida con la Guardia. Kessa è stata catturata.',
  },
  [G.ordine]: {
    seat: 'Tempio della Luce', guideId: C.anselmo,
    motto: 'La Luce perdona chi si redime',
    tagIds: [tags.religioso.id, tags.guaritore.id],
    notes: 'L\'**Ordine della Luce**. Cura i feriti, accoglie i redenti come Mirena.',
  },
  [G.sprone]: {
    seat: 'Palazzo Sprone', guideId: C.gareth,
    motto: 'Nobiltà obbliga',
    tagIds: [tags.nobile.id, tags.corte.id],
    notes: 'Casa **Sprone**, nobiltà cittadina. Mecenate di Guardia, Gilda e Ordine.',
  },
};

// --- Applica: personaggi ---
const characters = data.characters.map((c) => {
  const p = charProfiles[c.id];
  if (!p) {
    throw new Error(`Nessun profilo per personaggio ${c.id} (${c.name})`);
  }
  const enriched = {
    id: c.id,
    name: c.name,
    deletedAt: c.deletedAt ?? null,
    isPg: p.isPg,
    raceId: p.raceId,
    classLevels: p.classLevels,
    alignment: p.alignment,
    playerId: p.playerId,
    tagIds: p.tagIds,
    notes: p.notes,
  };
  return enriched;
});

// Coerenza roster: Mirena ha disertato i Corvi Neri (arco di tradimento nelle
// transazioni, taglia sulla sua testa). Non è più un membro attivo.
const memberRemovals = {
  [G.corvi]: [C.mirena],
};

// --- Applica: gruppi ---
const groups = data.groups.map((g) => {
  const p = groupProfiles[g.id];
  if (!p) {
    throw new Error(`Nessun profilo per gruppo ${g.id} (${g.name})`);
  }
  const removals = memberRemovals[g.id] ?? [];
  const memberIds = g.memberIds.filter((mid) => !removals.includes(mid));
  const guideStillMember = p.guideId === null || memberIds.includes(p.guideId);
  if (!guideStillMember) {
    throw new Error(`Guida ${p.guideId} non è membro del gruppo ${g.name}`);
  }
  const enriched = {
    id: g.id,
    name: g.name,
    type: g.type,
    memberIds,
    deletedAt: g.deletedAt ?? null,
    seat: p.seat,
    guideId: p.guideId,
    motto: p.motto,
    tagIds: p.tagIds,
    notes: p.notes,
  };
  return enriched;
});

// Fix grammaticali: alcuni testi-template usano il participio maschile per
// personaggi femminili (Nyra, Ysolde, Mirena). Coerenza di genere.
const textFixups = [
  ['Nyra Fiordighiaccio è passato di qui', 'Nyra Fiordighiaccio è passata di qui'],
  ['Ysolde Cantalba è passato di qui', 'Ysolde Cantalba è passata di qui'],
  ['Ysolde Cantalba si è schierato', 'Ysolde Cantalba si è schierata'],
  ['Mirena Volpe si è schierato', 'Mirena Volpe si è schierata'],
];
const transactions = data.transactions.map((tx) => {
  let name = tx.name;
  for (const [from, to] of textFixups) {
    if (name.includes(from)) {
      name = name.replace(from, to);
    }
  }
  if (name === tx.name) {
    return tx;
  }
  const fixed = { ...tx, name };
  return fixed;
});

const out = {
  version: 3,
  exportedAt: data.exportedAt ?? 1780099200000,
  characters,
  groups,
  transactions,
  tags: Object.values(tags),
  players: Object.values(players),
  races: Object.values(races),
  classes: Object.values(classes),
};

const json = JSON.stringify(out, null, 2);
writeFileSync(dst, json, 'utf8');

// Sanity: ogni tagId/raceId/classId/playerId referenziato esiste nel pool
const tagIds = new Set(out.tags.map((t) => t.id));
const raceIds = new Set(out.races.map((r) => r.id));
const classIds = new Set(out.classes.map((k) => k.id));
const playerIds = new Set(out.players.map((p) => p.id));
for (const c of characters) {
  if (c.raceId && !raceIds.has(c.raceId)) throw new Error(`raceId rotto: ${c.name}`);
  if (c.playerId && !playerIds.has(c.playerId)) throw new Error(`playerId rotto: ${c.name}`);
  for (const cl of c.classLevels) {
    if (!classIds.has(cl.classId)) throw new Error(`classId rotto: ${c.name}`);
  }
  for (const t of c.tagIds) if (!tagIds.has(t)) throw new Error(`tagId rotto: ${c.name}`);
}
for (const g of groups) {
  for (const t of g.tagIds) if (!tagIds.has(t)) throw new Error(`tagId rotto: ${g.name}`);
}

console.log(`OK → ${dst}`);
console.log(`  ${characters.length} personaggi, ${groups.length} gruppi, ${out.transactions.length} transazioni`);
console.log(`  pool: ${out.races.length} razze, ${out.classes.length} classi, ${out.players.length} giocatori, ${out.tags.length} tag`);