import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5175/ttrpg-core';
const OUT = process.argv[2] || 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

// Schema v3: nomi lunghi che vanno su 2 righe nella testata (display serif grande).
const seed = {
  version: 3, exportedAt: 0,
  characters: [{
    id: 'c1', name: 'Aldric il Giusto Custode Eterno delle Terre di Confine di Valdûr', deletedAt: null,
    isPg: false, raceId: null, classLevels: [], alignment: '', playerId: null,
    tagIds: [], notes: '',
  }],
  groups: [{
    id: 'g1', name: 'La Nobile e Antica Compagnia dell Alba Radiosa di Valdûr', type: 'fazione',
    memberIds: ['c1'], deletedAt: null, seat: '', guideId: 'c1',
    motto: '', tagIds: [], notes: '',
  }],
  transactions: [],
  tags: [], players: [], races: [], classes: [],
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--window-size=1000,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 900, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((s) => {
  localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s));
}, seed);

async function clickMenuItem(text) {
  const items = await page.$$('.ds-menu__item');
  for (const it of items) {
    const t = await page.evaluate((el) => el.textContent.trim(), it);
    if (t.includes(text)) { await it.click(); return true; }
  }
  return false;
}

async function shots(route, prefix) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  const head = await page.$('.rep-profile__head');
  await head.screenshot({ path: `${OUT}/${prefix}-01-rest.png` });

  // apri menu ingranaggio (open-on-hover) e clicca Rinomina
  const gear = await page.$('.rep-profile__gear');
  await gear.hover();
  await new Promise((r) => setTimeout(r, 300));
  const ok = await clickMenuItem('Rinomina');
  await new Promise((r) => setTimeout(r, 350));
  await head.screenshot({ path: `${OUT}/${prefix}-02-rename.png` });
  console.log(prefix, 'rename-clicked:', ok);
}

await shots('/personaggio/c1', 'char');
await shots('/gruppo/g1', 'grp');

// Riferimento parità: i due bottoni Annulla/Fatto del tab Note in modifica.
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const view = await page.$('.notes__view');
if (view) {
  await view.click();
  await new Promise((r) => setTimeout(r, 300));
  const actions = await page.$('.notes__actions');
  if (actions) await actions.screenshot({ path: `${OUT}/notes-actions.png` });
}

console.log('done');
await browser.close();
