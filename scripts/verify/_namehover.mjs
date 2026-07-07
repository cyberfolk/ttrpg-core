import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

const seed = {
  version: 3, exportedAt: 0,
  characters: [{ id: 'c1', name: 'Aldric il Giusto', deletedAt: null,
    isPg: true, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '' }],
  groups: [{ id: 'g1', name: 'La Guardia Cittadina', type: 'fazione', memberIds: [],
    deletedAt: null, seat: '', guideId: null, motto: '', tagIds: [], notes: '' }],
  transactions: [], tags: [], players: [], races: [], classes: [],
};

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--window-size=1000,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 900, deviceScaleFactor: 2 });
await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);

async function shots(url, tag) {
  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  const head = await page.$('.rep-profile__head');
  // menu check FIRST (in edit mode the gear disappears): must NOT contain "Rinomina"
  await page.hover('.rep-profile__gear');
  await new Promise((r) => setTimeout(r, 300));
  const items = await page.$$eval('.ds-menu__item', els => els.map(e => e.textContent.trim()));
  console.log(`${tag} menu:`, JSON.stringify(items));
  await page.mouse.move(500, 500);
  await new Promise((r) => setTimeout(r, 200));
  await head.screenshot({ path: `${OUT}/name-${tag}-rest.png` });
  await page.hover('.rep-profile__nameedit');
  await new Promise((r) => setTimeout(r, 250));
  await head.screenshot({ path: `${OUT}/name-${tag}-hover.png` });
  await page.click('.rep-profile__nameedit');
  await new Promise((r) => setTimeout(r, 250));
  await head.screenshot({ path: `${OUT}/name-${tag}-edit.png` });
}

await shots(`${BASE}/personaggio/c1`, 'char');
await shots(`${BASE}/gruppo/g1`, 'grp');

await browser.close();
console.log('done');
