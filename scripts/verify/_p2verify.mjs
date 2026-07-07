import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173/ttrpg-core';
const OUT = 'C:/Users/andre/cyberfolk/ttrpg-core/outputs/verify';

const seed = {
  version: 3,
  exportedAt: 0,
  characters: [
    {
      id: 'c1', name: 'Aragorn', deletedAt: null,
      isPg: true, raceId: 'r1', classLevels: [{ classId: 'k1', level: 3 }, { classId: 'k2', level: 2 }],
      alignment: 'Legale Buono', playerId: 'p1', tagIds: ['t1'], notes: '',
    },
    {
      id: 'c2', name: 'Legolas', deletedAt: null,
      isPg: false, raceId: null, classLevels: [], alignment: '', playerId: null, tagIds: [], notes: '',
    },
  ],
  groups: [
    {
      id: 'g1', name: 'La Compagnia', type: 'Fazione', memberIds: ['c1'], deletedAt: null,
      seat: 'Gran Burrone', guideId: 'c1', motto: "Non tutti quelli che vagano sono perduti.",
      tagIds: ['t1'], notes: '',
    },
  ],
  transactions: [],
  tags: [{ id: 't1', name: 'veterano' }],
  players: [{ id: 'p1', name: 'Marco' }],
  races: [{ id: 'r1', name: 'Umano' }],
  classes: [{ id: 'k1', name: 'Guerriero' }, { id: 'k2', name: 'Ranger' }],
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 1000, deviceScaleFactor: 2 });

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push(String(err)));

await page.evaluateOnNewDocument((s) => localStorage.setItem('ttrpg-reputation-state', JSON.stringify(s)), seed);

// --- Character profile ---
await page.goto(`${BASE}/personaggio/c1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const charText = await page.evaluate(() => document.querySelector('.led')?.innerText || '');
console.log('--- character sheet text ---');
console.log(charText);
console.log('--- Classe label present? ---');
// Label ":" viene aggiunto via CSS ::after (non è nel DOM/innerText): basta la label "Classe" su riga propria.
console.log(charText.split('\n').includes('Classe') ? 'YES' : 'NO (REGRESSION)');
await page.screenshot({ path: `${OUT}/p2-character.png` });

// Drive one inline edit: open Alignment select and choose another value.
const editOpened = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.led__item')];
  const item = items.find((it) => it.querySelector('.led__k')?.textContent.includes('Allineamento'));
  const btn = item?.querySelector('.led__val--edit');
  btn?.click();
  return !!btn;
});
await new Promise((r) => setTimeout(r, 300));
if (editOpened) {
  await page.evaluate(() => {
    const opts = [...document.querySelectorAll('.isel__opt')];
    const target = opts.find((o) => o.textContent.includes('Caotico Neutrale'));
    target?.click();
  });
  await new Promise((r) => setTimeout(r, 300));
}
const afterEditText = await page.evaluate(() => document.querySelector('.led')?.innerText || '');
console.log('--- after inline edit (alignment) ---');
console.log(afterEditText.split('\n').find((l) => l.includes('Allineamento')));

// --- Group profile ---
await page.goto(`${BASE}/gruppo/g1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const groupText = await page.evaluate(() => document.querySelector('.led')?.innerText || '');
console.log('--- group sheet text ---');
console.log(groupText);
await page.screenshot({ path: `${OUT}/p2-group.png` });

console.log('--- console errors ---');
console.log(consoleErrors.length ? consoleErrors : 'NONE');

await browser.close();
